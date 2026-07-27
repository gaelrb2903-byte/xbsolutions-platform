// Guion base de prospeccion telefonica para vendedores.
// Objetivo: detectar interes real y AGENDAR una cita, no cerrar la venta.

export const BASE_SCRIPT = {
  objetivo:
    'Detectar interes real y agendar una cita conmigo (el admin). NO cerrar la venta en la llamada.',
  secciones: [
    {
      id: 'apertura',
      titulo: 'Apertura (10–15 segundos)',
      contenido: [
        'Hola, buenas tardes. ¿Hablo con [nombre del contacto / encargado]?',
        'Le llamo de wxbsolutions, somos una agencia de automatizacion con IA aqui en Queretaro.',
        '¿Me regala 30 segundos? Le prometo ser breve y si no le interesa, colgamos y sin problema.',
      ],
    },
    {
      id: 'pitch',
      titulo: 'Pitch corto',
      contenido: [
        'Ayudamos a negocios locales a no perder clientes con tres cosas:',
        '1) Una recepcionista con IA que contesta sus llamadas y WhatsApp 24/7, aunque esten ocupados o cerrados.',
        '2) Automatizacion de WhatsApp para responder al instante y agendar solos.',
        '3) Gestion de resenas de Google: pedimos resenas a sus clientes contentos de forma automatica para que suban en el mapa.',
      ],
    },
    {
      id: 'calificacion',
      titulo: 'Pregunta de calificacion',
      contenido: [
        '¿Le ha pasado que pierde clientes porque no alcanzan a contestar una llamada o un WhatsApp a tiempo?',
        '(Escuchar. Si dice que si o que "a veces", hay interes: siga. Si dice que nunca, indague un poco mas antes de soltar.)',
      ],
    },
    {
      id: 'objeciones',
      titulo: 'Manejo de objeciones',
      contenido: [
        'PRECIO: "El plan que mas recomendamos arranca en $5,500 MXN al mes." Si piden algo mas economico: NO ofrezca nada mas barato en la llamada. Diga: "Tenemos opciones, deje que lo revise con mi equipo y le proponemos algo a su medida" y anote la nota para pasarmela a mi.',
        'FALTA DE TIEMPO: "Justo por eso existe esto: se instala una vez y trabaja solo. La demo son 10 minutos y se la agendo cuando usted pueda, incluso hoy mas tarde."',
        '"YA TENGO QUIEN CONTESTE": "Perfecto, esto no reemplaza a su equipo, lo respalda: cubre cuando estan ocupados, en la noche o el fin de semana, para que ningun cliente se quede sin respuesta."',
      ],
    },
    {
      id: 'cierre',
      titulo: 'Cierre',
      contenido: [
        'OPCION A (demo en vivo): si puede, una a la recepcionista con IA a la llamada en ese momento para que la escuche funcionando.',
        'OPCION B (agendar): "Le agendo una videollamada corta con [admin] para que le muestre todo. Puede ser hoy mas tarde o el dia que le acomode, no tiene que ser ahorita."',
        'Confirme dia, hora y numero, y registre la cita en la plataforma.',
      ],
    },
    {
      id: 'no',
      titulo: 'Si dice que no',
      contenido: [
        'Sin insistir: "Sin problema, gracias por su tiempo. Que tenga excelente dia."',
        'Marque el negocio como "No interesado" y siga con el siguiente.',
      ],
    },
  ],
};
