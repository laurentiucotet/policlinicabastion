import type { Collection, TinaField } from 'tinacms';
import { draftField, orderField, seoField, slugify } from './shared';

/* ---------------------------------------------------------------------------
 * Catalogul medical: afectiuni si servicii.
 *
 * Ambele au aceeasi logica: fiecare document e o pagina cu structura fixa,
 * grupata in catalog dupa specializare. Interventiile nu sunt o colectie
 * separata - sunt servicii cu eticheta `interventie`, pentru ca sunt acelasi
 * tip de lucru: ceva ce pacientul programeaza.
 *
 * Relatiile se declara o singura data, dar site-ul le citeste din ambele
 * capete - vezi src/lib/content.ts.
 * ------------------------------------------------------------------------- */

/** `reference` nu suporta `list: true`, deci lista de referinte = lista de obiecte. */
const referenceList = (
  name: string,
  label: string,
  collections: string[],
  description?: string,
): TinaField => ({
  type: 'object',
  name,
  label,
  description,
  list: true,
  ui: {
    itemProps: (item) => ({
      label: item?.ref?.split('/').pop()?.replace(/\.(mdx?|json)$/, '') ?? label,
    }),
  },
  fields: [{ type: 'reference', name: 'ref', label, collections, required: true }],
});

const keywordsField: TinaField = {
  type: 'string',
  name: 'keywords',
  label: 'Cuvinte-cheie pentru căutare',
  description: 'Sinonime și termeni populari. Nu apar pe pagină, dar sunt căutabili.',
  list: true,
};

const textListField = (name: string, label: string, description?: string): TinaField => ({
  type: 'string',
  name,
  label,
  description,
  list: true,
  ui: { component: 'textarea' },
});

const namedListField = (name: string, label: string, description?: string): TinaField => ({
  type: 'object',
  name,
  label,
  description,
  list: true,
  ui: { itemProps: (item) => ({ label: item?.name ?? label }) },
  fields: [
    { type: 'string', name: 'name', label: 'Denumire', required: true },
    { type: 'string', name: 'description', label: 'Explicație', ui: { component: 'textarea' }, required: true },
  ],
});

const faqField: TinaField = {
  type: 'object',
  name: 'faq',
  label: 'Întrebări frecvente',
  description: 'Apar ca acordeon la finalul paginii și în rezultatele Google.',
  list: true,
  ui: { itemProps: (item) => ({ label: item?.question ?? 'Întrebare' }) },
  fields: [
    { type: 'string', name: 'question', label: 'Întrebare', required: true },
    { type: 'string', name: 'answer', label: 'Răspuns', ui: { component: 'textarea' }, required: true },
  ],
};

const quickFactsField: TinaField = {
  type: 'object',
  name: 'quickFacts',
  label: 'Date esențiale (bara de sub titlu)',
  list: true,
  ui: { itemProps: (item) => ({ label: item?.label ?? 'Detaliu' }) },
  fields: [
    { type: 'string', name: 'label', label: 'Etichetă', required: true },
    { type: 'string', name: 'value', label: 'Valoare', required: true },
  ],
};

const specialityField: TinaField = {
  type: 'reference',
  name: 'speciality',
  label: 'Specializare',
  description: 'Determină categoria din catalog și medicii afișați pe pagină.',
  collections: ['specializari'],
  required: true,
};

export const afectiuni: Collection = {
  name: 'afectiuni',
  label: 'Afecțiuni',
  path: 'src/content/afectiuni',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/afectiuni/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Denumire', isTitle: true, required: true },
    { type: 'string', name: 'subtitle', label: 'Subtitlu (sub titlul paginii)' },
    { type: 'string', name: 'badge', label: 'Etichetă' },
    {
      type: 'string',
      name: 'shortDescription',
      label: 'Descriere scurtă',
      description: 'Un rând, afișat pe cardul din catalog și în rezultatele căutării.',
      required: true,
      ui: { component: 'textarea' },
    },
    specialityField,
    textListField('alsoKnownAs', 'Denumiri alternative', 'Ex: hiperplazie benignă de prostată, HBP.'),
    keywordsField,
    { type: 'image', name: 'cover', label: 'Imagine' },
    quickFactsField,
    { type: 'rich-text', name: 'body', label: 'Despre afecțiune', isBody: true },
    textListField('symptoms', 'Simptome'),
    textListField('causes', 'Cauze'),
    textListField('riskFactors', 'Factori de risc'),
    namedListField('diagnosis', 'Cum se pune diagnosticul', 'Investigația + ce arată.'),
    namedListField('treatments', 'Cum se tratează', 'Opțiuni conservatoare și medicamentoase.'),
    referenceList(
      'services',
      'Servicii și intervenții care o tratează',
      ['servicii'],
      'Apar ca linkuri pe pagina afecțiunii. Nu e nevoie să le adaugi și pe serviciu.',
    ),
    textListField('whenToSeeDoctor', 'Când mergi la medic'),
    textListField('prevention', 'Prevenție'),
    faqField,
    referenceList('related', 'Afecțiuni înrudite', ['afectiuni']),
    referenceList('articles', 'Articole legate', ['articole'], 'Peste cele găsite automat după cuvinte-cheie.'),
    orderField,
    draftField,
    seoField,
  ],
};

const priceField: TinaField = {
  type: 'object',
  name: 'price',
  label: 'Preț',
  description: 'Lasă gol pentru „La cerere". Completează doar „De la" pentru un preț fix.',
  fields: [
    { type: 'number', name: 'from', label: 'De la (sau preț fix)' },
    { type: 'number', name: 'to', label: 'Până la', description: 'Doar dacă prețul este un interval.' },
    { type: 'string', name: 'currency', label: 'Monedă', description: 'Implicit: lei.' },
    {
      type: 'string',
      name: 'note',
      label: 'Observație',
      description: 'Ex: „Prețul include consultația și examenul histopatologic."',
      ui: { component: 'textarea' },
    },
  ],
};

/**
 * Servicii — catalogul unificat.
 *
 * O consultație, o investigație și o intervenție sunt același tip de lucru:
 * ceva ce pacientul programează. Diferă prin eticheta „Tip serviciu" și prin
 * cât din protocol e completat. Câmpurile de protocol (anestezie, pași,
 * recuperare, riscuri) rămân goale la o consultație — secțiunile lor pur și
 * simplu nu apar pe pagină.
 */
export const servicii: Collection = {
  name: 'servicii',
  label: 'Servicii și intervenții',
  path: 'src/content/servicii',
  format: 'mdx',
  defaultItem: () => ({ type: 'consultatie', badge: 'Servicii' }),
  ui: {
    router: ({ document }) => `/servicii/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Denumire', isTitle: true, required: true },
    { type: 'string', name: 'subtitle', label: 'Subtitlu (sub titlul paginii)' },
    { type: 'string', name: 'badge', label: 'Etichetă' },
    {
      type: 'string',
      name: 'shortDescription',
      label: 'Descriere scurtă',
      description: 'Un rând, afișat pe cardul din catalog și în rezultatele căutării.',
      required: true,
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      name: 'type',
      label: 'Tip serviciu',
      description: 'Eticheta din catalog. „Intervenție" e cea care primește protocolul complet.',
      options: [
        { value: 'consultatie', label: 'Consultație' },
        { value: 'investigatie', label: 'Investigație' },
        { value: 'analize', label: 'Analize' },
        { value: 'procedura', label: 'Procedură' },
        { value: 'interventie', label: 'Intervenție' },
      ],
    },
    specialityField,
    keywordsField,
    { type: 'image', name: 'cover', label: 'Imagine' },
    priceField,
    { type: 'boolean', name: 'cnas', label: 'Decontat prin CNAS' },
    { type: 'string', name: 'duration', label: 'Durată', description: 'Ex: 20–30 de minute' },
    { type: 'string', name: 'anesthesia', label: 'Anestezie', description: 'Doar la intervenții.' },
    { type: 'string', name: 'admission', label: 'Regim', description: 'Ex: ambulatoriu (fără internare)' },
    { type: 'string', name: 'recovery', label: 'Recuperare', description: 'Ex: 24–48 de ore' },
    quickFactsField,
    referenceList('conditions', 'Afecțiuni tratate / pentru care e recomandat', ['afectiuni']),
    referenceList('doctors', 'Medici', ['medici'], 'Gol = toți medicii specializării.'),
    { type: 'rich-text', name: 'body', label: 'Despre serviciu', isBody: true },
    namedListField('includes', 'Ce include'),
    textListField('indications', 'Când este recomandat'),
    textListField('contraindications', 'Contraindicații'),
    textListField('preparation', 'Cum se pregătește pacientul'),
    {
      type: 'object',
      name: 'timeline',
      label: 'Cum decurge (pas cu pas)',
      description: 'Pașii apar numerotați, pe verticală, în ordinea de aici.',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title ?? 'Pas' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Titlu pas', required: true },
        { type: 'string', name: 'description', label: 'Descriere', ui: { component: 'textarea' }, required: true },
        { type: 'string', name: 'duration', label: 'Durată pas', description: 'Ex: 10 minute' },
      ],
    },
    textListField('aftercare', 'După intervenție'),
    textListField('benefits', 'Beneficii'),
    textListField('risks', 'Riscuri și posibile complicații'),
    faqField,
    referenceList('alternatives', 'Alternative', ['servicii']),
    referenceList('articles', 'Articole legate', ['articole']),
    orderField,
    draftField,
    seoField,
  ],
};

export const catalogCollections = [afectiuni, servicii];
