// Supabase via fetch — sin necesidad de npm install
// Usa la REST API directamente, 100% compatible

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = null; // no se usa directamente
export const SUPABASE_READY = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const HEADERS = SUPABASE_READY ? {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
} : {};

/** Lee un valor de printoria_store por key */
export async function sbGet(key) {
  if (!SUPABASE_READY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/printoria_store?key=eq.${key}&select=data`,
      { headers: HEADERS }
    );
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows[0].data;
  } catch { return null; }
}

/** Guarda/actualiza un valor en printoria_store */
export async function sbSet(key, value) {
  if (!SUPABASE_READY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/printoria_store`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ key, data: value, updated_at: new Date().toISOString() }),
    });
  } catch { /* silencioso */ }
}
