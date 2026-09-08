/**
 * Traduce calea unei imagini salvate din CMS intr-o adresa pe care site-ul chiar
 * o serveste.
 *
 * TinaCMS scrie caile relativ la propriul `mediaRoot` (`src/assets/uploads`).
 * Pentru imaginile din continut asta e corect: Astro le proceseaza prin
 * `<Image />` si le da un nume cu amprenta. Dar campurile care ajung direct
 * intr-un `<meta>`, `og:image` e singurul de acum, au nevoie de o adresa
 * publica, iar `/src/assets/...` nu exista in site-ul construit.
 *
 * In plus, cand cineva salveaza in CMS un camp care avea deja o cale publica,
 * Tina ii pune `mediaRoot` in fata si iese `/src/assets/uploads/uploads/x.png`.
 * Asa s-a rupt imaginea de distribuire prima data; functia asta o repara in loc
 * sa astepte ca omul sa nu mai greseasca.
 */

/** Prefixul pe care il pune TinaCMS. Trebuie sa ramana egal cu `mediaRoot` din `tina/config.ts`. */
const MEDIA_ROOT = '/src/assets/uploads';

/**
 * Adresele finale ale fisierelor urcate din CMS. Vite rezolva glob-ul la build,
 * deci harta contine exact fisierele existente, cu numele lor cu amprenta.
 */
const uploads = import.meta.glob<string>('/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,gif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function publicMediaPath(path?: string): string {
  const value = (path ?? '').trim();
  if (!value || /^https?:\/\//i.test(value)) return value;

  if (!value.startsWith(MEDIA_ROOT)) return value;

  const built = uploads[value];
  if (built) return built;

  // Nu e in `src/assets`: cel mai probabil o cale publica peste care CMS-ul a
  // pus prefixul. Ce ramane dupa prefix e adresa reala (`/uploads/...`).
  return value.slice(MEDIA_ROOT.length) || value;
}
