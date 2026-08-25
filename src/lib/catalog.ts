/* Tipurile folosite de catalogul cu categorii din stanga (/afectiuni,
 * /servicii). Stau aici, nu in componenta, ca paginile sa le poata importa
 * fara sa depinda de un fisier .astro. */

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Categoria din stanga - la noi, id-ul specializarii. */
  groupId: string;
  /** Eticheta (tip de serviciu), folosita de randul de filtre de deasupra grilei. */
  tagId?: string;
  /** Termeni suplimentari dupa care se poate cauta intrarea. */
  keywords?: string[];
  /** Text ascuns, adaugat la cautare: simptome, indicatii, intrebari frecvente. */
  searchText?: string;
  /** Chip-uri afisate pe card (ex. "Ambulatoriu", "350 lei"). */
  meta?: string[];
  icon?: string;
}

export interface CatalogGroup {
  id: string;
  label: string;
  icon?: string;
  /** Link catre pagina categoriei, afisat la finalul listei. */
  href?: string;
}

export interface CatalogTag {
  id: string;
  label: string;
}

/**
 * Etichetele serviciilor. Consultatia, investigatia si interventia sunt acelasi
 * tip de entitate — ceva ce pacientul programeaza — si difera doar prin
 * eticheta de aici.
 */
export const serviceTypes = {
  consultatie: 'Consultație',
  investigatie: 'Investigație',
  procedura: 'Procedură',
  interventie: 'Intervenție',
  analize: 'Analize',
} as const;

export type ServiceType = keyof typeof serviceTypes;

/** Ordinea etichetelor in randul de filtre. */
export const serviceTypeOrder: ServiceType[] = [
  'consultatie',
  'investigatie',
  'analize',
  'procedura',
  'interventie',
];
