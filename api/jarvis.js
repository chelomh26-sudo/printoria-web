import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const TIME_ZONE = 'America/Monterrey';

function safeEqual(a = '', b = '') {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function localDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function toCsv(summary) {
  const esc = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = [['ID', 'Fecha', 'Producto', 'Cantidad', 'Precio unitario', 'Total', 'Cliente', 'Estado', 'Origen']];
  for (const sale of summary.sales || []) {
    rows.push([
      sale.id, sale.fecha, sale.producto || sale.productoId, sale.cantidad,
      sale.precioUnitario, sale.total, sale.clienteId, sale.estado, sale.origen,
    ]);
  }
  return rows.map(row => row.map(esc).join(',')).join('\n');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const jarvisKey = process.env.JARVIS_API_KEY;
  if (!supabaseUrl || !secretKey || !jarvisKey) {
    return json(res, 503, { error: 'El puente de Jarvis no está configurado en Vercel.' });
  }

  const suppliedKey = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-jarvis-key'] || '';
  if (!safeEqual(String(suppliedKey), jarvisKey)) return json(res, 401, { error: 'No autorizado' });

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const action = req.method === 'GET' ? (req.query.action || 'health') : req.body?.action;

  try {
    if (action === 'health') return json(res, 200, { ok: true, service: 'printoria-sales', time_zone: TIME_ZONE, date: localDate() });

    if (action === 'inventory.list') {
      const [{ data: stockRow, error: stockError }, { data: productsRow, error: productsError }] = await Promise.all([
        supabase.from('printoria_store').select('data,updated_at').eq('key', 'printoria_stock').single(),
        supabase.from('printoria_store').select('data').eq('key', 'printoria_products').single(),
      ]);
      if (stockError) throw stockError;
      if (productsError) throw productsError;
      const products = new Map((productsRow.data || []).map(item => [item.id, item]));
      const inventory = (stockRow.data || []).map(item => ({
        ...item,
        product: products.get(item.productoId)?.nombre || item.productoId,
      }));
      return json(res, 200, { inventory, updated_at: stockRow.updated_at });
    }

    if (action === 'inventory.adjust') {
      const { stock_id, delta, reason } = req.body || {};
      const { data, error } = await supabase.rpc('jarvis_adjust_inventory', {
        p_stock_id: stock_id,
        p_delta: Number(delta),
        p_reason: reason,
        p_source: 'JARVIS',
      });
      if (error) throw error;
      return json(res, 200, { ok: true, inventory: data });
    }

    if (action === 'sales.create') {
      const sale = { ...(req.body?.sale || {}) };
      if (!sale.id) sale.id = `J-${Date.now()}`;
      if (!sale.fecha) sale.fecha = localDate();
      const { data, error } = await supabase.rpc('jarvis_record_sale', {
        p_sale: sale,
        p_stock_id: req.body?.stock_id || null,
        p_source: 'JARVIS',
      });
      if (error) throw error;
      return json(res, 201, { ok: true, ...data });
    }

    if (action === 'daily.summary' || action === 'daily.export') {
      const date = req.body?.date || req.query.date || localDate();
      const { data, error } = await supabase.rpc('jarvis_daily_summary', { p_date: date });
      if (error) throw error;
      if (action === 'daily.export' && (req.body?.format || req.query.format) === 'csv') {
        res.status(200);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="ventas-${date}.csv"`);
        return res.end(`\uFEFF${toCsv(data)}`);
      }
      return json(res, 200, data);
    }

    return json(res, 400, { error: `Acción no soportada: ${action || '(vacía)'}` });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Error desconocido' });
  }
}
