import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { getNextId, fmt, fmtN, fmtTime } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

const emptySlots = () => [{ label: '', gramos: 0 }, { label: '', gramos: 0 }, { label: '', gramos: 0 }, { label: '', gramos: 0 }];

function empty(mps) {
  return { id: getNextId(mps, 'PM'), nombre: '', descripcion: '', slots: emptySlots(), tiempoBambu: 0, precioVenta: 0, publicar: false, foto: '', descripcionPublica: '', _new: true };
}

function PMForm({ data, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data, slots: data.slots ? [...data.slots.map(s => ({ ...s }))] : emptySlots() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setSlot = (i, k, v) => setF(p => {
    const slots = [...p.slots];
    slots[i] = { ...slots[i], [k]: v };
    return { ...p, slots };
  });

  const calcs = useMemo(() => {
    const totalGramos = f.slots.reduce((acc, s) => acc + (Number(s.gramos) || 0), 0);
    const costoLuz = (f.tiempoBambu || 0) * config.costLuzMin;
    const costoDesgaste = (f.tiempoBambu || 0) * config.costDesgasteMin;
    return { totalGramos, costoLuz, costoDesgaste };
  }, [f.slots, f.tiempoBambu, config]);

  function submit(e) {
    e.preventDefault();
    if (!f.nombre.trim()) return alert('Nombre requerido');
    const slots = f.slots.filter(s => s.label || s.gramos > 0).map(s => ({ ...s, gramos: Number(s.gramos) }));
    onSave({ ...f, slots, tiempoBambu: Number(f.tiempoBambu), precioVenta: Number(f.precioVenta) });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ID *</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} />
        </div>
        <div>
          <label className={lbl}>Precio venta ($)</label>
          <input type="number" step="0.01" className={inp} value={f.precioVenta} onChange={e => set('precioVenta', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Nombre *</label>
          <input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Descripción</label>
          <input className={inp} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Tiempo Bambu (min)</label>
          <input type="number" step="0.1" min="0" className={inp} value={f.tiempoBambu} onChange={e => set('tiempoBambu', e.target.value)} />
        </div>
      </div>

      {/* Material slots */}
      <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Materiales (hasta 4 slots)</p>
        {f.slots.map((slot, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className={lbl}>Slot {i + 1} — Etiqueta</label>
              <input className={inp} value={slot.label} onChange={e => setSlot(i, 'label', e.target.value.toUpperCase())} placeholder={`Color ${i + 1}`} />
            </div>
            <div>
              <label className={lbl}>Gramos</label>
              <input type="number" step="0.01" min="0" className={inp} value={slot.gramos} onChange={e => setSlot(i, 'gramos', e.target.value)} />
            </div>
            <div className="text-xs text-zinc-500 pb-2">{i === 0 ? `Total: ${fmtN(calcs.totalGramos, 2)}g` : ''}</div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-100/30 rounded-lg p-3 flex gap-8 text-xs text-zinc-400">
        <div>Total gramos: <span className="text-zinc-700 font-semibold">{fmtN(calcs.totalGramos, 2)}g</span></div>
        <div>Costo luz: <span className="text-zinc-700">{fmt(calcs.costoLuz)}</span></div>
        <div>Costo desgaste: <span className="text-zinc-700">{fmt(calcs.costoDesgaste)}</span></div>
      </div>

      {/* Catálogo */}
      <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="pubm" checked={f.publicar} onChange={e => set('publicar', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
          <label htmlFor="pubm" className="text-sm text-zinc-600">Publicar en catálogo</label>
        </div>
        {f.publicar && (
          <>
            <input className={inp} value={f.foto} onChange={e => set('foto', e.target.value)} placeholder="URL foto..." />
            <textarea className={inp} rows={2} value={f.descripcionPublica} onChange={e => set('descripcionPublica', e.target.value)} placeholder="Descripción pública..." />
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

export default function ProductosMulti() {
  const { multiProducts, setMultiProducts, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = multiProducts.filter(p =>
    [p.id, p.nombre].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (multiProducts.find(p => p.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setMultiProducts([...multiProducts, data]);
    } else {
      setMultiProducts(multiProducts.map(p => p.id === f.id ? data : p));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setMultiProducts(multiProducts.filter(p => p.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Productos Multimaterial</h1>
          <p className="text-zinc-500 text-sm">Solo Bambu · Hasta 4 materiales</p>
        </div>
        <button onClick={() => setEditing(empty(multiProducts))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Nombre', 'Slots Material', 'Total g', 'T.Bambu', 'Precio', 'Catálogo', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(p => {
                const totalG = (p.slots || []).reduce((a, s) => a + (s.gramos || 0), 0);
                const slots = (p.slots || []).filter(s => s.label || s.gramos > 0);
                return (
                  <tr key={p.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#96d629]">{p.id}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800">{p.nombre || <span className="text-zinc-600 italic">vacío</span>}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      {slots.length ? slots.map(s => `${s.label} (${s.gramos}g)`).join(' · ') : '—'}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{fmtN(totalG, 2)}g</td>
                    <td className="py-3 px-4 text-zinc-600">{fmtTime(p.tiempoBambu)}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-800">{fmt(p.precioVenta)}</td>
                    <td className="py-3 px-4">{p.publicar ? <span className="text-green-400 text-xs font-bold">✓ SÍ</span> : <span className="text-zinc-600 text-xs">NO</span>}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...p, slots: (p.slots || []).map(s => ({ ...s })) })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(p.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Producto Multi' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <PMForm data={editing} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

