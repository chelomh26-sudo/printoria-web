-- ============================================================
-- PRINTORIA 3D — Schema Supabase
-- Pega esto en Supabase → SQL Editor → Run
-- ============================================================

-- Tabla única key-value para datos públicos del catálogo
create table if not exists printoria_store (
  key        text primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Permite lectura pública (catálogo visible para clientes)
alter table printoria_store enable row level security;

create policy "Lectura pública" on printoria_store
  for select using (true);

create policy "Escritura con anon key" on printoria_store
  for all using (true) with check (true);

-- Inserta filas vacías iniciales para que existan desde el principio
insert into printoria_store (key, data) values
  ('printoria_products', '[]'::jsonb),
  ('printoria_galeria',  '[]'::jsonb),
  ('printoria_config',   '{}'::jsonb)
on conflict (key) do nothing;
