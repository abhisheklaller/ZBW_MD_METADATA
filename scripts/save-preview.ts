// Save a rig page as one self-contained HTML file, lane banner included (plan.md § 3, ADR 0001).
// The page has no client JS and an inline stylesheet, so the saved file is the page.
// Usage: tsx scripts/save-preview.ts <path> <outFile>
import { writeFileSync } from 'node:fs';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const [path = '/digest/2026-10-28', out = 'preview.html'] = process.argv.slice(2);
const res = await createApp(loadConfig()).request(path);
if (res.status !== 200) {
  console.error(`rig returned ${res.status} for ${path}`);
  process.exit(1);
}
writeFileSync(out, await res.text());
console.log(`saved ${path} -> ${out}`);
