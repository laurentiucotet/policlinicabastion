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

type RefCollection = 'specializari' | 'medici' | 'categorii' | 'articole' | 'afectiuni' | 'interventii' | 'servicii';

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
      interventions: refListTo('interventii'),
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
      /** Interventiile care trateaza afectiunea */
      interventions: refListTo('interventii'),
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

/** Interventii si proceduri (catalog): /interventii/[slug] */
const interventii = defineCollection({
  loader: md('interventii'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      badge: z.string().default('Intervenții'),
      shortDescription: z.string(),
      /** Categoria din catalog = specializarea care efectueaza interventia */
      speciality: refTo('specializari'),
      keywords: textList,
      cover: image().optional(),
      /* Datele esentiale, afisate ca bara sub titlu ------------------------ */
      duration: z.string().optional(),
      anesthesia: z.string().optional(),
      /** Regim: ambulatoriu / spitalizare de zi */
      admission: z.string().optional(),
      recovery: z.string().optional(),
      /** Alte date esentiale, in afara celor patru de mai sus */
      quickFacts: factList,
      cnas: z.boolean().default(false),
      /** Afectiunile tratate prin aceasta interventie */
      treats: refListTo('afectiuni'),
      /** Medicii care o efectueaza. Gol => toti medicii specializarii. */
      doctors: refListTo('medici'),
      indications: textList,
      contraindications: textList,
      preparation: textList,
      /** Timeline "Cum decurge intervenția", pas cu pas */
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
      /** Alte interventii cu aceeasi indicatie */
      alternatives: refListTo('interventii'),
      articles: refListTo('articole'),
      order: z.number().default(100),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Servicii (oferta clinicii): /servicii/[slug] */
const servicii = defineCollection({
  loader: md('servicii'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      badge: z.string().default('Servicii'),
      shortDescription: z.string(),
      /** Gruparea din pagina /servicii */
      type: z.enum(['consultatie', 'investigatie', 'procedura', 'analize']).default('consultatie'),
      speciality: refTo('specializari'),
      keywords: textList,
      cover: image().optional(),
      /** Serviciul se efectueaza ca interventie => pagina cu protocol complet */
      intervention: refTo('interventii').optional(),
      /** Afectiunile pentru care se recomanda serviciul */
      conditions: refListTo('afectiuni'),
      doctors: refListTo('medici'),
      /** Decontat prin CNAS cu bilet de trimitere */
      cnas: z.boolean().default(false),
      duration: z.string().optional(),
      quickFacts: factList,
      /** Ce include serviciul */
      includes: namedList,
      preparation: textList,
      faq: faqList,
      articles: refListTo('articole'),
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
      cover: image().optional(),
      /** Datele de identificare ale proiectului (card-ul din design) */
      details: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .default([]),
      gallery: z.array(image()).default([]),
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
  interventii,
  servicii,
  proiecte,
  testimoniale,
  pagini,
};
