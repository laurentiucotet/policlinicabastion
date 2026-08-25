import type { CollectionEntry } from 'astro:content';

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
    '@context': 'https://schema.org',
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
    '@context': 'https://schema.org',
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
    '@context': 'https://schema.org',
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

export function procedureSchema(entry: CollectionEntry<'interventii'>) {
  const { title, shortDescription, preparation, timeline, indications } = entry.data;
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: title,
    description: shortDescription,
    preparation: preparation.join(' ') || undefined,
    howPerformed: timeline.map((step) => `${step.title}: ${step.description}`).join(' ') || undefined,
    indication: indications.map((name) => ({ '@type': 'MedicalIndication', name })),
  };
}

const serviceTypes = {
  consultatie: 'MedicalProcedure',
  investigatie: 'MedicalTest',
  analize: 'MedicalTest',
  procedura: 'MedicalProcedure',
} as const;

export function serviceSchema(entry: CollectionEntry<'servicii'>, clinicName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': serviceTypes[entry.data.type],
    name: entry.data.title,
    description: entry.data.shortDescription,
    provider: { '@type': 'MedicalClinic', name: clinicName },
  };
}
