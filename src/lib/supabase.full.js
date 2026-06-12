// ╔══════════════════════════════════════════════════════════════╗
// ║  VERSIÓN COMPLETA con Supabase                               ║
// ║  Requiere: npm install  +  archivo .env con credenciales     ║
// ║  Para activar:                                               ║
// ║    1. Borra supabase.js (el stub)                            ║
// ║    2. Renombra ESTE archivo a supabase.js                    ║
// ╚══════════════════════════════════════════════════════════════╝
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const SUPABASE_READY = !!supabase;

export async function sbGet(key) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('printoria_store')
    .select('data')
    .eq('key', key)
    .single();
  if (error || !data) return null;
  return data.data;
}

export async function sbSet(key, value) {
  if (!supabase) return;
  await supabase
    .from('printoria_store')
    .upsert({ key, data: value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}
