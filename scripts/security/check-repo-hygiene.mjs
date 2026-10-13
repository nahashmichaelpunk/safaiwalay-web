#!/usr/bin/env node
/**
 * Repo hygiene gate: fails when the tracked file set contains material that must
 * never be committed (credential files, database dumps, env files, CLI link state)
 * or file contents that look like live secrets.
 *
 * Usage:
 *   node scripts/security/check-repo-hygiene.mjs            # scans files tracked by git in cwd
 *   node scripts/security/check-repo-hygiene.mjs --root DIR # scans every file under DIR (used by tests)
 *
 * Exit code 0 = clean, 1 = findings, 2 = usage / environment error.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Path rules: [label, regex tested against the repo-relative POSIX path]. */
export const FORBIDDEN_PATHS = [
  ['environment file', /(^|\/)\.env(\.(?!example$)[^/]*)?$/],
  ['database dump', /(^|\/)[^/]*dump[^/]*\.(sql|gz|bak|dump)$/i],
  ['SQL file at repo root (use supabase/migrations)', /^[^/]+\.sql$/i],
  ['database backup', /\.(bak|backup|sqlite3?|db)$/i],
  ['private key / certificate', /\.(pem|key|p12|pfx|jks)$/i],
  ['service-account / credentials JSON', /(service[-_]?account|credentials?|client[-_]?secret|gcp[-_]?key)[^/]*\.json$/i],
  ['Google key file (name-<12 hex>.json)', /(^|\/)[a-z0-9-]+-[0-9a-f]{12}\.json$/],
  ['Supabase CLI link state', /(^|\/)supabase\/(?:.*\/)?\.temp\//],
  ['committed build output', /(^|\/)dist\//],
  ['TypeScript build cache', /\.tsbuildinfo$/],
];

/**
 * Content rules. Patterns are assembled from fragments so this file never
 * contains a literal that would match its own scanner.
 */
const j = (...parts) => parts.join('');
export const SECRET_PATTERNS = [
  ['private key block', new RegExp(j('-----BEGIN ', '(?:RSA |EC |OPENSSH |DSA )?PRIVATE ', 'KEY-----'))],
  ['service-account JSON', new RegExp(j('"type"\\s*:\\s*"service', '_account"'))],
  ['Google API key', new RegExp(j('AI', 'za[0-9A-Za-z_-]{35}'))],
  ['GitHub token', new RegExp(j('gh[pousr]', '_[A-Za-z0-9]{36,}'))],
  ['Sentry auth token', new RegExp(j('sntr', 'y[su]_[A-Za-z0-9+/=_-]{40,}'))],
  ['Slack token', new RegExp(j('xox', '[abprs]-[A-Za-z0-9-]{10,}'))],
  ['Razorpay live key', new RegExp(j('rzp', '_live_[A-Za-z0-9]{10,}'))],
  ['Stripe live key', new RegExp(j('sk', '_live_[A-Za-z0-9]{10,}'))],
  ['Microsoft Teams webhook URL', new RegExp(j('https://[a-z0-9.-]*', 'webhook\\.office\\.com/[A-Za-z0-9/_@.-]{20,}'))],
  ['Slack webhook URL', new RegExp(j('https://hooks', '\\.slack\\.com/(?:services|workflows)/[A-Za-z0-9/_-]{20,}'))],
  ['Discord webhook URL', new RegExp(j('https://discord', '(?:app)?\\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]{20,}'))],
  ['database URL with password', new RegExp(j('postgres(?:ql)?', '://[^\\s:@/]+:[^\\s@/]+@'))],
  ['hard-coded JWT', new RegExp(j('eyJ', '[A-Za-z0-9_-]{15,}\\.eyJ', '[A-Za-z0-9_-]{15,}\\.[A-Za-z0-9_-]{10,}'))],
];

/** Files exempt from content scanning (lockfiles are large and carry integrity hashes, not secrets). */
const CONTENT_SCAN_SKIP = [/(^|\/)package-lock\.json$/, /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|pdf)$/i];

const MAX_SCAN_BYTES = 2 * 1024 * 1024;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function listTracked(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

function listAll(root) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(toPosix(path.relative(root, full)));
    }
  };
  walk(root);
  return files;
}

/** @returns {{ file: string, rule: string, kind: 'path' | 'content', line?: number }[]} */
export function scan(root, { useGit = true } = {}) {
  const files = useGit ? listTracked(root) : listAll(root);
  const findings = [];

  for (const file of files) {
    for (const [label, re] of FORBIDDEN_PATHS) {
      if (re.test(file)) findings.push({ file, rule: label, kind: 'path' });
    }

    if (CONTENT_SCAN_SKIP.some((re) => re.test(file))) continue;
    const full = path.join(root, file);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue; // deleted in working tree but still listed
    }
    if (!stat.isFile() || stat.size > MAX_SCAN_BYTES) continue;

    const text = fs.readFileSync(full, 'utf8');
    if (text.includes('\u0000')) continue; // binary
    const lines = text.split('\n');
    for (const [label, re] of SECRET_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) findings.push({ file, rule: label, kind: 'content', line: i + 1 });
      }
    }
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const rootFlag = args.indexOf('--root');
  const useGit = rootFlag === -1;
  const root = path.resolve(rootFlag === -1 ? process.cwd() : args[rootFlag + 1] ?? '');

  if (!fs.existsSync(root)) {
    console.error(`[hygiene] root does not exist: ${root}`);
    process.exit(2);
  }

  let findings;
  try {
    findings = scan(root, { useGit });
  } catch (error) {
    console.error(`[hygiene] scan failed: ${error instanceof Error ? error.message : error}`);
    process.exit(2);
  }

  if (findings.length === 0) {
    console.log('[hygiene] OK - no forbidden files or secret-like content found.');
    return;
  }

  console.error(`[hygiene] FAILED - ${findings.length} finding(s):`);
  for (const f of findings) {
    // Never print the matched value, only where it is.
    console.error(`  - ${f.file}${f.line ? `:${f.line}` : ''}  ${f.kind === 'path' ? 'forbidden file' : 'secret-like content'}: ${f.rule}`);
  }
  process.exit(1);
}

if (process.argv[1] && path.basename(process.argv[1]) === 'check-repo-hygiene.mjs') {
  main();
}
