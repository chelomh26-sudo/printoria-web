import { useMemo, useState } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { calcConsumedGrams, getMaterialStatus, getSemaphore, fmtN } from '../store/utils';

/* ── Color de material por nombre ── */
const COLOR_KEYWORDS = {
  amarillo: '#FACC15', gris: '#9CA3AF', rojo: '#EF4444', azul: '#3B82F6',
  verde: '#22C55E', blanco: '#F9FAFB', negro: '#374151', naranja: '#F97316',
  morado: '#A855F7', rosa: '#EC4899', cafe: '#92400E', marron: '#92400E',
  transparente: '#CBD5E1', natural: '#D4B896', cyan: '#06B6D4',
};
function getMaterialColor(nombre) {
  const n = (nombre || '').toLowerCase();
  for (const [k, v] of Object.entries(COLOR_KEYWORDS)) {
    if (n.includes(k)) return v;
  }
  return '#96d629';
}

/* ── Card base ── */
function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm border border-zinc-200 ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, accent = '#96d629', icon }) {
  return (
    <Card className="p-5 flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <p className="text-xs font-black text-zinc-600 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-2xl font-black" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs font-semibold text-zinc-500">{sub}</p>}
    </Card>
  );
}

/* ── Barra de progreso ── */
function Bar({ pct, color = '#96d629', bg = '#e1e0e0' }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: bg }}>
      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

/* ── Sección header ── */
function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: '#96d629' }} />
        <p className="text-base font-black text-zinc-900 tracking-tight">{title}</p>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-bold transition-colors px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
          {action} →
        </button>
      )}
    </div>
  );
}

/* ── Estado pill ── */
function Pill({ label }) {
  const MAP = {
    'EN PROCESO': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'TERMINADO':  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'PENDIENTE':  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
    'SIN PAGO':   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  };
  const s = MAP[label] || MAP['PENDIENTE'];
  return (
    <span className="text-xs font-black px-3 py-1 rounded-full border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {label}
    </span>
  );
}

export default function Dashboard({ navigate }) {
  const {
    sales: allSales, wholesale: allWholesale, multiSales: allMultiSales,
    products, multiProducts, materials, clients, failures, personal, proceso, selectedMonth, stock,
  } = usePrintoria();

  const [alertasOpen, setAlertasOpen] = useState(false);

  function filterByMonth(items) {
    if (selectedMonth === 'all') return items;
    return items.filter(i => (i.fecha || '').startsWith(selectedMonth));
  }
  const sales = filterByMonth(allSales);
  const wholesale = filterByMonth(allWholesale);
  const multiSales = filterByMonth(allMultiSales);
  const ctx = { sales, products, multiSales, wholesale, personal, failures };
  const totalPedidos = sales.length + wholesale.length + multiSales.length;

  const periodoLabel = selectedMonth === 'all' ? 'Todo el historial' : (() => {
    const [y, m] = selectedMonth.split('-');
    const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${names[parseInt(m) - 1]} ${y}`;
  })();


  /* ── Materiales ── */
  const materialStats = useMemo(() =>
    materials.map(m => {
      const consumed = calcConsumedGrams(m.id, ctx);
      const restante = Math.max(0, (m.pesoInicial || 0) - consumed);
      const status = getMaterialStatus(restante);
      const pct = m.pesoInicial > 0 ? (restante / m.pesoInicial) * 100 : 0;
      return { ...m, consumed, restante, status, pct };
    })
  , [materials, ctx]);

  /* ── Alertas ── */
  const alertas = useMemo(() => {
    const list = [];
    materialStats.filter(m => m.nombre).forEach(m => {
      if (m.status.label === 'AGOTADO') list.push({ tipo: 'error', msg: `⛔ ${m.nombre} (${m.id}): AGOTADO` });
      else if (m.status.label === 'PEDIR') list.push({ tipo: 'warn', msg: `⚠️ ${m.nombre} (${m.id}): solo ${fmtN(m.restante, 1)}g restantes` });
    });
    return list;
  }, [materialStats]);

  /* ── Proceso ── */
  const procesoStats = useMemo(() => {
    const activos = proceso.filter(p => p.estado !== 'CANCELADO');
    return {
      total: activos.length,
      pendientes: activos.filter(p => p.estado === 'PENDIENTE').length,
      enProceso: activos.filter(p => p.estado === 'EN PROCESO').length,
      terminados: activos.filter(p => p.estado === 'TERMINADO').length,
      sinPago: activos.filter(p => !p.pagado).length,
    };
  }, [proceso]);

  /* ── Pedidos activos ── */
  const pedidosActivos = useMemo(() => {
    return proceso
      .filter(p => p.estado !== 'CANCELADO')
      .slice(0, 5)
      .map(o => {
        const prod = products.find(x => x.id === o.productoId) || multiProducts.find(x => x.id === o.productoId);
        const cliente = clients.find(x => x.id === o.clienteId);
        const hechas = (o.hechasBambu || 0) + (o.hechasEnder || 0);
        const pct = o.cantidad > 0 ? Math.round((hechas / o.cantidad) * 100) : 0;
        return { ...o, producto: prod?.nombre || o.productoId, cliente: cliente?.nombre || 'Sin cliente', hechas, pct, sem: getSemaphore?.(o) };
      });
  }, [proceso, products, multiProducts, clients]);

  /* ── Top productos (por unidades vendidas) ── */
  const topProducts = useMemo(() => {
    const map = {};
    [...sales, ...wholesale, ...multiSales].forEach(s => {
      const pid = s.productoId;
      const p = products.find(x => x.id === pid) || multiProducts.find(x => x.id === pid);
      if (!p) return;
      if (!map[pid]) map[pid] = { nombre: p.nombre, unidades: 0 };
      map[pid].unidades += s.cantidad || 1;
    });
    return Object.values(map).sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  }, [sales, wholesale, multiSales, products, multiProducts]);

  const maxUnidades = topProducts[0]?.unidades || 1;

  return (
    <div className="p-5 space-y-6 max-w-6xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-800">Dashboard</h1>
          <p className="text-sm font-semibold text-zinc-600">Resumen operativo · <span style={{ color: '#78b01e' }} className="font-black">{periodoLabel}</span> · <span className="text-zinc-500">{totalPedidos} pedidos</span></p>
        </div>

        {/* Badge alertas */}
        {alertas.length > 0 && (
          <button
            onClick={() => setAlertasOpen(true)}
            className="relative flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-sm shadow-sm transition-all active:scale-95"
            style={{ background: '#fff', border: '1.5px solid #fca5a5', color: '#b91c1c' }}
          >
            🔔 Alertas
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-black text-white flex items-center justify-center" style={{ background: '#ef4444' }}>
              {alertas.length}
            </span>
          </button>
        )}
      </div>

      {/* ── PROCESO ── */}
      <section>
        <SectionHeader title="Proceso" action="Ver detalle" onAction={() => navigate?.('proceso')} />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Activos', value: procesoStats.total, color: '#374151', bg: '#f9fafb' },
            { label: 'Pendientes', value: procesoStats.pendientes, color: '#a16207', bg: '#fefce8' },
            { label: 'En Proceso', value: procesoStats.enProceso, color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Terminados', value: procesoStats.terminados, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Sin Pago', value: procesoStats.sinPago, color: '#b91c1c', bg: '#fff1f2' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border border-zinc-200" style={{ background: s.bg }}>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pedidos activos */}
        {pedidosActivos.length > 0 && (
          <Card className="mt-3 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {pedidosActivos.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{o.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{o.producto}</p>
                    <p className="text-xs font-semibold text-zinc-600">{o.cliente} · {o.cantidad} pzas</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 hidden sm:block">
                      <Bar pct={o.pct} />
                      <p className="text-xs font-bold text-zinc-600 text-center mt-0.5">{o.hechas}/{o.cantidad}</p>
                    </div>
                    <Pill label={o.estado} />
                    {!o.pagado && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">$</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* ── MATERIALES ── */}
      <section>
        <SectionHeader title="Materiales" action="Ver todo" onAction={() => navigate?.('materiales')} />

        {/* Resumen stock */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'OK', count: materialStats.filter(m => m.nombre && m.status.label === 'OK').length, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Pedir pronto', count: materialStats.filter(m => m.nombre && m.status.label === 'PEDIR').length, color: '#a16207', bg: '#fefce8' },
            { label: 'Agotado', count: materialStats.filter(m => m.nombre && m.status.label === 'AGOTADO').length, color: '#b91c1c', bg: '#fff1f2' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border border-zinc-200" style={{ background: s.bg }}>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {materialStats.filter(m => m.nombre).map(m => {
              const matColor = getMaterialColor(m.nombre);
              const isLight = ['#F9FAFB', '#FFFFFF', '#CBD5E1', '#D4B896'].includes(matColor);
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  {/* Chip color */}
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ background: matColor, border: isLight ? '1.5px solid #d1d5db' : 'none' }}
                    title={m.nombre}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-zinc-900 truncate">{m.nombre} <span className="text-zinc-500 font-semibold text-xs">{m.marca}</span></p>
                      <span className={`text-xs font-bold ml-2 flex-shrink-0 ${
                        m.status.label === 'OK' ? 'text-green-600' :
                        m.status.label === 'PEDIR' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{fmtN(m.restante, 0)}g</span>
                    </div>
                    <Bar pct={m.pct} color={matColor !== '#96d629' ? matColor : '#96d629'} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* ── TOP PRODUCTOS ── */}
      {topProducts.length > 0 && (
        <section>
          <SectionHeader title="Top Productos" />
          <Card className="overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-sm font-black text-zinc-300 w-5 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-700 truncate">{p.nombre}</p>
                    <div className="mt-1">
                      <Bar pct={(p.unidades / maxUnidades) * 100} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black" style={{ color: '#96d629' }}>{p.unidades}</p>
                    <p className="text-xs text-zinc-400">pzas</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ── STOCK ── */}
      {stock && stock.length > 0 && (() => {
        const enriched = stock
          .map(s => ({ ...s, _prod: products.find(p => p.id === s.productoId) }))
          .sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))
          .slice(0, 3);
        return (
          <section>
            <SectionHeader title="Stock disponible" action="Ver stock" onAction={() => navigate?.('stock')} />
            <div className="grid grid-cols-3 gap-3">
              {enriched.map((s, i) => (
                <div key={s.id} className="rounded-2xl p-4 text-center border border-zinc-200 bg-white">
                  <p className="text-3xl font-black" style={{ color: '#96d629' }}>{s.cantidad}</p>
                  <p className="text-xs font-semibold text-zinc-700 mt-1 truncate">{s._prod?.nombre || s.productoId}</p>
                  <p className="text-xs text-zinc-400">piezas</p>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ── FALLAS ── */}
      {failures.length > 0 && (
        <section>
          <SectionHeader title="Fallas" action="Ver fallas" onAction={() => navigate?.('fallas')} />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total fallas" value={failures.length} icon="❌" accent="#dc2626" />
            <KpiCard label="Gramos perdidos" value={`${fmtN(failures.reduce((a, f) => a + (f.gramosPerdidos || 0), 0), 1)}g`} icon="⚖️" accent="#dc2626" />
          </div>
        </section>
      )}

      {/* ── MODAL ALERTAS ── */}
      {alertasOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setAlertasOpen(false); }}
        >
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-zinc-800">🔔 Alertas de stock</h3>
              <button onClick={() => setAlertasOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xl">✕</button>
            </div>
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{
                    background: a.tipo === 'error' ? '#fff1f2' : '#fefce8',
                    border: `1px solid ${a.tipo === 'error' ? '#fca5a5' : '#fde68a'}`,
                    color: a.tipo === 'error' ? '#b91c1c' : '#a16207',
                  }}
                >
                  {a.msg}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setAlertasOpen(false); navigate?.('materiales'); }}
              className="w-full rounded-xl py-3 font-bold text-sm text-white transition-all"
              style={{ background: '#96d629' }}
            >
              Ir a Materiales
            </button>
          </Card>
        </div>
      )}

    </div>
  );
}
