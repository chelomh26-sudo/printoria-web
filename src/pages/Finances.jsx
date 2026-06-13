import { useState, useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { calcCostoPorGramo, calcSaleCosts, fmt, fmtN } from '../store/utils';

const CATEGORIAS = ['Impresoras', 'Herramientas', 'Materiales', 'Renta / Luz', 'Otros'];

const CAT_ICONS = {
  'Impresoras': '🖨️',
  'Herramientas': '🔧',
  'Materiales': '🧵',
  'Renta / Luz': '💡',
  'Otros': '📦',
};

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

function getNextGastoId(gastos) {
  if (!gastos.length) return 'G001';
  const nums = gastos.map(g => parseInt(g.id.replace('G', '')) || 0);
  return 'G' + String(Math.max(...nums) + 1).padStart(3, '0');
}

const FINANCES_PIN = '269609';

function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (pin === FINANCES_PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1200);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg p-8 w-full max-w-sm text-center space-y-5">
        <div className="text-5xl">🔒</div>
        <div>
          <h2 className="text-xl font-black text-zinc-800">Finances</h2>
          <p className="text-sm text-zinc-500 mt-1">Ingresa tu PIN para continuar</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            className={`w-full text-center text-2xl tracking-widest font-bold rounded-xl border px-4 py-3 focus:outline-none transition-all ${
              error
                ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                : 'border-zinc-300 bg-zinc-100 text-zinc-800 focus:border-[#96d629]'
            }`}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />
          {error && <p className="text-red-500 text-sm font-semibold">PIN incorrecto</p>}
          <button
            type="submit"
            className="w-full bg-[#96d629] hover:bg-[#78b01e] text-black font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Finances() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  return <FinancesContent />;
}

function FinancesContent() {
  const { gastos, setGastos, sales, wholesale, multiSales, products, multiProducts, materials, failures, config, selectedMonth, addons } = usePrintoria();

  const empty = { fecha: new Date().toISOString().slice(0, 10), categoria: 'Impresoras', descripcion: '', monto: '' };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filterCat, setFilterCat] = useState('all');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function filterByMonth(items) {
    if (selectedMonth === 'all') return items;
    return items.filter(i => (i.fecha || '').startsWith(selectedMonth));
  }

  // Ingresos del periodo (ventas + mayoreo + multiVentas)
  const ingresos = useMemo(() => {
    let total = 0;
    filterByMonth(sales).forEach(s => {
      const p = products.find(x => x.id === s.productoId);
      const m = materials.find(x => x.id === s.materialId);
      const c = calcSaleCosts(s, p, m, config);
      if (c) total += c.precioPedido;
    });
    filterByMonth(wholesale).forEach(w => {
      total += ((w.precioUnitario || 0) - (w.descuento || 0)) * (w.cantidad || 1);
    });
    filterByMonth(multiSales).forEach(s => {
      const p = multiProducts.find(x => x.id === s.productoId);
      if (p) total += p.precioVenta * (s.cantidad || 1);
    });
    return total;
  }, [sales, wholesale, multiSales, products, multiProducts, materials, config, selectedMonth]);

  // Costo de producción del periodo
  const costoProduccion = useMemo(() => {
    let total = 0;
    filterByMonth(sales).forEach(s => {
      const p = products.find(x => x.id === s.productoId);
      const m = materials.find(x => x.id === s.materialId);
      const c = calcSaleCosts(s, p, m, config);
      if (c) {
        total += c.costoMaterial + c.costoLuz + c.costoDesgaste;
        // Costo de add-ons incluidos en la venta
        (s.addonsIncluidos || []).forEach(aoId => {
          const ao = (addons || []).find(a => a.id === aoId);
          total += (ao?.costoUnitario || 0) * (s.cantidad || 1);
        });
      }
    });
    filterByMonth(wholesale).forEach(w => {
      const p = products.find(x => x.id === w.productoId);
      const m = materials.find(x => x.id === w.materialId);
      if (!p) return;
      const cpg = m ? calcCostoPorGramo(m) : 0;
      const tiempo = w.impresora === 'Bambu' ? p.tiempoBambu : p.tiempoEnder;
      total += p.gramos * (w.cantidad || 1) * cpg + tiempo * (w.cantidad || 1) * (config.costLuzMin + config.costDesgasteMin);
    });
    return total;
  }, [sales, wholesale, products, materials, config, addons, selectedMonth]);

  // Gastos registrados (todo el historial, no filtrado por mes ya que son inversiones)
  const gastosTotal = useMemo(() => gastos.reduce((s, g) => s + (parseFloat(g.monto) || 0), 0), [gastos]);
  const gastosPorCat = useMemo(() => {
    const map = {};
    CATEGORIAS.forEach(c => { map[c] = 0; });
    gastos.forEach(g => { map[g.categoria] = (map[g.categoria] || 0) + (parseFloat(g.monto) || 0); });
    return map;
  }, [gastos]);

  const gananciaBruta = ingresos - costoProduccion;
  const gananciaNeta = gananciaBruta - gastosTotal;

  function handleSave() {
    if (!form.descripcion.trim() || !form.monto) return;
    if (editId) {
      setGastos(gastos.map(g => g.id === editId ? { ...g, ...form, monto: parseFloat(form.monto) } : g));
      setEditId(null);
    } else {
      setGastos([...gastos, { id: getNextGastoId(gastos), ...form, monto: parseFloat(form.monto) }]);
    }
    setForm(empty);
  }

  function handleEdit(g) {
    setForm({ fecha: g.fecha, categoria: g.categoria, descripcion: g.descripcion, monto: String(g.monto) });
    setEditId(g.id);
  }

  function handleDelete(id) {
    setGastos(gastos.filter(g => g.id !== id));
    if (editId === id) { setEditId(null); setForm(empty); }
  }

  const gastosFiltered = filterCat === 'all' ? gastos : gastos.filter(g => g.categoria === filterCat);
  const maxCat = Math.max(...Object.values(gastosPorCat), 1);

  const periodoLabel = selectedMonth === 'all' ? 'todo el historial' : (() => {
    const [y, m] = selectedMonth.split('-');
    const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${names[parseInt(m) - 1]} ${y}`;
  })();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Finances</h1>
        <p className="text-zinc-500 text-sm">Inversiones, gastos y ganancia real · Periodo: <span className="text-[#96d629]">{periodoLabel}</span></p>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-green-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-2xl font-bold text-green-400">{fmt(ingresos)}</p>
          <p className="text-xs text-zinc-500 mt-1">Ventas del periodo</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Costo Producción</p>
          <p className="text-2xl font-bold text-zinc-800">{fmt(costoProduccion)}</p>
          <p className="text-xs text-zinc-500 mt-1">Materiales + operación</p>
        </div>
        <div className="bg-white border border-red-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Invertido</p>
          <p className="text-2xl font-bold text-red-400">{fmt(gastosTotal)}</p>
          <p className="text-xs text-zinc-500 mt-1">Impresoras, herramientas, etc.</p>
        </div>
        <div className={`bg-white border rounded-xl p-5 ${gananciaNeta >= 0 ? 'border-[#96d629]/30' : 'border-red-500/40'}`}>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Ganancia Real</p>
          <p className={`text-2xl font-bold ${gananciaNeta >= 0 ? 'text-[#96d629]' : 'text-red-400'}`}>{fmt(gananciaNeta)}</p>
          <p className="text-xs text-zinc-500 mt-1">Ingresos − producción − inversión</p>
        </div>
      </div>

      {/* Desglose por categoría */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Inversión por categoría</h2>
        <div className="space-y-3">
          {CATEGORIAS.map(cat => {
            const val = gastosPorCat[cat] || 0;
            const pct = Math.round((val / Math.max(gastosTotal, 1)) * 100);
            const barW = Math.round((val / maxCat) * 100);
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-lg w-6 flex-shrink-0">{CAT_ICONS[cat]}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-600">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{pct}%</span>
                      <span className="text-sm font-bold text-zinc-800">{fmt(val)}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 rounded-full h-2">
                    <div className="bg-[#96d629] h-2 rounded-full transition-all" style={{ width: `${barW}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-800">{editId ? '✏️ Editar gasto' : '+ Registrar inversión / gasto'}</h2>
          <div>
            <label className={lbl}>Fecha</label>
            <input type="date" className={inp} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Categoría</label>
            <select className={inp} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <input type="text" className={inp} placeholder="Ej: Bambu A1 Mini" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Monto ($)</label>
            <input type="number" step="0.01" min="0" className={inp} placeholder="0.00" value={form.monto} onChange={e => set('monto', e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave}
              disabled={!form.descripcion.trim() || !form.monto}
              className="flex-1 bg-[#96d629] hover:bg-[#78b01e] disabled:opacity-40 text-black font-bold py-2 rounded-lg text-sm transition-colors">
              {editId ? 'Actualizar' : 'Guardar'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(empty); }}
                className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-800">Historial de inversiones</h2>
            <select className="bg-zinc-100 border border-zinc-300 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:border-[#96d629] focus:outline-none"
              value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 sticky top-0 bg-white">
                <tr>
                  {['Fecha', 'Categoría', 'Descripción', 'Monto', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {gastosFiltered.slice().reverse().map(g => (
                  <tr key={g.id} className={`hover:bg-zinc-100/30 transition-colors ${editId === g.id ? 'bg-[#96d629]/5' : ''}`}>
                    <td className="py-2 px-3 text-zinc-400 text-xs whitespace-nowrap">{g.fecha}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs">{CAT_ICONS[g.categoria]} {g.categoria}</span>
                    </td>
                    <td className="py-2 px-3 text-zinc-800 text-xs">{g.descripcion}</td>
                    <td className="py-2 px-3 font-bold text-red-400 text-xs whitespace-nowrap">{fmt(g.monto)}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(g)} className="text-zinc-500 hover:text-[#96d629] text-xs transition-colors">✏️</button>
                        <button onClick={() => handleDelete(g.id)} className="text-zinc-500 hover:text-red-400 text-xs transition-colors">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gastosFiltered.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-zinc-600 text-sm">Sin gastos registrados aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {gastosFiltered.length > 0 && (
            <div className="border-t border-zinc-200 px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-zinc-5