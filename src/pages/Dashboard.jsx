import { useMemo } from 'react';
import { useFinance } from '../store/FinanceContext';
import {
  fmt, currentMonth, filterByMonth, getLastNMonths,
  getMonthlyTotals, isConfirmadoEsteMes, monthLabel,
} from '../store/financeUtils';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

function KpiCard({ label, value, sub, icon, accent = '#3b82f6', negative = false }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-2xl font-black" style={{ color: negative ? '#ef4444' : accent }}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ navigate }) {
  const { accounts, transactions, recurrentes, confirmaciones, config, calcBalance } = useFinance();
  const mes = currentMonth();

  const txMes = useMemo(() => filterByMonth(transactions.filter(t => t.tipo !== 'transferencia'), mes), [transactions, mes]);
  const ingresos = useMemo(() => txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0), [txMes]);
  const gastos   = useMemo(() => txMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0), [txMes]);
  const ahorro   = ingresos - gastos;

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + calcBalance(a), 0), [accounts, calcBalance]);
  const pendientes   = recurrentes.filter(r => r.activo && !isConfirmadoEsteMes(r.id, confirmaciones, mes)).length;

  const months6   = useMemo(() => getLastNMonths(6), []);
  const chartData = useMemo(() => getMonthlyTotals(transactions, months6), [transactions, months6]);

  const ultimas = useMemo(() =>
    [...transactions]
      .filter(t => t.tipo !== 'transferencia')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5),
    [transactions],
  );

  const { simbolo } = config;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500">{monthLabel(mes)}</p>
        </div>
        {pendientes > 0 && (
          <button
            onClick={() => navigate('recurrentes')}
            className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl px-4 py-2 text-sm font-bold hover:bg-orange-500/20 transition-colors"
          >
            🔁 {pendientes} pendiente{pendientes > 1 ? 's' : ''} este mes
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Balance total" value={fmt(totalBalance, simbolo)} icon="💳" accent="#3b82f6" negative={totalBalance < 0} />
        <KpiCard label="Ingresos del mes" value={fmt(ingresos, simbolo)} icon="📥" accent="#22c55e" />
        <KpiCard label="Gastos del mes" value={fmt(gastos, simbolo)} icon="📤" accent="#ef4444" />
        <KpiCard
          label="Ahorro del mes"
          value={fmt(Math.abs(ahorro), simbolo)}
          icon={ahorro >= 0 ? '📈' : '📉'}
          accent={ahorro >= 0 ? '#22c55e' : '#ef4444'}
          negative={ahorro < 0}
          sub={ahorro < 0 ? 'déficit' : 'superávit'}
        />
      </div>

      {/* Sparkline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Ahorro neto · últimos 6 meses</p>
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ahorroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#f4f4f5' }}
                formatter={v => [`${simbolo}${Number(v).toFixed(2)}`, 'Ahorro']}
              />
              <Area type="monotone" dataKey="ahorro" stroke="#3b82f6" strokeWidth={2} fill="url(#ahorroGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuentas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">Cuentas</p>
            <button onClick={() => navigate('cuentas')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Ver todas →</button>
          </div>
          <div className="space-y-2">
            {accounts.map(a => {
              const bal = calcBalance(a);
              return (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                    <span className="text-sm text-zinc-300">{a.nombre}</span>
                  </div>
                  <span className={`text-sm font-bold ${bal < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                    {bal < 0 ? '-' : ''}{fmt(Math.abs(bal), simbolo)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Últimas transacciones */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">Últimos movimientos</p>
            <button onClick={() => navigate('transacciones')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Ver todas →</button>
          </div>
          {ultimas.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">Sin transacciones aún</p>
          ) : (
            <div className="space-y-2">
              {ultimas.map(t => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{t.descripcion}</p>
                    <p className="text-xs text-zinc-600">
                      {t.fecha} · <span className={t.ambito === 'negocio' ? 'text-orange-400' : 'text-blue-400'}>{t.ambito}</span>
                    </p>
                  </div>
                  <span className={`text-sm font-bold ml-3 flex-shrink-0 ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{fmt(t.monto, simbolo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
