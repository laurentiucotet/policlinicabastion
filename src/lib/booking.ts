import { getCollection, type CollectionEntry } from 'astro:content';
import { getMedici, getServicii, getSpecializari } from './content';
import { formatPrice, hasPrice } from './utils';
import { serviceTypes } from './catalog';

/* ---------------------------------------------------------------------------
 * Datele modulului de programari.
 *
 * Pagina /programari primeste un singur pachet JSON, generat aici la build, iar
 * sloturile concrete se calculeaza in browser din regulile de program. Motivul:
 * site-ul e static, iar sloturile depind de "azi" - un build de luni ar arata
 * vineri o saptamana care a trecut deja.
 *
 * Aritmetica sloturilor tine cont de faptul ca fiecare serviciu are alta durata:
 * un slot e valid doar daca serviciul incape integral inainte de finalul
 * intervalului de lucru al medicului.
 * ------------------------------------------------------------------------- */

export interface BookingSpeciality {
  id: string;
  title: string;
  icon: string;
}

export interface BookingDoctor {
  id: string;
  name: string;
  role: string;
  specialities: string[];
}

export interface BookingService {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  specialityId: string;
  durationMinutes: number;
  priceLabel: string;
  hasPrice: boolean;
  cnas: boolean;
  doctorIds: string[];
  url: string;
}

export interface BookingInterval {
  day: number;
  from: string;
  to: string;
  room?: string;
}

export interface BookingSchedule {
  doctorId: string;
  slotMinutes: number;
  bookingWindowDays: number;
  intervals: BookingInterval[];
  exceptions: Array<{ date: string; reason?: string; from?: string; to?: string }>;
  /** Serviciile pe care le programeaza medicul. Gol = toate ale specializarii. */
  serviceIds: string[];
}

export interface BookingData {
  specialities: BookingSpeciality[];
  doctors: BookingDoctor[];
  services: BookingService[];
  schedules: BookingSchedule[];
  /** Cu cate ore inainte se poate face cel mai devreme o programare. */
  leadTimeHours: number;
  /**
   * Modul demonstrativ: calendarul arata sloturi ocupate simulate, iar
   * confirmarea nu ajunge nicaieri. Se stinge din `settings/site.json` cand
   * exista un backend real de programari.
   */
  demo: boolean;
}

const keepDrafts = import.meta.env.DEV;

async function getProgram(): Promise<CollectionEntry<'program'>[]> {
  const items = await getCollection('program', (entry) => keepDrafts || !entry.data.draft);
  return items;
}

export async function getBookingData(options: { leadTimeHours: number; demo: boolean }): Promise<BookingData> {
  const [specializari, medici, servicii, program] = await Promise.all([
    getSpecializari(),
    getMedici(),
    getServicii(),
    getProgram(),
  ]);

  const doctors: BookingDoctor[] = medici.map((doctor) => ({
    id: doctor.id,
    name: doctor.data.name,
    role: doctor.data.role,
    specialities: doctor.data.specialities.map((ref) => ref.id),
  }));

  /* Un serviciu fara medici declarati apartine intregii specializari - aceeasi
   * regula ca pe paginile de serviciu, ca sa nu existe doua adevaruri. */
  const services: BookingService[] = servicii.map((service) => {
    const declared = service.data.doctors.map((ref) => ref.id);
    const doctorIds = declared.length
      ? declared
      : doctors.filter((doctor) => doctor.specialities.includes(service.data.speciality.id)).map((d) => d.id);

    return {
      id: service.id,
      title: service.data.title,
      type: service.data.type,
      typeLabel: serviceTypes[service.data.type],
      specialityId: service.data.speciality.id,
      durationMinutes: service.data.durationMinutes,
      priceLabel: formatPrice(service.data.price),
      hasPrice: hasPrice(service.data.price),
      cnas: service.data.cnas,
      doctorIds,
      url: `/servicii/${service.id}`,
    };
  });

  const schedules: BookingSchedule[] = program.map((entry) => ({
    doctorId: entry.data.doctor.id,
    slotMinutes: entry.data.slotMinutes,
    bookingWindowDays: entry.data.bookingWindowDays,
    intervals: entry.data.intervals,
    exceptions: entry.data.exceptions,
    serviceIds: entry.data.services.map((ref) => ref.id),
  }));

  const bookable = new Set(schedules.map((schedule) => schedule.doctorId));

  return {
    // Se ofera spre programare doar specializarile care au macar un medic cu program.
    specialities: specializari
      .filter((speciality) =>
        doctors.some((doctor) => bookable.has(doctor.id) && doctor.specialities.includes(speciality.id)),
      )
      .map((speciality) => ({ id: speciality.id, title: speciality.data.title, icon: speciality.data.icon })),
    doctors: doctors.filter((doctor) => bookable.has(doctor.id)),
    services: services.filter((service) => service.doctorIds.some((id) => bookable.has(id))),
    schedules,
    leadTimeHours: options.leadTimeHours,
    demo: options.demo,
  };
}
