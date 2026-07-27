import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { getNextId, fmt } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

const TIPOS = ['Básico', 'Tornasol'];
const ESTADOS = ['Disponible', 'Poco', 'Acabado'];
const ESTADO_STYLE = {
  Disponible: 'bg-green-100 text-green-700 border border-green-300',
  Poco:       'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Acabado:    'bg-red-100 text-red-700 border border-red-300',
};
const ESTADO_EMOJI = { Disponible: '🟢', Poco: '🟡', Acabado: '🔴' };

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
  if (n.includes('gris') || n.includes('gray') || n.includes('grey') || n.includes('plata')) return '#9CA3AF';
  if (n.includes('tornasol') || n.includes('rainbow') || n.includes('silk')) return null;
  return null;
}

function normalize(m) {
  return {
    tipo: m.tipo || (String(m.nombre || '').toLowerCase().includes('tornasol') ? 'Tornasol' : 'Básico'),
    estado: m.estado || 'Disponible',
    tienda: m.tienda || '',
    link: m.link || '',
    ...m,
  };
}

function empty(mats) {
  return { id: getNextId(mats, 'M'), nombre: '', marca: '', tipo: 'Básico', estado: 'Disponible', tienda: '', link: '', precioRollo: 0, rollos: 1, pesoInicial: 1000, _new: true };
}

function MaterialForm({ data, existingTipos = [], onSave, onCancel }) {
  const BASE = ['Básico', 'Tornasol'];
  const [f, setF] = useState({ ...data });
  const [customMode, setCustomMode] = useState(!!f.tipo && !BASE.includes(f.tipo));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function submit(e) {
    e.preventDefault();
    if (!f.id.trim()) return alert('ID requerido');
    if (!f.tipo || !f.tipo.trim()) return alert('Elige o escribe el tipo');
    onSave({ ...f, tipo: f.tipo.trim(), precioRollo: Number(f.precioRollo) || 0 });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ID *</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} placeholder="M011" />
        </div>
        <div>
          <label className={lbl}>Marca</label>
          <input className={inp} value={f.marca} onChange={e => set('marca', e.target.value.toUpperCase())} placeholder="SUNLU" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Nombre / Color</label>
          <input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} placeholder="PLA NEGRO" />
        </div>
        <div>
          <label className={lbl}>Tipo</label>
          <select className={inp} value={customMode ? '__otro__' : f.tipo}
            onChange={e => { if (e.target.value === '__otro__') { setCustomMode(true); set('tipo', ''); } else { setCustomMode(false); set('tipo', e.target.value); } }}>
            {[...new Set(['Básico', 'Tornasol', ...existingTipos])].map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__otro__">Otro / especial…</option>
          </select>
          {customMode && (
            <input className={`${inp} mt-2`} value={f.tipo} onChange={e => set('tipo', e.target.value)} placeholder="Nombre del tipo (ej. TPU, PETG)" />
          )}
          {customMode && <p className="text-[11px] text-zinc-400 mt-1">Especial: usa su propio precio de abajo (no el precio base).</p>}
        </div>
        <div>
          <label className={lbl}>Estado</label>
          <select className={inp} value={f.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Precio por rollo ($)</label>
          <input type="number" min="0" step="0.01" className={inp} value={f.precioRollo} onChange={e => set('precioRollo', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Tienda (dónde lo compras)</label>
          <input className={inp} value={f.tienda} onChange={e => set('tienda', e.target.value)} placeholder="Amazon / Mercado Libre" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Link para volver a pedir</label>
          <input className={inp} value={f.link} onChange={e => set('link', e.target.value)} placeholder="https://..." />
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
  const { materials, setMaterials, config, setConfig } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => materials.map(normalize), [materials]);
  const existingTipos = useMemo(() => [...new Set(materials.map(m => (m.tipo || '')).filter(t => t && !['Básico', 'Tornasol'].includes(t)))], [materials]);
  const filtered = rows.filter(r =>
    [r.id, r.nombre, r.marca, r.tipo, r.estado].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (materials.find(m => m.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setMaterials([...materials, data]);
    } else {
      setMaterials(materials.map(m => m.id === f.id ? { ...m, ...data } : m));
    }
    setEditing(null);
  }

  function cycleEstado(m) {
    const next = ESTADOS[(ESTADOS.indexOf(m.estado || 'Disponible') + 1) % ESTADOS.length];
    setMaterials(materials.map(x => x.id === m.id ? { ...x, estado: next } : x));
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setMaterials(materials.filter(m => m.id !== id));
  }

  const basePrice = (tipo) => tipo === 'Tornasol' ? (config.precioBaseTornasol ?? 0) : tipo === 'Básico' ? (config.precioBaseBasico ?? 0) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Materiales</h1>
          <p className="text-zinc-500 text-sm">{materials.length} materiales · Toca el estado para cambiarlo</p>
        </div>
        <button onClick={() => setEditing(empty(materials))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo Material
        </button>
      </div>

      {/* Precios base por tipo */}
      <div className="grid grid-cols-2 gap-3">
        {TIPOS.map(t => (
          <div key={t} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Precio base {t}</p>
              <p className="text-[11px] text-zinc-400">$ por rollo (referencia)</p>
            </div>
            <div className="flex items-center gap-1 text-zinc-800 font-bold">
              <span>$</span>
              <input type="number" min="0" step="1"
                className="w-24 bg-zinc-100 border border-zinc-300 rounded-lg px-2 py-1 text-right focus:border-[#96d629] focus:outline-none"
                value={basePrice(t)}
                onChange={e => setConfig({ ...config, [t === 'Tornasol' ? 'precioBaseTornasol' : 'precioBaseBasico']: Number(e.target.value) || 0 })} />
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de estado */}
      <div className="grid grid-cols-3 gap-3">
        {ESTADOS.map(s => {
          const count = rows.filter(r => r.estado === s).length;
          return (
            <div key={s} className={`rounded-xl p-4 ${ESTADO_STYLE[s]}`}>
              <p className="text-3xl font-black">{count}</p>
              <p className="text-sm font-bold mt-1">{ESTADO_EMOJI[s]} {s}</p>
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
                {['Color / Nombre', 'Marca', 'Tipo', 'Precio', 'Estado', 'Tienda', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(m => {
                const c = getMaterialColor(m.nombre);
                return (
                  <tr key={m.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {c && <div className="w-4 h-4 rounded-full flex-shrink-0 border border-zinc-200" style={{ backgroundColor: c }} />}
                        {m.tipo === 'Tornasol' && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg,#ff6fae,#ffd24a,#22c55e,#4a90e2)' }} />}
                        <span className="font-semibold text-zinc-800">{m.nombre || <span className="text-zinc-400 italic">vacío</span>}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{m.marca || '—'}</td>
                    <td className="py-3 px-4 text-zinc-600">{m.tipo}</td>
                    <td className="py-3 px-4 text-zinc-600">{m.precioRollo ? fmt(m.precioRollo) : (['Básico', 'Tornasol'].includes(m.tipo) ? <span className="text-zinc-400">base {fmt(basePrice(m.tipo))}</span> : '—')}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => cycleEstado(m)} title="Toca para cambiar"
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${ESTADO_STYLE[m.estado]}`}>
                        {ESTADO_EMOJI[m.estado]} {m.estado}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {m.link
                        ? <a href={m.link} target="_blank" rel="noreferrer" className="text-[#5b8a1a] font-semibold hover:underline">{m.tienda || 'Pedir'} ↗</a>
                        : (m.tienda || '—')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...m })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(m.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Sin materiales</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Material' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <MaterialForm data={editing} existingTipos={existingTipos} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
