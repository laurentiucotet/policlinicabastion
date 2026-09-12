#!/usr/bin/env node
/**
 * Regenereaza `tina/tina-lock.json`.
 *
 * TinaCloud citeste schema site-ului din acest fisier, direct din repo, nu din
 * build-ul de pe Vercel. Daca fisierul e vechi, panoul /admin va afisa campurile
 * vechi, chiar daca `tina/collections/*.ts` s-a schimbat.
 *
 * `npm run dev` il regenereaza automat. Scriptul asta exista pentru cazul in
 * care ai modificat doar schema si nu vrei sa pornesti serverul de development.
 *
 * Dupa rulare: comite fisierul.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const generated = join('tina', '__generated__');
const readJson = (name) => JSON.parse(readFileSync(join(generated, name), 'utf8'));

// `--local` nu are nevoie de credentiale TinaCloud; ne intereseaza doar
// artefactele de schema pe care le produce codegen-ul.
const result = spawnSync('tinacms', ['build', '--local', '--skip-cloud-checks', '--noTelemetry'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Aceeasi structura pe care o scrie `tinacms dev`.
writeFileSync(
  join('tina', 'tina-lock.json'),
  JSON.stringify({
    schema: readJson('_schema.json'),
    lookup: readJson('_lookup.json'),
    graphql: readJson('_graphql.json'),
  }),
);

console.log('\n✅ tina/tina-lock.json regenerat, comite-l ca TinaCloud sa vada schema noua.\n');
