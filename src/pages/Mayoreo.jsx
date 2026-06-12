import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, getNextId, fmt, fmtN, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];

function emptyForm(ws) {
  return { id: getNextId(ws, 'MM'), fecha: TODAY(), clienteId: '', productoId: '', materialId: '', impresora: 'Bambu', cantidad: 1, precioUnitario: 0, descuento: 0, estado: 'PENDIENTE', _new: true };
}

function MayoreoForm({ data, products, materials, clients, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const producto = products.find(p => p.id === f.productoId);
  const material = materials.find(m => m.id === f.materialId);
  const cliente = clients.find(c => c.id === f.clienteId);

  const calcs = useMemo(() => {
    if (!producto) return null;
    const tiempo = f.impresora === 'Bambu' ? producto.tiempoBambu : producto.tiempoEnder;
    const tiempoTotal = tiempo * (f.cantidad || 1);
    const gramosTotal = producto.gramos * (f.cantidad || 1);
    const cpg = material ? calcCostoPorGramo(material) : 0;
    const costoLuz = tiempoTotal * config.costLuzMin;
    const costoDesgaste = tiempoTotal * config.costDesgasteMin;
    const costoMaterial = gramosTotal * cpg;
    const costoProduccion = costoLuz + costoDesgaste + costoMaterial;
    const precioConDesc = (Number(f.precioUnitario) || 0) - (Number(f.descuento) || 0);
    const total = precioConDesc * (f.cantidad || 1);
    const ganancia = total - costoProduccion;
    return { tiempoTotal, gramosTotal, costoLuz, costoDesgaste, costoMaterial, costoProduccion, precioConDesc, total, ganancia };
  }, [f, producto, material, config]);

  function submit(e) {
    e.preventDefault();
    if (!f.productoId) return alert('ID producto requerido');
    if (!f.materialId) return alert('ID material requerido');
    onSave({ ...f, cantidad: Number(f.cantidad), precioUnitario: Number(f.precioUnitario), descuento: Number(f.descuento) });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>ID Cliente</label>
          <input className={inp} value={f.clienteId} onChange={e => set('clienteId', e.target.value.toUpperCase())} placeholder="C001" />
        </div>
        <div>
          <label className={lbl}>Cliente (auto)</label>
          <input className={ro} readOnly value={cliente?.nombre || (f.clienteId ? '⚠ No encontrado' : '')} />
        </div>
      </div>

      <div className="bg-zinc-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producto · Material · Impresora</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>ID Producto *</label>
            <input className={inp} value={f.productoId} onChange={e => set('productoId', e.target.value.toUpperCase())} placeholder="P001" />
          </div>
          <div>
            <label className={lbl}>Producto (auto)</label>
            <input className={ro} readOnly value={producto?.nombre || (f.productoId ? '⚠ No encontrado' : '')} />
          </div>
          <div>
            <label className={lbl}>ID Material *</label>
            <input className={inp} value={f.materialId} onChange={e => set('materialId', e.target.value.toUpperCase())} placeholder="M002" />
          </div>
          <div>
            <label className={lbl}>Material (auto)</label>
            <input className={ro} readOnly value={material ? `${material.nombre} ${material.marca}` : (f.materialId ? '⚠ No encontrado' : '')} />
          </div>
          <div>
            <label className={lbl}>Cantidad piezas</label>
            <input type="number" min="1" className={inp} value={f.cantidad} onChange={e => set('cantidad', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Impresora</label>
            <select className={inp} value={f.impresora} onChange={e => set('impresora', e.target.value)}>
              <option>Bambu</option><option>Ender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-zinc-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Precios</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lbl}>Precio unitario ($)</label>
            <input type="number" step="0.01" min="0" className={inp} value={f.precioUnitario} onChange={e => set('precioUnitario', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Descuento por pieza ($)</label>
            <input type="number" step="0.01" min="0" className={inp} value={f.descuento} onChange={e => set('descuento', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Precio c/desc (auto)</label>
            <input className={ro} readOnly value={calcs ? fmt(calcs.precioConDesc) : '—'} />
          </div>
        </div>
      </div>

      {/* Calcs */}
      {calcs && (
        <div className="bg-zinc-100/30 border border-zinc-300 rounded-xl p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <p className="col-span-2 font-bold text-zinc-600 mb-1 uppercase tracking-wider">Resumen</p>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between"><span>Gramos:</span><span className="text-zinc-700">{fmtN(calcs.gramosTotal, 1)}g</span></div>
            <div className="flex justify-between"><span>Tiempo:</span><span className="text-zinc-700">{fmtTime(calcs.tiempoTotal)}</span></div>
            <div className="flex justify-between"><span>Costo producción:</span><span className="text-red-400 font-bold">{fmt(calcs.costoProduccion)}</span></div>
          </div>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between"><span>Precio c/desc × {f.cantidad}:</span><span className="text-zinc-700">{fmt(calcs.total)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1"><span className="font-semibold">Ganancia:</span><span className={`font-bold ${calcs.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(calcs.ganancia)}</span></div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

const ESTADO_COLOR = { PENDIENTE: 'bg-yellow-400/15 text-yellow-300', 'EN PROCESO': 'bg-blue-400/15 text-blue-300', TERMINADO: 'bg-green-400/15 text-green-300', ENTREGADO: 'bg-zinc-200 text-zinc-600', CANCELADO: 'bg-red-400/15 text-red-300' };

export default function Mayoreo() {
  const { wholesale, setWholesale, proceso, setProceso, products, materials, clients, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => wholesale.map(w => {
    const producto = products.find(p => p.id === w.productoId);
    const material = materials.find(m => m.id === w.materialId);
    const cliente = clients.find(c => c.id === w.clienteId);
    if (!producto) return { ...w, _cliente: cliente, _producto: null, _material: material, _calcs: null };
    const tiempo = w.impresora === 'Bambu' ? producto.tiempoBambu : producto.tiempoEnder;
    const tiempoTotal = tiempo * (w.cantidad || 1);
    const gramosTotal = producto.gramos * (w.cantidad || 1);
    const cpg = material ? calcCostoPorGramo(material) : 0;
    const costoProduccion = tiempoTotal * (config.costLuzMin + config.costDesgasteMin) + gramosTotal * cpg;
    const precioConDesc = (w.precioUnitario || 0) - (w.descuento || 0);
    const total = precioConDesc * (w.cantidad || 1);
    const ganancia = total - costoProduccion;
    return { ...w, _cliente: cliente, _producto: producto, _material: material, _calcs: { tiempoTotal, gramosTotal, costoProduccion, precioConDesc, total, ganancia } };
  }), [wholesale, products, materials, clients, config]);

  const filtered = rows.filter(r =>
    [r.id, r._cliente?.nombre, r._producto?.nombre].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (wholesale.find(w => w.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setWholesale([...wholesale, data]);
      if (!proceso.find(p => p.orderId === f.id)) {
        setProceso([...proceso, { orderId: f.id, tipo: 'mayoreo', hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, estado: 'PENDIENTE' }]);
      }
    } else {
      setWholesale(wholesale.map(w => w.id === f.id ? data : w));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) {
      setWholesale(wholesale.filter(w => w.id !== id));
      setProceso(proceso.filter(p => p.orderId !== id));
    }
  }

  const totales = useMemo(() => {
    let total = 0, ganancia = 0;
    rows.forEach(r => { if (r._calcs) { total += r._calcs.total; ganancia += r._calcs.ganancia; } });
    return { total, ganancia };
  }, [rows]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Mayoreo</h1>
          <p className="text-zinc-500 text-sm">{wholesale.length} pedidos · con descuento por pieza</p>
        </div>
        <button onClick={() => setEditing(emptyForm(wholesale))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo Mayoreo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">TOTAL INGRESOS</p>
          <p className="text-xl font-bold text-zinc-800">{fmt(totales.total)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">GANANCIA</p>
          <p className={`text-xl font-bold ${totales.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(totales.ganancia)}</p>
        </div>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Fecha', 'Cliente', 'Producto', 'Material', 'Cant', 'P.Unit', 'Desc', 'P.c/Desc', 'Total', 'Ganancia', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-zinc-100/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-[#96d629]">{r.id}</td>
                  <td className="py-3 px-3 text-zinc-400">{r.fecha}</td>
                  <td className="py-3 px-3 text-zinc-600">{r._cliente?.nombre || r.clienteId}</td>
                  <td className="py-3 px-3 font-medium text-zinc-800">{r._producto?.nombre || r.productoId}</td>
                  <td className="py-3 px-3 text-zinc-400">{r._material?.nombre || r.materialId}</td>
                  <td className="py-3 px-3 text-zinc-600">{r.cantidad}</td>
                  <td className="py-3 px-3 text-zinc-600">{fmt(r.precioUnitario)}</td>
                  <td className="py-3 px-3 text-red-400">-{fmt(r.descuento)}</td>
                  <td className="py-3 px-3 font-semibold text-zinc-800">{r._calcs ? fmt(r._calcs.precioConDesc) : '—'}</td>
                  <td className="py-3 px-3 font-bold text-zinc-800">{r._calcs ? fmt(r._calcs.total) : '—'}</td>
                  <td className={`py-3 px-3 font-semibold ${r._calcs?.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r._calcs ? fmt(r._calcs.ganancia) : '—'}</td>
                  <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[r.estado] || 'bg-zinc-100 text-zinc-600'}`}>{r.estado}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...r, _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-2 py-1.5 rounded text-xs">✏️</button>
                      <button onClick={() => del(r.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={13} className="py-10 text-center text-zinc-500">Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Mayoreo' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <MayoreoForm data={editing} products={products} materials={materials} clients={clients} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

