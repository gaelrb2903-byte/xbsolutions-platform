import admin from 'firebase-admin';
import { getAdmin, requireAuth, json } from './lib/admin.mjs';

// Genera un guion de llamada adaptado al giro del negocio usando Gemini Flash
// (free tier de Google AI Studio). La API key vive solo en el servidor.
// Guarda el resultado en el doc del negocio para no regenerar. Cualquier
// usuario autenticado (admin o vendedor) puede generarlo o regenerarlo.
// 'gemini-flash-latest' apunta siempre al Flash vigente (evita que el modelo
// fijo quede descontinuado con el tiempo, como paso con gemini-2.0-flash).
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido.' });

  try {
    await requireAuth(event);
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
        // gemini-flash-latest trae "thinking" activado por defecto y esos tokens
        // de pensamiento SI cuentan contra maxOutputTokens (por eso salía cortado
        // con el límite viejo de 900). thinkingBudget:0 lo rechaza esta versión
        // del modelo (400 invalid argument), así que se deja en 1 (mínimo permitido)
        // y se sube el límite total para dejar espacio de sobra al guion completo.
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingBudget: 1 },
        },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      // El detalle tecnico (que modelo, que codigo de Gemini) solo va al log del
      // servidor. Lo que ve el vendedor/admin en el toast es un mensaje generico,
      // sin mencionar "Gemini" ni detalles internos.
      console.error('Gemini error:', resp.status, detail);
      if (resp.status === 429) {
        return json(429, { error: 'Está saturado ahora mismo, intenta de nuevo en unos minutos.' });
      }
      return json(502, { error: 'Intenta de nuevo en un momento.' });
    }

    const data = await resp.json();
    const script = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!script) return json(502, { error: 'Salió vacío, intenta de nuevo.' });

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
  const giro = category || 'negocio local';
  return `Actúa como especialista en guiones de venta telefónica B2B para wxbsolutions, una agencia de automatización con IA.
Genera un guion de llamada en frío COMPLETO y FORMAL para este negocio:

* Nombre: ${name}
* Categoría/giro: ${giro}

El guion debe tener ESTA ESTRUCTURA EXACTA (solo estos 6 títulos en mayúsculas, español formal, sin coloquialismos):

APERTURA (10–15 segundos)
Saluda formalmente, se presenta como {{vendedor}} de wxbsolutions, explica brevemente que ayuda a negocios a captar más clientes mediante automatización. Pregunta si tiene disponibilidad para una consulta breve.

PITCH CORTO
Describe tres servicios de recepcionista IA:
1. Atiende llamadas y WhatsApp 24/7 incluso cuando no están disponibles
2. Automatización de WhatsApp para responder inmediatamente y agendar citas
3. Gestión de reseñas de Google automática
Adapta brevemente al giro ${giro} con un ejemplo específico de dolor. Ejemplo: si es pizzería, menciona "pedidos perdidos en hora pico"; si es clínica, "citas perdidas fuera de horario"; si es plomería, "emergencias que se pierden de madrugada".

PREGUNTA DE CALIFICACIÓN
Una sola pregunta formal y específica al dolor del giro: ¿Ha experimentado pérdida de clientes por no atender llamadas/mensajes a tiempo? (Aclaración para el vendedor: Si responde "sí" o "a veces" = hay interés, continúe. Si dice "nunca" = indague más.)

MANEJO DE OBJECIONES — RECEPCIONISTA IA
Tres escenarios:
— PRECIO: "Nuestro plan principal tiene un valor de $5,500 MXN mensuales. Antes de hablar de inversión, me gustaría ofrecerle un diagnóstico sin costo de su presencia en Google: cómo aparece en búsquedas, respuesta en redes, y aspectos de mejora. Posteriormente le presento cómo la recepcionista IA optimiza su captación de clientes." Si pide opciones más económicas: "Contamos con diferentes opciones. Permítame revisar sus necesidades con mi jefe y le presentamos una propuesta personalizada."
— FALTA DE TIEMPO: "Comprendo. La ventaja es que se instala una sola vez y funciona de forma automática. El diagnóstico y la demostración toman 10 a 15 minutos. Puedo agendarle en el horario que le resulte más cómodo, incluso hoy si lo prefiere."
— "YA TENGO QUIEN CONTESTE": "Totalmente válido. Lo que esto hace es respaldar a su equipo: atiende consultas fuera de horario, fines de semana, y momentos de alto volumen, garantizando que ningún cliente quede sin respuesta."

CIERRE
Dos opciones:
— OPCIÓN A (Demo en vivo): Si es posible durante la llamada, conectar la recepcionista IA para que experimente cómo funciona en tiempo real.
— OPCIÓN B (Agendar): "Le propongo agendar una videollamada breve con mi jefe para que le presente el diagnóstico de su presencia en Google y le muestre cómo funciona la recepcionista IA. Disponemos de espacios esta semana. ¿Qué día le conviene?" Confirmar día, hora, número de contacto. Registrar en plataforma.

SI CLIENTE RECHAZA RECEPCIONISTA — OFERTA WEB COMO ALTERNATIVA (NUEVA SECCIÓN — solo si el cliente dice "No" a recepcionista)
Cuando rechaza, el vendedor presenta web sin insistir:
"Entiendo. Adicionalmente, contamos con servicios de diseño web profesional. La mayoría de negocios locales pierden oportunidades porque no aparecen en búsquedas de Google. ¿Cuenta actualmente con un sitio web?"
(Pausa, escucha respuesta)
Si dice "No cuento con sitio web": "Desarrollamos sitios web desde $3,500 MXN con diseño responsivo, hosting incluido por un año, y entrega en 5 a 7 días. Antes de presentarle opciones, quisiera revisar su presencia actual en Google para ofrecerle algo alineado con su negocio."
Si dice "Tengo sitio web pero necesita actualización": "Perfecto. Podemos modernizarla y optimizarla para Google. Muchos clientes posteriormente agregan la recepcionista IA cuando ven resultados de la web. Lo que haríamos es revisar su sitio actual y presentarle una propuesta de mejora."
Si dice "Ya tengo un sitio web actualizado": "Excelente. En ese caso, en este momento no hay acciones inmediatas. Agradezco sinceramente su tiempo. Si en el futuro considera automatizar su comunicación, con gusto estoy disponible."

REGLAS ESTRICTAS:
* El guion debe tener exactamente 6 títulos en mayúsculas (APERTURA, PITCH CORTO, PREGUNTA DE CALIFICACIÓN, MANEJO DE OBJECIONES, CIERRE, SI CLIENTE RECHAZA RECEPCIONISTA).
* Español formal, profesional. Sin coloquialismos ("le late", "ando", "no manches", "va").
* {{vendedor}} debe estar literal en APERTURA — se sustituye en frontend.
* Máximo 550 palabras totales.
* Precios exactos: recepcionista $5,500 MXN/mes, web desde $3,500 MXN, web profesional $6,500 MXN.
* Nunca ofrezcas dos servicios a la vez en pitch — recepcionista primero, web solo si rechaza.
* Nunca cierres venta en la llamada — objetivo es agendar cita.
* El ejemplo de dolor en PITCH debe ser específico al giro ${giro}, no genérico.
* Tono formal y profesional — sin intrusiones ni múltiples preguntas juntas.
* Vendedores trabajan en línea — no menciones "pasar por el negocio" ni "presencial".
* Usa siempre acentuación correcta del español (tildes y eñes donde corresponda) — nunca escribas el texto sin tildes.

Genera el guion completo ahora, con las 6 secciones.`;
}
