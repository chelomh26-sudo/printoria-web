import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { getSemaphore } from '../store/utils';

const inp = 'bg-zinc-100 border border-zinc-300 rounded px-2 py-1 text-zinc-800 text-xs focus:border-[#96d629] focus:outline-none w-full';

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];

function autoEstado(totalHechas, cantTotal, estadoActual) {
  // No sobreescribir si ya fue entregado o cancelado manualmente
  if (estadoActual === 'CANCELADO') return estadoActual;
  if (totalHechas <= 0) return 'PENDIENTE';
  if (totalHechas < cantTotal) return 'EN PROCESO';
  return 'TERMINADO'; // completo pero no entregado todavía
}

export default function Proceso() {
  const { proceso, setProceso, sales, wholesale, multiSales, products, multiProducts, materials, clients } = usePrintoria();
  const [filter, setFilter] = useState('ACTIVOS');

  const allOrders = useMemo(() => {
    const orders = [];

    sales.forEach(s => {
      const prod = products.find(p => p.id === s.productoId);
      const mat = materials.find(m => m.id === s.materialId);
      const cli = clients.find(c => c.id === s.clienteId);
      const proc = proceso.find(p => p.orderId === s.id) || { hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: s.estado };
      orders.push({ orderId: s.id, tipo: 'VENTAS', soloBAMBU: false, fuente: s, cliente: cli?.nombre || s.clienteId, producto: prod?.nombre || s.productoId, material: mat?.nombre || s.materialId, impresora: s.impresora, cantTotal: s.cantidad, proc });
    });

    wholesale.forEach(w => {
      const prod = products.find(p => p.id === w.productoId);
      const mat = materials.find(m => m.id === w.materialId);
      const cli = clients.find(c => c.id === w.clienteId);
      const proc = proceso.find(p => p.orderId === w.id) || { hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: w.estado };
      orders.push({ orderId: w.id, tipo: 'MAYOREO', soloBAMBU: false, fuente: w, cliente: cli?.nombre || w.clienteId, producto: prod?.nombre || w.productoId, material: mat?.nombre || w.materialId, impresora: w.impresora, cantTotal: w.cantidad, proc });
    });

    multiSales.forEach(s => {
      const prod = multiProducts.find(p => p.id === s.productoId);
      const cli = clients.find(c => c.id === s.clienteId);
      const proc = proceso.find(p => p.orderId === s.id) || { hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: s.estado };
      orders.push({ orderId: s.id, tipo: 'MULTI', soloBAMBU: true, fuente: s, cliente: cli?.nombre || s.clienteId, producto: prod?.nombre || s.productoId, material: 'Multi', impresora: 'Bambu', cantTotal: s.cantidad, proc });
    });

    return orders;
  }, [proceso, sales, wholesale, multiSales, products, multiProducts, materials, clients]);

  const filteredOrders = useMemo(() => {
    if (filter === 'ACTIVOS') return allOrders.filter(o => !['ENTREGADO', 'CANCELADO'].includes(o.proc.estado));
    if (filter === 'ENTREGADOS') return allOrders.filter(o => o.proc.estado === 'ENTREGADO');
    return allOrders;
  }, [allOrders, filter]);

  function updateProc(orderId, key, value) {
    const order = allOrders.find(o => o.orderId === orderId);
    const cantTotal = order?.cantTotal || 0;
    const existing = proceso.find(p => p.orderId === orderId) || { hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: 'PENDIENTE' };

    const updates = { [key]: value };

    // Auto-estado cuando cambian las piezas hechas
    if (key === 'hechasBambu' || key === 'hechasEnder') {
      const bambu = key === 'hechasBambu' ? Number(value) : Number(existing.hechasBambu || 0);
      const ender = key === 'hechasEnder' ? Number(value) : Number(existing.hechasEnder || 0);
      updates.estado = autoEstado(bambu + ender, cantTotal, existing.estado);
    }

    if (proceso.find(p => p.orderId === orderId)) {
      setProceso(proceso.map(p => p.orderId === orderId ? { ...p, ...updates } : p));
    } else {
      const tipo = order?.tipo === 'MAYOREO' ? 'mayoreo' : order?.tipo === 'MULTI' ? 'ventaMulti' : 'venta';
      setProceso([...proceso, { orderId, tipo, hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: 'PENDIENTE', ...updates }]);
    }
  }

  const counts = useMemo(() => ({
    activos: allOrders.filter(o => !['ENTREGADO', 'CANCELADO'].includes(o.proc.estado)).length,
    pendientes: allOrders.filter(o => o.proc.estado === 'PENDIENTE').length,
    sinPago: allOrders.filter(o => !o.proc.pagado && !['ENTREGADO', 'CANCELADO'].includes(o.proc.estado)).length,
  }), [allOrders]);

  const ESTADO_COLOR = {
    PENDIENTE: 'bg-yellow-400/15 text-yellow-300',
    'EN PROCESO': 'bg-blue-400/15 text-blue-300',
    TERMINADO: 'bg-green-400/15 text-green-300',
    ENTREGADO: 'bg-zinc-200 text-zinc-600',
    CANCELADO: 'bg-red-400/15 text-red-300',
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Proceso Activo</h1>
        <p className="text-zinc-500 text-sm">Tracking de todos los pedidos · Estado automático al registrar piezas</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">PEDIDOS ACTIVOS</p>
          <p className="text-2xl font-bold text-[#96d629]">{counts.activos}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-500">PENDIENTES</p>
          <p className="text-2xl font-bold text-yellow-400">{counts.pendientes}</p>
        </div>
        <div className="bg-white border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500">SIN PAGO</p>
          <p className="text-2xl font-bold text-red-400">{counts.sinPago}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['ACTIVOS', 'ENTREGADOS', 'TODOS'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f ? 'bg-[#96d629] text-black' : 'bg-white text-zinc-400 hover:text-zinc-800 border border-zinc-200'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Tipo', 'Cliente', 'Producto', 'Impr', 'Total', 'Bambu✅', 'Ender✅', 'Hechas', 'Faltan', '%', 'Estado', 'Fecha Entrega', 'Sem', 'Recogido', 'Pagado'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map(o => {
                const p = o.proc;
                const hechasBambu = Number(p.hechasBambu) || 0;
                const hechasEnder = Number(p.hechasEnder) || 0;
                const totalHechas = hechasBambu + (o.soloBAMBU ? 0 : hechasEnder);
                const faltan = Math.max(0, o.cantTotal - totalHechas);
                const pct = o.cantTotal > 0 ? Math.min(100, Math.round((totalHechas / o.cantTotal) * 100)) : 0;
                const semaforo = getSemaphore(p.fechaEntrega, p.estado);

                return (
                  <tr key={o.orderId} className="hover:bg-zinc-100/30 transition-colors">
                    <td className="py-2 px-2 font-mono text-[#96d629] text-xs">{o.orderId}</td>
                    <td className="py-2 px-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        o.tipo === 'MAYOREO' ? 'bg-purple-400/15 text-purple-300' :
                        o.tipo === 'MULTI' ? 'bg-orange-400/15 text-orange-300' :
                        'bg-blue-400/15 text-blue-300'
                      }`}>{o.tipo}</span>
                    </td>
                    <td className="py-2 px-2 text-zinc-600 text-xs max-w-[90px] truncate">{o.cliente}</td>
                    <td className="py-2 px-2 text-zinc-800 text-xs font-medium max-w-[100px] truncate">{o.producto}</td>
                    <td className="py-2 px-2 text-zinc-400 text-xs">{o.impresora}</td>
                    <td className="py-2 px-2 text-zinc-800 font-bold text-xs">{o.cantTotal}</td>

                    {/* Bambu hechas */}
                    <td className="py-2 px-2">
                      <input type="number" min="0" max={o.cantTotal} className={inp} style={{ width: '52px' }}
                        value={hechasBambu}
                        onChange={e => updateProc(o.orderId, 'hechasBambu', Number(e.target.value))} />
                    </td>

                    {/* Ender hechas — oculto para multimaterial (solo Bambu) */}
                    <td className="py-2 px-2">
                      {o.soloBAMBU ? (
                        <span className="text-xs text-zinc-600 px-2">—</span>
                      ) : (
                        <input type="number" min="0" max={o.cantTotal} className={inp} style={{ width: '52px' }}
                          value={hechasEnder}
                          onChange={e => updateProc(o.orderId, 'hechasEnder', Number(e.target.value))} />
                      )}
                    </td>

                    <td className="py-2 px-2 font-bold text-zinc-800 text-xs">{totalHechas}</td>
                    <td className={`py-2 px-2 font-bold text-xs ${faltan > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{faltan}</td>

                    {/* Barra de progreso */}
                    <td className="py-2 px-2 min-w-[80px]">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 bg-zinc-100 rounded-full h-2 min-w-[40px]">
                          <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-[#96d629]'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-zinc-400 flex-shrink-0">{pct}%</span>
                      </div>
                    </td>

                    {/* Estado — auto-calculado, pero editable manualmente */}
                    <td className="py-2 px-2">
                      <select className={`${inp} ${ESTADO_COLOR[p.estado] || ''}`} style={{ width: '115px' }}
                        value={p.estado || 'PENDIENTE'}
                        onChange={e => updateProc(o.orderId, 'estado', e.target.value)}>
                        {ESTADOS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>

                    {/* Fecha entrega */}
                    <td className="py-2 px-2">
                      <input type="date" className={inp} style={{ width: '130px' }} value={p.fechaEntrega || ''}
                        onChange={e => updateProc(o.orderId, 'fechaEntrega', e.target.value)} />
                    </td>

                    {/* Semáforo */}
                    <td className="py-2 px-2 text-center">
                      {semaforo
                        ? <span title={semaforo.label} className="text-lg cursor-default">{semaforo.emoji}</span>
                        : <span className="text-green-400 text-xs font-bold">✓</span>}
                    </td>

                    {/* Recogido / Entregado */}
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => updateProc(o.orderId, 'entregado', !p.entregado)}
                        className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                          p.entregado
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}>
                        {p.entregado ? '✓ SÍ' : '✗ NO'}
                      </button>
                    </td>

                    {/* Pagado */}
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => updateProc(o.orderId, 'pagado', !p.pagado)}
                        className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                          p.pagado
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}>
                        {p.pagado ? '✓ SÍ' : '✗ NO'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={16} className="py-10 text-center text-zinc-500">Sin pedidos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

