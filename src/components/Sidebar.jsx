import { useMemo } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';

const GROUPS = [
  { label: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: '📊' }] },
  { label: null, items: [{ id: 'proceso', label: 'Proceso', icon: '🔄' }] },
  { label: null, items: [{ id: 'cola', label: 'Cola Impresion', icon: '🖨️' }] },
  { label: null, items: [{ id: 'finances', label: 'Finances 🔒', icon: '💵' }] },
  { label: null, items: [{ id: 'config', label: 'Configuracion', icon: '⚙️' }] },
  {
    label: 'CATALOGOS',
    items: [
      { id: 'materiales', label: 'Materiales', icon: '🧵' },
      { id: 'productos', label: 'Productos', icon: '📦' },
      { id: 'productosMulti', label: 'Prod. Multi', icon: '🎨' },
      { id: 'clientes', label: 'Clientes', icon: '👥' },
      { id: 'stock', label: 'Stock', icon: '📦' },
    ],
  },
  {
    label: 'OPERACIONES',
    items: [
      { id: 'ventas', label: 'Ventas', icon: '💰' },
      { id: 'ventasMulti', label: 'Ventas Multi', icon: '💳' },
      { id: 'mayoreo', label: 'Mayoreo', icon: '🏪' },
      { id: 'cotizaciones', label: 'Cotizaciones', icon: '📝' },
      { id: 'personal', label: 'Uso Personal', icon: '🏠' },
      { id: 'fallas', label: 'Fallas', icon: '❌' },
    ],
  },
  {
    label: 'PUBLICO',
    items: [
      { id: 'galeria', label: 'Galeria Fotos', icon: '📸' },
      { id: 'catalogo', label: 'Catalogo Publico', icon: '🛍️' },
    ],
  },
];

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

export default function Sidebar({ current, setCurrent, collapsed, setCollapsed }) {
  const { sales, wholesale, multiSales, selectedMonth, setSelectedMonth } = usePrintoria();

  const availableMonths = useMemo(() => {
    const months = new Set();
    [...sales, ...wholesale, ...multiSales].forEach(o => {
      if (o.fecha) months.add(o.fecha.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [sales, wholesale, multiSales]);

  return (
    <aside
      className={`flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-14' : 'w-52'}`}
      style={{ background: '#2c2b29', borderRight: '1px solid #3d3c3a' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4" style={{ borderBottom: '1px solid #3d3c3a' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo-icon.png" alt="Printoria" className="w-8 h-8 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-extrabold text-white tracking-widest text-xs leading-tight">PRINTORIA</p>
              <p className="text-xs leading-tight truncate" style={{ color: '#96d629' }}>Imprimiendo Posibilidades</p>
            </div>
          </div>
        )}
        {collapsed && <img src="/logo-icon.png" alt="Printoria" className="w-7 h-7 object-contain mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 p-1 rounded text-zinc-400 hover:text-white transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Selector mes */}
      <div className={`${collapsed ? 'px-1 py-2' : 'px-3 py-3'}`} style={{ borderBottom: '1px solid #3d3c3a' }}>
        {!collapsed ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#6b6b69' }}>Periodo</p>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
              style={{ background: '#3d3c3a', border: '1px solid #555452' }}
            >
              <option value="all">Todos los meses</option>
              {availableMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
            {selectedMonth !== 'all' && (
              <button onClick={() => setSelectedMonth('all')} className="text-xs mt-1" style={{ color: '#6b6b69' }}>
                x Limpiar filtro
              </button>
            )}
          </div>
        ) : (
          <button title="Filtro de mes" onClick={() => setCollapsed(false)} className="w-full flex justify-center py-1 text-lg" style={{ color: selectedMonth !== 'all' ? '#96d629' : '#6b6b69' }}>
            📅
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="text-xs font-bold uppercase tracking-widest px-3 pt-4 pb-1" style={{ color: '#555452' }}>
                {group.label}
              </p>
            )}
            {group.label && collapsed && <div style={{ borderTop: '1px solid #3d3c3a', margin: '8px 0' }} />}
            {group.items.map(item => {
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrent(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg mx-1 ${collapsed ? 'justify-center' : 'justify-start'}`}
                  style={{
                    width: 'calc(100% - 8px)',
                    background: active ? 'rgba(150,214,41,0.12)' : 'transparent',
                    color: active ? '#96d629' : '#c4c3c1',
                    borderLeft: active ? '3px solid #96d629' : '3px solid transparent',
                  }}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 flex justify-center items-center gap-2" style={{ borderTop: '1px solid #3d3c3a' }}>
        {!collapsed && <p className="text-xs" style={{ color: '#555452' }}>Printoria 3D v1.0</p>}
        {collapsed && <p className="text-xs" style={{ color: '#555452' }}>.</p>}
      </div>
    </aside>
  );
}
