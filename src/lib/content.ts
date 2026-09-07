import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { byOrder, normalizeText } from './utils';
import { isFeatureEnabled } from './features';

/* Helpere de citire a continutului. Toate filtreaza `draft: true` in productie,
 * dar le lasa vizibile in `astro dev` ca sa poti previzualiza ce scrii in Tina. */

const keepDrafts = import.meta.env.DEV;

const notDraft = (entry: { data: { draft?: boolean } }) => keepDrafts || !entry.data.draft;

export async function getSpecializari(): Promise<CollectionEntry<'specializari'>[]> {
  const items = await getCollection('specializari', notDraft);
  return items.sort(byOrder);
}

export async function getMedici(): Promise<CollectionEntry<'medici'>[]> {
  const items = await getCollection('medici', notDraft);
  return items.sort(byOrder);
}

export async function getMediciBySpecialitate(specialitateId: string): Promise<CollectionEntry<'medici'>[]> {
  const items = await getMedici();
  return items.filter((medic) => medic.data.specialities.some((ref) => ref.id === specialitateId));
}

export async function getArticole(): Promise<CollectionEntry<'articole'>[]> {
  const items = await getCollection('articole', notDraft);
  return items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getCategorii(): Promise<CollectionEntry<'categorii'>[]> {
  const items = await getCollection('categorii');
  return items.sort(byOrder);
}

export async function getProiecte(): Promise<CollectionEntry<'proiecte'>[]> {
  const items = await getCollection('proiecte', notDraft);
  return items.sort(byOrder);
}

export async function getTestimoniale(): Promise<CollectionEntry<'testimoniale'>[]> {
  const items = await getCollection('testimoniale');
  return items.sort(byOrder);
}

export async function getAfectiuni(): Promise<CollectionEntry<'afectiuni'>[]> {
  // Sectiune stinsa din CMS: lista goala aici goleste si legaturile
  // incrucisate de pe celelalte pagini, si indexul de cautare. Vezi ./features.
  if (!isFeatureEnabled('afectiuni')) return [];
  const items = await getCollection('afectiuni', notDraft);
  return items.sort(byOrder);
}

export async function getServicii(): Promise<CollectionEntry<'servicii'>[]> {
  // Sectiune stinsa din CMS: lista goala aici goleste si legaturile
  // incrucisate de pe celelalte pagini, si indexul de cautare. Vezi ./features.
  if (!isFeatureEnabled('servicii')) return [];
  const items = await getCollection('servicii', notDraft);
  return items.sort(byOrder);
}

export async function getSuport(): Promise<CollectionEntry<'suport'>[]> {
  // Sectiune stinsa din CMS: lista goala aici goleste si legaturile
  // incrucisate de pe celelalte pagini, si indexul de cautare. Vezi ./features.
  if (!isFeatureEnabled('suport')) return [];
  const items = await getCollection('suport', notDraft);
  return items.sort(byOrder);
}

export async function getPosturi(): Promise<CollectionEntry<'posturi'>[]> {
  const items = await getCollection('posturi', notDraft);
  return items.sort(byOrder);
}

/* ---------------------------------------------------------------------------
 * Relatii intre entitati.
 *
 * Regula: fiecare relatie e declarata o singura data in CMS, dar poate fi
 * citita din ambele capete. Ex. un serviciu declara ce afectiuni trateaza
 * (`conditions`), iar pagina afectiunii il afiseaza - fie pentru ca afectiunea
 * l-a listat ea (`services`), fie pentru ca serviciul a listat afectiunea.
 * Asa nu exista relatii "pe jumatate".
 * ------------------------------------------------------------------------- */

type WithId = { id: string };

const unique = <T extends WithId>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
};

/** Rezolva o lista de referinte, ignorand intrarile de tip draft. */
async function resolveMany<C extends 'afectiuni' | 'articole' | 'medici' | 'servicii' | 'proiecte' | 'suport'>(
  refs: { collection: C; id: string }[],
): Promise<CollectionEntry<C>[]> {
  // `getEntry` are un tip conditional greu de propagat printr-un generic, asa
  // ca fixam aici forma rezultatului - referintele sunt oricum validate la build.
  const entries = (await Promise.all(refs.map((ref) => getEntry(ref)))) as (CollectionEntry<C> | undefined)[];
  return entries.filter((entry): entry is CollectionEntry<C> => entry !== undefined && notDraft(entry));
}

export async function getAfectiuniBySpecialitate(specialitateId: string) {
  const items = await getAfectiuni();
  return items.filter((item) => item.data.speciality.id === specialitateId);
}

export async function getServiciiBySpecialitate(specialitateId: string) {
  const items = await getServicii();
  return items.filter((item) => item.data.speciality.id === specialitateId);
}

/** Serviciile prin care se trateaza o afectiune (din ambele capete ale relatiei). */
export async function getServiciiForAfectiune(afectiune: CollectionEntry<'afectiuni'>) {
  const [declared, all] = await Promise.all([resolveMany(afectiune.data.services), getServicii()]);
  const reverse = all.filter((item) => item.data.conditions.some((ref) => ref.id === afectiune.id));
  return unique([...declared, ...reverse]).sort(byOrder);
}

/** Afectiunile tratate printr-un serviciu (din ambele capete ale relatiei). */
export async function getAfectiuniForServiciu(serviciu: CollectionEntry<'servicii'>) {
  const [declared, all] = await Promise.all([resolveMany(serviciu.data.conditions), getAfectiuni()]);
  const reverse = all.filter((item) => item.data.services.some((ref) => ref.id === serviciu.id));
  return unique([...declared, ...reverse]).sort(byOrder);
}

/** Serviciile pe care le asigura un medic (declarate pe serviciu). */
export async function getServiciiForMedic(medic: CollectionEntry<'medici'>) {
  const items = await getServicii();
  return items.filter(
    (item) =>
      item.data.doctors.some((ref) => ref.id === medic.id) ||
      // Fara medici declarati, serviciul apartine intregii specializari.
      (item.data.doctors.length === 0 &&
        medic.data.specialities.some((ref) => ref.id === item.data.speciality.id)),
  );
}

/** Medicii care asigura un serviciu: cei declarati, altfel toata specializarea. */
export async function getMediciForServiciu(serviciu: CollectionEntry<'servicii'>) {
  if (serviciu.data.doctors.length) {
    const declared = await resolveMany(serviciu.data.doctors);
    return declared.sort(byOrder);
  }
  return getMediciBySpecialitate(serviciu.data.speciality.id);
}

type RelatableData = {
  title: string;
  keywords?: string[];
  alsoKnownAs?: string[];
  articles: { collection: 'articole'; id: string }[];
};

/**
 * Articolele relevante pentru o afectiune, un serviciu sau un proiect, in ordine:
 *   1. cele legate explicit de pe entitate (`articles`)
 *   2. cele care declara ele legatura (`conditions` / `services`)
 *   3. cele care contin titlul sau un cuvant-cheie in titlu/rezumat
 *
 * Pasul 3 face ca relatia sa functioneze din prima, inainte ca editorul sa
 * apuce sa eticheteze cele ~30 de articole existente.
 */
export async function getArticoleForEntity(
  entry: { id: string; data: RelatableData },
  kind: 'conditions' | 'services',
  limit = 3,
): Promise<CollectionEntry<'articole'>[]> {
  const [declared, all] = await Promise.all([resolveMany(entry.data.articles), getArticole()]);

  const reverse = all.filter((article) => article.data[kind].some((ref) => ref.id === entry.id));

  /* Fiecare termen devine o lista de radacini de 6 litere ("prostata" ->
   * "prostat"), ca sa treaca peste flexiunea din romana: "biopsia de prostata"
   * si "biopsie prostatica" se potrivesc. Un termen se considera gasit doar
   * daca toate radacinile lui apar in articol - altfel apar prea multe
   * potriviri intamplatoare. */
  const terms = [entry.data.title, ...(entry.data.keywords ?? []), ...(entry.data.alsoKnownAs ?? [])]
    .map((term) =>
      normalizeText(term)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 5)
        .map((word) => word.slice(0, 6)),
    )
    .filter((stems) => stems.length > 0);

  const byKeyword = all.filter((article) => {
    const haystack = normalizeText(`${article.data.title} ${article.data.excerpt}`);
    return terms.some((stems) => stems.every((stem) => haystack.includes(stem)));
  });

  return unique([...declared, ...reverse, ...byKeyword]).slice(0, limit);
}

/** Intrebarile inrudite de pe o pagina de suport, plus altele din acelasi grup. */
export async function getSuportInrudite(current: CollectionEntry<'suport'>, limit = 3) {
  const [declared, all] = await Promise.all([resolveMany(current.data.related), getSuport()]);
  const sameTopic = all.filter((item) => item.id !== current.id && item.data.topic === current.data.topic);
  return unique([...declared, ...sameTopic]).slice(0, limit);
}

/** Noutatile despre un proiect european: legate explicit, din ambele capete. */
export async function getArticoleForProiect(
  proiect: CollectionEntry<'proiecte'>,
  limit = 3,
): Promise<CollectionEntry<'articole'>[]> {
  const [declared, all] = await Promise.all([resolveMany(proiect.data.articles), getArticole()]);
  const reverse = all.filter((article) => article.data.projects.some((ref) => ref.id === proiect.id));
  return unique([...declared, ...reverse]).slice(0, limit);
}

/** Articole inrudite: aceeasi categorie, exceptand articolul curent. */
export async function getArticoleInrudite(
  current: CollectionEntry<'articole'>,
  limit = 3,
): Promise<CollectionEntry<'articole'>[]> {
  const all = await getArticole();
  const sameCategory = all.filter(
    (item) => item.id !== current.id && item.data.category?.id === current.data.category?.id,
  );
  const rest = all.filter((item) => item.id !== current.id && !sameCategory.includes(item));
  return [...sameCategory, ...rest].slice(0, limit);
}
