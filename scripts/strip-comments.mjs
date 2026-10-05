// Shared by the client guards so both agree on what counts as code.
/**
 * Blanks out comments before matching. Documentation is allowed to name the
 * thing it forbids — src/constants/index.ts explains the rule in its header —
 * and a guard that cannot tell code from prose gets disabled within a week.
 * Line positions are preserved so reported line numbers stay accurate.
 */
export function stripComments(source) {
  let out = '';
  let state = 'code'; // code | line | block | single | double | template
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (char === '/' && next === '/') {
        state = 'line';
        out += '  ';
        i += 1;
        continue;
      }
      if (char === '/' && next === '*') {
        state = 'block';
        out += '  ';
        i += 1;
        continue;
      }
      if (char === "'") state = 'single';
      else if (char === '"') state = 'double';
      else if (char === '`') state = 'template';
      out += char;
      continue;
    }

    if (state === 'line') {
      if (char === '\n') {
        state = 'code';
        out += '\n';
      } else {
        out += ' ';
      }
      continue;
    }

    if (state === 'block') {
      if (char === '*' && next === '/') {
        state = 'code';
        out += '  ';
        i += 1;
      } else {
        out += char === '\n' ? '\n' : ' ';
      }
      continue;
    }

    // Inside a string literal: copy through, honouring escapes.
    out += char;
    if (char === '\\') {
      out += next ?? '';
      i += 1;
      continue;
    }
    if (
      (state === 'single' && char === "'") ||
      (state === 'double' && char === '"') ||
      (state === 'template' && char === '`')
    ) {
      state = 'code';
    }
  }
  return out;
}
