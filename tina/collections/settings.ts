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
      name: 'features',
      label: 'Secțiuni active',
      description:
        'Stinge o secțiune și dispare complet: paginile ei nu se mai generează, iese din meniu, din subsol, din căutare și din legăturile de pe celelalte pagini. Conținutul rămâne salvat, se reaprinde oricând.',
      fields: [
        { type: 'boolean', name: 'servicii', label: 'Servicii și intervenții' },
        { type: 'boolean', name: 'afectiuni', label: 'Afecțiuni tratate' },
        { type: 'boolean', name: 'suport', label: 'Centrul de suport' },
      ],
    },
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
      name: 'booking',
      label: 'Programări',
      fields: [
        { type: 'string', name: 'label', label: 'Text buton' },
        { type: 'string', name: 'href', label: 'Link buton' },
        {
          type: 'number',
          name: 'leadTimeHours',
          label: 'Cel mai devreme peste (ore)',
          description: 'Cu cât timp înainte se poate face o programare. Ex: 24.',
        },
        {
          type: 'boolean',
          name: 'demo',
          label: 'Modul demonstrativ',
          description:
            'Bifat: calendarul arată disponibilitate simulată, iar programarea nu se înregistrează nicăieri. Se debifează când există un sistem real de programări.',
        },
      ],
    },
    {
      type: 'object',
      name: 'address',
      label: 'Adresă',
      fields: [
        { type: 'string', name: 'street', label: 'Stradă și număr' },
        { type: 'string', name: 'city', label: 'Oraș' },
        { type: 'string', name: 'county', label: 'Județ' },
        { type: 'string', name: 'postalCode', label: 'Cod poștal' },
        {
          type: 'string',
          name: 'latitude',
          label: 'Latitudine',
          description:
            'Coordonatele apar în datele structurate (schema.org) și ajută Google și asistenții AI să plaseze corect clinica pe hartă. Se iau din Google Maps: click dreapta pe clădire → prima linie din meniu. Lăsate goale, coordonatele lipsesc pur și simplu, nu se inventează.',
        },
        { type: 'string', name: 'longitude', label: 'Longitudine' },
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
    {
      type: 'object',
      name: 'parking',
      label: 'Parcare',
      description:
        'Apare pe pagina de contact, sub hartă. Lasă descrierea goală ca să ascunzi complet secțiunea.',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        {
          type: 'string',
          name: 'description',
          label: 'Descriere',
          description: 'Câte locuri sunt, dacă parcarea e gratuită și pe unde se intră în curte.',
          ui: { component: 'textarea' },
        },
        {
          type: 'string',
          name: 'note',
          label: 'Notă suplimentară',
          description: 'Opțional: ce face pacientul dacă toate locurile sunt ocupate.',
        },
      ],
    },
    {
      type: 'object',
      name: 'social',
      label: 'Rețele sociale',
      description:
        'Linkul complet al fiecărui profil. Un câmp lăsat gol ascunde iconița din subsol, nu apare un link mort.',
      fields: [
        {
          type: 'string',
          name: 'facebook',
          label: 'Facebook',
          description: 'Ex: https://www.facebook.com/policlinicabastion/',
        },
        {
          type: 'string',
          name: 'instagram',
          label: 'Instagram',
          description: 'Ex: https://www.instagram.com/policlinica.bastion/',
        },
        {
          type: 'string',
          name: 'linkedin',
          label: 'LinkedIn',
          description: 'Ex: https://www.linkedin.com/company/nume-pagina/',
        },
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
      name: 'footerGroups',
      label: 'Subsol: coloane de linkuri',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title ?? 'Coloană' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Titlu coloană', required: true },
        {
          type: 'object',
          name: 'links',
          label: 'Linkuri',
          list: true,
          ui: { itemProps: (item) => ({ label: item?.label ?? 'Link' }) },
          fields: [
            { type: 'string', name: 'label', label: 'Text', required: true },
            { type: 'string', name: 'href', label: 'Link', required: true },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'footerLegal',
      label: 'Subsol: rândul de jos (legal)',
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
        { type: 'string', name: 'titleBefore', label: 'Titlu, prima linie' },
        { type: 'string', name: 'titleHighlight', label: 'Cuvânt evidențiat (albastru)' },
        { type: 'string', name: 'titleAfter', label: 'Titlu, restul' },
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
    sectionHeader('explore', 'Secțiunea „Caută după ce te interesează”'),
    sectionHeader('news', 'Secțiunea „Ultimele noutăți”', [
      ctaField('cta', 'Buton'),
      { type: 'number', name: 'count', label: 'Câte articole afișăm' },
    ]),
    sectionHeader('services', 'Secțiunea „Servicii medicale”'),
    sectionHeader('highlights', 'Secțiunea „Intervenții de referință”', [
      {
        type: 'object',
        name: 'items',
        label: 'Intervenții promovate',
        description: 'Lasă gol pentru primele din catalog, în ordinea lor.',
        list: true,
        ui: { itemProps: (item) => ({ label: item?.ref?.split('/').pop()?.replace(/\.mdx?$/, '') ?? 'Intervenție' }) },
        fields: [{ type: 'reference', name: 'ref', label: 'Intervenție', collections: ['servicii'], required: true }],
      },
      ctaField('cta', 'Buton'),
      { type: 'number', name: 'count', label: 'Câte intervenții afișăm' },
    ]),
    sectionHeader('why', 'Banda „De ce Bastion” (fundal albastru)', [
      {
        type: 'object',
        name: 'items',
        label: 'Motive',
        list: true,
        ui: { itemProps: (item) => ({ label: item?.title ?? 'Motiv' }) },
        fields: [
          { type: 'string', name: 'icon', label: 'Iconiță (emoji)' },
          { type: 'string', name: 'title', label: 'Titlu', required: true },
          { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' }, required: true },
        ],
      },
    ]),
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
    sectionHeader('steps', 'Secțiunea „Cum te programezi”', [
      {
        type: 'object',
        name: 'items',
        label: 'Pași',
        description: 'Se numerotează automat, în ordinea de aici.',
        list: true,
        ui: { itemProps: (item) => ({ label: item?.title ?? 'Pas' }) },
        fields: [
          { type: 'string', name: 'title', label: 'Titlu pas', required: true },
          { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' }, required: true },
        ],
      },
    ]),
    sectionHeader('testimonials', 'Secțiunea „Testimoniale”', [
      { type: 'number', name: 'count', label: 'Câte recenzii afișăm' },
    ]),
    sectionHeader('team', 'Secțiunea „Echipa noastră”', [
      ctaField('cta', 'Buton'),
      { type: 'number', name: 'count', label: 'Câți medici afișăm' },
    ]),
    sectionHeader('faq', 'Secțiunea „Întrebări frecvente”', [
      {
        type: 'object',
        name: 'items',
        label: 'Întrebări',
        list: true,
        ui: { itemProps: (item) => ({ label: item?.question ?? 'Întrebare' }) },
        fields: [
          { type: 'string', name: 'question', label: 'Întrebare', required: true },
          { type: 'string', name: 'answer', label: 'Răspuns', ui: { component: 'textarea' }, required: true },
        ],
      },
    ]),
    {
      type: 'object',
      name: 'euProjects',
      label: 'Banda „Fonduri europene”',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        ctaField('cta', 'Link'),
      ],
    },
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

export const despre: Collection = {
  name: 'despre',
  label: 'Pagina „Despre noi"',
  path: 'src/content/settings',
  format: 'json',
  match: { include: 'despre' },
  ui: { ...singletonUi, router: () => '/despre-noi' },
  fields: [
    seoField,
    {
      type: 'object',
      name: 'intro',
      label: 'Capul paginii',
      fields: [
        { type: 'string', name: 'badge', label: 'Etichetă' },
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'story',
      label: 'Povestea clinicii',
      description:
        'Bara cu cifre de deasupra (medici, specializări, servicii) se numără singură din conținut, nu se scrie aici.',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        {
          type: 'string',
          name: 'paragraphs',
          label: 'Paragrafe',
          list: true,
          ui: { component: 'textarea' },
        },
        { type: 'string', name: 'highlightsTitle', label: 'Titlul casetei din dreapta' },
        { type: 'string', name: 'highlights', label: 'Puncte din casetă', list: true },
      ],
    },
    {
      type: 'object',
      name: 'values',
      label: 'Banda albastră (cum lucrăm)',
      fields: [
        { type: 'string', name: 'badge', label: 'Etichetă' },
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
        {
          type: 'object',
          name: 'items',
          label: 'Puncte',
          list: true,
          ui: { itemProps: (item) => ({ label: item?.title ?? 'Punct' }) },
          fields: [
            { type: 'string', name: 'icon', label: 'Emoji' },
            { type: 'string', name: 'title', label: 'Titlu', required: true },
            { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'equipment',
      label: 'Dotări',
      description: 'Lista de echipamente vine din proiectele europene, ca să nu fie ținută în două locuri.',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'intro', label: 'Introducere', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'specialities',
      label: 'Specializări',
      fields: [
        { type: 'string', name: 'badge', label: 'Etichetă' },
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      name: 'team',
      label: 'Echipa',
      fields: [
        { type: 'string', name: 'badge', label: 'Etichetă' },
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
        ctaField('cta', 'Buton'),
      ],
    },
    {
      type: 'object',
      name: 'steps',
      label: 'Cum decurge o vizită',
      fields: [
        { type: 'string', name: 'badge', label: 'Etichetă' },
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'subtitle', label: 'Subtitlu', ui: { component: 'textarea' } },
        {
          type: 'object',
          name: 'items',
          label: 'Pași',
          list: true,
          ui: { itemProps: (item) => ({ label: item?.title ?? 'Pas' }) },
          fields: [
            { type: 'string', name: 'title', label: 'Titlu', required: true },
            { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
          ],
        },
      ],
    },
    {
      type: 'object',
      name: 'cta',
      label: 'Bandă CTA (finală)',
      fields: [
        { type: 'string', name: 'title', label: 'Titlu' },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        ctaField('cta', 'Buton'),
      ],
    },
  ],
};

export const settingsCollections = [homepage, despre, setari, meniu];
