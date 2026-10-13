import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexHtmlPath = path.join(root, 'index.html');
const swaConfigPath = path.join(root, 'public', 'staticwebapp.config.json');

function extractInlineScriptPayloads(html) {
  const pattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  const payloads = [];
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const attrs = match[1] ?? '';
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const type = typeMatch?.[1]?.toLowerCase() ?? 'text/javascript';
    if (type === 'module') continue;

    const payload = match[2];
    if (payload.trim()) payloads.push(payload);
  }

  return payloads;
}

function toHashToken(payload) {
  const hash = createHash('sha256').update(payload, 'utf8').digest('base64');
  return `'sha256-${hash}'`;
}

function updateScriptSrcDirective(csp, hashTokens) {
  const directives = csp
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean);

  const scriptIndex = directives.findIndex((directive) => directive.startsWith('script-src '));
  if (scriptIndex === -1) {
    throw new Error('CSP does not include script-src directive');
  }

  const scriptParts = directives[scriptIndex]
    .replace(/^script-src\s+/, '')
    .split(/\s+/)
    .filter(Boolean);

  const nonHashParts = scriptParts.filter((part) => !/^'sha256-[^']+'$/.test(part));
  const merged = [...nonHashParts, ...hashTokens];
  directives[scriptIndex] = `script-src ${merged.join(' ')}`;

  return `${directives.join('; ')};`;
}

function main() {
  const html = readFileSync(indexHtmlPath, 'utf8');
  const payloads = extractInlineScriptPayloads(html);
  const hashes = Array.from(new Set(payloads.map(toHashToken)));

  const config = JSON.parse(readFileSync(swaConfigPath, 'utf8'));
  const currentCsp = config?.globalHeaders?.['Content-Security-Policy'];
  if (!currentCsp) {
    throw new Error('Content-Security-Policy not found in staticwebapp config');
  }

  config.globalHeaders['Content-Security-Policy'] = updateScriptSrcDirective(currentCsp, hashes);
  writeFileSync(swaConfigPath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`[csp-inline] updated script-src with ${hashes.length} inline script hash(es)`);
}

main();
