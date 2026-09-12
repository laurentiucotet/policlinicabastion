import type { APIRoute } from 'astro';

/**
 * Primeste formularul de feedback (NPS) si il trimite pe email, la fel ca
 * `/api/contact`.
 *
 * Doua diferente fata de formularul de contact, amandoua din motive de date
 * personale:
 *
 * - **Numele si contactul sunt optionale.** Un scor mic e cel mai usor de dat
 *   anonim, iar tocmai acela e cel din care se invata ceva. Cine vrea raspuns
 *   isi lasa datele.
 * - **Nu se stocheaza nimic.** Mesajul pleaca pe email si atat; site-ul e
 *   static, nu are baza de date, deci nu poate pierde ce nu tine.
 */
export const prerender = false;

const redirect = (origin: string, status: 'ok' | 'eroare') =>
  new Response(null, {
    status: 303,
    headers: { Location: `${origin}/feedback?status=${status}#formular` },
  });

/** Cele trei grupe din metoda NPS, folosite ca sa se vada din subiect ce a venit. */
const groupOf = (score: number) => {
  if (score >= 9) return 'promotor';
  if (score >= 7) return 'pasiv';
  return 'detractor';
};

export const POST: APIRoute = async ({ request, url }) => {
  const origin = url.origin;

  try {
    const form = await request.formData();

    // Honeypot: botii completeaza si campurile ascunse.
    if (form.get('website')) return redirect(origin, 'ok');

    const rawScore = String(form.get('score') ?? '').trim();
    const score = Number(rawScore);
    const comment = String(form.get('comment') ?? '').trim();
    const speciality = String(form.get('speciality') ?? '').trim();
    const name = String(form.get('name') ?? '').trim();
    const contact = String(form.get('contact') ?? '').trim();
    const gdpr = form.get('gdpr');

    const validScore = rawScore !== '' && Number.isInteger(score) && score >= 0 && score <= 10;
    if (!validScore || !gdpr) return redirect(origin, 'eroare');

    const body = [
      `Scor NPS: ${score}/10 (${groupOf(score)})`,
      speciality && `Specializare: ${speciality}`,
      name && `Nume: ${name}`,
      contact && `Contact: ${contact}`,
      '',
      comment || '(fara comentariu)',
    ]
      .filter(Boolean)
      .join('\n');

    const apiKey = import.meta.env.RESEND_API_KEY;
    const to = import.meta.env.FEEDBACK_TO_EMAIL ?? import.meta.env.CONTACT_TO_EMAIL;
    const from = import.meta.env.CONTACT_FROM_EMAIL;

    if (!apiKey || !to || !from) {
      // Fara cheie de email configurata feedbackul ajunge doar in logurile Vercel.
      console.info('[feedback] raspuns nou (email neconfigurat):\n%s', body);
      return redirect(origin, 'ok');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Scorul in subiect: un 0 nu trebuie sa astepte sa fie deschis mailul.
        subject: `Feedback pacient: ${score}/10 (${groupOf(score)})`,
        text: body,
      }),
    });

    if (!response.ok) {
      console.error('[feedback] Resend a returnat %s: %s', response.status, await response.text());
      return redirect(origin, 'eroare');
    }

    return redirect(origin, 'ok');
  } catch (error) {
    console.error('[feedback] eroare neasteptata', error);
    return redirect(origin, 'eroare');
  }
};
