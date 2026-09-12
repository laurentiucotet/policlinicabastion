import type { APIRoute } from 'astro';
import { site } from '../lib/site';
import {
  getAfectiuni,
  getArticole,
  getMedici,
  getProiecte,
  getServicii,
  getSpecializari,
  getSuport,
} from '../lib/content';
import { formatPrice, hasPrice } from '../lib/utils';

/**
 * `/llms.txt`, harta site-ului scrisa pentru modele de limbaj.
 *
 * De ce exista, pe langa sitemap si JSON-LD: un model care raspunde la
 * „ce face clinica asta?" sau „unde fac o biopsie fusion in Timisoara?" nu
 * parcurge 130 de pagini HTML. Are nevoie de un singur fisier care sa spuna,
 * in text simplu, ce este clinica, ce servicii ofera, cine sunt medicii si
 * unde se afla raspunsurile detaliate.
 *
 * Doua reguli pe care le respecta fisierul:
 *
 * 1. **Nu inventeaza nimic.** Totul se genereaza din continutul real, la
 *    build. Cand un serviciu nu are pret, scrie „la cerere", nu o cifra.
 * 2. **Nu da sfaturi medicale.** Enumera ce exista pe site si trimite la
 *    pagini; nota de la final spune explicit ca nu inlocuieste consultul.
 *
 * Formatul urmeaza conventia llmstxt.org: titlu, rezumat, apoi sectiuni cu
 * linkuri adnotate.
 */
export const GET: APIRoute = async ({ site: astroSite, url }) => {
  const origin = (astroSite ?? new URL(url.origin)).toString().replace(/\/$/, '');
  const link = (path: string) => `${origin}${path}`;

  const [specializari, medici, servicii, afectiuni, suport, articole, proiecte] = await Promise.all([
    getSpecializari(),
    getMedici(),
    getServicii(),
    getAfectiuni(),
    getSuport(),
    getArticole(),
    getProiecte(),
  ]);

  const lines: string[] = [];
  const section = (title: string, entries: string[]) => {
    if (entries.length === 0) return;
    lines.push('', `## ${title}`, '',...entries);
  };

  lines.push(
    `# ${site.name}`,
    '',
    `> ${site.tagline}. ${site.defaultSeo.description}`,
    '',
    `- Adresă: ${site.address.street}, ${site.address.city}, județul ${site.address.county}`,
    `- Telefon: ${site.phones.map((phone) => `${phone.value} (${phone.label.toLowerCase()})`).join(', ')}`,
    `- Email: ${site.email}`,
...site.schedule.map((entry) => `- Program ${entry.days}: ${entry.hours}`),
    `- Programări online: ${link('/programari')}`,
  );

  section(
    'Specializări',
    specializari.map((entry) => `- [${entry.data.title}](${link(`/specializari/${entry.id}`)}): ${entry.data.subtitle ?? ''}`.trimEnd()),
  );

  section(
    'Medici',
    medici.map((entry) => {
      const specialities = entry.data.specialities
.map((ref) => specializari.find((item) => item.id === ref.id)?.data.title)
.filter(Boolean)
.join(', ');
      return `- [${entry.data.name}](${link(`/medici/${entry.id}`)}): ${entry.data.role}${specialities ? `, ${specialities}`: ''}`;
    }),
  );

  section(
    'Servicii și intervenții',
    servicii.map((entry) => {
      const facts = [
        hasPrice(entry.data.price) ? formatPrice(entry.data.price): 'preț la cerere',
        entry.data.cnas ? 'decontat CNAS cu bilet de trimitere': undefined,
        entry.data.duration,
      ].filter(Boolean);
      return `- [${entry.data.title}](${link(`/servicii/${entry.id}`)}): ${entry.data.shortDescription} (${facts.join('; ')})`;
    }),
  );

  section(
    'Afecțiuni tratate',
    afectiuni.map((entry) => `- [${entry.data.title}](${link(`/afectiuni/${entry.id}`)}): ${entry.data.shortDescription}`),
  );

  section(
    'Întrebări frecvente ale pacienților',
    suport.map((entry) => `- [${entry.data.title}](${link(`/suport/${entry.id}`)}): ${entry.data.shortAnswer}`),
  );

  section(
    'Proiecte cu finanțare europeană',
    proiecte.map((entry) => `- [${entry.data.title}](${link(`/proiecte-europene/${entry.id}`)}): ${entry.data.summary}`),
  );

  // Articolele sunt multe; lista completa e in sitemap. Aici intra doar cele
  // recente, ca sa ramana un fisier citibil dintr-o bucata.
  section(
    'Articole recente',
    articole
.slice(0, 25)
.map((entry) => `- [${entry.data.title}](${link(`/noutati/${entry.id}`)}): ${entry.data.excerpt}`),
  );

  section('Altele', [
    `- [Toate articolele](${link('/noutati')})`,
    `- [Servicii decontate prin CNAS](${link('/servicii-decontate-cnas')})`,
    `- [Drepturile și obligațiile pacienților](${link('/drepturile-pacientilor')})`,
    `- [Politica de confidențialitate](${link('/politica-de-confidentialitate')})`,
    `- [Politica de cookie-uri](${link('/politica-cookies')})`,
    `- [Sitemap complet](${link('/sitemap-index.xml')})`,
  ]);

  lines.push(
    '',
    '## Notă',
    '',
    'Informațiile de pe acest site au scop de informare. Nu înlocuiesc consultul',
    'medical: diagnosticul și tratamentul se stabilesc de medic, la consultație,',
    'pentru fiecare pacient în parte.',
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
