import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { getNextId, fmt, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-500 text-sm';

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];
const TIPOS = ['Básico', 'Tornasol', 'Mixto'];
const COLORES = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 'Gris', 'Tornasol'];

// Ingreso de una venta: total directo (modelo simple) o cálculo viejo por producto
function saleTotal(s, products) {
  if (typeof s.total === 'number') return s.total;
  const p = products.find(x => x.id === s.productoId);
  const precio = (s.precioUnitario != null ? s.precioUnitario : (p ? p.precioVenta : 0)) || 0;
  return precio * (s.cantidad || 1);
}
function saleProducto(s, products) {
  if (s.producto) return s.producto;
  const p = products.find(x => x.id === s.productoId);
  return p ? p.nombre : (s.productoId || '—');
}

function emptyForm(sales) {
  return { id: getNextId(sales, 'V'), fecha: TODAY(), producto: '', tipo: 'Básico', color: '', cantidad: 1, precioUnitario: '', clienteId: '', estado: 'ENTREGADO', _new: true };
}

function VentaForm({ data, products, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Si el producto existe en catálogo, sugiere su precio
  const match = products.find(p => (p.nombre || '').toLowerCase() === (f.producto || '').toLowerCase());
  const precio = f.precioUnitario !== '' && f.precioUnitario != null ? Number(f.precioUnitario) : (match ? match.precioVenta : 0);
  const total = (Number(precio) || 0) * (Number(f.cantidad) || 1);

  function submit(e) {
    e.preventDefault();
    if (!f.producto.trim()) return alert('Escribe el producto');
    const pu = f.precioUnitario !== '' && f.precioUnitario != null ? Number(f.precioUnitario) : (match ? match.precioVenta : 0);
    onSave({
      ...f,
      productoId: match ? match.id : (f.productoId || ''),
      cantidad: Number(f.cantidad) || 1,
      precioUnitario: Number(pu) || 0,
      total: (Number(pu) || 0) * (Number(f.cantidad) || 1),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>ID</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} />
        </div>
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" className={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Estado</label>
          <select className={inp} value={f.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Producto *</label>
        <input className={inp} list="prod-list" value={f.producto} onChange={e => set('producto', e.target.value)} placeholder="Ej: Estrella Fidget S" />
        <datalist id="prod-list">
          {products.map(p => <option key={p.id} value={p.nombre} />)}
        </datalist>
        {match && <p className="text-[11px] text-zinc-400 mt-1">En catálogo · precio sugerido {fmt(match.precioVenta)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo</label>
          <select className={inp} value={f.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Color (opcional)</label>
          <input className={inp} list="color-list" value={f.color} onChange={e => set('color', e.target.value)} placeholder="Ej: Negro" />
          <datalist id="color-list">
            {COLORES.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className={lbl}>Cantidad</label>
          <input type="number" min="1" className={inp} value={f.cantidad} onChange={e => set('cantidad', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Precio unitario ($)</label>
          <input type="number" min="0" step="0.01" className={inp} value={f.precioUnitario} onChange={e => set('precioUnitario', e.target.value)} placeholder={match ? String(match.precioVenta) : '0'} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Cliente (opcional)</label>
          <input className={inp} value={f.clienteId} onChange={e => set('clienteId', e.target.value)} placeholder="Nombre o —" />
        </div>
        <div>
          <label className={lbl}>Total</label>
          <input className={ro} readOnly value={fmt(total)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

const ESTADO_COLOR = { PENDIENTE: 'bg-yellow-400/15 text-yellow-600', 'EN PROCESO': 'bg-blue-400/15 text-blue-600', TERMINADO: 'bg-green-400/15 text-green-600', ENTREGADO: 'bg-zinc-200 text-zinc-600', CANCELADO: 'bg-red-400/15 text-red-600' };
const TIPO_COLOR = { 'Básico': 'bg-zinc-100 text-zinc-600', 'Tornasol': 'bg-pink-100 text-pink-600', 'Mixto': 'bg-indigo-100 text-indigo-600' };

export default function Ventas() {
  const { sales, setSales, products } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => sales.map(s => ({
    ...s,
    _producto: saleProducto(s, products),
    _total: saleTotal(s, products),
  })), [sales, products]);

  const filtered = rows.filter(r =>
    [r.id, r._producto, r.tipo, r.color, r.clienteId, r.estado, r.origen].some(v => (v || '').toString().toLowerCase().includes(search.toLowerCase()))
  ).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (sales.find(s => s.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setSales([...sales, data]);
    } else {
      setSales(sales.map(s => s.id === f.id ? { ...s, ...data } : s));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar venta ${id}?`)) setSales(sales.filter(s => s.id !== id));
  }

  const totales = useMemo(() => {
    const ingresos = rows.reduce((a, r) => a + (r._total || 0), 0);
    const piezas = rows.reduce((a, r) => a + (Number(r.cantidad) || 0), 0);
    return { ingresos, piezas, n: rows.length };
  }, [rows]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Ventas</h1>
          <p className="text-zinc-500 text-sm">{sales.length} ventas · registro rápido</p>
        </div>
        <button onClick={() => setEditing(emptyForm(sales))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nueva Venta
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">INGRESOS</p>
          <p className="text-xl font-bold text-green-600">{fmt(totales.ingresos)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">VENTAS</p>
          <p className="text-xl font-bold text-zinc-800">{totales.n}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">PIEZAS</p>
          <p className="text-xl font-bold text-zinc-800">{totales.piezas}</p>
        </div>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar producto, color, cliente..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['Fecha', 'Producto', 'Tipo', 'Color', 'Cant', 'Total', 'Cliente', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-zinc-100/30 transition-colors">
                  <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                    {r.fecha}
                    {r.origen && <span className="block text-[10px] text-[#96d629] font-semibold">{r.origen}{r.ticket ? ` #${r.ticket}` : ''}</span>}
                  </td>
                  <td className="py-3 px-3 text-zinc-800 font-medium max-w-[280px]">{r._producto}</td>
                  <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${TIPO_COLOR[r.tipo] || 'bg-zinc-100 text-zinc-500'}`}>{r.tipo || '—'}</span></td>
                  <td className="py-3 px-3 text-zinc-500">{r.color || '—'}</td>
                  <td className="py-3 px-3 text-zinc-600">{r.cantidad}</td>
                  <td className="py-3 px-3 font-semibold text-zinc-800">{fmt(r._total)}</td>
                  <td className="py-3 px-3 text-zinc-500">{r.clienteId || '—'}</td>
                  <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[r.estado] || 'bg-zinc-100 text-zinc-600'}`}>{r.estado}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...r, _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-2 py-1.5 rounded text-xs">✏️</button>
                      <button onClick={() => del(r.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-zinc-500">Sin ventas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nueva Venta' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <VentaForm data={editing} products={products} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
