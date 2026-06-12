import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, calcConsumedGrams, getMaterialStatus, getNextId, fmt, fmtN } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

// Auto-detect color from material name keywords
function getMaterialColor(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('amarill') || n.includes('yellow')) return '#FACC15';
  if (n.includes('rojo') || n.includes('red') || n.includes('rosa') || n.includes('pink')) return '#EF4444';
  if (n.includes('azul') || n.includes('blue') || n.includes('celeste')) return '#3B82F6';
  if (n.includes('verde') || n.includes('green') || n.includes('lima')) return '#22C55E';
  if (n.includes('naranj') || n.includes('orange')) return '#F97316';
  if (n.includes('morad') || n.includes('purple') || n.includes('lila') || n.includes('violeta')) return '#A855F7';
  if (n.includes('negro') || n.includes('black')) return '#1f2937';
  if (n.includes('blanco') || n.includes('white') || n.includes('natural')) return '#e5e7eb';
  if (n.includes('gris') || n.includes('gray') || n.includes('grey') || n.includes('plata') || n.includes('silver')) return '#9CA3AF';
  if (n.includes('cafe') || n.includes('marron') || n.includes('brown') || n.includes('wood')) return '#92400e';
  if (n.includes('dorad') || n.includes('gold')) return '#D97706';
  if (n.includes('transparente') || n.includes('clear') || n.includes('cristal')) return 'transparent';
  return null;
}

function empty(mats) {
  return { id: getNextId(mats, 'M'), nombre: '', marca: '', rollos: 1, pesoInicial: 1000, precioRollo: 0, _new: true };
}

function MaterialForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const cxg = useMemo(() => {
    if (!f.pesoInicial || f.pesoInicial == 0) return 0;
    return (f.precioRollo * (f.rollos || 1)) / f.pesoInicial;
  }, [f.precioRollo, f.rollos, f.pesoInicial]);

  function submit(e) {
    e.preventDefault();
    if (!f.id.trim()) return alert('ID requerido');
    onSave({ ...f, rollos: Number(f.rollos), pesoInicial: Number(f.pesoInicial), precioRollo: Number(f.precioRollo) });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ID *</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} placeholder="M010" />
        </div>
        <div>
          <label className={lbl}>Marca</label>
          <input className={inp} value={f.marca} onChange={e => set('marca', e.target.value.toUpperCase())} placeholder="ELEGOO" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Nombre / Color</label>
          <input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} placeholder="PLA NEGRO" />
        </div>
        <div>
          <label className={lbl}>Cantidad de rollos</label>
          <input type="number" min="1" className={inp} value={f.rollos} onChange={e => set('rollos', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Peso inicial total (g)</label>
          <input type="number" min="0" step="0.01" className={inp} value={f.pesoInicial} onChange={e => set('pesoInicial', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Precio por rollo ($)</label>
          <input type="number" min="0" step="0.01" className={inp} value={f.precioRollo} onChange={e => set('precioRollo', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Costo / gramo (calculado)</label>
          <input className={ro} readOnly value={`$${cxg.toFixed(4)} / g`} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

export default function Materiales() {
  const { materials, setMaterials, sales, products, multiSales, wholesale, personal, failures } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const ctx = { sales, products, multiSales, wholesale, personal, failures };

  const rows = useMemo(() => materials.map(m => {
    const consumed = calcConsumedGrams(m.id, ctx);
    const restante = (m.pesoInicial || 0) - consumed;
    const cpg = calcCostoPorGramo(m);
    const status = getMaterialStatus(restante);
    return { ...m, consumed, restante, cpg, status };
  }), [materials, sales, products, multiSales, wholesale, personal, failures]);

  const filtered = rows.filter(r =>
    [r.id, r.nombre, r.marca, r.status.label].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (materials.find(m => m.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setMaterials([...materials, data]);
    } else {
      setMaterials(materials.map(m => m.id === f.id ? data : m));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setMaterials(materials.filter(m => m.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Materiales</h1>
          <p className="text-zinc-500 text-sm">{materials.length} materiales · Stock en tiempo real</p>
        </div>
        <button onClick={() => setEditing(empty(materials))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo Material
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {['OK', 'PEDIR', 'AGOTADO'].map(s => {
          const count = rows.filter(r => r.status.label === s).length;
          const styles = {
            OK:      { card: 'border-2 border-green-500  bg-green-50',  num: 'text-green-700',  lbl: 'text-green-700' },
            PEDIR:   { card: 'border-2 border-yellow-500 bg-yellow-50', num: 'text-yellow-700', lbl: 'text-yellow-700' },
            AGOTADO: { card: 'border-2 border-red-500    bg-red-50',    num: 'text-red-700',    lbl: 'text-red-700' },
          };
          const st = styles[s];
          return (
            <div key={s} className={`rounded-xl p-4 ${st.card}`}>
              <p className={`text-3xl font-black ${st.num}`}>{count}</p>
              <p className={`text-sm font-bold ${st.lbl} mt-1`}>{s}</p>
            </div>
          );
        })}
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Nombre', 'Marca', 'Rollos', 'Peso Inicial', 'Precio/Rollo', 'Costo/g', 'Consumido', 'Restante', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-zinc-100/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#96d629]">{m.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const c = getMaterialColor(m.nombre);
                        if (!c) return null;
                        const isTransp = c === 'transparent';
                        return (
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 border ${isTransp ? 'border-zinc-300 bg-[repeating-conic-gradient(#ccc_0%_25%,transparent_0%_50%)] bg-[length:6px_6px]' : 'border-zinc-200/60'}`}
                            style={!isTransp ? { backgroundColor: c } : {}}
                          />
                        );
                      })()}
                      <span className="font-semibold text-zinc-800">{m.nombre || <span className="text-zinc-400 italic">vacío</span>}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{m.marca || '—'}</td>
                  <td className="py-3 px-4 text-zinc-600">{m.rollos}</td>
                  <td className="py-3 px-4 text-zinc-600">{m.pesoInicial}g</td>
                  <td className="py-3 px-4 text-zinc-600">{fmt(m.precioRollo)}</td>
                  <td className="py-3 px-4 text-zinc-600">${fmtN(m.cpg, 4)}/g</td>
                  <td className="py-3 px-4 text-zinc-600">{fmtN(m.consumed, 1)}g</td>
                  <td className="py-3 px-4 font-medium text-zinc-800">{fmtN(m.restante, 1)}g</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.status.cls}`}>
                      {m.status.emoji} {m.status.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...m })}
                        className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs">✏️</button>
                      <button onClick={() => del(m.id)}
                        className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Material' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <MaterialForm data={editing} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

