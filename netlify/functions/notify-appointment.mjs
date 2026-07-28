import { requireAuth, json } from './lib/admin.mjs';

// Manda un correo a Gael cuando un vendedor agenda una cita, via Resend
// (https://resend.com, capa gratis). Si falta RESEND_API_KEY, no rompe el
// flujo de agendado: solo se registra en el log y se responde ok:false.
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'gaelrb2903@gmail.com';
const RESEND_FROM = process.env.RESEND_FROM || 'wxbsolutions <onboarding@resend.dev>';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido.' });

  try {
    await requireAuth(event);

    const { business, contact, phone, fechaTexto, notes, sellerName } = JSON.parse(event.body || '{}');
    if (!business || !fechaTexto) return json(400, { error: 'Faltan datos de la cita.' });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('notify-appointment: falta RESEND_API_KEY, no se envio correo.');
      return json(200, { ok: false, skipped: true });
    }

    const html = `
      <h2>Nueva cita agendada</h2>
      <p><strong>${business}</strong> — ${fechaTexto}</p>
      <ul>
        <li><strong>Contacto:</strong> ${contact || '—'}</li>
        <li><strong>Teléfono:</strong> ${phone || '—'}</li>
        <li><strong>Vendedor:</strong> ${sellerName || '—'}</li>
        <li><strong>Notas:</strong> ${notes || '—'}</li>
      </ul>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ADMIN_NOTIFY_EMAIL],
        subject: `Nueva cita: ${business} — ${fechaTexto}`,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Resend error:', resp.status, detail);
      return json(200, { ok: false, skipped: false, error: 'No se pudo enviar el correo.' });
    }

    return json(200, { ok: true });
  } catch (e) {
    if (e.statusCode) return json(e.statusCode, { error: e.error });
    console.error('notify-appointment:', e);
    return json(500, { error: 'Error interno al notificar la cita.' });
  }
}
