import siteJson from '../content/settings/site.json';
import navigationJson from '../content/settings/navigation.json';
import homeJson from '../content/settings/home.json';
import { isDisabledHref } from './features';

/* ---------------------------------------------------------------------------
 * "Singleton"-urile (setari globale, meniu, homepage) nu sunt colectii Astro:
 * sunt fisiere JSON importate direct. Sunt tot editabile din TinaCMS, dar nu
 * au nevoie de loader/slug, deci importul direct e mai simplu si mai rapid.
 * ------------------------------------------------------------------------- */

export const site = siteJson;
export const home = homeJson;

/**
 * Meniul si subsolul, curatate de linkurile catre sectiuni stinse din CMS.
 * Filtrarea se face o singura data, aici, ca sa nu trebuiasca fiecare
 * componenta de navigatie sa stie despre comutatoare.
 */
export const navigation = {
  ...navigationJson,
  main: navigationJson.main
    .filter((item) => !isDisabledHref(item.href))
    .map((item) => ({ ...item, children: item.children.filter((child) => !isDisabledHref(child.href)) })),
  footerGroups: navigationJson.footerGroups
    .map((group) => ({ ...group, links: group.links.filter((link) => !isDisabledHref(link.href)) }))
    .filter((group) => group.links.length > 0),
};

export type Site = typeof siteJson;
export type Navigation = typeof navigationJson;
export type Home = typeof homeJson;

export type NavItem = Navigation['main'][number];

/** Numarul principal de telefon, in format `tel:` */
export const primaryPhoneHref = site.phones[0]?.href ?? '';

export const whatsappHref = site.whatsapp.number
  ? `https://wa.me/${site.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(site.whatsapp.message)}`
  : '';
