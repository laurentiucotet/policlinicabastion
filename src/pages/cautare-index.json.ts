import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  getAfectiuni,
  getArticole,
  getInterventii,
  getMedici,
  getProiecte,
  getServicii,
  getSpecializari,
} from '../lib/content';

/**
 * Index de cautare generat la build. E consumat de doua locuri:
 *   - functia de cautare din header (components/layout/SearchBox.astro)
 *   - pagina de rezultate /rezultate-cautare
 */
export const GET: APIRoute = async () => {
  const [specializari, afectiuni, interventii, servicii, medici, articole, proiecte, pagini] = await Promise.all([
    getSpecializari(),
    getAfectiuni(),
    getInterventii(),
    getServicii(),
    getMedici(),
    getArticole(),
    getProiecte(),
    getCollection('pagini', (page) => import.meta.env.DEV || !page.data.draft),
  ]);

  const entries = [
    ...specializari.map((item) => ({
      type: 'Specializare',
      title: item.data.title,
      description: item.data.shortDescription,
      url: `/specializari/${item.id}`,
      keywords: item.data.services.map((service) => service.name),
    })),
    ...afectiuni.map((item) => ({
      type: 'Afecțiune',
      title: item.data.title,
      description: item.data.shortDescription,
      url: `/afectiuni/${item.id}`,
      keywords: [...item.data.keywords, ...item.data.alsoKnownAs, ...item.data.symptoms],
    })),
    ...interventii.map((item) => ({
      type: 'Intervenție',
      title: item.data.title,
      description: item.data.shortDescription,
      url: `/interventii/${item.id}`,
      keywords: item.data.keywords,
    })),
    ...servicii.map((item) => ({
      type: 'Serviciu',
      title: item.data.title,
      description: item.data.shortDescription,
      url: `/servicii/${item.id}`,
      keywords: item.data.keywords,
    })),
    ...medici.map((item) => ({
      type: 'Medic',
      title: item.data.name,
      description: item.data.role,
      url: `/medici/${item.id}`,
      keywords: [...item.data.procedures, ...item.data.pathologies],
    })),
    ...articole.map((item) => ({
      type: 'Articol',
      title: item.data.title,
      description: item.data.excerpt,
      url: `/noutati/${item.id}`,
      keywords: [],
    })),
    ...proiecte.map((item) => ({
      type: 'Proiect european',
      title: item.data.title,
      description: item.data.summary,
      url: `/proiecte-europene/${item.id}`,
      keywords: [],
    })),
    ...pagini.map((item) => ({
      type: 'Pagină',
      title: item.data.title,
      description: item.data.subtitle ?? '',
      url: `/${item.id}`,
      keywords: [],
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
