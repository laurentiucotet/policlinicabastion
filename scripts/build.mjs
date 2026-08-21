#!/usr/bin/env node
/**
 * Build de productie.
 *
 * `tinacms build` genereaza panoul de admin (public/admin). Are doua cerinte:
 *   1. credentialele TinaCloud (TINA_PUBLIC_CLIENT_ID + TINA_TOKEN);
 *   2. branch-ul curent sa fie indexat in TinaCloud.
 *
 * A doua cerinta pica pe deploy-urile de preview: Vercel construieste fiecare
 * branch, dar TinaCloud indexeaza doar branch-urile adaugate explicit. Ca sa nu
 * blocheze deploy-ul, pe preview sarim peste verificarea de cloud si tolerăm
 * esecul. Pe productie ramane strict — vrem sa aflam daca ceva e gresit.
 */
import { spawnSync } from 'node:child_process';

const run = (command, args, { tolerateFailure = false } = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status === 0) return true;
  if (tolerateFailure) return false;
  process.exit(result.status ?? 1);
};

const warn = (message) => console.warn(`\n⚠️  ${message}\n`);

const hasTinaCredentials = Boolean(process.env.TINA_PUBLIC_CLIENT_ID && process.env.TINA_TOKEN);
const isVercelProduction = process.env.VERCEL_ENV === 'production';
const branch = process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'local';

if (!hasTinaCredentials) {
  warn(
    'TINA_PUBLIC_CLIENT_ID / TINA_TOKEN lipsesc — sar peste `tinacms build`.\n' +
      '   Site-ul se construieste normal, dar /admin nu va fi disponibil.\n' +
      '   Adauga variabilele in Vercel → Settings → Environment Variables.',
  );
} else if (isVercelProduction) {
  // Productie: orice problema de configurare trebuie sa opreasca deploy-ul.
  run('tinacms', ['build']);
} else {
  // Preview / build local: nu blocam deploy-ul daca branch-ul nu e in TinaCloud.
  const ok = run('tinacms', ['build', '--skip-cloud-checks'], { tolerateFailure: true });
  if (ok) {
    warn(
      `Build de preview pe branch-ul \`${branch}\`.\n` +
        '   Panoul /admin a fost construit, dar poate citi continut doar daca\n' +
        '   branch-ul este indexat in TinaCloud. Editarea se face pe productie.',
    );
  } else {
    warn('`tinacms build` a esuat pe un build care nu e de productie — continui doar cu site-ul.');
  }
}

run('astro', ['build']);
