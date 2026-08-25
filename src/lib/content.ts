import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { byOrder, normalizeText } from './utils';

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
  const items = await getCollection('afectiuni', notDraft);
  return items.sort(byOrder);
}

export async function getInterventii(): Promise<CollectionEntry<'interventii'>[]> {
  const items = await getCollection('interventii', notDraft);
  return items.sort(byOrder);
}

export async function getServicii(): Promise<CollectionEntry<'servicii'>[]> {
  const items = await getCollection('servicii', notDraft);
  return items.sort(byOrder);
}

/* ---------------------------------------------------------------------------
 * Relatii intre entitati.
 *
 * Regula: fiecare relatie e declarata o singura data in CMS, dar poate fi
 * citita din ambele capete. Ex. o interventie declara ce afectiuni trateaza
 * (`treats`), iar pagina afectiunii afiseaza interventiile care o trateaza -
 * fie pentru ca afectiunea le-a listat ea (`interventions`), fie pentru ca
 * interventia a listat afectiunea. Asa nu exista relatii "pe jumatate".
 * ------------------------------------------------------------------------- */

type WithId = { id: string };

const unique = <T extends WithId>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
};

/** Rezolva o lista de referinte, ignorand intrarile de tip draft. */
async function resolveMany<C extends 'afectiuni' | 'interventii' | 'articole' | 'medici' | 'servicii'>(
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

export async function getInterventiiBySpecialitate(specialitateId: string) {
  const items = await getInterventii();
  return items.filter((item) => item.data.speciality.id === specialitateId);
}

export async function getServiciiBySpecialitate(specialitateId: string) {
  const items = await getServicii();
  return items.filter((item) => item.data.speciality.id === specialitateId);
}

/** Interventiile care trateaza o afectiune (din ambele capete ale relatiei). */
export async function getInterventiiForAfectiune(afectiune: CollectionEntry<'afectiuni'>) {
  const [declared, all] = await Promise.all([resolveMany(afectiune.data.interventions), getInterventii()]);
  const reverse = all.filter((item) => item.data.treats.some((ref) => ref.id === afectiune.id));
  return unique([...declared, ...reverse]).sort(byOrder);
}

/** Afectiunile tratate de o interventie (din ambele capete ale relatiei). */
export async function getAfectiuniForInterventie(interventie: CollectionEntry<'interventii'>) {
  const [declared, all] = await Promise.all([resolveMany(interventie.data.treats), getAfectiuni()]);
  const reverse = all.filter((item) => item.data.interventions.some((ref) => ref.id === interventie.id));
  return unique([...declared, ...reverse]).sort(byOrder);
}

/** Serviciile care se efectueaza prin aceasta interventie. */
export async function getServiciiForInterventie(interventie: CollectionEntry<'interventii'>) {
  const items = await getServicii();
  return items.filter((item) => item.data.intervention?.id === interventie.id);
}

/** Serviciile recomandate pentru o afectiune (declarate pe serviciu). */
export async function getServiciiForAfectiune(afectiune: CollectionEntry<'afectiuni'>) {
  const items = await getServicii();
  return items.filter((item) => item.data.conditions.some((ref) => ref.id === afectiune.id));
}

/** Interventiile pe care le efectueaza un medic (declarate pe interventie). */
export async function getInterventiiForMedic(medic: CollectionEntry<'medici'>) {
  const items = await getInterventii();
  return items.filter(
    (item) =>
      item.data.doctors.some((ref) => ref.id === medic.id) ||
      // Fara medici declarati, interventia apartine intregii specializari.
      (item.data.doctors.length === 0 &&
        medic.data.specialities.some((ref) => ref.id === item.data.speciality.id)),
  );
}

/** Medicii care efectueaza o interventie: cei declarati, altfel toata specializarea. */
export async function getMediciForInterventie(interventie: CollectionEntry<'interventii'>) {
  if (interventie.data.doctors.length) {
    const declared = await resolveMany(interventie.data.doctors);
    return declared.sort(byOrder);
  }
  return getMediciBySpecialitate(interventie.data.speciality.id);
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
 * Articolele relevante pentru o afectiune / interventie / serviciu, in ordine:
 *   1. cele legate explicit de pe entitate (`articles`)
 *   2. cele care declara ele legatura (`conditions` / `interventions`)
 *   3. cele care contin titlul sau un cuvant-cheie in titlu/rezumat
 *
 * Pasul 3 face ca relatia sa functioneze din prima, inainte ca editorul sa
 * apuce sa eticheteze cele ~30 de articole existente.
 */
export async function getArticoleForEntity(
  entry: { id: string; data: RelatableData },
  kind: 'conditions' | 'interventions',
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
