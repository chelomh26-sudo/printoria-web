import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { calcSaleCosts, calcCostoPorGramo, getNextId, fmt, fmtN, fmtTime, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];
const IMPRESORAS = ['Bambu', 'Ender'];

function emptyForm(sales) {
  return { id: getNextId(sales, 'V'), fecha: TODAY(), clienteId: '', cantidad: 1, productoId: '', materialId: '', impresora: 'Bambu', extras: 0, addonsIncluidos: [], estado: 'PENDIENTE', _new: true };
}

function VentaForm({ data, products, materials, clients, config, addons, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const producto = products.find(p => p.id === f.productoId);
  const material = materials.find(m => m.id === f.materialId);
  const cliente = clients.find(c => c.id === f.clienteId);
  const calcs = useMemo(() => calcSaleCosts(f, producto, material, config), [f, producto, material, config]);

  const addonsIncluidos = f.addonsIncluidos || [];
  const addonTotal = addonsIncluidos.reduce((sum, id) => {
    const a = (addons || []).find(x => x.id === id);
    return sum + (a ? a.precioExtra * (Number(f.cantidad) || 1) : 0);
  }, 0);
  const precioPedidoConAddons = (calcs?.precioPedido || 0) + addonTotal;
  const gananciaConAddons = precioPedidoConAddons - (calcs?.costoTotal || 0);
  const margenConAddons = precioPedidoConAddons > 0 ? gananciaConAddons / precioPedidoConAddons : 0;

  function toggleAddon(id) {
    const curr = f.addonsIncluidos || [];
    set('addonsIncluidos', curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]);
  }

  function submit(e) {
    e.preventDefault();
    if (!f.productoId) return alert('Ingresa ID de producto');
    if (!f.materialId) return alert('Ingresa ID de material');
    onSave({ ...f, cantidad: Number(f.cantidad), extras: Number(f.extras) });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Header fields */}
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

      {/* Cliente ID → auto-fill */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>ID Cliente</label>
          <input className={inp} value={f.clienteId} onChange={e => set('clienteId', e.target.value.toUpperCase())} placeholder="C001" />
        </div>
        <div>
          <label className={lbl}>Cliente (auto)</label>
          <input className={ro} readOnly value={cliente ? cliente.nombre : f.clienteId ? '⚠ No encontrado' : ''} />
        </div>
      </div>

      {/* Producto ID → auto-fill */}
      <div className="bg-zinc-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producto</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>ID Producto *</label>
            <input className={inp} value={f.productoId} onChange={e => set('productoId', e.target.value.toUpperCase())} placeholder="P001" />
          </div>
          <div>
            <label className={lbl}>Nombre (auto)</label>
            <input className={ro} readOnly value={producto ? producto.nombre : f.productoId ? '⚠ No encontrado' : ''} />
          </div>
          <div>
            <label className={lbl}>Cantidad</label>
            <input type="number" min="1" className={inp} value={f.cantidad} onChange={e => set('cantidad', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Impresora</label>
            <select className={inp} value={f.impresora} onChange={e => set('impresora', e.target.value)}>
              {IMPRESORAS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        {producto && (
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 bg-white rounded p-2">
            <span>Gramos/pieza: <b className="text-zinc-700">{fmtN(producto.gramos, 2)}g</b></span>
            <span>Tiempo Ender: <b className="text-zinc-700">{fmtTime(producto.tiempoEnder)}</b></span>
            <span>Tiempo Bambu: <b className="text-zinc-700">{fmtTime(producto.tiempoBambu)}</b></span>
          </div>
        )}
      </div>

      {/* Material ID → auto-fill */}
      <div className="bg-zinc-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Material</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>ID Material *</label>
            <input className={inp} value={f.materialId} onChange={e => set('materialId', e.target.value.toUpperCase())} placeholder="M002" />
          </div>
          <div>
            <label className={lbl}>Material (auto)</label>
            <input className={ro} readOnly value={material ? `${material.nombre} ${material.marca}` : f.materialId ? '⚠ No encontrado' : ''} />
          </div>
        </div>
        {material && (
          <p className="text-xs text-zinc-400">Costo/g: <b className="text-zinc-700">${fmtN(calcCostoPorGramo(material), 4)}</b></p>
        )}
      </div>

      {/* Add-ons opcionales */}
      {addons && addons.length > 0 && (
        <div className="bg-zinc-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Add-ons / Accesorios opcionales</p>
          <div className="space-y-1.5">
            {addons.map(a => {
              const checked = addonsIncluidos.includes(a.id);
              const sinStock = a.stock <= 0 && !checked;
              return (
                <label key={a.id} className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 border transition-colors ${checked ? 'border-[#96d629] bg-[#96d629]/8' : 'border-zinc-200 bg-white hover:border-zinc-300'} ${sinStock ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={sinStock}
                    onChange={() => toggleAddon(a.id)}
                    className="accent-[#96d629]"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-zinc-800">{a.nombre}</span>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">+${a.precioExtra?.toFixed(2)} c/u</span>
                      <span className={`${a.stock <= 0 ? 'text-red-400' : a.stock < 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                        stock: {a.stock}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          {addonTotal > 0 && (
            <p className="text-xs text-right text-zinc-500">
              Subtotal add-ons: <span className="font-bold text-zinc-700">${addonTotal.toFixed(2)}</span>
              {Number(f.cantidad) > 1 && <span className="text-zinc-400"> ({Number(f.cantidad)} pzas × add-ons)</span>}
            </p>
          )}
        </div>
      )}

      {/* Extras */}
      <div>
        <label className={lbl}>Extras / costos adicionales ($)</label>
        <input type="number" step="0.01" min="0" className={inp} value={f.extras} onChange={e => set('extras', e.target.value)} />
      </div>

      {/* Calculated costs */}
      {calcs && (
        <div className="bg-zinc-100/30 border border-zinc-300 rounded-xl p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <p className="col-span-2 font-bold text-zinc-600 mb-1 uppercase tracking-wider">Costos calculados</p>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between"><span>Gramos total:</span><span className="text-zinc-700">{fmtN(calcs.gramosTotal, 2)}g</span></div>
            <div className="flex justify-between"><span>Tiempo total:</span><span className="text-zinc-700">{fmtTime(calcs.tiempoTotal)}</span></div>
            <div className="flex justify-between"><span>Costo luz:</span><span className="text-zinc-700">{fmt(calcs.costoLuz)}</span></div>
            <div className="flex justify-between"><span>Costo desgaste:</span><span className="text-zinc-700">{fmt(calcs.costoDesgaste)}</span></div>
            <div className="flex justify-between"><span>Costo material:</span><span className="text-zinc-700">{fmt(calcs.costoMaterial)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1"><span className="font-semibold">Costo total:</span><span className="text-red-400 font-bold">{fmt(calcs.costoTotal)}</span></div>
          </div>
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex justify-between"><span>Precio unitario:</span><span className="text-zinc-700">{fmt(calcs.precioUnitario)}</span></div>
            <div className="flex justify-between"><span>Precio pedido:</span><span className="text-zinc-700">{fmt(calcs.precioPedido)}</span></div>
            {addonTotal > 0 && (
              <div className="flex justify-between"><span>Add-ons total:</span><span className="text-[#96d629] font-medium">+{fmt(addonTotal)}</span></div>
            )}
            <div className="flex justify-between border-t border-zinc-300 pt-1 mt-1"><span className="font-semibold">Total c/add-ons:</span><span className="text-zinc-800 font-bold">{fmt(precioPedidoConAddons)}</span></div>
            <div className="flex justify-between"><span className="font-semibold">Ganancia:</span><span className={`font-bold ${gananciaConAddons >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(gananciaConAddons)}</span></div>
            <div className="flex justify-between"><span>Margen:</span>
              <span className={`font-bold ${margenConAddons >= config.margenMinimo ? 'text-green-400' : 'text-yellow-400'}`}>
                {(margenConAddons * 100).toFixed(1)}% {margenConAddons < config.margenMinimo ? '⚠️' : '✓'}
              </span>
            </div>
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

export default function Ventas() {
  const { sales, setSales, proceso, setProceso, products, materials, clients, config, stock, setStock, addons, setAddons } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => sales.map(s => ({
    ...s,
    _cliente: clients.find(c => c.id === s.clienteId),
    _producto: products.find(p => p.id === s.productoId),
    _material: materials.find(m => m.id === s.materialId),
    get _calcs() { return calcSaleCosts(s, this._producto, this._material, config); },
  })), [sales, clients, products, materials, config]);

  const filtered = rows.filter(r =>
    [r.id, r._cliente?.nombre, r._producto?.nombre, r._material?.nombre, r.estado].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (sales.find(s => s.id === f.id)) return alert(`ID ${f.id} ya existe`);
      // Verificar stock disponible para este producto
      const stockEntry = stock.find(s => s.productoId === f.productoId && s.cantidad > 0);
      if (stockEntry) {
        const usar = window.confirm(
          `📦 Hay ${stockEntry.cantidad} pieza(s) de este producto en stock.\n\n¿Usar ${Math.min(f.cantidad || 1, stockEntry.cantidad)} pieza(s) del stock para esta venta?\n\n(Aceptar = descontar del stock · Cancelar = marcar como nueva producción)`
        );
        if (usar) {
          const descontar = Math.min(f.cantidad || 1, stockEntry.cantidad);
          setStock(stock.map(s =>
            s.id === stockEntry.id ? { ...s, cantidad: s.cantidad - descontar } : s
          ).filter(s => s.cantidad > 0));
        }
      }
      // Descontar stock de add-ons seleccionados
      if ((data.addonsIncluidos || []).length > 0 && addons.length > 0) {
        const qty = data.cantidad || 1;
        setAddons(addons.map(a =>
          (data.addonsIncluidos || []).includes(a.id)
            ? { ...a, stock: Math.max(0, a.stock - qty) }
            : a
        ));
      }
      setSales([...sales, data]);
      if (!proceso.find(p => p.orderId === f.id)) {
        setProceso([...proceso, { orderId: f.id, tipo: 'venta', hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, estado: 'PENDIENTE' }]);
      }
    } else {
      setSales(sales.map(s => s.id === f.id ? data : s));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar venta ${id}?`)) {
      setSales(sales.filter(s => s.id !== id));
      setProceso(proceso.filter(p => p.orderId !== id));
    }
  }

  const totales = useMemo(() => {
    let ingresos = 0, costos = 0, ganancia = 0;
    rows.forEach(r => { if (r._calcs) { ingresos += r._calcs.precioPedido; costos += r._calcs.costoTotal; ganancia += r._calcs.ganancia; } });
    return { ingresos, costos, ganancia };
  }, [rows]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Ventas Simples</h1>
          <p className="text-zinc-500 text-sm">{sales.length} ventas</p>
        </div>
        <button onClick={() => setEditing(emptyForm(sales))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nueva Venta
        </button>
      </div>

      {/* Totals bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">INGRESOS</p>
          <p className="text-xl font-bold text-zinc-800">{fmt(totales.ingresos)}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">COSTOS</p>
     