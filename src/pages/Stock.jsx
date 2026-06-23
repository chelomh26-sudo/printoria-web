import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { calcCostoPorGramo, fmt, fmtN, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro  = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const UBICACIONES = [
  { value: 'casa',         label: '\u{1F3E0} Mi casa',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'tienda_cubos', label: '\u{1F3EA} Tienda Cubos', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

function getNextId(arr) {
  if (!arr.length) return 'SK001';
  const nums = arr.map(s => parseInt(s.id?.replace('SK', '') || '0')).filter(n => !isNaN(n));
  return 'SK' + String((Math.max(0, ...nums) + 1)).padStart(3, '0');
}

function emptyForm(stock) {
  return { id: getNextId(stock), fechaProduccion: TODAY(), productoId: '', materialId: '', cantidad: 1, ubicacion: 'casa' };
}

export default function Stock() {
  const { stock, setStock, products, materials } = usePrintoria();
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('todas');
  const [form, setForm]         = useState(() => emptyForm(stock));
  const [isNew, setIsNew]       = useState(true);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const producto   = products.find(p => p.id === form.productoId);
  const material   = materials.find(m => m.id === form.materialId);
  const cantidad   = parseInt(form.cantidad) || 1;
  const gramosAuto = producto ? (producto.gramos || 0) * cantidad : 0;
  const cpg        = material ? calcCostoPorGramo(material) : 0;
  const costoTotal = cpg * gramosAuto;

  const rows = useMemo(() =>
    stock.map(s => ({
      ...s,
      _producto: products.find(p => p.id === s.productoId),
      _material: materials.find(m => m.id === s.materialId),
    }))
  , [stock, products, materials]);

  const filtered = rows.filter(r => {
    const matchSearch = [r.id, r._producto?.nombre, r._material?.nombre].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchUbicacion = filterUbicacion === 'todas' || (r.ubicacion || 'casa') === filterUbicacion;
    return matchSearch && matchUbicacion;
  });

  const top3 = useMemo(() =>
    [...rows].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0)).slice(0, 3)
  , [rows]);

  const totalCasa  = rows.filter(r => !r.ubicacion || r.ubicacion === 'casa').reduce((s, x) => s + (x.cantidad || 0), 0);
  const totalCubos = rows.filter(r => r.ubicacion === 'tienda_cubos').reduce((s, x) => s + (x.cantidad || 0), 0);

  function openNew() {
    setForm(emptyForm(stock));
    setIsNew(true);
    setEditing('form');
  }

  function openEdit(s) {
    setForm({ ...s });
    setIsNew(false);
    setEditing('form');
  }

  function save(e) {
    e.preventDefault();
    if (!form.productoId) return alert('Ingresa ID de producto');
    if (!form.materialId) return alert('Ingresa ID de material');
    if (!form.cantidad || parseInt(form.cantidad) <= 0) return alert('Ingresa cantidad');
    const data = { ...form, cantidad: parseInt(form.cantidad), gramosUsados: gramosAuto, ubicacion: form.ubicacion || 'casa' };
    if (isNew) {
      if (stock.find(s => s.id === form.id)) return alert('ID ' + form.id + ' ya existe');
      setStock([...stock, data]);
    } else {
      setStock(stock.map(s => s.id === form.id ? data : s));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm('Eliminar entrada de stock ' + id + '?')) {
      setStock(stock.filter(s => s.id !== id));
    }
  }

  if (editing === 'form') {
    return (
      <div className="p-5 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="text-zinc-400 hover:text-zinc-700 text-lg">{'<-'}</button>
          <h1 className="text-xl font-black text-zinc-800">{isNew ? 'Agregar al Stock' : 'Editar Stock ' + form.id}</h1>
        </div>
        <form onSubmit={save} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>ID</label>
              <input className={inp} value={form.id} disabled={!isNew} onChange={e => set('id', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={lbl}>Fecha de produccion</label>
              <input type="date" className={inp} value={form.fechaProduccion} onChange={e => set('fechaProduccion', e.target.value)} />
            </div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Donde esta este stock?</p>
            <div className="grid grid-cols-2 gap-3">
              {UBICACIONES.map(u => (
                <button key={u.value} type="button" onClick={() => set('ubicacion', u.value)}
                  className={'py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ' + (form.ubicacion === u.value ? 'border-[#96d629] bg-[#f0fdf4] text-[#4a7c00] shadow-sm scale-[1.02]' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300')}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Producto</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>ID Producto *</label>
                <input className={inp} value={form.productoId} onChange={e => set('productoId', e.target.value.toUpperCase())} placeholder="P001" />
              </div>
              <div>
                <label className={lbl}>Nombre (auto)</label>
                <input className={ro} readOnly value={producto ? producto.nombre : form.productoId ? 'No encontrado' : ''} />
              </div>
            </div>
            <div>
              <label className={lbl}>Cantidad producida *</label>
              <input type="number" min="1" className={inp} value={form.cantidad} onChange={e => set('cantidad', e.target.value)} />
            </div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Material usado</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>ID Material *</label>
                <input className={inp} value={form.materialId} onChange={e => set('materialId', e.target.value.toUpperCase())} placeholder="M001" />
              </div>
              <div>
                <label className={lbl}>Material (auto)</label>
                <input className={ro} readOnly value={material ? material.nombre + ' ' + material.marca : form.materialId ? 'No encontrado' : ''} />
              </div>
            </div>
            {producto && (
              <div className="bg-white rounded-lg p-3 text-xs text-zinc-500 space-y-1">
                <div className="flex justify-between"><span>Gramos/pieza:</span><span className="font-bold text-zinc-700">{fmtN(producto.gramos || 0, 2)}g</span></div>
                <div className="flex justify-between"><span>Gramos total lote ({cantidad} pzas):</span><span className="font-bold text-zinc-700">{fmtN(gramosAuto, 2)}g</span></div>
                {material && (<>
                  <div className="flex justify-between"><span>Costo/g:</span><span className="font-bold text-zinc-700">{fmtN(cpg, 4){'}'}</span></div>
                  <div className="flex justify-between border-t border-zinc-100 pt-1"><span className="font-semibold">Costo total lote:</span><span className="font-bold text-[#96d629]">{fmt(costoTotal)}</span></div>
                </>)}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
            <button type="button" onClick={() => setEditing(null)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-2 rounded-lg text-sm font-medium">Cancelar</button>
            <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
          </div>
        </form>
      </div>
    );
  }

  const totalPiezas = stock.reduce((s, x) => s + (x.cantidad || 0), 0);

  return (
    <div className="p-5 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-800">Stock</h1>
          <p className="text-sm text-zinc-500 font-medium">{stock.length} entradas <span className="font-bold" style={{ color: '#96d629' }}>{totalPiezas} piezas totales</span></p>
        </div>
        <button onClick={openNew} className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-xl text-sm shadow-sm transition-all active:scale-95">+ Agregar</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-blue-700">{totalCasa}</p>
          <p className="text-xs font-bold text-blue-500 mt-0.5">Mi casa</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-purple-700">{totalCubos}</p>
          <p className="text-xs font-bold text-purple-500 mt-0.5">Tienda Cubos</p>
        </div>
      </div>
      {top3.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3">Mayor stock disponible</p>
          <div className="grid grid-cols-3 gap-3">
            {top3.map((s, i) => {
              const ubic = UBICACIONES.find(u => u.value === (s.ubicacion || 'casa'));
              return (
                <div key={s.id} className="rounded-xl p-3 text-center"
                  style={{ background: i === 0 ? '#f0fdf4' : i === 1 ? '#eff6ff' : '#fefce8', border: '1px solid', borderColor: i === 0 ? '#bbf7d0' : i === 1 ? '#bfdbfe' : '#fde68a' }}>
                  <p className="text-2xl font-black" style={{ color: i === 0 ? '#15803d' : i === 1 ? '#1d4ed8' : '#92400e' }}>{s.cantidad}</p>
                  <p className="text-xs font-bold text-zinc-600 truncate mt-0.5">{s._producto?.nombre || s.productoId}</p>
                  <p className="text-xs text-zinc-400">{ubic?.label || 'Mi casa'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <input className={inp + ' flex-1 min-w-[180px]'} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto, material o ID..." />
        <select className="bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-700 text-sm focus:border-[#96d629] focus:outline-none" value={filterUbicacion} onChange={e => setFilterUbicacion(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="casa">Mi casa</option>
          <option value="tienda_cubos">Tienda Cubos</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-4xl mb-3">stock</p>
          <p className="font-semibold">No hay stock registrado</p>
          <p className="text-sm">Agrega piezas terminadas con el boton de arriba</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {filtered.map(s => {
              const cpg_ = s._material ? calcCostoPorGramo(s._material) : 0;
              const costo = cpg_ * (s.gramosUsados || 0);
              const ubic = UBICACIONES.find(u => u.value === (s.ubicacion || 'casa'));
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 flex-shrink-0">{s.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-800 truncate">{s._producto?.nombre || s.productoId}</p>
                      <span className={'text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ' + (ubic?.color || 'bg-blue-50 text-blue-700 border-blue-200')}>{ubic?.label || 'Mi casa'}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{s._material ? s._material.nombre + ' ' + s._material.marca : s.materialId}{s.gramosUsados ? ' - ' + fmtN(s.gramosUsados, 1) + 'g' : ''}{' - '}{s.fechaProduccion}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="text-xl font-black" style={{ color: '#96d629' }}>{s.cantidad}</p>
                    <p className="text-xs text-zinc-400">pzas</p>
                  </div>
                  {costo > 0 && (
                    <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
                      <p className="text-sm font-bold text-zinc-600">{fmt(costo)}</p>
                      <p className="text-xs text-zinc-400">costo</p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(s)} className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 rounded-lg font-medium">editar</button>
                    <button onClick={() => del(s.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2 py-1 rounded-lg font-medium">borrar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
