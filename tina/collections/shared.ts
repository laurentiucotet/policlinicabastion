import type { TinaField } from 'tinacms';

/** Grup de campuri SEO, refolosit de toate colectiile cu pagina proprie. */
export const seoField: TinaField = {
  type: 'object',
  name: 'seo',
  label: 'SEO',
  description: 'Lasă gol pentru a folosi titlul și descrierea paginii.',
  fields: [
    { type: 'string', name: 'title', label: 'Titlu în Google' },
    { type: 'string', name: 'description', label: 'Descriere în Google', ui: { component: 'textarea' } },
    { type: 'image', name: 'image', label: 'Imagine pentru social media' },
    { type: 'boolean', name: 'noindex', label: 'Ascunde pagina din Google' },
  ],
};

export const draftField: TinaField = {
  type: 'boolean',
  name: 'draft',
  label: 'Ciornă (nepublicat)',
  description: 'Bifat, pagina nu apare pe site.',
};

export const orderField: TinaField = {
  type: 'number',
  name: 'order',
  label: 'Ordine de afișare',
  description: 'Numere mai mici apar primele.',
};

/** Buton (etichetă + link) folosit in hero, benzi CTA etc. */
export const ctaField = (name: string, label: string): TinaField => ({
  type: 'object',
  name,
  label,
  fields: [
    { type: 'string', name: 'label', label: 'Text buton' },
    { type: 'string', name: 'href', label: 'Link' },
  ],
});

/** Transforma titlul in slug fara diacritice (devine numele fisierului si URL-ul). */
export const slugify = (values: Record<string, unknown>, key = 'title') =>
  String(values[key] ?? 'pagina-noua')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
