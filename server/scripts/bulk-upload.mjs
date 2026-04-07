#!/usr/bin/env node
/**
 * Upload every file in a folder (recursively) to POST /api/upload on your API host.
 *
 * Usage:
 *   node scripts/bulk-upload.mjs <api-base-url> <local-folder> [manifest.json]
 *
 * Examples:
 *   node scripts/bulk-upload.mjs https://portfolio-r4mt.onrender.com ./my-media
 *   node scripts/bulk-upload.mjs http://127.0.0.1:4000 ./server/uploads
 *
 * Writes upload-manifest.json (or path you pass) with { localPath, url, filename }[].
 * Then set project coverAssetPath in Atlas to the matching `url` (e.g. /uploads/uuid.jpg).
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises';
import { basename, dirname, isAbsolute, join, relative } from 'path';

function usage() {
  console.error(`
Usage: node scripts/bulk-upload.mjs <api-base-url> <local-folder> [manifest-out.json]

  api-base-url   No trailing slash, e.g. https://yourservice.onrender.com
  local-folder   Directory of files to upload (images/videos, etc.)
  manifest-out   Optional output JSON path (default: ./upload-manifest.json)
`);
  process.exit(1);
}

async function* walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const ent of entries) {
    const p = join(root, ent.name);
    if (ent.name.startsWith('.')) continue;
    if (ent.isDirectory()) {
      yield* walkFiles(p);
    } else if (ent.isFile()) {
      yield p;
    }
  }
}

async function main() {
  const baseArg = process.argv[2];
  const dirArg = process.argv[3];
  const outArg = process.argv[4] || join(process.cwd(), 'upload-manifest.json');

  if (!baseArg || !dirArg) usage();

  const base = baseArg.replace(/\/$/, '');
  const root = isAbsolute(dirArg) ? dirArg : join(process.cwd(), dirArg);

  try {
    if (!(await stat(root)).isDirectory()) {
      console.error('Not a directory:', root);
      process.exit(1);
    }
  } catch {
    console.error('Folder not found:', root);
    process.exit(1);
  }

  const results = [];
  let n = 0;
  for await (const filePath of walkFiles(root)) {
    const buf = await readFile(filePath);
    const name = basename(filePath);
    const form = new FormData();
    form.append('file', new Blob([buf]), name);

    const res = await fetch(`${base}/api/upload`, { method: 'POST', body: form });
    const text = await res.text();
    if (!res.ok) {
      console.error(`FAIL ${relative(process.cwd(), filePath)}: ${res.status} ${text}`);
      continue;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error(`FAIL ${name}: not JSON`, text);
      continue;
    }
    results.push({
      localPath: filePath,
      relative: relative(process.cwd(), filePath),
      url: json.url,
      filename: json.filename,
    });
    n += 1;
    console.log(`OK ${n} ${json.url}  <=  ${relative(process.cwd(), filePath)}`);
    await new Promise((r) => setTimeout(r, 150));
  }

  await mkdir(dirname(outArg), { recursive: true }).catch(() => {});
  await writeFile(outArg, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${results.length} entries to ${outArg}`);
  console.log(
    'Next: in Atlas, set each project’s coverAssetPath to the matching `url` from this file.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
