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
    {
      type: 'string',
      name: 'duration',
      label: 'Durată (text afișat)',
      description: 'Ex: 20–30 de minute. Poate fi un interval.',
    },
    {
      type: 'number',
      name: 'durationMinutes',
      label: 'Durată pentru calendar (minute)',
      description: 'Cât ocupă serviciul într-un slot de programare. Un singur număr, ex. 30.',
    },
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

/**
 * Centrul de suport — întrebări administrative (asigurare, bilete, documente).
 * Sunt separate de întrebările frecvente de pe paginile de serviciu pentru că
 * nu țin de o afecțiune anume.
 */
export const suport: Collection = {
  name: 'suport',
  label: 'Centru de suport',
  path: 'src/content/suport',
  format: 'mdx',
  defaultItem: () => ({ topic: 'clinica' }),
  ui: {
    router: ({ document }) => `/suport/${document._sys.filename}`,
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Întrebarea',
      description: 'Scrie-o exact cum ar formula-o pacientul.',
      isTitle: true,
      required: true,
    },
    {
      type: 'string',
      name: 'shortAnswer',
      label: 'Răspunsul scurt',
      description: 'Două propoziții. Apare în listă, în căutare și în Google.',
      required: true,
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      name: 'topic',
      label: 'Temă',
      options: [
        { value: 'asigurare', label: 'Asigurare și CNAS' },
        { value: 'programari', label: 'Programări și bilete' },
        { value: 'documente', label: 'Documente și rezultate' },
        { value: 'clinica', label: 'Despre clinică' },
      ],
    },
    keywordsField,
    { type: 'rich-text', name: 'body', label: 'Răspunsul complet', isBody: true },
    namedListField('steps', 'Pas cu pas', 'Doar când răspunsul este o procedură.'),
    {
      type: 'object',
      name: 'links',
      label: 'Linkuri utile',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label ?? 'Link' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Text', required: true },
        { type: 'string', name: 'href', label: 'Link', required: true },
      ],
    },
    referenceList('related', 'Întrebări înrudite', ['suport']),
    referenceList('services', 'Servicii legate', ['servicii']),
    orderField,
    draftField,
    seoField,
  ],
};

/** Posturi deschise, afișate pe /cariere. */
export const posturi: Collection = {
  name: 'posturi',
  label: 'Posturi (cariere)',
  path: 'src/content/posturi',
  format: 'mdx',
  defaultItem: () => ({ type: 'Normă întreagă', location: 'Timișoara', draft: true }),
  ui: {
    router: () => '/cariere',
    filename: { slugify: (values) => slugify(values) },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titlul postului', isTitle: true, required: true },
    { type: 'string', name: 'department', label: 'Departament', description: 'Ex: Urologie, Recepție.' },
    { type: 'string', name: 'type', label: 'Tip', description: 'Ex: Normă întreagă, colaborare.' },
    { type: 'string', name: 'location', label: 'Locație' },
    {
      type: 'string',
      name: 'summary',
      label: 'Rezumat',
      required: true,
      ui: { component: 'textarea' },
    },
    textListField('responsibilities', 'Ce va face'),
    textListField('requirements', 'Ce cerem'),
    textListField('offer', 'Ce oferim'),
    { type: 'rich-text', name: 'body', label: 'Detalii (opțional)', isBody: true },
    orderField,
    draftField,
    seoField,
  ],
};

/**
 * Programul medicilor — sursa sloturilor din /programari.
 *
 * Nu se completează sloturi individuale, ci intervale pe zile ale săptămânii.
 * Sloturile concrete se calculează automat, ținând cont de durata serviciului
 * ales de pacient.
 */
export const program: Collection = {
  name: 'program',
  label: 'Program medici (calendar)',
  path: 'src/content/program',
  format: 'json',
  ui: { filename: { slugify: (values) => slugify(values, 'doctor') } },
  fields: [
    {
      type: 'reference',
      name: 'doctor',
      label: 'Medic',
      collections: ['medici'],
      required: true,
    },
    {
      type: 'number',
      name: 'slotMinutes',
      label: 'Pasul grilei (minute)',
      description: 'La câte minute începe un slot nou. Ex: 30.',
    },
    {
      type: 'number',
      name: 'bookingWindowDays',
      label: 'Cu câte zile înainte se poate programa',
    },
    {
      type: 'object',
      name: 'intervals',
      label: 'Intervale de lucru',
      description: 'Câte o linie pentru fiecare interval, pe fiecare zi.',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: `${['', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][item?.day ?? 0] ?? 'Zi'} ${item?.from ?? ''}–${item?.to ?? ''}`,
        }),
      },
      fields: [
        {
          type: 'number',
          name: 'day',
          label: 'Ziua (1 = luni ... 7 = duminică)',
          required: true,
        },
        { type: 'string', name: 'from', label: 'De la (HH:MM)', required: true },
        { type: 'string', name: 'to', label: 'Până la (HH:MM)', required: true },
        { type: 'string', name: 'room', label: 'Cabinet / sală' },
      ],
    },
    {
      type: 'object',
      name: 'exceptions',
      label: 'Excepții (concediu, program modificat)',
      description: 'Fără ore = zi liberă. Cu ore = program diferit în ziua aceea.',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.date ?? 'Excepție' }) },
      fields: [
        { type: 'string', name: 'date', label: 'Data (AAAA-LL-ZZ)', required: true },
        { type: 'string', name: 'reason', label: 'Motiv' },
        { type: 'string', name: 'from', label: 'De la (HH:MM)' },
        { type: 'string', name: 'to', label: 'Până la (HH:MM)' },
      ],
    },
    referenceList('services', 'Servicii programabile', ['servicii'], 'Gol = toate serviciile specializării.'),
    draftField,
  ],
};

export const catalogCollections = [afectiuni, servicii, suport, posturi, program];
