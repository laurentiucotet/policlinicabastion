/**
 * Reguli de lungime pentru titlul si descrierea din <head>.
 *
 * Google nu numara caractere, ci pixeli, dar pragurile de mai jos sunt
 * echivalentul practic: peste ele, textul apare taiat cu „…" in rezultatele
 * cautarii. Un titlu taiat isi pierde exact partea care raspunde la intrebarea
 * omului, pentru ca sfarsitul e prima victima.
 *
 * Regulile se aplica automat, in `BaseLayout`, ca sa nu depinda de disciplina
 * celui care scrie in CMS si ca sa nu fie nevoie de numarat caractere la
 * fiecare articol nou.
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/** Sub atat, o descriere taiata spune prea putin ca sa merite taietura. */
const DESCRIPTION_MIN_AFTER_CUT = 120;

/**
 * Titlul paginii, cu numele clinicii adaugat doar daca incape.
 *
 * Sufixul „| Policlinica Bastion" ajuta la recunoastere, dar pe titlurile lungi
 * de articol el impinge afara tocmai subiectul. Cand nu incape, brandul cade:
 * el se vede oricum in URL-ul afisat sub titlu.
 *
 * Titlurile lungi in sine nu se taie aici. Un titlu ciuntit de cod („Prima
 * clinica din Romania care a implem…") arata mai rau decat unul lung pe care
 * Google il scurteaza singur, cu propriile reguli.
 */
export function pageTitle(title: string | undefined, siteName: string, appendSiteName = true): string {
  if (!title) return '';

  const withSuffix = `${title} | ${siteName}`;

  return appendSiteName && withSuffix.length <= TITLE_MAX ? withSuffix : title;
}

/**
 * Descrierea paginii, scurtata la limita de afisare.
 *
 * Taietura cauta intai sfarsitul unei propozitii: o descriere care se termina
 * cu punct pare scrisa, nu retezata. Daca ultima propozitie completa ar lasa
 * prea putin text, se taie la ultimul cuvant intreg si se pune „…", ca omul sa
 * vada ca urmeaza mai mult.
 */
export function metaDescription(text: string | undefined): string {
  const value = (text ?? '').trim();
  if (value.length <= DESCRIPTION_MAX) return value;

  const head = value.slice(0, DESCRIPTION_MAX);

  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  const sentenceLength = sentenceEnd + 1;
  if (sentenceLength >= DESCRIPTION_MIN_AFTER_CUT) return head.slice(0, sentenceLength);

  const lastSpace = head.lastIndexOf(' ');
  return `${head.slice(0, lastSpace > 0 ? lastSpace : head.length - 1).replace(/[,;:–—-]$/, '')}…`;
}
