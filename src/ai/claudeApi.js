const API_URL = 'https://api.anthropic.com/v1/messages';

export const TOOLS = [
  {
    name: 'registrar_uso_personal',
    description: 'Registra un uso personal de impresión 3D. Úsalo cuando el usuario menciona que imprimió algo para uso propio, pruebas, o sube una captura del slicer.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Qué se imprimió o probó' },
        materialId: { type: 'string', description: 'ID del material usado, ej: M003. Si no está seguro, omitir.' },
        gramos: { type: 'number', description: 'Gramos de filamento usados' },
        tiempo: { type: 'number', description: 'Tiempo de impresión en minutos' },
        impresora: { type: 'string', enum: ['Bambu', 'Ender'], description: 'Impresora usada' },
      },
      required: ['descripcion', 'gramos'],
    },
  },
  {
    name: 'registrar_falla',
    description: 'Registra una falla de impresión donde se perdieron material y/o tiempo.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Qué pasó en la falla' },
        materialId: { type: 'string', description: 'ID del material que falló, ej: M006' },
        gramosPerdidos: { type: 'number', description: 'Gramos de filamento perdidos' },
        tiempoPerdido: { type: 'number', description: 'Minutos perdidos' },
        impresora: { type: 'string', enum: ['Bambu', 'Ender'] },
      },
      required: ['descripcion', 'gramosPerdidos'],
    },
  },
  {
    name: 'registrar_producto',
    description: 'Registra un nuevo producto en el catálogo con sus parámetros de impresión.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del producto' },
        descripcion: { type: 'string', description: 'Descripción breve' },
        gramos: { type: 'number', description: 'Peso en gramos' },
        tiempoBambu: { type: 'number', description: 'Tiempo en minutos en impresora Bambu' },
        tiempoEnder: { type: 'number', description: 'Tiempo en minutos en impresora Ender' },
        precioVenta: { type: 'number', description: 'Precio de venta sugerido en pesos' },
      },
      required: ['nombre', 'gramos'],
    },
  },
  {
    name: 'registrar_gasto',
    description: 'Registra un gasto o inversión del negocio: impresoras, herramientas, materiales comprados, renta, luz, etc.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Qué se compró o pagó' },
        categoria: {
          type: 'string',
          enum: ['Impresoras', 'Herramientas', 'Materiales', 'Renta / Luz', 'Otros'],
          description: 'Categoría del gasto',
        },
        monto: { type: 'number', description: 'Cuánto costó en pesos' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Si no se dice, usar hoy.' },
      },
      required: ['descripcion', 'monto', 'categoria'],
    },
  },
  {
    name: 'registrar_cliente',
    description: 'Registra un nuevo cliente en la base de datos.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        telefono: { type: 'string' },
        instagram: { type: 'string', description: 'Sin @' },
        tipo: { type: 'string', enum: ['MENUDEO', 'MAYOREO'], description: 'Tipo de cliente' },
        notas: { type: 'string' },
      },
      required: ['nombre'],
    },
  },
  {
    name: 'iniciar_cola',
    description: 'Inicia la cola de impresión de una impresora a una hora específica. Úsalo cuando el usuario diga que ya empezó a imprimir, ej: "ya empecé la Bambu a las 4", "la Ender lleva 2 horas corriendo", "empecé la bamboo ahorita".',
    input_schema: {
      type: 'object',
      properties: {
        impresora: { type: 'string', enum: ['bambu', 'ender'], description: 'La impresora que se inició' },
        hora: { type: 'string', description: 'Hora de inicio en formato HH:MM (24h). Si dice "hace X horas/minutos", calcula hacia atrás desde ahora. Si dice "ahorita" o "ahora", usa la hora actual.' },
      },
      required: ['impresora', 'hora'],
    },
  },
  {
    name: 'consultar_negocio',
    description: 'Consulta datos actuales del negocio: ventas, materiales, proceso activo, ganancias.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: {
          type: 'string',
          enum: ['ventas', 'materiales', 'proceso', 'general'],
          description: 'Qué datos consultar',
        },
      },
      required: ['tipo'],
    },
  },
];

export async function callClaude({ apiKey, messages, systemPrompt }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: TOOLS,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${res.status}`);
  }

  return res.json();
}

export function buildSystemPrompt(appData) {
  const { materials, products, sales, wholesale, personal, failures } = appData;

  const matList = materials
    .filter(m => m.nombre)
    .map(m => `${m.id}: ${m.nombre} ${m.marca}`)
    .join(', ');

  const prodList = products
    .filter(p => p.nombre)
    .map(p => `${p.id}: ${p.nombre} (${p.gramos}g, $${p.precioVenta})`)
    .join(', ');

  return `Eres el asistente inteligente de PRINTORIA, un negocio de impresión 3D.
Ayudas al dueño a registrar datos del negocio de forma rápida y natural.

MATERIALES DISPONIBLES: ${matList || 'ninguno aún'}
PRODUCTOS EN CATÁLOGO: ${prodList || 'ninguno aún'}
VENTAS REGISTRADAS: ${sales.length} ventas, ${wholesale.length} mayoreos
FALLAS REGISTRADAS: ${failures.length}
USO PERSONAL: ${personal.length} registros

CAPACIDADES:
- Analizar capturas de pantalla del slicer (Bambu, Orca, Cura) y extraer gramos + tiempo
- Registrar uso personal, fallas, productos nuevos
- Consultar resúmenes del negocio

CUANDO VEAS UNA IMAGEN DE SLICER:
1. Lee el peso del filamento (gramos)
2. Lee el tiempo de impresión (conviértelo a minutos)
3. Identifica el material si es visible
4. Pregunta si es producto nuevo, uso personal o fue una falla
5. Usa la herramienta correspondiente para registrar

Responde siempre en español. Sé breve y directo. Si falta info, pregunta solo lo necesario.`;
}

export function buildDataSummary(tipo, appData) {
  const { sales, wholesale, materials, proceso, products } = appData;
  if (tipo === 'materiales') {
    return materials.filter(m => m.nombre).map(m =>
      `${m.id} ${m.nombre}: ${m.pesoInicial}g inicial`
    ).join('\n');
  }
  if (tipo === 'ventas') {
    return [...sales, ...wholesale].slice(-5).map(s =>
      `${s.id}: ${s.cantidad} pzas, ${s.fecha}`
    ).join('\n');
  }
  if (tipo === 'proceso') {
    return proceso.map(p =>
      `${p.orderId}: ${p.estado}, ${p.hechasBambu + p.hechasEnder} hechas`
    ).join('\n');
  }
  return `Ventas: ${sales.length} | Mayoreo: ${wholesale.length} | Materiales: ${materials.filter(m => m.nombre).length}`;
}
