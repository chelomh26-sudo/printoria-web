create table if not exists public.printoria_inventory_movements (
  id bigint generated always as identity primary key,
  stock_id text not null,
  product_id text,
  delta integer not null check (delta <> 0),
  quantity_before integer not null,
  quantity_after integer not null check (quantity_after >= 0),
  reason text not null,
  source text not null default 'JARVIS',
  sale_id text,
  created_at timestamptz not null default now()
);

alter table public.printoria_inventory_movements enable row level security;
revoke all on public.printoria_inventory_movements from anon, authenticated;

create or replace function public.jarvis_adjust_inventory(
  p_stock_id text,
  p_delta integer,
  p_reason text,
  p_source text default 'JARVIS'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock jsonb;
  v_item jsonb;
  v_before integer;
  v_after integer;
  v_product_id text;
begin
  if p_delta = 0 then raise exception 'El ajuste no puede ser cero'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'El motivo es obligatorio'; end if;

  select data into v_stock from public.printoria_store where key = 'printoria_stock' for update;
  if v_stock is null then raise exception 'No existe printoria_stock'; end if;

  select value into v_item from jsonb_array_elements(v_stock) value where value->>'id' = p_stock_id limit 1;
  if v_item is null then raise exception 'Stock % no encontrado', p_stock_id; end if;

  v_before := coalesce((v_item->>'cantidad')::integer, 0);
  v_after := v_before + p_delta;
  if v_after < 0 then raise exception 'Stock insuficiente: hay %, se solicitó %', v_before, abs(p_delta); end if;
  v_product_id := v_item->>'productoId';

  select jsonb_agg(
    case when value->>'id' = p_stock_id then jsonb_set(value, '{cantidad}', to_jsonb(v_after), true) else value end
    order by ordinality
  ) into v_stock
  from jsonb_array_elements(v_stock) with ordinality as items(value, ordinality);

  update public.printoria_store set data = v_stock, updated_at = now() where key = 'printoria_stock';
  insert into public.printoria_inventory_movements(stock_id, product_id, delta, quantity_before, quantity_after, reason, source)
  values (p_stock_id, v_product_id, p_delta, v_before, v_after, p_reason, coalesce(nullif(p_source,''), 'JARVIS'));

  return jsonb_build_object('stock_id', p_stock_id, 'product_id', v_product_id, 'quantity_before', v_before, 'quantity_after', v_after);
end;
$$;

create or replace function public.jarvis_record_sale(
  p_sale jsonb,
  p_stock_id text default null,
  p_source text default 'JARVIS'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sales jsonb;
  v_stock jsonb;
  v_item jsonb;
  v_sale_id text := p_sale->>'id';
  v_quantity integer := coalesce((p_sale->>'cantidad')::integer, 1);
  v_before integer;
  v_after integer;
  v_product_id text := coalesce(p_sale->>'productoId', '');
begin
  if coalesce(trim(v_sale_id), '') = '' then raise exception 'La venta requiere id'; end if;
  if v_quantity <= 0 then raise exception 'La cantidad debe ser mayor a cero'; end if;

  select data into v_sales from public.printoria_store where key = 'printoria_sales' for update;
  v_sales := coalesce(v_sales, '[]'::jsonb);
  if exists (select 1 from jsonb_array_elements(v_sales) x where x->>'id' = v_sale_id) then
    raise exception 'La venta % ya existe', v_sale_id;
  end if;

  if p_stock_id is not null then
    select data into v_stock from public.printoria_store where key = 'printoria_stock' for update;
    select value into v_item from jsonb_array_elements(coalesce(v_stock, '[]'::jsonb)) value where value->>'id' = p_stock_id limit 1;
    if v_item is null then raise exception 'Stock % no encontrado', p_stock_id; end if;
    v_before := coalesce((v_item->>'cantidad')::integer, 0);
    v_after := v_before - v_quantity;
    if v_after < 0 then raise exception 'Stock insuficiente: hay %, se venden %', v_before, v_quantity; end if;
    if v_product_id <> '' and v_item->>'productoId' <> v_product_id then raise exception 'El stock no corresponde al producto'; end if;
    v_product_id := v_item->>'productoId';

    select jsonb_agg(
      case when value->>'id' = p_stock_id then jsonb_set(value, '{cantidad}', to_jsonb(v_after), true) else value end
      order by ordinality
    ) into v_stock from jsonb_array_elements(v_stock) with ordinality as items(value, ordinality);
    update public.printoria_store set data = v_stock, updated_at = now() where key = 'printoria_stock';
    insert into public.printoria_inventory_movements(stock_id, product_id, delta, quantity_before, quantity_after, reason, source, sale_id)
    values (p_stock_id, v_product_id, -v_quantity, v_before, v_after, 'Venta ' || v_sale_id, coalesce(nullif(p_source,''), 'JARVIS'), v_sale_id);
  end if;

  p_sale := p_sale || jsonb_build_object(
    'fecha', coalesce(nullif(p_sale->>'fecha',''), to_char(timezone('America/Monterrey', now()), 'YYYY-MM-DD')),
    'origen', coalesce(nullif(p_sale->>'origen',''), coalesce(nullif(p_source,''), 'JARVIS'))
  );
  update public.printoria_store set data = v_sales || jsonb_build_array(p_sale), updated_at = now() where key = 'printoria_sales';
  return jsonb_build_object('sale', p_sale, 'inventory', case when p_stock_id is null then null else jsonb_build_object('stock_id', p_stock_id, 'quantity_after', v_after) end);
end;
$$;

create or replace function public.jarvis_daily_summary(p_date date)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with sales as (
    select value sale
    from public.printoria_store s, jsonb_array_elements(s.data) value
    where s.key = 'printoria_sales'
      and value->>'fecha' = p_date::text
      and coalesce(value->>'estado','') <> 'CANCELADO'
  )
  select jsonb_build_object(
    'date', p_date,
    'sales_count', count(*),
    'pieces', coalesce(sum(coalesce((sale->>'cantidad')::numeric, 1)), 0),
    'revenue', coalesce(sum(coalesce((sale->>'total')::numeric, coalesce((sale->>'precioUnitario')::numeric,0) * coalesce((sale->>'cantidad')::numeric,1))), 0),
    'sales', coalesce(jsonb_agg(sale order by sale->>'id'), '[]'::jsonb)
  ) from sales;
$$;

revoke execute on function public.jarvis_adjust_inventory(text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.jarvis_record_sale(jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.jarvis_daily_summary(date) from public, anon, authenticated;
grant execute on function public.jarvis_adjust_inventory(text, integer, text, text) to service_role;
grant execute on function public.jarvis_record_sale(jsonb, text, text) to service_role;
grant execute on function public.jarvis_daily_summary(date) to service_role;
