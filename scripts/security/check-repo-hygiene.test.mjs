import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { scan } from './check-repo-hygiene.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const cli = path.join(here, 'check-repo-hygiene.mjs');

const tempDirs = [];
function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hygiene-'));
  tempDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

const rulesFor = (dir) => scan(dir, { useGit: false }).map((f) => `${f.kind}:${f.rule}:${f.file}`);

// Secret-shaped values are assembled at runtime so this file never contains a literal match.
const fake = {
  privateKey: ['-----BEGIN ', 'PRIVATE KEY-----\nMIIEvQIBADANBgkq\n-----END ', 'PRIVATE KEY-----'].join(''),
  serviceAccount: ['{ "type": "service', '_account", "project_id": "demo" }'].join(''),
  googleKey: ['AI', 'za', 'Sy' + 'A'.repeat(33)].join(''),
  githubToken: ['gh', 'p_', 'a'.repeat(36)].join(''),
  sentryToken: ['sntr', 'ys_', 'a'.repeat(48)].join(''),
  sentryUserToken: ['sntr', 'yu_', 'b'.repeat(64)].join(''),
  teamsWebhook: ['https://contoso.webhook.office.com/', 'webhookb2/', 'a'.repeat(30)].join(''),
  slackWebhook: ['https://hooks', '.slack.com/services/', 'T00000000/B00000000/', 'x'.repeat(24)].join(''),
  dbUrl: ['postgres', '://admin:hunter2pass@db.example.com:5432/app'].join(''),
  jwt: ['eyJ', 'hbGciOiJIUzI1NiJ9', '.eyJ', 'zdWIiOiIxMjM0NTY3ODkwIn0', '.abcdefghij1234567890'].join(''),
};

describe('forbidden files are rejected (regression for the leaked repo)', () => {
  const cases = [
    ['.env', 'environment file'],
    ['.env.production', 'environment file'],
    ['apps/web/.env.local', 'environment file'],
    ['dump.sql', 'database dump'],
    ['backups/db_dump_2026.sql.gz', 'database dump'],
    ['schema.sql', 'SQL file at repo root'],
    ['demo-project-1a2b3c4d5e6f.json', 'Google key file'],
    ['gcp-service-account.json', 'service-account / credentials JSON'],
    ['config/credentials.json', 'service-account / credentials JSON'],
    ['server.pem', 'private key / certificate'],
    ['supabase/.temp/project-ref', 'Supabase CLI link state'],
    ['supabase/functions/supabase/.temp/linked-project.json', 'Supabase CLI link state'],
    ['dist/index.html', 'committed build output'],
    ['tsconfig.app.tsbuildinfo', 'TypeScript build cache'],
  ];
  for (const [file, expected] of cases) {
    it(`flags ${file}`, () => {
      const dir = fixture({ [file]: 'x' });
      const hits = rulesFor(dir).filter((h) => h.startsWith('path:'));
      assert.ok(
        hits.some((h) => h.includes(expected) && h.endsWith(`:${file}`)),
        `expected "${expected}" for ${file}, got ${JSON.stringify(hits)}`
      );
    });
  }
});

describe('legitimate files are not flagged', () => {
  it('accepts .env.example, migrations, lockfile and normal source', () => {
    const dir = fixture({
      '.env.example': 'VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key\n',
      'supabase/migrations/20260427195000_create_telemetry_events.sql': 'create table t (id int);',
      'package-lock.json': `{"integrity":"${'sha512-' + 'A'.repeat(88)}"}`,
      'src/main.tsx': 'export const x = 1;\n',
      'public/staticwebapp.config.json': '{"globalHeaders":{"X-Frame-Options":"DENY"}}',
      'components.json': '{"style":"new-york"}',
    });
    assert.deepEqual(rulesFor(dir), []);
  });
});

describe('secret-like content is rejected', () => {
  const cases = [
    ['private key block', fake.privateKey],
    ['service-account JSON', fake.serviceAccount],
    ['Google API key', `const k = "${fake.googleKey}";`],
    ['GitHub token', `token=${fake.githubToken}`],
    ['Sentry auth token', `SENTRY_AUTH_TOKEN=${fake.sentryToken}`],
    ['Sentry auth token', `SENTRY_AUTH_TOKEN=${fake.sentryUserToken}`],
    ['Microsoft Teams webhook URL', `url: '${fake.teamsWebhook}'`],
    ['Slack webhook URL', `url: '${fake.slackWebhook}'`],
    ['database URL with password', `DATABASE_URL=${fake.dbUrl}`],
    ['hard-coded JWT', `const anon = "${fake.jwt}";`],
  ];
  for (const [rule, content] of cases) {
    it(`flags ${rule}`, () => {
      const dir = fixture({ 'src/config.ts': content });
      const hits = rulesFor(dir).filter((h) => h.startsWith('content:'));
      assert.ok(hits.some((h) => h.includes(rule)), `expected "${rule}", got ${JSON.stringify(hits)}`);
    });
  }

  it('does not flag a public Sentry DSN placeholder or a DB URL without a password', () => {
    const dir = fixture({
      'src/a.ts': 'const dsn = "https://examplePublicKey@o0.ingest.sentry.io/0";',
      'src/b.ts': 'const u = "postgresql://postgres.abcdefgh@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";',
    });
    assert.deepEqual(rulesFor(dir), []);
  });
});

describe('CLI behaviour', () => {
  const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

  it('exits 0 on a clean tree', () => {
    const dir = fixture({ 'src/main.tsx': 'export {};\n' });
    const r = run(['--root', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /OK/);
  });

  it('exits 1 on findings and never prints the matched secret value', () => {
    const dir = fixture({ 'src/config.ts': `const k = "${fake.googleKey}";`, '.env': `A=${fake.githubToken}` });
    const r = run(['--root', dir]);
    assert.equal(r.status, 1);
    const output = r.stdout + r.stderr;
    assert.match(output, /FAILED/);
    assert.ok(!output.includes(fake.googleKey), 'Google key value leaked to output');
    assert.ok(!output.includes(fake.githubToken), 'GitHub token value leaked to output');
  });

  it('exits 2 when the root does not exist', () => {
    const r = run(['--root', path.join(os.tmpdir(), 'definitely-missing-hygiene-root')]);
    assert.equal(r.status, 2);
  });
});

describe('this repository', () => {
  it('has no forbidden files or secret-like content', (t) => {
    try {
      execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoRoot, stdio: 'ignore' });
    } catch {
      t.skip('not a git work tree');
      return;
    }
    const findings = scan(repoRoot, { useGit: true });
    assert.deepEqual(
      findings.map((f) => `${f.file}${f.line ? ':' + f.line : ''} ${f.rule}`),
      []
    );
  });
});
