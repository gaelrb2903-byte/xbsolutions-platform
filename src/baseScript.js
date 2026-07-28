// Guion base de prospección telefónica para vendedores — tono formal.
// Objetivo: detectar interés real y AGENDAR una cita, no cerrar la venta.
// Recepcionista IA es el Plan A; sitios web es el Plan B (solo si rechaza el A).

export const BASE_SCRIPT = {
  objetivo:
    'Detectar interés real y agendar una cita con mi jefe (admin). NO cerrar la venta en la llamada.',
  secciones: [
    {
      id: 'apertura',
      titulo: 'Apertura (10–15 segundos)',
      contenido: [
        'Hola, buenos días/tardes. ¿Con quién tengo el gusto de hablar?',
        'Le llamo de wxbsolutions, somos una agencia de automatización con IA aquí en Querétaro.',
        '¿Tiene un momento para una consulta breve? Le prometo que será directo.',
      ],
    },
    {
      id: 'pitch',
      titulo: 'Pitch corto',
      contenido: [
        'Ayudamos a negocios locales a captar más clientes mediante automatización. Contamos con tres servicios:',
        '1) Una recepcionista con IA que atiende llamadas y WhatsApp 24/7, incluso cuando no están disponibles.',
        '2) Automatización de WhatsApp para responder de forma inmediata y agendar citas automáticamente.',
        '3) Gestión de reseñas de Google, solicitando opiniones a clientes satisfechos para mejorar su posicionamiento en el mapa.',
      ],
    },
    {
      id: 'calificacion',
      titulo: 'Pregunta de calificación',
      contenido: [
        '¿Ha experimentado situaciones donde pierda clientes por no poder atender llamadas o mensajes a tiempo?',
        '(Escuchar. Si responde afirmativamente o con "a veces", continúe. Si dice "nunca", profundice un poco más.)',
      ],
    },
    {
      id: 'objeciones',
      titulo: 'Manejo de objeciones — recepcionista IA',
      contenido: [
        'PRECIO: "Nuestro plan principal tiene un valor de $5,500 MXN mensuales. Antes de hablar de inversión, me gustaría ofrecerle un diagnóstico sin costo de su presencia en Google: cómo aparece su negocio en búsquedas, respuesta en redes sociales, y aspectos de mejora. Posteriormente le presentaré cómo la recepcionista IA optimiza su captación de clientes." Si pide opciones más económicas: NO ofrezca precios reducidos en la llamada. Diga: "Contamos con diferentes opciones. Permítame revisar sus necesidades con mi jefe y le presentamos una propuesta personalizada." Anote los detalles para pasarle.',
        'FALTA DE TIEMPO: "Comprendo. La ventaja es que se instala una sola vez y funciona de forma automática. El diagnóstico inicial y la demostración toman entre 10 y 15 minutos. Puedo agendarle en el horario que le resulte más cómodo, incluso hoy si lo prefiere."',
        '"YA TENGO QUIEN CONTESTE": "Totalmente válido. Lo que esto hace es respaldar a su equipo: atiende las consultas fuera de horario, fines de semana, y momentos de alto volumen, garantizando que ningún cliente quede sin respuesta."',
      ],
    },
    {
      id: 'cierre',
      titulo: 'Cierre (recepcionista IA es Plan A)',
      contenido: [
        'OPCIÓN A (demostración en vivo): si es posible durante la llamada, conectar la recepcionista IA para que experimente cómo funciona en tiempo real.',
        'OPCIÓN B (agendar con mi jefe): "Le propongo agendar una videollamada breve con mi jefe para que le presente el diagnóstico de su presencia en Google y le muestre cómo funciona la recepcionista IA. Disponemos de espacios esta semana. ¿Qué día le conviene?"',
        'Confirme día, hora y número de contacto, y registre la cita en la plataforma.',
      ],
    },
    {
      id: 'rechaza-recepcionista',
      titulo: 'Si cliente rechaza recepcionista (Plan B — sitios web)',
      contenido: [
        'Sin insistir con el recepcionista. En cambio, presente la alternativa de sitios web: "Entiendo. Adicionalmente, contamos con servicios de diseño web profesional. La mayoría de negocios locales pierden oportunidades porque no aparecen en los resultados de búsqueda de Google. ¿Cuenta actualmente con un sitio web?" (Pausa, escuche la respuesta.)',
        'Si dice "No cuento con sitio web": "Desarrollamos sitios web desde $3,500 MXN con diseño responsivo, hosting incluido por un año, y entrega en 5 a 7 días. Antes de presentarle opciones, quisiera revisar su presencia actual en Google para ofrecerle algo verdaderamente alineado con su negocio." Objetivo: agendar cita con mi jefe para diagnosticar presencia en línea y proponer web.',
        'Si dice "Tengo sitio web pero necesita actualización": "Perfecto. Podemos modernizarla y optimizarla para Google. Muchos clientes posteriormente agregan la recepcionista IA cuando observan los resultados de la web." Objetivo: agendar cita con mi jefe para diagnosticar la web actual.',
        'Si dice "Ya tengo un sitio web actualizado": "Excelente. En ese caso, en este momento no hay acciones inmediatas. Agradezco sinceramente su tiempo. Si en el futuro considera automatizar su comunicación o mejorar algo, con gusto estoy disponible." Objetivo: cerrar profesionalmente, marcar "No interesado" y continuar con el siguiente.',
      ],
    },
  ],
};
