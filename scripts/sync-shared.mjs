// Copies ../shared/src (the code shared with the API) into ./shared/src, so this folder can also be
// built on its own — e.g. by Cloudflare Pages from the storefront's own repository. Runs before every
// build. Inside the full project ../shared is used directly, so edit ../shared, never ./shared.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const from = path.resolve(here, '../../shared/src');
const to = path.resolve(here, '../shared/src');

if (!fs.existsSync(from)) {
  console.log('sync-shared: ../shared not found, using the copy in ./shared');
  process.exit(0);
}
fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log(`sync-shared: copied ${fs.readdirSync(to).length} files from ../shared/src`);
