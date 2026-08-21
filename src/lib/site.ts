import siteJson from '../content/settings/site.json';
import navigationJson from '../content/settings/navigation.json';
import homeJson from '../content/settings/home.json';

/* ---------------------------------------------------------------------------
 * "Singleton"-urile (setari globale, meniu, homepage) nu sunt colectii Astro:
 * sunt fisiere JSON importate direct. Sunt tot editabile din TinaCMS, dar nu
 * au nevoie de loader/slug, deci importul direct e mai simplu si mai rapid.
 * ------------------------------------------------------------------------- */

export const site = siteJson;
export const navigation = navigationJson;
export const home = homeJson;

export type Site = typeof siteJson;
export type Navigation = typeof navigationJson;
export type Home = typeof homeJson;

export type NavItem = Navigation['main'][number];

/** Numarul principal de telefon, in format `tel:` */
export const primaryPhoneHref = site.phones[0]?.href ?? '';

export const whatsappHref = site.whatsapp.number
  ? `https://wa.me/${site.whatsapp.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(site.whatsapp.message)}`
  : '';
