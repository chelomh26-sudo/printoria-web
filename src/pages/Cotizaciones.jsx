import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, getNextId, fmt, fmtN, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const emptyMats = () => [{ materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }];

function emptyForm(qs) {
  return { id: getNextId(qs, 'COT'), fecha: TODAY(), descripcion: '', materiales: emptyMats(), tiempoImpresion: 0, tiempoDiseno: 0, extras: 0, _new: true };
}

function CotizacionForm({ data, materials, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data, materiales: data.materiales ? data.materiales.map(m => ({ ...m })) : emptyMats() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setMat = (i, k, v) => setF(p => { const mats = [...p.materiales]; mats[i] = { ...mats[i], [k]: v }; return { ...p, materiales: mats }; });

  const calcs = useMemo(() => {
    let costoMateriales = 0, gramosTotal = 0;
    f.materiales.forEach(m => {
      if (m.materialId && m.gramos > 0) {
        const mat = materials.find(x => x.id === m.materialId);
        costoMateriales += (Number(m.gramos) || 0) * (mat ? calcCostoPorGramo(mat) : 0);
        gramosTotal += Number(m.gramos) || 0;
      }
    });
    const costoLuz = (Number(f.tiempoImpresion) || 0) * config.costLuzMin;
    const costoDesgaste = (Number(f.tiempoImpresion) || 0) * config.costDesgasteMin;
    const costoTrabajo = ((Number(f.tiempoDiseno) || 0) / 60) * config.precioHoraTrabajo;
    const costoReal = costoMateriales + costoLuz + costoDesgaste + costoTrabajo + (Number(f.extras) || 0);
    const precioSugerido = config.margenMinimo < 1 ? costoReal / (1 - config.margenMinimo) : costoReal * 2;
    return { costoMateriales, gramosTotal, costoLuz, costoDesgaste, costoTrabajo, costoReal, precioSugerido };
  }, [f, materials, config]);

  function submit(e) {
    e.preventDefault();
    const mats = f.materiales.filter(m => m.materialId && m.gramos > 0).map(m => ({ materialId: m.materialId, gramos: Number(m.gramos) }));
    onSave({ ...f, tiempoImpresion: Number(f.tiempoImpresion), tiempoDiseno: Number(f.tiempoDiseno), extras: Number(f.extras), materiales: mats });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>ID</label><input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} /></div>
        <div><label className={lbl}>Fecha</label><input type="date" className={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
        <div className="col-span-2"><label className={lbl}>Descripción / Nombre del trabajo</label><input className={inp} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Figura personalizada cliente..." /></div>
      </div>

      <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Materiales (hasta 4)</p>
        {f.materiales.map((m, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div>
              <label className={lbl}>ID Material {i + 1}</label>
              <input className={inp} value={m.materialId} onChange={e => setMat(i, 'materialId', e.target.value.toUpperCase())} placeholder="M002" />
            </div>
            <div>
              <label className={lbl}>Gramos</label>
              <input type="number" step="0.01" min="0" className={inp} value={m.gramos} onChange={e => setMat(i, 'gramos', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Material</label>
              <input className={ro} readOnly value={materials.find(x => x.id === m.materialId)?.nombre || ''} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Tiempo impresión (min)</label>
          <input type="number" step="1" min="0" className={inp} value={f.tiempoImpresion} onChange={e => set('tiempoImpresion', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Tiempo diseño (min)</label>
          <input type="number" step="1" min="0" className={inp} value={f.tiempoDiseno} onChange={e => set('tiempoDiseno', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Extras ($)</label>
          <input type="number" step="0.01" min="0" className={inp} value={f.extras} onChange={e => set('extras', e.target.value)} />
        </div>
      </div>

      {/* Big result box */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-[#96d629]/30 rounded-xl p-5 space-y-3">
        <p className="font-bold text-[#96d629] text-sm uppercase tracking-wider">Cotización calculada</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between"><span>Gramos total:</span><span className="text-zinc-700">{fmtN(calcs.gramosTotal, 2)}g</span></div>
            <div className="flex justify-between"><span>Costo materiales:</span><span className="text-zinc-700">{fmt(calcs.costoMateriales)}</span></div>
            <div className="flex justify-between"><span>Costo luz:</span><span className="text-zinc-700">{fmt(calcs.costoLuz)}</span></div>
            <div className="flex justify-between"><span>Costo desgaste:</span><span className="text-zinc-700">{fmt(calcs.costoDesgaste)}</span></div>
            <div className="flex justify-between"><span>Costo diseño/trabajo:</span><span className="text-zinc-700">{fmt(calcs.costoTrabajo)}</span></div>
            <div className="flex justify-between"><span>Extras:</span><span className="text-zinc-700">{fmt(Number(f.extras))}</span></div>
          </div>
          <div className="flex flex-col justify-center items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Costo real</p>
              <p className="text-2xl font-bold text-red-400">{fmt(calcs.costoReal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Precio sugerido ({(config.margenMinimo * 100).toFixed(0)}% margen)</p>
              <p className="text-3xl font-black text-[#96d629]">{fmt(calcs.precioSugerido)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar Cotización</button>
      </div>
    </form>
  );
}

export default function Cotizaciones() {
  const { quotes, setQuotes, materials, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = quotes.filter(q =>
    [q.id, q.descripcion].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (quotes.find(q => q.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setQuotes([...quotes, data]);
    } else {
      setQuotes(quotes.map(q => q.id === f.id ? data : q));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setQuotes(quotes.filter(q => q.id !== id));
  }

  function calcQuote(q) {
    let costoMateriales = 0;
    (q.materiales || []).forEach(m => {
      const mat = materials.find(x => x.id === m.materialId);
      costoMateriales += (m.gramos || 0) * (mat ? calcCostoPorGramo(mat) : 0);
    });
    const costoLuz = (q.tiempoImpresion || 0) * config.costLuzMin;
    const costoDesgaste = (q.tiempoImpresion || 0) * config.costDesgasteMin;
    const costoTrabajo = ((q.tiempoDiseno || 0) / 60) * config.precioHoraTrabajo;
    const costoReal = costoMateriales + costoLuz + costoDesgaste + costoTrabajo + (q.extras || 0);
    const precioSugerido = config.margenMinimo < 1 ? costoReal / (1 - config.margenMinimo) : costoReal * 2;
    return { costoReal, precioSugerido };
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Cotizaciones</h1>
          <p className="text-zinc-500 text-sm">Calcula costo real y precio sugerido</p>
        </div>
        <button onClick={() => setEditing(emptyForm(quotes))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nueva Cotización
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Fecha', 'Descripción', 'T.Impresión', 'T.Diseño', 'Costo Real', 'Precio Sug.', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(q => {
                const { costoReal, precioSugerido } = calcQuote(q);
                return (
                  <tr key={q.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#96d629]">{q.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{q.fecha}</td>
                    <td className="py-3 px-4 text-zinc-800 max-w-xs truncate">{q.descripcion || '—'}</td>
                    <td className="py-3 px-4 text-zinc-600">{fmtTime(q.tiempoImpresion)}</td>
                    <td className="py-3 px-4 text-zinc-600">{fmtTime(q.tiempoDiseno)}</td>
                    <td className="py-3 px-4 text-red-400 font-semibold">{fmt(costoReal)}</td>
                    <td className="py-3 px-4 text-[#96d629] font-bold text-base">{fmt(precioSugerido)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...q, materiales: (q.materiales || []).map(m => ({ ...m })), _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(q.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Sin cotizaciones</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nueva Cotización' : `Editar ${editing.id}`} onClose={() => setEditing(null)} wide>
          <CotizacionForm data={editing} materials={materials} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

