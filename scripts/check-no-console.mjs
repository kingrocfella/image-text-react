#!/usr/bin/env node
/** Enforce the structured mobile logger as the only app logging path. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripComments } from './strip-comments.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

const violations = [];
// The logger is the one sanctioned console user (development output only).
const ALLOWED = new Set(['src/logging/logger.ts']);

for (const file of walk(join(ROOT, 'src'))) {
  const rel = relative(ROOT, file);
  if (ALLOWED.has(rel) || rel.includes('__tests__')) continue;
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    if (/\bconsole\s*\./.test(line)) {
      violations.push(`${relative(ROOT, file)}:${index + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error('Use createMobileLogger(scope); console.* is forbidden in src/:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log('check-no-console: clean');
