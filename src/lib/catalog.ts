/* Tipurile folosite de catalogul cu categorii din stanga (/afectiuni,
 * /interventii, /servicii). Stau aici, nu in componenta, ca paginile sa le
 * poata importa fara sa depinda de un fisier .astro. */

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Categoria din stanga - la noi, id-ul specializarii. */
  groupId: string;
  /** Termeni suplimentari dupa care se poate cauta intrarea. */
  keywords?: string[];
  /** Chip-uri afisate pe card (ex. "Ambulatoriu", "Decontat CNAS"). */
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
