import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, getNextId, fmt, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const CAUSAS = ['ADHESIÓN', 'FILAMENTO', 'CONFIGURACIÓN', 'CORTE DE LUZ', 'MECÁNICA', 'TEMPERATURA', 'OTRO'];

function emptyForm(fs) {
  return { id: getNextId(fs, 'F'), fecha: TODAY(), impresora: 'Bambu', materialId: '', gramosPerdidos: 0, tiempoPerdido: 0, causa: 'ADHESIÓN', descripcion: '', _new: true };
}

function FallaForm({ data, materials, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const material = materials.find(m => m.id === f.materialId);

  const calcs = useMemo(() => {
    const cpg = material ? calcCostoPorGramo(material) : 0;
    const costoMaterial = (Number(f.gramosPerdidos) || 0) * cpg;
    const costoLuz = (Number(f.tiempoPerdido) || 0) * config.costLuzMin;
    const costoDesgaste = (Number(f.tiempoPerdido) || 0) * config.costDesgasteMin;
    return { costoMaterial, costoLuz, costoDesgaste, total: costoMaterial + costoLuz + costoDesgaste };
  }, [f, material, config]);

  function submit(e) {
    e.preventDefault();
    onSave({ ...f, gramosPerdidos: Number(f.gramosPerdidos), tiempoPerdido: Number(f.tiempoPerdido) });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>ID</label><input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} /></div>
        <div><label className={lbl}>Fecha</label><input type="date" className={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
        <div>
          <label className={lbl}>Impresora</label>
          <select className={inp} value={f.impresora} onChange={e => set('impresora', e.target.value)}>
            <option>Bambu</option><option>Ender</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Causa</label>
          <select className={inp} value={f.causa} onChange={e => set('causa', e.target.value)}>
            {CAUSAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>ID Material</label>
          <input className={inp} value={f.materialId} onChange={e => set('materialId', e.target.value.toUpperCase())} placeholder="M002" />
        </div>
        <div>
          <label className={lbl}>Material (auto)</label>
          <input className={ro} readOnly value={material ? `${material.nombre} ${material.marca}` : (f.materialId ? '⚠ No encontrado' : '')} />
        </div>
        <div>
          <label className={lbl}>Gramos perdidos</label>
          <input type="number" step="0.01" min="0" className={inp} value={f.gramosPerdidos} onChange={e => set('gramosPerdidos', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Tiempo perdido (min)</label>
          <input type="number" step="1" min="0" className={inp} value={f.tiempoPerdido} onChange={e => set('tiempoPerdido', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Descripción</label>
          <textarea className={inp} rows={3} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Qué pasó exactamente..." />
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 grid grid-cols-4 gap-3 text-xs text-zinc-400">
        <div className="text-center"><p className="text-zinc-500 mb-1">C.Material</p><p className="text-red-400 font-bold">{fmt(calcs.costoMaterial)}</p></div>
        <div className="text-center"><p className="text-zinc-500 mb-1">C.Luz</p><p className="text-red-400">{fmt(calcs.costoLuz)}</p></div>
        <div className="text-center"><p className="text-zinc-500 mb-1">C.Desgaste</p><p className="text-red-400">{fmt(calcs.costoDesgaste)}</p></div>
        <div className="text-center"><p className="text-zinc-500 mb-1">PÉRDIDA TOTAL</p><p className="text-red-400 font-bold text-base">{fmt(calcs.total)}</p></div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg text-sm">Registrar Falla</button>
      </div>
    </form>
  );
}

const CAUSA_COLOR = { ADHESIÓN: 'bg-orange-400/15 text-orange-300', FILAMENTO: 'bg-yellow-400/15 text-yellow-300', CONFIGURACIÓN: 'bg-blue-400/15 text-blue-300', 'CORTE DE LUZ': 'bg-red-400/15 text-red-300', MECÁNICA: 'bg-purple-400/15 text-purple-300', TEMPERATURA: 'bg-[#a3dc3f]/15 text-[#78b01e]', OTRO: 'bg-zinc-200 text-zinc-600' };

export default function Fallas() {
  const { failures, setFailures, materials, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = failures.filter(f =>
    [f.id, f.causa, f.impresora, f.descripcion, materials.find(m => m.id === f.materialId)?.nombre].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const totales = useMemo(() => {
    let gramos = 0, costo = 0;
    failures.forEach(f => {
      gramos += f.gramosPerdidos || 0;
      const mat = materials.find(m => m.id === f.materialId);
      const cpg = mat ? calcCostoPorGramo(mat) : 0;
      costo += (f.gramosPerdidos || 0) * cpg + (f.tiempoPerdido || 0) * (config.costLuzMin + config.costDesgasteMin);
    });
    return { gramos, costo };
  }, [failures, materials, config]);

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (failures.find(x => x.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setFailures([...failures, data]);
    } else {
      setFailures(failures.map(x => x.id === f.id ? data : x));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setFailures(failures.filter(f => f.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Fallas</h1>
          <p className="text-zinc-500 text-sm">{failures.length} registradas</p>
        </div>
        <button onClick={() => setEditing(emptyForm(failures))}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-sm">
          + Registrar Falla
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500"># FALLAS</p>
          <p className="text-2xl font-bold text-red-400">{failures.length}</p>
        </div>
        <div className="bg-white border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500">GRAMOS PERDIDOS</p>
          <p className="text-2xl font-bold text-red-400">{totales.gramos.toFixed(1)}g</p>
        </div>
        <div className="bg-white border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500">COSTO PÉRDIDAS</p>
          <p className="text-2xl font-bold text-red-400">{fmt(totales.costo)}</p>
        </div>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Fecha', 'Impr', 'Material', 'Causa', 'Gramos', 'Tiempo', 'Pérdida', 'Descripción', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(f => {
                const mat = materials.find(m => m.id === f.materialId);
                const cpg = mat ? calcCostoPorGramo(mat) : 0;
                const perdida = (f.gramosPerdidos || 0) * cpg + (f.tiempoPerdido || 0) * (config.costLuzMin + config.costDesgasteMin);
                return (
                  <tr key={f.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[#96d629]">{f.id}</td>
                    <td className="py-3 px-3 text-zinc-400">{f.fecha}</td>
                    <td className="py-3 px-3 text-zinc-600">{f.impresora}</td>
                    <td className="py-3 px-3 text-zinc-600">{mat?.nombre || f.materialId || '—'}</td>
                    <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${CAUSA_COLOR[f.causa] || 'bg-zinc-200 text-zinc-600'}`}>{f.causa}</span></td>
                    <td className="py-3 px-3 text-zinc-600">{f.gramosPerdidos}g</td>
                    <td className="py-3 px-3 text-zinc-600">{fmtTime(f.tiempoPerdido)}</td>
                    <td className="py-3 px-3 font-bold text-red-400">{fmt(perdida)}</td>
                    <td className="py-3 px-3 text-zinc-400 max-w-xs truncate">{f.descripcion || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...f, _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-2 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(f.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-zinc-500">Sin fallas registradas 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Registrar Falla' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <FallaForm data={editing} materials={materials} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

