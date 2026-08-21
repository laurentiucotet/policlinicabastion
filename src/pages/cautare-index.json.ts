import type { APIRoute } from 'astro';
import { getArticole, getMedici, getProiecte, getSpecializari } from '../lib/content';

/** Index de cautare generat la build si filtrat in browser pe /cautare. */
export const GET: APIRoute = async () => {
  const [specializari, medici, articole, proiecte] = await Promise.all([
    getSpecializari(),
    getMedici(),
    getArticole(),
    getProiecte(),
  ]);

  const entries = [
    ...specializari.map((item) => ({
      type: 'Specializare',
      title: item.data.title,
      description: item.data.shortDescription,
      url: `/specializari/${item.id}`,
    })),
    ...medici.map((item) => ({
      type: 'Medic',
      title: item.data.name,
      description: item.data.role,
      url: `/medici/${item.id}`,
    })),
    ...articole.map((item) => ({
      type: 'Articol',
      title: item.data.title,
      description: item.data.excerpt,
      url: `/noutati/${item.id}`,
    })),
    ...proiecte.map((item) => ({
      type: 'Proiect european',
      title: item.data.title,
      description: item.data.summary,
      url: `/proiecte-europene/${item.id}`,
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
