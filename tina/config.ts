import { defineConfig } from 'tinacms';
import { contentCollections } from './collections/content';
import { settingsCollections } from './collections/settings';

/* ---------------------------------------------------------------------------
 * TinaCMS — stratul de editare al site-ului.
 *
 * Cum functioneaza:
 *   1. Continutul sta in fisiere .mdx / .json in `src/content` (in acest repo).
 *   2. Clientul editeaza la `https://<site>/admin` (o aplicatie React statica,
 *      generata de `tinacms build` in `public/admin`).
 *   3. La Salvare, Tina Cloud face commit direct in branch-ul configurat mai jos.
 *   4. Commit-ul declanseaza un build nou pe Vercel => site-ul se actualizeaza.
 *
 * Astro NU foloseste API-ul GraphQL al Tinei: citeste direct fisierele prin
 * content collections (`src/content.config.ts`). Cele doua scheme trebuie
 * tinute in sincron manual — vezi docs/ARHITECTURA.md.
 * ------------------------------------------------------------------------- */

const branch =
  process.env.TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF || // completat automat de Vercel
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID ?? null,
  token: process.env.TINA_TOKEN ?? null,

  build: {
    // panoul de admin ajunge in `public/admin` => disponibil la /admin
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      // Fisierele urcate din CMS ajung in `src/assets/uploads`, ca sa poata fi
      // optimizate de Astro (<Image />) la build. Daca le-am pune in `public`,
      // Astro nu le-ar putea procesa.
      publicFolder: '',
      mediaRoot: 'src/assets/uploads',
    },
  },

  // Nu generam clientul GraphQL: frontendul citeste fisierele direct.
  client: { skip: true },

  schema: {
    collections: [...settingsCollections, ...contentCollections],
  },
});
