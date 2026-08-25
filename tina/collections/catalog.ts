import type { Collection, TinaField } from 'tinacms';
import { draftField, orderField, seoField, slugify } from './shared';

/* ---------------------------------------------------------------------------
 * Catalogul medical: afectiuni, interventii si servicii.
 *
 * Toate trei au aceeasi logica: fiecare document e o pagina cu structura fixa,
 * grupata in catalog dupa specializare. Relatiile (ce interventie trateaza ce
 * afectiune, ce serviciu se face prin ce interventie) se declara o singura
 * data, dar site-ul le citeste din ambele capete - vezi src/lib/content.ts.
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
      'interventions',
      'Intervenții care o tratează',
      ['interventii'],
      'Apar ca linkuri pe pagina afecțiunii. Nu e nevoie să le adaugi și pe intervenție.',
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

export const interventii: Collection = {
  name: 'interventii',
  label: 'Intervenții',
  path: 'src/content/interventii',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/interventii/${document._sys.filename}`,
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
      required: true,
      ui: { component: 'textarea' },
    },
    specialityField,
    keywordsField,
    { type: 'image', name: 'cover', label: 'Imagine' },
    { type: 'string', name: 'duration', label: 'Durată', description: 'Ex: 20–30 de minute' },
    { type: 'string', name: 'anesthesia', label: 'Anestezie', description: 'Ex: anestezie locală' },
    { type: 'string', name: 'admission', label: 'Regim', description: 'Ex: ambulatoriu (fără internare)' },
    { type: 'string', name: 'recovery', label: 'Recuperare', description: 'Ex: 24–48 de ore' },
    { type: 'boolean', name: 'cnas', label: 'Decontat prin CNAS' },
    quickFactsField,
    { type: 'rich-text', name: 'body', label: 'Ce este intervenția', isBody: true },
    textListField('indications', 'Când este recomandată'),
    referenceList('treats', 'Afecțiuni tratate', ['afectiuni']),
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
    referenceList('doctors', 'Medici care o efectuează', ['medici'], 'Gol = toți medicii specializării.'),
    referenceList('alternatives', 'Alternative', ['interventii']),
    referenceList('articles', 'Articole legate', ['articole']),
    orderField,
    draftField,
    seoField,
  ],
};

export const servicii: Collection = {
  name: 'servicii',
  label: 'Servicii',
  path: 'src/content/servicii',
  format: 'mdx',
  ui: {
    router: ({ document }) => `/servicii/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Denumire serviciu', isTitle: true, required: true },
    { type: 'string', name: 'subtitle', label: 'Subtitlu (sub titlul paginii)' },
    { type: 'string', name: 'badge', label: 'Etichetă' },
    {
      type: 'string',
      name: 'shortDescription',
      label: 'Descriere scurtă',
      required: true,
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      name: 'type',
      label: 'Tip serviciu',
      options: [
        { value: 'consultatie', label: 'Consultație' },
        { value: 'investigatie', label: 'Investigație' },
        { value: 'procedura', label: 'Procedură' },
        { value: 'analize', label: 'Analize' },
      ],
    },
    specialityField,
    keywordsField,
    { type: 'image', name: 'cover', label: 'Imagine' },
    {
      type: 'reference',
      name: 'intervention',
      label: 'Se efectuează ca intervenție',
      description: 'Dacă serviciul are un protocol complet, leagă-l aici de pagina intervenției.',
      collections: ['interventii'],
    },
    referenceList('conditions', 'Afecțiuni pentru care e recomandat', ['afectiuni']),
    referenceList('doctors', 'Medici', ['medici'], 'Gol = toți medicii specializării.'),
    { type: 'boolean', name: 'cnas', label: 'Decontat prin CNAS' },
    { type: 'string', name: 'duration', label: 'Durată', description: 'Ex: 30 de minute' },
    quickFactsField,
    { type: 'rich-text', name: 'body', label: 'Despre serviciu', isBody: true },
    namedListField('includes', 'Ce include'),
    textListField('preparation', 'Cum te pregătești'),
    faqField,
    referenceList('articles', 'Articole legate', ['articole']),
    orderField,
    draftField,
    seoField,
  ],
};

export const catalogCollections = [afectiuni, interventii, servicii];
