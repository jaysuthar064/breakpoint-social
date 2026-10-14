/**
 * Refuses a release build that is pointed at a developer's machine.
 *
 * This repo is deployed by committing `dist/`, which means the build happens
 * locally and whatever is in `.env` at that moment becomes production. The
 * failure mode is quiet and expensive: build with local values, push, and the
 * live site asks every visitor's browser for `localhost:8887`, which answers
 * nothing. The page looks perfect on the machine that built it.
 *
 * So a release build asserts its configuration instead of assuming it.
 *
 * usage: node check-env.js
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const values = {};

  for (const name of ['.env.local', '.env']) {
    const file = resolve(here, name);

    if (!existsSync(file)) {
      continue;
    }

    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line) => {
        const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);

        if (match && values[match[1]] === undefined) {
          values[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      });
  }

  // A real environment variable beats the file, which is how a CI host would
  // supply these.
  for (const key of ['VITE_API_BASE', 'SITE_URL']) {
    if (process.env[key]) {
      values[key] = process.env[key];
    }
  }

  return values;
}

const LOCAL = /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local(\b|\/)/i;

const env = loadEnv();
const problems = [];

if (!env.VITE_API_BASE) {
  problems.push('VITE_API_BASE is not set. The browser would not know where the API is.');
} else if (LOCAL.test(env.VITE_API_BASE)) {
  problems.push(
    `VITE_API_BASE points at this machine: ${env.VITE_API_BASE}\n` +
      '     Visitors cannot reach that. Use the public WordPress URL.',
  );
} else if (!/^https:\/\//i.test(env.VITE_API_BASE)) {
  problems.push(
    `VITE_API_BASE is not https: ${env.VITE_API_BASE}\n` +
      '     A browser on an https page will refuse to call it.',
  );
}

if (!env.SITE_URL) {
  problems.push('SITE_URL is not set. Canonical tags and the sitemap need the public address.');
} else if (LOCAL.test(env.SITE_URL)) {
  problems.push(
    `SITE_URL points at this machine: ${env.SITE_URL}\n` +
      '     Every canonical tag and sitemap entry would be wrong.',
  );
}

if (problems.length > 0) {
  console.error('');
  console.error('  Release build stopped: this configuration would ship a broken site.');
  console.error('');

  problems.forEach((problem) => console.error(`   - ${problem}`));

  console.error('');
  console.error('  Set these in frontend/.env before building for release:');
  console.error('');
  console.error('    VITE_API_BASE=https://breakpointsocial.com/wp-json/');
  console.error('    SITE_URL=https://breakpointsocial.com');
  console.error('');
  console.error('  Then put them back to the localhost values for local work.');
  console.error('');

  process.exit(1);
}

console.log('release config ok');
console.log(`  API:  ${env.VITE_API_BASE}`);
console.log(`  site: ${env.SITE_URL}`);
