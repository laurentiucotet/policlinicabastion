// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import site from './src/content/settings/site.json' with { type: 'json' };

/**
 * Sectiunile optionale (servicii, afectiuni, centrul de suport) se sting din
 * CMS, din `settings/site.json` -> `features`.
 *
 * Stingerea se face la nivel de ruta: paginile lor sunt rute dinamice al caror
 * `getStaticPaths` returneaza gol cand sectiunea e stinsa, deci nu se genereaza
 * si nu ajung nici in sitemap. Aici raman doar redirectarile vechi, care nu pot
 * arata spre o ruta inexistenta — Astro respinge build-ul daca o fac.
 *
 * Perechea din partea de continut e `src/lib/features.ts`.
 */
const features = /** @type {Record<string, boolean>} */ (site.features ?? {});
/** @param {string} name */
const enabled = (name) => features[name] !== false;

// https://astro.build/config
export default defineConfig({
  site: 'https://www.policlinicabastion.ro',

  // Tot site-ul e generat static la build. Paginile care au nevoie de server
  // (ex. POST-ul formularului de contact) opteaza individual prin
  // `export const prerender = false`.
  output: 'static',
  adapter: vercel({
    imageService: true,
    webAnalytics: { enabled: false },
  }),

  // /cautare nu mai e o pagina de sine statatoare: cautarea e o functie in
  // header, iar rezultatele au pagina lor. Pastram vechiul URL functional.
  redirects: {
    '/cautare': '/rezultate-cautare',
    // Intervențiile au fost unificate cu serviciile: sunt acelasi tip de
    // entitate, diferentiat printr-o eticheta. Slug-urile s-au pastrat.
    ...(enabled('servicii')
      ? { '/interventii': '/servicii', '/interventii/[slug]': '/servicii/[slug]' }
      : {}),
  },

  integrations: [
    mdx(),
    sitemap({
      // /admin este panoul TinaCMS, nu trebuie indexat
      filter: (page) => !page.includes('/admin'),
    }),
  ],

  // Fonturile sunt descarcate la build si servite de pe domeniul nostru
  // (fara request catre Google la runtime => GDPR-friendly + mai rapid).
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'Public Sans',
      cssVariable: '--font-public-sans',
      provider: fontProviders.google(),
      weights: [600, 700],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],

  image: {
    domains: [],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
