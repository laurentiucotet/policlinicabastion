import siteJson from '../content/settings/site.json';

/* ---------------------------------------------------------------------------
 * Sectiuni care se pot stinge din CMS
 *
 * Trei parti ale site-ului sunt optionale: catalogul de servicii, catalogul de
 * afectiuni si centrul de suport. Fiecare are un comutator in
 * `settings/site.json` -> `features`.
 *
 * "Stins" inseamna aici mai mult decat un link ascuns. O sectiune stinsa:
 *
 *   1. nu isi mai genereaza paginile la build (vezi integrarea din
 *      `astro.config.mjs`) - deci nu ramane niciun URL viu, nici in sitemap;
 *   2. dispare din meniu si din subsol (`navigation` de mai jos e deja filtrat);
 *   3. iese din sursa de date - `getServicii`/`getAfectiuni`/`getSuport`
 *      returneaza liste goale, deci si legaturile incrucisate de pe paginile
 *      celorlalte entitati, si indexul de cautare, se golesc singure.
 *
 * Ordinea conteaza: daca s-ar filtra doar linkurile, ar ramane pagini vii pe
 * care le gaseste Google si la care duc trimiterile din articole.
 * ------------------------------------------------------------------------- */

export const features = siteJson.features;

export type FeatureName = keyof typeof features;

/** Prefixul de URL pe care il ocupa fiecare sectiune optionala. */
export const featureRoutes: Record<FeatureName, string> = {
  servicii: '/servicii',
  afectiuni: '/afectiuni',
  suport: '/suport',
};

export const isFeatureEnabled = (name: FeatureName): boolean => features[name] !== false;

/**
 * `true` daca URL-ul apartine unei sectiuni stinse. Compara pe segmente, ca
 * `/servicii-decontate-cnas` (pagina separata, care ramane) sa nu fie confundat
 * cu `/servicii`.
 */
export const isDisabledHref = (href: string): boolean => {
  const path = href.split(/[?#]/)[0] ?? '';
  return (Object.keys(featureRoutes) as FeatureName[]).some(
    (name) =>
      !isFeatureEnabled(name) && (path === featureRoutes[name] || path.startsWith(`${featureRoutes[name]}/`)),
  );
};
