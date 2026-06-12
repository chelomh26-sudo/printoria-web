import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, getNextId, fmt, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const emptyMats = () => [{ materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }];

function emptyForm(ps) {
  return { id: getNextId(ps, 'UP'), fecha: TODAY(), descripcion: '', impresora: 'Bambu', materiales: emptyMats(), tiempo: 0, _new: true };
}

function UPForm({ data, materials, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data, materiales: data.materiales ? [...data.materiales.map(m => ({ ...m }))] : emptyMats() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setMat = (i, k, v) => setF(p => { const mats = [...p.materiales]; mats[i] = { ...mats[i], [k]: v }; return { ...p, materiales: mats }; });

  const calcs = useMemo(() => {
    let costoMateriales = 0, gramosTotal = 0;
    f.materiales.forEach(m => {
      if (m.materialId && m.gramos > 0) {
        const mat = materials.find(x => x.id === m.materialId);
        costoMateriales += Number(m.gramos) * (mat ? calcCostoPorGramo(mat) : 0);
        gramosTotal += Number(m.gramos);
      }
    });
    const costoLuz = (Number(f.tiempo) || 0) * config.costLuzMin;
    const costoDesgaste = (Number(f.tiempo) || 0) * config.costDesgasteMin;
    return { costoMateriales, gramosTotal, costoLuz, costoDesgaste, total: costoMateriales + costoLuz + costoDesgaste };
  }, [f, materials, config]);

  function submit(e) {
    e.preventDefault();
    const mats = f.materiales.filter(m => m.materialId && m.gramos > 0).map(m => ({ materialId: m.materialId, gramos: Number(m.gramos) }));
    onSave({ ...f, tiempo: Number(f.tiempo), materiales: mats });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>ID</label><input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} /></div>
        <div><label className={lbl}>Fecha</label><input type="date" className={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
        <div>
          <label className={lbl}>Impresora</label>
          <select className={inp} value={f.impresora} onChange={e => set('impresora', e.target.value)}>
            <option>Bambu</option><option>Ender</option>
          </select>
        </div>
        <div className="col-span-3">
          <label className={lbl}>Descripción</label>
          <input className={inp} value={f.descripcion} onChange={e => set('descripcion', e.target.value.toUpperCase())} placeholder="¿Qué imprimiste?" />
        </div>
        <div>
          <label className={lbl}>Tiempo (min)</label>
          <input type="number" step="1" min="0" className={inp} value={f.tiempo} onChange={e => set('tiempo', e.target.value)} />
        </div>
      </div>

      <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Materiales usados</p>
        {f.materiales.map((m, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div>
              <label className={lbl}>ID Material {i + 1}</label>
              <input className={inp} value={m.materialId} onChange={e => setMat(i, 'materialId', e.target.value.toUpperCase())} placeholder="M002" />
            </div>
            <div>
              <label className={lbl}>Gramos usados</label>
              <input type="number" step="0.01" min="0" className={inp} value={m.gramos} onChange={e => setMat(i, 'gramos', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Material</label>
              <input className={ro} readOnly value={materials.find(x => x.id === m.materialId)?.nombre || ''} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-100/30 rounded-lg p-3 flex gap-6 text-xs text-zinc-400">
        <div>Gramos: <span className="text-zinc-700 font-semibold">{calcs.gramosTotal.toFixed(2)}g</span></div>
        <div>C.Mat: <span className="text-zinc-700">{fmt(calcs.costoMateriales)}</span></div>
        <div>Luz+Desgaste: <span className="text-zinc-700">{fmt(calcs.costoLuz + calcs.costoDesgaste)}</span></div>
        <div>Total: <span className="text-red-400 font-bold">{fmt(calcs.total)}</span></div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

export default function UsoPersonal() {
  const { personal, setPersonal, materials, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = personal.filter(u =>
    [u.id, u.descripcion, u.impresora].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function calcTotal(u) {
    let c = 0, g = 0;
    (u.materiales || []).forEach(m => {
      const mat = materials.find(x => x.id === m.materialId);
      c += (m.gramos || 0) * (mat ? calcCostoPorGramo(mat) : 0);
      g += m.gramos || 0;
    });
    c += (u.tiempo || 0) * (config.costLuzMin + config.costDesgasteMin);
    return { costo: c, gramos: g };
  }

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (personal.find(p => p.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setPersonal([...personal, data]);
    } else {
      setPersonal(personal.map(p => p.id === f.id ? data : p));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setPersonal(personal.filter(p => p.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Uso Personal</h1>
          <p className="text-zinc-500 text-sm">Descuenta del stock · no genera ingresos</p>
        </div>
        <button onClick={() => setEditing(emptyForm(personal))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo Uso
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Fecha', 'Descripción', 'Impresora', 'Materiales', 'Gramos', 'Costo', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(u => {
                const { costo, gramos } = calcTotal(u);
                const matsStr = (u.materiales || []).map(m => {
                  const mat = materials.find(x => x.id === m.materialId);
                  return `${mat?.nombre || m.materialId} (${m.gramos}g)`;
                }).join(', ');
                return (
                  <tr key={u.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#96d629]">{u.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{u.fecha}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800">{u.descripcion}</td>
                    <td className="py-3 px-4 text-zinc-400">{u.impresora}</td>
                    <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{matsStr || '—'}</td>
                    <td className="py-3 px-4 text-zinc-600">{gramos.toFixed(1)}g</td>
                    <td className="py-3 px-4 text-red-400 font-semibold">{fmt(costo)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...u, materiales: (u.materiales || []).map(m => ({ ...m })), _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(u.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Uso Personal' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <UPForm data={editing} materials={materials} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

