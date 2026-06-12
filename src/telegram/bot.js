/**
 * TELEGRAM BOT — INTEGRACIÓN FUTURA
 *
 * Este archivo muestra la estructura para integrar un bot de Telegram
 * que interprete mensajes naturales y los registre en PRINTORIA usando la API de Claude.
 *
 * FLUJO:
 * 1. Usuario manda: "vendí 3 cajas a Fran con M003"
 * 2. Bot recibe mensaje via webhook
 * 3. Se envía a Claude API con el contexto del catálogo actual
 * 4. Claude devuelve JSON estructurado con la operación a registrar
 * 5. Se llama a la función de registro correspondiente
 *
 * SETUP (cuando esté listo):
 * npm install node-telegram-bot-api @anthropic-ai/sdk
 */

// import TelegramBot from 'node-telegram-bot-api';
// import Anthropic from '@anthropic-ai/sdk';

// const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
// const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

/**
 * Parsea un mensaje natural en una operación PRINTORIA
 *
 * @param {string} message - "vendí 3 cajas a Fran con M003"
 * @param {object} context - { products, clients, materials } actuales
 * @returns {{ operation: string, data: object }}
 */
// async function parseNaturalMessage(message, context) {
//   const systemPrompt = `Eres el asistente de PRINTORIA, un negocio de impresión 3D.
//
//   Catálogo actual:
//   Productos: ${JSON.stringify(context.products.map(p => ({ id: p.id, nombre: p.nombre })))}
//   Materiales: ${JSON.stringify(context.materials.map(m => ({ id: m.id, nombre: m.nombre })))}
//   Clientes: ${JSON.stringify(context.clients.map(c => ({ id: c.id, nombre: c.nombre })))}
//
//   Cuando recibas un mensaje del dueño, identifica qué operación registrar y devuelve JSON:
//   {
//     "operation": "venta" | "mayoreo" | "falla" | "uso_personal" | "cotizacion",
//     "data": { ...campos según operación },
//     "confirmation": "Texto amigable para confirmar con el usuario"
//   }`;
//
//   const response = await anthropic.messages.create({
//     model: 'claude-sonnet-4-6',
//     max_tokens: 1024,
//     system: systemPrompt,
//     messages: [{ role: 'user', content: message }],
//   });
//
//   return JSON.parse(response.content[0].text);
// }

/**
 * Handler principal del bot
 *
 * bot.on('message', async (msg) => {
 *   const chatId = msg.chat.id;
 *   const text = msg.text;
 *
 *   try {
 *     bot.sendMessage(chatId, '⏳ Procesando...');
 *
 *     // Obtener datos actuales de localStorage (o DB si migras)
 *     const context = getPrintoriaContext(); // PUNTO DE INTEGRACIÓN
 *
 *     const parsed = await parseNaturalMessage(text, context);
 *
 *     // Confirmar con el usuario antes de registrar
 *     bot.sendMessage(chatId, `✅ ${parsed.confirmation}\n\n¿Confirmar? (sí/no)`);
 *
 *     // Guardar estado pendiente y esperar respuesta...
 *     // ...
 *
 *   } catch (err) {
 *     bot.sendMessage(chatId, `❌ Error: ${err.message}`);
 *   }
 * });
 */

// PUNTO DE INTEGRACIÓN con el store de React:
// Para conectar el bot con los datos de localStorage,
// se puede usar una función exportada desde PrintoriaContext
// o migrar a un backend con base de datos (SQLite / Supabase recomendados).

export {};
