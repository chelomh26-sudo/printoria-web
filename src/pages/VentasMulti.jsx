import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcCostoPorGramo, getNextId, fmt, fmtN, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];

const emptyMats = () => [{ materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }, { materialId: '', gramos: 0 }];

function emptyForm(ms) {
  return { id: getNextId(ms, 'VM'), fecha: TODAY(), clienteId: '', productoId: '', cantidad: 1, materiales: emptyMats(), extras: 0, estado: 'PENDIENTE', _new: true };
}

function VMForm({ data, multiProducts, materials, clients, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data, materiales: data.materiales ? data.materiales.map(m => ({ ...m })) : emptyMats() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setMat = (i, k, v) => setF(p => { const mats = [...p.materiales]; mats[i] = { ...mats[i], [k]: v }; return { ...p, materiales: mats }; });

  const producto = multiProducts.find(p => p.id === f.productoId);
  const cliente = clients.find(c => c.id === f.clienteId);

  const calcs = useMemo(() => {
    if (!producto) return null;
    const tiempoTotal = producto.tiempoBambu * (f.cantidad || 1);
    let costoMateriales = 0, gramosTotal = 0;
    f.materiales.forEach(m => {
      if (m.materialId && m.gramos > 0) {
        const mat = materials.find(x => x.id === m.materialId);
        const g = m.gramos * (f.cantidad || 1);
        costoMateriales += g * (mat ? calcCostoPorGramo(mat) : 0);
        gramosTotal += g;
      }
    });
    const costoLuz = tiempoTotal * config.costLuzMin;
    const costoDesgaste = tiempoTotal * config.costDesgasteMin;
    const costoTotal = costoLuz + costoDesgaste + costoMateriales + (Number(f.extras) || 0);
    const precioPedido = producto.precioVenta * (f.cantidad || 1);
    const ganancia = precioPedido - costoTotal;
    return { tiempoTotal, gramosTotal, costoLuz, costoDesgaste, costoMateriales, costoTotal, precioPedido, ganancia, margen: precioPedido > 0 ? ganancia / precioPedido : 0 };
  }, [f, producto, materials, config]);

  function submit(e) {
    e.preventDefault();
    if (!f.productoId) return alert('ID producto requerido');
    const mats = f.materiales.filter(m => m.materialId && m.gramos > 0).map(m => ({ materialId: m.materialId, gramos: Number(m.gramos) }));
    if (!mats.length) return alert('Ingresa al menos un material con gramos');
    onSave({ ...f, cantidad: Number(f.cantidad), extras: Number(f.extras), materiales: mats });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>ID</label><input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} /></div>
        <div><label className={lbl}>Fecha</label><input type="date" className={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
        <div><label className={lbl}>Estado</label><select className={inp} value={f.estado} onChange={e => set('estado', e.target.value)}>{ESTADOS.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>ID Cliente</label><input className={inp} value={f.clienteId} onChange={e => set('clienteId', e.target.value.toUpperCase())} placeholder="C001" /></div>
        <div><label className={lbl}>Cliente (auto)</label><input className={ro} readOnly value={cliente?.nombre || (f.clienteId ? '⚠ No encontrado' : '')} /></div>
      </div>

      <div className="bg-zinc-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producto Multi *</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lbl}>ID Producto Multi</label><input className={inp} value={f.productoId} onChange={e => set('productoId', e.target.value.toUpperCase())} placeholder="PM001" /></div>
          <div><label className={lbl}>Producto (auto)</label><input className={ro} readOnly value={producto?.nombre || (f.productoId ? '⚠ No encontrado' : '')} /></div>
          <div><label className={lbl}>Cantidad</label><input type="number" min="1" className={inp} value={f.cantidad} onChange={e => set('cantidad', e.target.value)} /></div>
        </div>
        {producto?.slots?.length > 0 && (
          <div className="text-xs text-zinc-500 bg-white rounded p-2">
            Slots: {producto.slots.filter(s => s.label).map(s => `${s.label}: ${s.gramos}g`).join(' · ')}
          </div>
        )}
      </div>

      <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Materiales usados (hasta 4)</p>
        {f.materiales.map((m, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div>
              <label className={lbl}>ID Material {i + 1}</label>
              <input className={inp} value={m.materialId} onChange={e => setMat(i, 'materialId', e.target.value.toUpperCase())} placeholder="M002" />
            </div>
            <div>
              <label className={lbl}>Gramos/pieza</label>
              <input type="number" step="0.01" min="0" className={inp} value={m.gramos} onChange={e => setMat(i, 'gramos', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Material</label>
              <input className={ro} readOnly value={materials.find(x => x.id === m.materialId)?.nombre || ''} />
            </div>
          </div>
        ))}
      </div>

      <div><label className={lbl}>Extras ($)</label><input type="number" step="0.01" min="0" className={inp} value={f.extras} onChange={e => set('extras', e.target.value)} /></div>

      {calcs && (
        <div className="bg-zinc-100/30 border border-zinc-300 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
          <p className="col-span-2 font-bold text-zinc-600 uppercase tracking-wider">Costos</p>
          <div className="space-y-1 text-zinc-400">
            <div className="flex justify-between"><span>Gramos:</span><span className="text-zinc-700">{fmtN(calcs.gramosTotal, 2)}g</span></div>
            <div className="flex justify-between"><span>Tiempo:</span><span className="text-zinc-700">{fmtTime(calcs.tiempoTotal)}</span></div>
            <div className="flex justify-between"><span>Costo materiales:</span><span className="text-zinc-700">{fmt(calcs.costoMateriales)}</span></div>
            <div className="flex justify-between"><span>Luz + Desgaste:</span><span className="text-zinc-700">{fmt(calcs.costoLuz + calcs.costoDesgaste)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1"><span className="font-bold">Costo total:</span><span className="text-red-400 font-bold">{fmt(calcs.costoTotal)}</span></div>
          </div>
          <div className="space-y-1 text-zinc-400">
            <div className="flex justify-between"><span>Precio pedido:</span><span className="text-zinc-700">{fmt(calcs.precioPedido)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1"><span className="font-bold">Ganancia:</span><span className={`font-bold ${calcs.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(calcs.ganancia)}</span></div>
            <div className="flex justify-between"><span>Margen:</span><span className={calcs.margen >= config.margenMinimo ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>{(calcs.margen * 100).toFixed(1)}%</span></div>
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

export default function VentasMulti() {
  const { multiSales, setMultiSales, proceso, setProceso, multiProducts, materials, clients, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = multiSales.filter(s =>
    [s.id, clients.find(c => c.id === s.clienteId)?.nombre, multiProducts.find(p => p.id === s.productoId)?.nombre].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (multiSales.find(s => s.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setMultiSales([...multiSales, data]);
      if (!proceso.find(p => p.orderId === f.id)) {
        setProceso([...proceso, { orderId: f.id, tipo: 'ventaMulti', hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, estado: 'PENDIENTE' }]);
      }
    } else {
      setMultiSales(multiSales.map(s => s.id === f.id ? data : s));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) {
      setMultiSales(multiSales.filter(s => s.id !== id));
      setProceso(proceso.filter(p => p.orderId !== id));
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Ventas Multimaterial</h1>
          <p className="text-zinc-500 text-sm">{multiSales.length} ventas · Solo Bambu</p>
        </div>
        <button onClick={() => setEditing(emptyForm(multiSales))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nueva Venta Multi
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Fecha', 'Cliente', 'Producto', 'Cant', 'Materiales', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(s => {
                const prod = multiProducts.find(p => p.id === s.productoId);
                const cli = clients.find(c => c.id === s.clienteId);
                const matsStr = (s.materiales || []).map(m => materials.find(x => x.id === m.materialId)?.nombre || m.materialId).filter(Boolean).join(', ');
                return (
                  <tr key={s.id} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#96d629]">{s.id}</td>
                    <td className="py-3 px-4 text-zinc-400">{s.fecha}</td>
                    <td className="py-3 px-4 text-zinc-600">{cli?.nombre || s.clienteId}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800">{prod?.nombre || s.productoId}</td>
                    <td className="py-3 px-4 text-zinc-600">{s.cantidad}</td>
                    <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{matsStr}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-zinc-600">{s.estado}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing({ ...s, materiales: (s.materiales || []).map(m => ({ ...m })), _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white px-2 py-1.5 rounded text-xs">✏️</button>
                        <button onClick={() => del(s.id)} className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1.5 rounded text-xs">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Sin ventas multimaterial</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nueva Venta Multi' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <VMForm data={editing} multiProducts={multiProducts} materials={materials} clients={clients} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

