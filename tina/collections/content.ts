import type { Collection } from 'tinacms';
import { catalogCollections } from './catalog';
import { ctaField, draftField, orderField, seoField, slugify } from './shared';

/* ---------------------------------------------------------------------------
 * Colectiile "de continut": fiecare document devine o pagina pe site.
 * `path` trebuie sa fie identic cu `base`-ul loaderului din src/content.config.ts.
 * ------------------------------------------------------------------------- */

export const specializari: Collection = {
  name: 'specializari',
  label: 'Specializări',
  path: 'src/content/specializari',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/specializari/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Denumire', isTitle: true, required: true },
    { type: 'string', name: 'subtitle', label: 'Subtitlu (sub titlul paginii)' },
    { type: 'string', name: 'badge', label: 'Etichetă', description: 'Chip-ul albastru de deasupra titlului.' },
    {
      type: 'string',
      name: 'icon',
      label: 'Iconiță (emoji)',
      description: 'Apare în grila de servicii de pe prima pagină. Ex: 🫘',
    },
    {
      type: 'string',
      name: 'shortDescription',
      label: 'Descriere scurtă',
      description: 'Un rând, afișat pe cardul din prima pagină.',
      required: true,
      ui: { component: 'textarea' },
    },
    { type: 'image', name: 'cover', label: 'Imagine' },
    orderField,
    { type: 'boolean', name: 'showOnHomepage', label: 'Afișează pe prima pagină' },
    {
      type: 'object',
      name: 'services',
      label: 'Servicii (acordeon)',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.name ?? 'Serviciu' }) },
      fields: [
        { type: 'string', name: 'name', label: 'Denumire serviciu', required: true },
        { type: 'string', name: 'description', label: 'Descriere', ui: { component: 'textarea' }, required: true },
      ],
    },
    { type: 'rich-text', name: 'body', label: 'Descriere completă', isBody: true },
    draftField,
    seoField,
  ],
};

export const medici: Collection = {
  name: 'medici',
  label: 'Medici',
  path: 'src/content/medici',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/medici/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values, 'name') },
  },
  fields: [
    { type: 'string', name: 'name', label: 'Nume', isTitle: true, required: true },
    { type: 'string', name: 'role', label: 'Titulatură', description: 'Ex: Medic primar urolog', required: true },
    { type: 'string', name: 'academicTitle', label: 'Titlu academic' },
    { type: 'string', name: 'badge', label: 'Etichetă', description: 'Chip-ul de pe pagina medicului. Ex: Urologie' },
    { type: 'image', name: 'photo', label: 'Fotografie' },
    {
      // `reference` nu suporta `list: true` in interfata Tina, asa ca folosim
      // o lista de obiecte cu o singura referinta fiecare.
      type: 'object',
      name: 'specialities',
      label: 'Specializări',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: item?.ref?.split('/').pop()?.replace(/\.mdx?$/, '') ?? 'Specializare',
        }),
      },
      fields: [
        {
          type: 'reference',
          name: 'ref',
          label: 'Specializare',
          collections: ['specializari'],
          required: true,
        },
      ],
    },
    orderField,
    { type: 'boolean', name: 'showOnHomepage', label: 'Afișează pe prima pagină' },
    { type: 'string', name: 'procedures', label: 'Proceduri și investigații', list: true },
    { type: 'string', name: 'pathologies', label: 'Patologii tratate', list: true },
    { type: 'string', name: 'education', label: 'Formare profesională', list: true },
    { type: 'string', name: 'memberships', label: 'Afilieri profesionale', list: true },
    { type: 'rich-text', name: 'body', label: 'Despre medic', isBody: true },
    draftField,
    seoField,
  ],
};

export const categorii: Collection = {
  name: 'categorii',
  label: 'Categorii articole',
  path: 'src/content/categorii',
  format: 'json',
  ui: { filename: { slugify: (values) => slugify(values, 'name') } },
  fields: [
    { type: 'string', name: 'name', label: 'Denumire', isTitle: true, required: true },
    orderField,
  ],
};

export const articole: Collection = {
  name: 'articole',
  label: 'Articole / Noutăți',
  path: 'src/content/articole',
  format: 'mdx',
  defaultItem: () => ({ date: new Date().toISOString(), draft: true }),
  ui: {
    router: ({ document }) => `/noutati/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titlu', isTitle: true, required: true },
    { type: 'datetime', name: 'date', label: 'Data publicării', required: true },
    { type: 'datetime', name: 'updated', label: 'Data ultimei actualizări' },
    {
      type: 'string',
      name: 'excerpt',
      label: 'Rezumat',
      description: 'Apare pe card, în listă și în Google.',
      required: true,
      ui: { component: 'textarea' },
    },
    { type: 'image', name: 'cover', label: 'Imagine principală' },
    { type: 'string', name: 'coverAlt', label: 'Text alternativ imagine' },
    { type: 'reference', name: 'category', label: 'Categorie', collections: ['categorii'] },
    { type: 'reference', name: 'author', label: 'Autor (medic)', collections: ['medici'] },
    {
      // Relatii explicite: articolul apare pe paginile afectiunilor si ale
      // interventiilor alese aici. Fara ele, legatura se face automat dupa
      // cuvinte-cheie (vezi getArticoleForEntity in src/lib/content.ts).
      type: 'object',
      name: 'conditions',
      label: 'Afecțiuni legate',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: item?.ref?.split('/').pop()?.replace(/\.mdx?$/, '') ?? 'Afecțiune',
        }),
      },
      fields: [{ type: 'reference', name: 'ref', label: 'Afecțiune', collections: ['afectiuni'], required: true }],
    },
    {
      type: 'object',
      name: 'interventions',
      label: 'Intervenții legate',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: item?.ref?.split('/').pop()?.replace(/\.mdx?$/, '') ?? 'Intervenție',
        }),
      },
      fields: [{ type: 'reference', name: 'ref', label: 'Intervenție', collections: ['interventii'], required: true }],
    },
    { type: 'boolean', name: 'featured', label: 'Articol promovat' },
    { type: 'rich-text', name: 'body', label: 'Conținut', isBody: true },
    draftField,
    seoField,
  ],
};

export const proiecte: Collection = {
  name: 'proiecte',
  label: 'Proiecte europene',
  path: 'src/content/proiecte-europene',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/proiecte-europene/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titlu proiect', isTitle: true, required: true },
    { type: 'string', name: 'subtitle', label: 'Subtitlu' },
    {
      type: 'string',
      name: 'summary',
      label: 'Rezumat',
      required: true,
      ui: { component: 'textarea' },
    },
    { type: 'image', name: 'cover', label: 'Imagine principală' },
    {
      type: 'object',
      name: 'details',
      label: 'Date de identificare',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label ?? 'Detaliu' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Etichetă', required: true },
        { type: 'string', name: 'value', label: 'Valoare', required: true },
      ],
    },
    { type: 'image', name: 'gallery', label: 'Galerie foto', list: true },
    orderField,
    { type: 'rich-text', name: 'body', label: 'Descriere proiect', isBody: true },
    draftField,
    seoField,
  ],
};

export const testimoniale: Collection = {
  name: 'testimoniale',
  label: 'Testimoniale',
  path: 'src/content/testimoniale',
  format: 'json',
  defaultItem: () => ({ rating: 5, source: 'google' }),
  ui: { filename: { slugify: (values) => slugify(values, 'author') } },
  fields: [
    { type: 'string', name: 'author', label: 'Nume pacient', isTitle: true, required: true },
    { type: 'string', name: 'timeAgo', label: 'Când', description: 'Ex: acum 3 săptămâni', required: true },
    {
      type: 'number',
      name: 'rating',
      label: 'Număr de stele (1-5)',
      required: true,
    },
    { type: 'string', name: 'text', label: 'Recenzie', required: true, ui: { component: 'textarea' } },
    {
      type: 'string',
      name: 'source',
      label: 'Sursă',
      options: [
        { value: 'google', label: 'Google' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'site', label: 'Site' },
      ],
    },
    { type: 'string', name: 'url', label: 'Link către recenzie' },
    orderField,
  ],
};

export const pagini: Collection = {
  name: 'pagini',
  label: 'Pagini statice',
  path: 'src/content/pagini',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titlu', isTitle: true, required: true },
    { type: 'string', name: 'badge', label: 'Etichetă' },
    { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
    { type: 'rich-text', name: 'body', label: 'Conținut', isBody: true },
    draftField,
    seoField,
  ],
};

export const contentCollections = [
  specializari,
  medici,
  ...catalogCollections,
  categorii,
  articole,
  proiecte,
  testimoniale,
  pagini,
];

export { ctaField };
