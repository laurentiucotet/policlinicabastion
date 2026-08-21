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

const refTo = <C extends 'specializari' | 'medici' | 'categorii'>(collection: C) =>
  z.preprocess(tinaId, reference(collection));

/**
 * Campurile `reference` cu mai multe valori sunt salvate de Tina ca lista de
 * obiecte `{ ref: 'src/content/...' }`. Acceptam si forma scurta (doar slug).
 */
const refListTo = <C extends 'specializari'>(collection: C) =>
  z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value.map((item) =>
            item && typeof item === 'object' && 'ref' in item ? (item as { ref: unknown }).ref : item,
          )
        : [],
    z.array(refTo(collection)),
  );

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
      featured: z.boolean().default(false),
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

export const collections = { specializari, medici, categorii, articole, proiecte, testimoniale, pagini };
