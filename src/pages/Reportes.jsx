import { useMemo, useState } from 'react';
import { useFinance } from '../store/FinanceContext';
import {
  fmt, currentMonth, filterByMonth, getLastNMonths,
  getMonthlyTotals, monthLabel,
} from '../store/financeUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const GRID   = { strokeDasharray: '3 3', stroke: '#27272a' };
const XTICK  = { fill: '#71717a', fontSize: 11 };
const YTICK  = { fill: '#71717a', fontSize: 11 };
const TT_STYLE = { background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 };
const TT_LABEL = { color: '#f4f4f5' };
const TT_ITEM  = { color: '#a1a1aa' };
const LEG_STYLE = { color: '#a1a1aa', fontSize: 12 };

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Reportes() {
  const { transactions, categories, config } = useFinance();
  const [mes, setMes] = useState(currentMonth());

  const months6 = useMemo(() => getLastNMonths(6), []);
  const barData = useMemo(() => getMonthlyTotals(transactions, months6), [transactions, months6]);

  const { simbolo } = config;

  const txMes = useMemo(() =>
    filterByMonth(transactions.filter(t => t.tipo !== 'transferencia'), mes),
    [transactions, mes],
  );

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);

  const pieGastoCat = useMemo(() => {
    const map = {};
    txMes.filter(t => t.tipo === 'gasto').forEach(t => {
      const cat = catMap[t.categoriaId];
      const key = cat?.nombre || 'Sin categoría';
      const color = cat?.color || '#71717a';
      if (!map[key]) map[key] = { name: key, value: 0, fill: color };
      map[key].value += t.monto;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [txMes, catMap]);

  const pieAmbito = useMemo(() => {
    let personal = 0, negocio = 0;
    txMes.filter(t => t.tipo === 'gasto').forEach(t => {
      if (t.ambito === 'personal') personal += t.monto;
      else negocio += t.monto;
    });
    return [
      { name: 'Personal', value: personal, fill: '#3b82f6' },
      { name: 'Negocio',  value: negocio,  fill: '#f97316' },
    ].filter(d => d.value > 0);
  }, [txMes]);

  const tableData = useMemo(() => {
    const months = getLastNMonths(6);
    return getMonthlyTotals(transactions, months).map(d => ({
      ...d,
      pctAhorro: d.ingresos > 0 ? ((d.ahorro / d.ingresos) * 100).toFixed(1) : '—',
    }));
  }, [transactions]);

  const fmtTT = v => [`${simbolo}${Number(v).toFixed(2)}`, ''];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Reportes</h1>
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none"
        >
          {getLastNMonths(12).reverse().map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Barras: ingresos vs gastos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Ingresos vs Gastos · últimos 6 meses</p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" tick={XTICK} axisLine={false} tickLine={false} />
              <YAxis tick={YTICK} axisLine={false} tickLine={false} width={70}
                tickFormatter={v => `${simbolo}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={fmtTT} />
              <Legend wrapperStyle={LEG_STYLE} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos"   name="Gastos"   fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie gastos por categoría */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">
            Gastos por categoría · {monthLabel(mes)}
          </p>
          {pieGastoCat.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">Sin gastos este mes</p>
          ) : (
            <>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieGastoCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={renderLabel}>
                      {pieGastoCat.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={fmtTT} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {pieGastoCat.slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-zinc-400">{d.name}</span>
                    </div>
                    <span className="text-zinc-300 font-bold">{fmt(d.value, simbolo)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pie personal vs negocio */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">
            Personal vs Negocio · {monthLabel(mes)}
          </p>
          {pieAmbito.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">Sin gastos este mes</p>
          ) : (
            <>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieAmbito} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={renderLabel}>
                      {pieAmbito.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={fmtTT} />
                    <Legend wrapperStyle={LEG_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {pieAmbito.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-zinc-400">{d.name}</span>
                    </div>
                    <span className="text-zinc-300 font-bold">{fmt(d.value, simbolo)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla resumen */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">Resumen mensual</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Mes','Ingresos','Gastos','Ahorro','% Ahorro'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-black text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...tableData].reverse().map(d => (
                <tr key={d.month} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3 text-zinc-400 font-medium">{monthLabel(d.month)}</td>
                  <td className="px-5 py-3 text-green-400 font-bold">{fmt(d.ingresos, simbolo)}</td>
                  <td className="px-5 py-3 text-red-400 font-bold">{fmt(d.gastos, simbolo)}</td>
                  <td className={`px-5 py-3 font-bold ${d.ahorro >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {d.ahorro < 0 ? '-' : ''}{fmt(Math.abs(d.ahorro), simbolo)}
                  </td>
                  <td className={`px-5 py-3 font-bold ${parseFloat(d.pctAhorro) >= 0 ? 'text-zinc-300' : 'text-red-400'}`}>
                    {d.pctAhorro !== '—' ? `${d.pctAhorro}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
