import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { stripComments } from './strip-comments.mjs';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'src');
const generated = path.join(src, 'api', 'routes.generated.ts');
const routeSource = fs.readFileSync(generated, 'utf8');
// Static paths ("/v1/me") and the fixed part of parameterised ones (`/v1/job/${...}`).
const routes = [
  ...new Set(
    [...routeSource.matchAll(/["`](\/[^"`$]*)/g)]
      .map((match) => match[1].replace(/\/$/, ''))
      .filter((route) => route.length > 1),
  ),
];

const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(entry.name) || file === generated || file.includes('__tests__')) {
      continue;
    }

    // Metro asset requires are filesystem references, not HTTP route literals. Remove
    // their static argument before comparing source text with the generated API paths.
    const source = stripComments(fs.readFileSync(file, 'utf8')).replace(
      /require\((['"])[^'"]+\1\)/g,
      "require('')",
    );
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      for (const route of routes) {
        if (route !== '/' && line.includes(route)) {
          findings.push(`${path.relative(root, file)}:${index + 1}: ${route}`);
        }
      }
    });
  }
}

walk(src);

if (findings.length > 0) {
  console.error('Use API_ROUTES instead of route literals:');
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log('check-no-route-literals: clean');
