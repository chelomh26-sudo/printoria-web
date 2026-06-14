import { useFinance } from '../store/FinanceContext';
import { currentMonth, isConfirmadoEsteMes } from '../store/financeUtils';

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '📊' },
  { id: 'transacciones', label: 'Transacciones',  icon: '💸' },
  { id: 'recurrentes',   label: 'Recurrentes',    icon: '🔁' },
  { id: 'cuentas',       label: 'Cuentas',        icon: '🏦' },
  { id: 'reportes',      label: 'Reportes',       icon: '📈' },
  { id: 'categorias',    label: 'Categorías',     icon: '🏷️' },
  { id: 'configuracion', label: 'Configuración',  icon: '⚙️' },
];

export default function Sidebar({ current, setCurrent, collapsed, setCollapsed }) {
  const { config, recurrentes, confirmaciones } = useFinance();
  const mes = currentMonth();

  const pendientes = recurrentes.filter(r =>
    r.activo && !isConfirmadoEsteMes(r.id, confirmaciones, mes)
  ).length;

  return (
    <aside
      className="flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-200 flex-shrink-0"
      style={{ width: collapsed ? 60 : 210 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">💰</span>
            <span className="text-sm font-black text-zinc-100 truncate">{config.nombre}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-zinc-500 hover:text-zinc-100 text-lg transition-colors ml-auto"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(item => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrent(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 relative ${
                active
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
              style={active ? { borderLeft: '3px solid #3b82f6' } : { borderLeft: '3px solid transparent' }}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{item.label}</span>
              )}
              {item.id === 'recurrentes' && pendientes > 0 && (
                <span
                  className={`ml-auto text-xs font-black bg-orange-500 text-white rounded-full px-1.5 py-0.5 leading-none flex-shrink-0 ${collapsed ? 'absolute top-1 right-1 text-[10px]' : ''}`}
                >
                  {pendientes}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 text-center">Mis Finanzas v1.0</p>
        </div>
      )}
    </aside>
  );
}
