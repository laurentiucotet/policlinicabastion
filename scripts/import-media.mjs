#!/usr/bin/env node
/**
 * Importa imaginile ramase pe policlinicabastion.ro in src/assets/uploads/ si
 * scrie referinta lor in frontmatter-ul fisierelor de continut.
 *
 * De ce exista scriptul: continutul textual a fost migrat automat, dar mediul in
 * care a rulat migrarea nu are voie sa deschida conexiuni catre
 * policlinicabastion.ro. Imaginile trebuie deci aduse de pe o masina care
 * ajunge la site - de obicei laptopul tau.
 *
 *   node scripts/import-media.mjs            # descarca tot ce lipseste
 *   node scripts/import-media.mjs --dry-run  # arata ce ar face, fara sa scrie
 *   node scripts/import-media.mjs --force    # redescarca si ce exista deja
 *
 * Sursele sunt in scripts/media-manifest.json, generat la migrare:
 *   { "medici": { "<slug>": "<url>" }, "articole": { "<slug>": "<url>" } }
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = join(root, 'src/assets/uploads');
const MANIFEST = join(root, 'scripts/media-manifest.json');

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

/** Colectia -> unde stau fisierele si sub ce cheie de frontmatter merge imaginea. */
const TARGETS = {
  medici: { dir: 'src/content/medici', ext: '.mdx', field: 'photo' },
  articole: { dir: 'src/content/articole', ext: '.mdx', field: 'cover' },
};

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

/**
 * Extensia din URL, curatata de query string. WordPress serveste .png/.jpg/.jpeg;
 * orice altceva primeste .jpg, ca sa nu ajunga un fisier fara extensie in Astro,
 * care are nevoie de ea ca sa aleaga encoderul.
 */
const extensionFor = (url) => {
  const raw = extname(new URL(url).pathname).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'].includes(raw) ? raw : '.jpg';
};

const download = async (url, destination) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'policlinicabastion-import/1.0' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`raspuns care nu e imagine (${type || 'fara content-type'})`);

  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
};

/**
 * Scrie cheia in frontmatter daca lipseste. Nu suprascrie o valoare existenta:
 * daca cineva a pus deja o imagine mai buna din CMS, ea ramane.
 */
const setFrontmatterField = async (file, field, value) => {
  const source = await readFile(file, 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error('fisier fara frontmatter');

  const [block, body] = [match[1], source.slice(match[0].length)];
  if (new RegExp(`^${field}:`, 'm').test(block)) return false;

  // Imediat dupa `name:` / `title:`, ca frontmatter-ul sa ramana lizibil.
  const anchor = block.match(/^(name|title):.*$/m);
  const updated = anchor
    ? block.replace(anchor[0], `${anchor[0]}\n${field}: ${value}`)
    : `${block}\n${field}: ${value}`;

  await writeFile(file, `---\n${updated}\n---\n${body}`);
  return true;
};

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
await mkdir(UPLOADS, { recursive: true });

let downloaded = 0;
let skipped = 0;
const failures = [];

for (const [collection, entries] of Object.entries(manifest)) {
  const target = TARGETS[collection];
  if (!target) {
    console.warn(`! colectie necunoscuta in manifest: ${collection}`);
    continue;
  }

  for (const [slug, url] of Object.entries(entries)) {
    const filename = `${slug}${extensionFor(url)}`;
    const destination = join(UPLOADS, filename);
    const contentFile = join(root, target.dir, `${slug}${target.ext}`);

    if (!(await exists(contentFile))) {
      failures.push(`${slug}: nu exista ${target.dir}/${slug}${target.ext}`);
      continue;
    }

    if ((await exists(destination)) && !force) {
      skipped += 1;
    } else if (dryRun) {
      console.log(`  [dry-run] ${url}\n            -> src/assets/uploads/${filename}`);
      downloaded += 1;
    } else {
      try {
        await download(url, destination);
        downloaded += 1;
        console.log(`  ✓ ${filename}`);
      } catch (error) {
        failures.push(`${slug}: ${error.message}`);
        continue;
      }
    }

    if (!dryRun) {
      await setFrontmatterField(contentFile, target.field, `../../assets/uploads/${filename}`);
    }
  }
}

console.log(
  `\n${downloaded} descarcate, ${skipped} deja prezente, ${failures.length} esuate` +
    (dryRun ? ' (dry-run: nu s-a scris nimic)' : ''),
);

if (failures.length) {
  console.error('\nEsecuri:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
