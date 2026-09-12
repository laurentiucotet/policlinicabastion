import type { CollectionEntry } from 'astro:content';
import { site } from './site';

/* ---------------------------------------------------------------------------
 * Datele structurate ale site-ului (JSON-LD)
 *
 * Doua audiente, cu nevoi diferite:
 *
 * - **Motoarele de cautare** citesc `MedicalClinic`, `Physician`, `Article`,
 *   `FAQPage` si asa mai departe ca sa afiseze rezultate imbogatite.
 * - **Modelele de limbaj** care raspund la intrebari despre clinica citesc
 *   aceleasi date, dar au nevoie sa fie *legate intre ele*: altfel un articol e
 *   un text fara autor, iar un serviciu e o procedura fara furnizor.
 *
 * De aceea fiecare entitate importanta are un `@id` stabil, restul paginilor
 * trimit la el in loc sa repete obiectul, iar `BaseLayout` le publica pe toate
 * intr-un singur `@graph`. Membrii grafului nu isi poarta propriul `@context`:
 * il mostenesc din graf.
 *
 * Perechea pentru cititorii automati care nu parseaza JSON-LD e `/llms.txt`.
 * ------------------------------------------------------------------------- */

/** Ancore stabile. Se schimba doar daca se schimba domeniul. */
export const schemaIds = { clinic: '#clinica', website: '#website' } as const;

const absolute = (path: string, origin: string) => new URL(path, origin).toString();

/** Referinta scurta catre clinica, de folosit ca `provider` sau `publisher`. */
export const clinicRef = (origin: string) => ({ '@id': absolute(schemaIds.clinic, origin) });

/** „Luni, Miercuri, Vineri" -> zilele schema.org. */
const DAYS: Record<string, string> = {
  luni: 'Monday',
  marti: 'Tuesday',
  marți: 'Tuesday',
  miercuri: 'Wednesday',
  joi: 'Thursday',
  vineri: 'Friday',
  sambata: 'Saturday',
  sâmbătă: 'Saturday',
  duminica: 'Sunday',
  duminică: 'Sunday',
};

/**
 * Programul din CMS e scris pentru oameni („Luni, Miercuri, Vineri" /
 * „08:00 – 22:00"). Aici se traduce in forma pe care o inteleg masinile.
 * Randurile „Închis" se sar: absenta unei zile inseamna deja inchis.
 */
const openingHours = () =>
  site.schedule.flatMap((entry) => {
    const match = entry.hours.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
    if (!match) return [];

    const dayOfWeek = entry.days
.split(/[,/]/)
.map((day) => DAYS[day.trim().toLowerCase()])
.filter((day): day is string => Boolean(day));
    if (dayOfWeek.length === 0) return [];

    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek, opens: match[1], closes: match[2] }];
  });

/** Entitatea centrala. Toate celelalte pagini trimit la ea prin `@id`. */
export function clinicSchema(origin: string, specialities: string[] = []) {
  const { latitude, longitude } = site.address;
  const geo =
    latitude && longitude
      ? { '@type': 'GeoCoordinates', latitude, longitude }
: undefined;

  return {
    '@type': 'MedicalClinic',
    '@id': absolute(schemaIds.clinic, origin),
    name: site.name,
    legalName: site.legalName,
    description: site.defaultSeo.description,
    url: origin,
    email: site.email,
    telephone: site.phones.map((phone) => phone.value),
    image: absolute(site.defaultSeo.image, origin),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.county,
      postalCode: site.address.postalCode,
      addressCountry: 'RO',
    },
...(geo ? { geo, hasMap: site.address.mapsUrl || undefined }: {}),
    openingHoursSpecification: openingHours(),
    // Pacientii vin din toata regiunea de vest, nu doar din oras.
    areaServed: [
      { '@type': 'City', name: site.address.city },
      { '@type': 'AdministrativeArea', name: `Județul ${site.address.county}` },
    ],
...(specialities.length ? { medicalSpecialty: specialities }: {}),
    sameAs: Object.values(site.social).filter(Boolean),
  };
}

/**
 * `WebSite` cu `SearchAction`: lasa motoarele sa trimita direct in cautarea
 * site-ului. Ruta e cea reala, `/rezultate-cautare?q=`.
 */
export function websiteSchema(origin: string) {
  return {
    '@type': 'WebSite',
    '@id': absolute(schemaIds.website, origin),
    name: site.name,
    url: origin,
    inLanguage: 'ro-RO',
    publisher: clinicRef(origin),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin.replace(/\/$/, '')}/rezultate-cautare?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Paginile de catalog. `ItemList` spune explicit ce contine lista si in ce
 * ordine, altfel un cititor automat vede doar o insiruire de linkuri.
 */
export function collectionSchema(options: {
  origin: string;
  name: string;
  description?: string;
  items: Array<{ name: string; url: string }>;
}) {
  const { origin, name, description, items } = options;
  return {
    '@type': 'CollectionPage',
    name,
...(description ? { description }: {}),
    isPartOf: { '@id': absolute(schemaIds.website, origin) },
    about: clinicRef(origin),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absolute(item.url, origin),
      })),
    },
  };
}

/* ---------------------------------------------------------------------------
 * JSON-LD pentru paginile de catalog. Structura fixa a paginilor de afectiune
 * si de interventie se traduce direct in tipurile schema.org corespunzatoare
 * (MedicalCondition / MedicalProcedure), plus FAQPage acolo unde exista
 * intrebari frecvente.
 * ------------------------------------------------------------------------- */

type Faq = Array<{ question: string; answer: string }>;

export function faqSchema(items: Faq) {
  if (!items.length) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>, origin: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.url, origin).toString(),
    })),
  };
}

export function conditionSchema(entry: CollectionEntry<'afectiuni'>) {
  const { title, shortDescription, alsoKnownAs, symptoms, causes, prevention } = entry.data;
  return {
    '@type': 'MedicalCondition',
    name: title,
    description: shortDescription,
    alternateName: alsoKnownAs,
    signOrSymptom: symptoms.map((name) => ({ '@type': 'MedicalSignOrSymptom', name })),
    cause: causes.map((name) => ({ '@type': 'MedicalCause', name })),
    possibleTreatment: entry.data.treatments.map((item) => ({
      '@type': 'MedicalTherapy',
      name: item.name,
      description: item.description,
    })),
    primaryPrevention: prevention.length
      ? { '@type': 'MedicalTherapy', name: 'Prevenție', description: prevention.join(' ') }
: undefined,
  };
}

/**
 * Serviciile poarta tipul schema.org potrivit etichetei lor. O interventie sau
 * o consultatie sunt `MedicalProcedure`; o investigatie sau analizele sunt
 * `MedicalTest`. Cand serviciul are protocol (pregatire, pasi, indicatii), il
 * publicam si pe acela.
 */
const serviceSchemaTypes = {
  consultatie: 'MedicalProcedure',
  investigatie: 'MedicalTest',
  analize: 'MedicalTest',
  procedura: 'MedicalProcedure',
  interventie: 'MedicalProcedure',
} as const;

export function serviceSchema(entry: CollectionEntry<'servicii'>, origin: string) {
  const { title, shortDescription, type, preparation, timeline, indications } = entry.data;

  return {
    '@type': serviceSchemaTypes[type],
    name: title,
    description: shortDescription,
    provider: clinicRef(origin),
    preparation: preparation.join(' ') || undefined,
    howPerformed: timeline.map((step) => `${step.title}: ${step.description}`).join(' ') || undefined,
    indication: indications.map((name) => ({ '@type': 'MedicalIndication', name })),
  };
}

/**
 * Medicul, legat de clinica prin `@id`.
 *
 * `worksFor` nu repeta obiectul clinicii, ci trimite la el: asa, un model care
 * citeste pagina medicului ajunge la adresa, program si specializari fara sa le
 * ghiceasca, iar Google stie ca cei 24 de medici sunt ai aceleiasi clinici, nu
 * 24 de cabinete separate.
 */
export function physicianSchema(
  entry: CollectionEntry<'medici'>,
  origin: string,
  medicalSpecialty?: string,
) {
  const { name, role, academicTitle } = entry.data;

  return {
    '@type': 'Physician',
    '@id': absolute(`/medici/${entry.id}#medic`, origin),
    url: absolute(`/medici/${entry.id}`, origin),
    name,
    jobTitle: [role, academicTitle].filter(Boolean),
...(medicalSpecialty ? { medicalSpecialty }: {}),
    worksFor: clinicRef(origin),
  };
}
