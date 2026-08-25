/** Concateneaza clase, ignorand valorile false/undefined. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const dateFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Sorteaza dupa `order` apoi alfabetic, ca sa fie stabil. */
export function byOrder<T extends { data: { order?: number } }>(a: T, b: T): number {
  return (a.data.order ?? 100) - (b.data.order ?? 100);
}

/** Text fara diacritice si litere mici - baza pentru cautare si potriviri. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Genereaza id-uri de ancora din titluri (pentru cuprinsul articolelor). */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Initialele autorului unei recenzii (avatarul rotund din testimoniale). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLORS = ['#be185d', '#2563eb', '#059669', '#7c3aed', '#ea580c', '#0891b2'];

/** Culoare stabila pentru avatar, derivata din nume. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}
