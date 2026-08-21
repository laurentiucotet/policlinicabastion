import type { Collection } from 'tinacms';
import { ctaField, seoField } from './shared';

/* ---------------------------------------------------------------------------
 * "Singleton"-uri: cate un singur fisier JSON, fara buton de creare/stergere.
 * `match.include` fixeaza colectia pe un singur fisier din `src/content/settings`.
 * ------------------------------------------------------------------------- */

const singletonUi = { allowedActions: { create: false, delete: false } } as const;

export const setari: Collection = {
  name: 'setari',
  label: 'Setări site',
  path: 'src/content/settings',
  format: 'json',
  match: { include: 'site' },
  ui: singletonUi,
  fields: [
    { type: 'string', name: 'name', label: 'Nume clinică', isTitle: true, required: true },
    { type: 'string', name: 'legalName', label: 'Denumire juridică' },
    { type: 'string', name: 'tagline', label: 'Slogan' },
    {
      type: 'object',
      name: 'defaultSeo',
      label: 'SEO implicit',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu implicit' },
        { type: 'string', name: 'description', label: 'Descriere implicită', ui: { component: 'textarea' } },
        { type: 'image', name: 'image', label: 'Imagine implicită social media' },
      ],
    },
    {
      type: 'object',
      name: 'topBar',
      label: 'Bara de sus',
      fields: [
        { type: 'string', name: 'addressShort', label: 'Adresă (scurt)' },
        { type: 'string', name: 'phonesShort', label: 'Telefoane (scurt)' },
        { type: 'string', name: 'hoursShort', label: 'Program (scurt)' },
      ],
    },
    {
      type: 'object',
      name: 'phones',
      label: 'Telefoane',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.value ?? 'Telefon' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Etichetă' },
        { type: 'string', name: 'value', label: 'Număr afișat', required: true },
        { type: 'string', name: 'href', label: 'Link tel:', description: 'Ex: tel:+40738826587' },
      ],
    },
    { type: 'string', name: 'email', label: 'Email' },
    {
      type: 'object',
      name: 'address',
      label: 'Adresă',
      fields: [
        { type: 'string', name: 'street', label: 'Stradă și număr' },
        { type: 'string', name: 'city', label: 'Oraș' },
        { type: 'string', name: 'county', label: 'Județ' },
        { type: 'string', name: 'postalCode', label: 'Cod poștal' },
        { type: 'string', name: 'mapsUrl', label: 'Link Google Maps' },
        {
          type: 'string',
          name: 'mapEmbedUrl',
          label: 'Link hartă încorporată (embed)',
          description: 'Google Maps → Partajare → Încorporați o hartă → doar valoarea src.',
        },
      ],
    },
    {
      type: 'object',
      name: 'schedule',
      label: 'Program de lucru',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.days ?? 'Interval' }) },
      fields: [
        { type: 'string', name: 'days', label: 'Zile', required: true },
        { type: 'string', name: 'hours', label: 'Interval orar', required: true },
      ],
    },
    {
      type: 'object',
      name: 'whatsapp',
      label: 'WhatsApp',
      fields: [
        { type: 'string', name: 'number', label: 'Număr', description: 'Format internațional: +40738826587' },
        { type: 'string', name: 'message', label: 'Mesaj precompletat', ui: { component: 'textarea' } },
      ],
    },
    ctaField('booking', 'Buton principal (Programează-te)'),
    {
      type: 'object',
      name: 'social',
      label: 'Rețele sociale',
      fields: [
        { type: 'string', name: 'facebook', label: 'Facebook' },
        { type: 'string', name: 'instagram', label: 'Instagram' },
        { type: 'string', name: 'linkedin', label: 'LinkedIn' },
      ],
    },
    {
      type: 'object',
      name: 'analytics',
      label: 'Analytics',
      fields: [{ type: 'string', name: 'gtmId', label: 'Google Tag Manager ID' }],
    },
  ],
};

export const meniu: Collection = {
  name: 'meniu',
  label: 'Meniu',
  path: 'src/content/settings',
  format: 'json',
  match: { include: 'navigation' },
  ui: singletonUi,
  fields: [
    {
      type: 'object',
      name: 'main',
      label: 'Meniu principal',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label ?? 'Element' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Text', required: true },
        { type: 'string', name: 'href', label: 'Link', required: true },
        {
          type: 'object',
          name: 'children',
          label: 'Submeniu',
          list: true,
          ui: { itemProps: (item) => ({ label: item?.label ?? 'Element' }) },
          fields: [
            { type: 'string', name: 'label', label: 'Text', required: true },
            { type: 'string', name: 'href', label: 'Link', required: true },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'footer',
      label: 'Linkuri în subsol',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label ?? 'Link' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Text', required: true },
        { type: 'string', name: 'href', label: 'Link', required: true },
      ],
    },
  ],
};

const sectionHeader = (name: string, label: string, extra: Collection['fields'] = []) => ({
  type: 'object' as const,
  name,
  label,
  fields: [
    { type: 'string' as const, name: 'badge', label: 'Etichetă' },
    { type: 'string' as const, name: 'title', label: 'Titlu' },
    { type: 'string' as const, name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
    ...extra,
  ],
});

export const homepage: Collection = {
  name: 'homepage',
  label: 'Prima pagină',
  path: 'src/content/settings',
  format: 'json',
  match: { include: 'home' },
  ui: { ...singletonUi, router: () => '/' },
  fields: [
    seoField,
    {
      type: 'object',
      name: 'hero',
      label: 'Hero',
      fields: [
        { type: 'string', name: 'titleBefore', label: 'Titlu — prima linie' },
        { type: 'string', name: 'titleHighlight', label: 'Cuvânt evidențiat (albastru)' },
        { type: 'string', name: 'titleAfter', label: 'Titlu — restul' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
        ctaField('primaryCta', 'Buton principal'),
        ctaField('secondaryCta', 'Buton secundar'),
        {
          type: 'object',
          name: 'stats',
          label: 'Cifre cheie',
          list: true,
          ui: { itemProps: (item) => ({ label: item?.value ?? 'Cifră' }) },
          fields: [
            { type: 'string', name: 'value', label: 'Valoare', required: true },
            { type: 'string', name: 'label', label: 'Etichetă', required: true },
          ],
        },
        { type: 'string', name: 'statsNote', label: 'Notă sub cifre' },
      ],
    },
    sectionHeader('news', 'Secțiunea „Ultimele noutăți”', [
      ctaField('cta', 'Buton'),
      { type: 'number', name: 'count', label: 'Câte articole afișăm' },
    ]),
    sectionHeader('services', 'Secțiunea „Servicii medicale”'),
    {
      type: 'object',
      name: 'ctaPrimary',
      label: 'Bandă CTA (după servicii)',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        ctaField('cta', 'Buton'),
      ],
    },
    sectionHeader('testimonials', 'Secțiunea „Testimoniale”', [
      { type: 'number', name: 'count', label: 'Câte recenzii afișăm' },
    ]),
    sectionHeader('team', 'Secțiunea „Echipa noastră”', [
      ctaField('cta', 'Buton'),
      { type: 'number', name: 'count', label: 'Câți medici afișăm' },
    ]),
    {
      type: 'object',
      name: 'ctaSecondary',
      label: 'Bandă CTA (finală)',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        ctaField('cta', 'Buton'),
      ],
    },
  ],
};

export const settingsCollections = [homepage, setari, meniu];
