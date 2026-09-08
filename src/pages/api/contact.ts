import type { APIRoute } from 'astro';

// Singura ruta care ruleaza pe server (Vercel Function). Restul site-ului
// este generat static la build.
export const prerender = false;

const redirect = (origin: string, status: 'ok' | 'eroare') =>
  new Response(null, {
    status: 303,
    headers: { Location: `${origin}/contact?status=${status}#continut` },
  });

export const POST: APIRoute = async ({ request, url }) => {
  const origin = url.origin;

  try {
    const form = await request.formData();

    // Honeypot: botii completeaza si campurile ascunse.
    if (form.get('website')) return redirect(origin, 'ok');

    const name = String(form.get('name') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const reason = String(form.get('reason') ?? '').trim();
    const message = String(form.get('message') ?? '').trim();
    const gdpr = form.get('gdpr');

    if (!name || !phone || !reason || !message || !gdpr) return redirect(origin, 'eroare');

    const apiKey = import.meta.env.RESEND_API_KEY;
    const to = import.meta.env.CONTACT_TO_EMAIL;
    const from = import.meta.env.CONTACT_FROM_EMAIL;

    const body = [
      `Nume: ${name}`,
      `Telefon: ${phone}`,
      email && `Email: ${email}`,
      `Motiv: ${reason}`,
      '',
      message,
    ]
            .filter(Boolean)
            .join('\n');

    if (!apiKey || !to || !from) {
      // Fara cheie de email configurata mesajul ajunge doar in logurile Vercel.
      console.info('[contact] mesaj nou (email neconfigurat):\n%s', body);
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
        reply_to: email || undefined,
        // Motivul intra in subiect: recepția vede din listă cine preia mesajul.
        subject: `Mesaj de pe site: ${reason} (${name})`,
        text: body,
      }),
    });

    if (!response.ok) {
      console.error('[contact] Resend a returnat %s: %s', response.status, await response.text());
      return redirect(origin, 'eroare');
    }

    return redirect(origin, 'ok');
  } catch (error) {
    console.error('[contact] eroare neasteptata', error);
    return redirect(origin, 'eroare');
  }
};
