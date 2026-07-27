import admin from 'firebase-admin';
import { getAdmin, requireAdmin, json } from './lib/admin.mjs';

// Genera un guion de llamada adaptado al giro del negocio usando Gemini Flash
// (free tier de Google AI Studio). La API key vive solo en el servidor.
// Guarda el resultado en el doc del negocio para no regenerar. Solo admin.
// 'gemini-flash-latest' apunta siempre al Flash vigente (evita que el modelo
// fijo quede descontinuado con el tiempo, como paso con gemini-2.0-flash).
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metodo no permitido.' });

  try {
    await requireAdmin(event);
    getAdmin();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json(500, { error: 'Falta GEMINI_API_KEY en el servidor.' });

    const { businessId, name, category } = JSON.parse(event.body || '{}');
    if (!businessId || !name) return json(400, { error: 'Faltan datos del negocio.' });

    const prompt = buildPrompt(name, category);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Gemini error:', resp.status, detail);
      if (resp.status === 429) return json(429, { error: 'Limite de Gemini alcanzado. Espera un minuto.' });
      return json(502, { error: 'Gemini no respondio correctamente.' });
    }

    const data = await resp.json();
    const script = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!script) return json(502, { error: 'Gemini devolvio una respuesta vacia.' });

    await admin.firestore().collection('businesses').doc(businessId).update({
      customScript: script,
      scriptGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return json(200, { ok: true, script });
  } catch (e) {
    if (e.statusCode) return json(e.statusCode, { error: e.error });
    console.error('generate-script:', e);
    return json(500, { error: 'Error interno al generar el guion.' });
  }
}

function buildPrompt(name, category) {
  const giro = category ? `del giro "${category}"` : 'de negocio local';
  return `Eres un coach de ventas para wxbsolutions, una agencia en Queretaro, Mexico que vende:
- Recepcionista con IA que contesta llamadas y WhatsApp 24/7
- Automatizacion de WhatsApp
- Gestion automatica de resenas de Google

Escribe un guion de llamada telefonica en ESPANOL de Mexico, adaptado especificamente al negocio "${name}" ${giro}. El objetivo del vendedor es DETECTAR INTERES y AGENDAR UNA CITA, no cerrar la venta.

Reglas:
- Usa ejemplos concretos y dolores tipicos de ese giro (clientes que llaman fuera de horario, citas perdidas, reseñas, etc.).
- El plan que mas recomendamos arranca en $5,500 MXN/mes. Si piden algo mas barato, el vendedor NO ofrece nada mas economico: lo anota y lo pasa al admin.
- Tono cercano, directo, profesional. Nada de emojis.

Estructura el guion en estas secciones, cada una con su encabezado en MAYUSCULAS seguido de dos puntos, y el texto en lineas cortas:
APERTURA:
PITCH:
PREGUNTA DE CALIFICACION:
MANEJO DE OBJECIONES (precio, falta de tiempo, "ya tengo quien conteste"):
CIERRE (demo en vivo o agendar videollamada):

Se breve y practico para leer en voz alta.`;
}
