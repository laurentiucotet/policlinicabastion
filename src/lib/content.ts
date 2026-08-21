import { getCollection, type CollectionEntry } from 'astro:content';
import { byOrder } from './utils';

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
