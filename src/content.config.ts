import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/* ---------------------------------------------------------------------------
 * Sursa de adevar pentru continut: fisiere .mdx / .json din `src/content`.
 * Aceleasi fisiere sunt (a) citite de Astro la build prin loaderele de mai jos
 * si (b) editate de client prin TinaCMS (vezi `tina/config.ts`).
 * Cele doua scheme trebuie tinute in sincron - vezi docs/ARHITECTURA.md.
 * ------------------------------------------------------------------------- */

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    noindex: z.boolean().optional(),
  })
  .optional();

const md = (dir: string) => glob({ base: `./src/content/${dir}`, pattern: '**/[^_]*.{md,mdx}' });
const json = (dir: string) => glob({ base: `./src/content/${dir}`, pattern: '**/[^_]*.json' });

/**
 * TinaCMS salveaza campurile de tip `reference` ca path complet catre fisier
 * (ex. `src/content/specializari/nefrologie.mdx`), in timp ce Astro asteapta
 * id-ul intrarii (ex. `nefrologie`). Normalizam inainte de validare, ca ambele
 * forme sa functioneze - si cele scrise manual, si cele scrise de Tina.
 */
const tinaId = (value: unknown) =>
  typeof value === 'string' ? value.split('/').pop()!.replace(/\.(md|mdx|json)$/, '') : value;

type RefCollection =
  | 'specializari'
  | 'medici'
  | 'categorii'
  | 'articole'
  | 'afectiuni'
  | 'servicii'
  | 'proiecte'
  | 'suport'
  | 'posturi';

const refTo = <C extends RefCollection>(collection: C) => z.preprocess(tinaId, reference(collection));

/**
 * Campurile `reference` cu mai multe valori sunt salvate de Tina ca lista de
 * obiecte `{ ref: 'src/content/...' }`. Acceptam si forma scurta (doar slug).
 */
const refListTo = <C extends RefCollection>(collection: C) =>
  z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value.map((item) =>
            item && typeof item === 'object' && 'ref' in item ? (item as { ref: unknown }).ref : item,
          )
        : [],
    z.array(refTo(collection)),
  );

/** Liste simple de text (simptome, indicatii, riscuri...) */
const textList = z.array(z.string()).default([]);

/** Lista `nume + descriere` (investigatii, optiuni de tratament, ce include) */
const namedList = z
  .array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  )
  .default([]);

/** Intrebari frecvente - randate ca acordeon + schema.org FAQPage */
const faqList = z
  .array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  )
  .default([]);

/** Bara de "date esentiale" din capul paginii (durata, anestezie, CNAS...) */
const factList = z
  .array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  )
  .default([]);

/**
 * Pretul unui serviciu. Poate fi fix (`from`), interval (`from` + `to`) sau
 * absent - caz in care pagina afiseaza "La cerere" si trimite la telefon.
 * Vezi `formatPrice()` in src/lib/utils.ts.
 */
const price = z
  .object({
    from: z.number().optional(),
    to: z.number().optional(),
    currency: z.string().default('lei'),
    note: z.string().optional(),
  })
  .optional();

/** Specializari medicale: /specializari/[slug] */
const specializari = defineCollection({
  loader: md('specializari'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      badge: z.string().default('Specializari'),
      /** Emoji sau scurtatura folosita in grila de servicii de pe homepage */
      icon: z.string().default('🩺'),
      shortDescription: z.string(),
      cover: image().optional(),
      order: z.number().default(100),
      showOnHomepage: z.boolean().default(true),
      /** Acordeonul "Servicii <specializare>" din design */
      services: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
          }),
        )
        .default([]),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Medici: /medici/[slug] */
const medici = defineCollection({
  loader: md('medici'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** ex. "Medic Primar Nefrologie" - apare sub nume in grila echipei */
      role: z.string(),
      /** ex. "Asistent Universitar - UMF Victor Babes Timisoara" */
      academicTitle: z.string().optional(),
      /** chip-ul albastru de deasupra numelui pe pagina de medic */
      badge: z.string().optional(),
      photo: image().optional(),
      specialities: refListTo('specializari'),
      order: z.number().default(100),
      showOnHomepage: z.boolean().default(true),
      /** Liste simple, randate in doua coloane ca in design */
      procedures: z.array(z.string()).default([]),
      pathologies: z.array(z.string()).default([]),
      education: z.array(z.string()).default([]),
      memberships: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Categorii de articole (chip-urile din /noutati) */
const categorii = defineCollection({
  loader: json('categorii'),
  schema: z.object({
    name: z.string(),
    order: z.number().default(100),
  }),
});

/** Articole de blog / noutati: /noutati/[slug] */
const articole = defineCollection({
  loader: md('articole'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      excerpt: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      category: refTo('categorii').optional(),
      author: refTo('medici').optional(),
      /** Relatii explicite: articolul apare pe paginile acestor entitati */
      conditions: refListTo('afectiuni'),
      services: refListTo('servicii'),
      /** Proiectele europene pe care le documenteaza articolul */
      projects: refListTo('proiecte'),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Afectiuni (catalog): /afectiuni/[slug] */
const afectiuni = defineCollection({
  loader: md('afectiuni'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      badge: z.string().default('Afecțiuni'),
      /** Un rand, afisat pe cardul din catalog si in rezultatele cautarii */
      shortDescription: z.string(),
      /** Categoria din catalog = specializarea care trateaza afectiunea */
      speciality: refTo('specializari'),
      /** Termeni dupa care poate fi gasita in cautare (sinonime, populare) */
      keywords: textList,
      /** Denumiri alternative afisate sub titlu ("cunoscuta si ca...") */
      alsoKnownAs: textList,
      cover: image().optional(),
      /** Bara de date esentiale: frecventa, varsta afectata, urgenta... */
      quickFacts: factList,
      symptoms: textList,
      causes: textList,
      riskFactors: textList,
      /** Cum se pune diagnosticul: investigatii + explicatie */
      diagnosis: namedList,
      /** Optiuni de tratament conservator / medicamentos */
      treatments: namedList,
      /** Serviciile si interventiile prin care se trateaza afectiunea */
      services: refListTo('servicii'),
      whenToSeeDoctor: textList,
      prevention: textList,
      faq: faqList,
      /** Afectiuni inrudite, afisate in subsolul paginii */
      related: refListTo('afectiuni'),
      /** Articole legate explicit (peste cele gasite automat dupa cuvinte-cheie) */
      articles: refListTo('articole'),
      order: z.number().default(100),
      draft: z.boolean().default(false),
      seo,
    }),
});

/**
 * Servicii (catalog unificat): /servicii/[slug]
 *
 * O consultatie, o investigatie si o interventie sunt acelasi tip de entitate -
 * ceva ce pacientul programeaza. Difera doar prin eticheta (`type`) si prin cat
 * de mult din protocol e completat: o consultatie nu are timeline si anestezie,
 * o interventie are. Sectiunile fara continut nu se randeaza.
 */
const servicii = defineCollection({
  loader: md('servicii'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      badge: z.string().default('Servicii'),
      shortDescription: z.string(),
      /** Eticheta din catalog. `interventie` deblocheaza protocolul complet. */
      type: z.enum(['consultatie', 'investigatie', 'procedura', 'interventie', 'analize']).default('consultatie'),
      /** Categoria din catalog = specializarea care il asigura */
      speciality: refTo('specializari'),
      keywords: textList,
      cover: image().optional(),
      price,
      /** Decontat prin CNAS cu bilet de trimitere */
      cnas: z.boolean().default(false),
      /* Date esentiale ------------------------------------------------------ */
      duration: z.string().optional(),
      anesthesia: z.string().optional(),
      /** Regim: ambulatoriu / spitalizare de zi */
      admission: z.string().optional(),
      recovery: z.string().optional(),
      quickFacts: factList,
      /** Afectiunile tratate / pentru care este recomandat */
      conditions: refListTo('afectiuni'),
      /** Medicii care il asigura. Gol => toti medicii specializarii. */
      doctors: refListTo('medici'),
      /* Continutul paginii, in ordinea in care e randat ---------------------- */
      includes: namedList,
      indications: textList,
      contraindications: textList,
      preparation: textList,
      /** Timeline "Cum decurge", pas cu pas */
      timeline: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
            duration: z.string().optional(),
          }),
        )
        .default([]),
      aftercare: textList,
      benefits: textList,
      risks: textList,
      faq: faqList,
      /** Alte servicii cu aceeasi indicatie */
      alternatives: refListTo('servicii'),
      articles: refListTo('articole'),
      order: z.number().default(100),
      draft: z.boolean().default(false),
      seo,
    }),
});

/**
 * Centrul de suport: /suport si /suport/[slug]
 *
 * Intrebari administrative, nu medicale - asigurare, bilete de trimitere,
 * medic de familie, documente. Sunt separate de intrebarile frecvente de pe
 * paginile de serviciu tocmai pentru ca nu tin de o afectiune anume.
 */
const suport = defineCollection({
  loader: md('suport'),
  schema: z.object({
    /** Intrebarea, exact cum ar formula-o pacientul. */
    title: z.string(),
    /** Raspunsul in doua propozitii, afisat in liste si in cautare. */
    shortAnswer: z.string(),
    topic: z.enum(['asigurare', 'programari', 'documente', 'clinica']).default('clinica'),
    keywords: textList,
    /** Pasii de urmat, cand raspunsul e o procedura. */
    steps: namedList,
    /** Linkuri utile (institutii, formulare). */
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        }),
      )
      .default([]),
    related: refListTo('suport'),
    /** Legaturi catre catalog, cand intrebarea are un corespondent acolo. */
    services: refListTo('servicii'),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    seo,
  }),
});

/** Posturi deschise: /cariere */
const posturi = defineCollection({
  loader: md('posturi'),
  schema: z.object({
    title: z.string(),
    /** Ex. "Urologie", "Recepție", "Asistență medicală" */
    department: z.string().optional(),
    /** Norma intreaga / partiala / colaborare */
    type: z.string().default('Normă întreagă'),
    location: z.string().default('Timișoara'),
    summary: z.string(),
    responsibilities: textList,
    requirements: textList,
    offer: textList,
    order: z.number().default(100),
    draft: z.boolean().default(false),
    seo,
  }),
});

/** Proiecte europene: /proiecte-europene/[slug] */
const proiecte = defineCollection({
  loader: md('proiecte-europene'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      summary: z.string(),
      /** Eticheta afisata pe card si in capul paginii */
      status: z.enum(['in-derulare', 'incheiat']).default('in-derulare'),
      cover: image().optional(),
      /* Datele de identificare, obligatorii pentru vizibilitatea finantarii -- */
      beneficiary: z.string().optional(),
      program: z.string().optional(),
      /** Cod SMIS / cod proiect */
      smis: z.string().optional(),
      contractNumber: z.string().optional(),
      /** Perioada de implementare, ca text ("martie 2024 - august 2026") */
      period: z.string().optional(),
      totalValue: z.string().optional(),
      grantValue: z.string().optional(),
      /** Orice alt camp de identificare, in afara celor de mai sus */
      details: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .default([]),
      objectives: textList,
      /** Rezultate concrete: echipamente achizitionate, servicii nou create */
      results: namedList,
      gallery: z.array(image()).default([]),
      /** Noutati legate explicit de proiect (peste cele gasite automat) */
      articles: refListTo('articole'),
      order: z.number().default(100),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Recenzii Google afisate pe homepage */
const testimoniale = defineCollection({
  loader: json('testimoniale'),
  schema: z.object({
    author: z.string(),
    timeAgo: z.string(),
    rating: z.number().min(1).max(5).default(5),
    text: z.string(),
    source: z.enum(['google', 'facebook', 'site']).default('google'),
    url: z.string().optional(),
    order: z.number().default(100),
  }),
});

/** Pagini statice editabile: /[slug] (GDPR, termeni, drepturi pacienti...) */
const pagini = defineCollection({
  loader: md('pagini'),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    badge: z.string().optional(),
    draft: z.boolean().default(false),
    seo,
  }),
});

export const collections = {
  specializari,
  medici,
  categorii,
  articole,
  afectiuni,
  servicii,
  suport,
  posturi,
  proiecte,
  testimoniale,
  pagini,
};
