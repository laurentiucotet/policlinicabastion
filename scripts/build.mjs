#!/usr/bin/env node
/**
 * Build de productie.
 *
 * Site-ul (astro build) NU depinde de TinaCloud, vezi docs/ARHITECTURA.md.
 * Singurul lucru care depinde de el este panoul /admin, generat de
 * `tinacms build`.
 *
 * De aceea, o problema la TinaCloud nu trebuie sa opreasca niciodata deploy-ul
 * clinicii: nici lipsa credentialelor, nici un branch neindexat (normal pe
 * orice preview), nici un proiect care nu raspunde inca (`project not found`,
 * de obicei conexiunea GitHub <-> TinaCloud nu s-a terminat de procesat, sau
 * o variabila de mediu are un spatiu/newline in plus). Sarim mereu peste
 * verificarea de cloud (`--skip-cloud-checks`) si toleram orice esec al
 * `tinacms build`: /admin poate lipsi sau poate sa nu functioneze temporar,
 * dar site-ul public trebuie sa mearga oricum.
 *
 * Pentru verificarea stricta, manuala, a configurarii TinaCloud, foloseste
 * `npm run build:full` (fara toleranta la erori).
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
const branch = process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'local';

if (!hasTinaCredentials) {
  warn(
    'TINA_PUBLIC_CLIENT_ID / TINA_TOKEN lipsesc, sar peste `tinacms build`.\n' +
      '   Site-ul se construieste normal, dar /admin nu va fi disponibil.\n' +
      '   Adauga variabilele in Vercel → Settings → Environment Variables.',
  );
} else {
  const ok = run('tinacms', ['build', '--skip-cloud-checks'], { tolerateFailure: true });
  if (ok) {
    warn(
      `tinacms build reusit pentru branch-ul \`${branch}\`.\n` +
        '   /admin poate citi/scrie continut doar daca acest branch este\n' +
        '   conectat si indexat in proiectul TinaCloud.',
    );
  } else {
    warn(
      `\`tinacms build\` a esuat pentru branch-ul \`${branch}\`, continui doar cu site-ul.\n` +
        '   Motive frecvente: proiectul TinaCloud nu e inca conectat la\n' +
        '   acest repo/branch ("project not found"), sau credentialele au\n' +
        '   spatii/ghilimele in plus copiate din greseala in Vercel.\n' +
        '   Verificare stricta, manuala: `npm run build:full`.',
    );
  }
}

run('astro', ['build']);
