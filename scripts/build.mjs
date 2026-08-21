#!/usr/bin/env node
/**
 * Build de productie.
 *
 * `tinacms build` genereaza panoul de admin (public/admin) si are nevoie de
 * credentialele TinaCloud. Daca ele lipsesc — de exemplu la primul deploy, sau
 * intr-un preview de test — sarim peste pasul acesta si construim doar site-ul,
 * ca deploy-ul sa nu pice. /admin va lipsi pana cand variabilele sunt setate.
 */
import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const hasTinaCredentials = Boolean(process.env.TINA_PUBLIC_CLIENT_ID && process.env.TINA_TOKEN);

if (hasTinaCredentials) {
  run('tinacms', ['build']);
} else {
  console.warn(
    '\n⚠️  TINA_PUBLIC_CLIENT_ID / TINA_TOKEN lipsesc — sar peste `tinacms build`.\n' +
      '   Site-ul se construieste normal, dar /admin nu va fi disponibil.\n' +
      '   Adauga variabilele in Vercel → Settings → Environment Variables.\n',
  );
}

run('astro', ['build']);
