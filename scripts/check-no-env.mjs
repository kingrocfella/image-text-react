#!/usr/bin/env node
/**
 * Guards AGENTS.md §2: the mobile app reads NO environment variables.
 *
 * Every app-wide constant belongs in src/constants/index.ts, which is bundled
 * and therefore public. A `process.env` read in the client is either a secret
 * that must not ship in a binary, or config that belongs in src/constants.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripComments } from './strip-comments.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['src'];
const FORBIDDEN = [
  { pattern: /\bprocess\.env\b/, why: 'process.env' },
  { pattern: /\bEXPO_PUBLIC_[A-Z0-9_]+/, why: 'EXPO_PUBLIC_* variable' },
  { pattern: /expo-constants/, why: 'expo-constants (use src/constants instead)' },
];

// This file describes the rule, so it would match its own patterns.
const SELF = 'scripts/check-no-env.mjs';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (rel === SELF || rel.includes('__tests__')) continue;

    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(line)) {
          violations.push(`${rel}:${index + 1}  ${why}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('The mobile app must not read environment variables (AGENTS.md §2).');
  console.error('Move these values into src/constants/index.ts:\n');
  for (const violation of violations) console.error('  ' + violation);
  process.exit(1);
}

console.log('check-no-env: clean — no environment reads in the mobile app.');
