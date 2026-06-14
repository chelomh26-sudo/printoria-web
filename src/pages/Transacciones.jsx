import { useState, useMemo, useCallback } from 'react';
import { useFinance } from '../store/FinanceContext';
import Modal from '../components/Modal';
import {
  fmt, TODAY, currentMonth, filterByMonth, getNextId,
  compressImage, monthLabel, getLastNMonths,
} from '../store/financeUtils';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-500 transition-colors';
const lbl = 'block text-xs font-medium text-zinc-500 mb-1';
const sel = `${inp} cursor-pointer`;

const TIPO_COLORS = { ingreso: 'text-green-400', gasto: 'text-red-400', transferencia: 'text-blue-400' };
const TIPO_BADGE  = { ingreso: 'bg-green-500/15 text-green-400', gasto: 'bg-red-500/15 text-red-400', transferencia: 'bg-blue-500/15 text-blue-400' };

const EMPTY_FORM = {
  fecha: TODAY(), monto: '', tipo: 'gasto', ambito: 'personal',
  categoriaId: '', cuentaId: '', cuentaDestinoId: '', descripcion: '', notas: '', ticket: null,
};

function TransaccionForm({ initial, onSave, onClose, accounts, categories, simbolo }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [ticketPreview, setTicketPreview] = useState(initial?.ticket || null);
  const [uploading, setUploading] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const setE = k => e => set(k)(e.target.value);

  const filteredCats = categories.filter(c =>
    form.tipo !== 'transferencia' && c.tipo === form.tipo
  );

  const handleTicket = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const b64 = await compressImage(file);
      setTicketPreview(b64);
      setForm(f => ({ ...f, ticket: b64 }));
    } finally {
      setUploading(false);
    }
  };

  const removeTicket = () => {
    setTicketPreview(null);
    setForm(f => ({ ...f, ticket: null }));
  };

  const submit = () => {
    if (!form.monto || Number(form.monto) <= 0) return alert('Ingresa un monto válido');
    if (!form.cuentaId) return alert('Selecciona una cuenta');
    if (!form.descripcion.trim()) return alert('Agrega una descripción');
    if (form.tipo === 'transferencia' && !form.cuentaDestinoId) return alert('Selecciona cuenta destino');
    if (form.tipo === 'transferencia' && form.cuentaId === form.cuentaDestinoId) return alert('Las cuentas deben ser distintas');
    onSave({
      ...form,
      monto: Number(form.monto),
      categoriaId: form.tipo === 'transferencia' ? null : form.categoriaId || null,
      cuentaDestinoId: form.tipo === 'transferencia' ? form.cuentaDestinoId : null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" value={form.fecha} onChange={setE('fecha')} className={inp} />
        </div>
        <div>
          <label className={lbl}>Tipo</label>
          <select value={form.tipo} onChange={e => { setE('tipo')(e); setForm(f => ({ ...f, tipo: e.target.value, categoriaId: '' })); }} className={sel}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Ámbito</label>
          <select value={form.ambito} onChange={setE('ambito')} className={sel}>
            <option value="personal">Personal</option>
            <option value="negocio">Negocio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Monto ({simbolo})</label>
          <input type="number" min="0" step="0.01" value={form.monto} onChange={setE('monto')} placeholder="0.00" className={inp} />
        </div>
        <div>
          <label className={lbl}>Cuenta origen</label>
          <select value={form.cuentaId} onChange={setE('cuentaId')} className={sel}>
            <option value="">— Selecciona —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {form.tipo === 'transferencia' ? (
        <div>
          <label className={lbl}>Cuenta destino</label>
          <select value={form.cuentaDestinoId} onChange={setE('cuentaDestinoId')} className={sel}>
            <option value="">— Selecciona —</option>
            {accounts.filter(a => a.id !== form.cuentaId).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className={lbl}>Categoría</label>
          <select value={form.categoriaId} onChange={setE('categoriaId')} className={sel}>
            <option value="">— Sin categoría —</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className={lbl}>Descripción *</label>
        <input type="text" value={form.descripcion} onChange={setE('descripcion')} placeholder="Ej. Súper del sábado" className={inp} />
      </div>

      <div>
        <label className={lbl}>Notas (opcional)</label>
        <textarea value={form.notas} onChange={setE('notas')} rows={2} placeholder="Notas adicionales..." className={`${inp} resize-none`} />
      </div>

      {/* Ticket */}
      <div>
        <label className={lbl}>Foto de ticket (opcional)</label>
        {ticketPreview ? (
          <div className="relative inline-block">
            <img src={ticketPreview} alt="ticket" className="h-24 rounded-lg object-cover border border-zinc-700" />
            <button onClick={removeTicket} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">×</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 hover:border-blue-500 hover:text-blue-400 transition-colors w-fit">
            {uploading ? '⏳ Comprimiendo...' : '📷 Adjuntar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handleTicket} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={submit} className="btn-brand flex-1">Guardar</button>
        <button onClick={onClose} className="btn-outline">Cancelar</button>
      </div>
    </div>
  );
}

export default function Transacciones() {
  const { accounts, categories, transactions, setTransactions, config } = useFinance();
  const [modal, setModal]       = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  const [filterMes, setFilterMes]     = useState(currentMonth());
  const [filterTipo, setFilterTipo]   = useState('all');
  const [filterCuenta, setFilterCuenta] = useState('all');
  const [filterAmbito, setFilterAmbito] = useState('all');
  const [search, setSearch]     = useState('');

  const months = useMemo(() => [{ v: 'all', l: 'Todos los meses' }, ...getLastNMonths(12).reverse().map(m => ({ v: m, l: monthLabel(m) }))], []);

  const filtered = useMemo(() => {
    let list = filterMes === 'all' ? transactions : filterByMonth(transactions, filterMes);
    if (filterTipo   !== 'all') list = list.filter(t => t.tipo    === filterTipo);
    if (filterCuenta !== 'all') list = list.filter(t => t.cuentaId === filterCuenta || t.cuentaDestinoId === filterCuenta);
    if (filterAmbito !== 'all') list = list.filter(t => t.ambito  === filterAmbito);
    if (search.trim()) {
      const q = search.toLowerCase();
      const catMap = Object.fromEntries(categories.map(c => [c.id, c.nombre.toLowerCase()]));
      list = list.filter(t =>
        t.descripcion.toLowerCase().includes(q) ||
        (t.categoriaId && catMap[t.categoriaId]?.includes(q))
      );
    }
    return [...list].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [transactions, filterMes, filterTipo, filterCuenta, filterAmbito, search, categories]);

  const ingTotal = useMemo(() => filtered.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0), [filtered]);
  const gasTotal = useMemo(() => filtered.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0), [filtered]);

  const save = useCallback(form => {
    if (form.id) {
      setTransactions(prev => prev.map(t => t.id === form.id ? form : t));
    } else {
      setTransactions(prev => [...prev, { ...form, id: getNextId(prev, 'TXN') }]);
    }
    setModal(null);
  }, [setTransactions]);

  const del = id => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const accMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts]);
  const { simbolo } = config;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Transacciones</h1>
        <button onClick={() => setModal({ form: null })} className="btn-brand">+ Nueva</button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)} className={`${sel} w-auto`}>
          {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={`${sel} w-auto`}>
          <option value="all">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <select value={filterCuenta} onChange={e => setFilterCuenta(e.target.value)} className={`${sel} w-auto`}>
          <option value="all">Todas las cuentas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select value={filterAmbito} onChange={e => setFilterAmbito(e.target.value)} className={`${sel} w-auto`}>
          <option value="all">Personal + Negocio</option>
          <option value="personal">Personal</option>
          <option value="negocio">Negocio</option>
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className={`${inp} w-44`} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Ingresos', v: ingTotal, c: 'text-green-400' },
          { l: 'Gastos',   v: gasTotal, c: 'text-red-400' },
          { l: 'Neto',     v: ingTotal - gasTotal, c: ingTotal - gasTotal >= 0 ? 'text-blue-400' : 'text-red-400' },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">{l}</p>
            <p className={`font-black text-lg ${c}`}>{fmt(Math.abs(v), simbolo)}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-center py-12">Sin transacciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  {['Fecha','Tipo','Descripción','Categoría','Cuenta','Ámbito','Monto',''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-black text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const cat = catMap[t.categoriaId];
                  const acc = accMap[t.cuentaId];
                  const accDest = t.cuentaDestinoId ? accMap[t.cuentaDestinoId] : null;
                  return (
                    <tr key={t.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{t.fecha}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIPO_BADGE[t.tipo]}`}>{t.tipo}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-200 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{t.descripcion}</span>
                          {t.ticket && (
                            <button onClick={() => setTicketModal(t.ticket)} title="Ver ticket" className="text-zinc-500 hover:text-blue-400 flex-shrink-0">📷</button>
                          )}
                        </div>
                        {t.notas && <p className="text-xs text-zinc-600 truncate">{t.notas}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {cat ? `${cat.icono} ${cat.nombre}` : (t.tipo === 'transferencia' ? `→ ${accDest?.nombre || '?'}` : '—')}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        <span style={{ color: acc?.color }}>{acc?.nombre || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.ambito === 'negocio' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>
                          {t.ambito}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${TIPO_COLORS[t.tipo]}`}>
                        {t.tipo === 'ingreso' ? '+' : t.tipo === 'gasto' ? '-' : ''}{fmt(t.monto, simbolo)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setModal({ form: t })} className="text-zinc-500 hover:text-blue-400 text-xs font-bold transition-colors">Editar</button>
                          <button onClick={() => del(t.id)} className="text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.form ? 'Editar transacción' : 'Nueva transacción'} onClose={() => setModal(null)} wide>
          <TransaccionForm
            initial={modal.form}
            onSave={save}
            onClose={() => setModal(null)}
            accounts={accounts}
            categories={categories}
            simbolo={simbolo}
          />
        </Modal>
      )}

      {ticketModal && (
        <Modal title="Foto del ticket" onClose={() => setTicketModal(null)}>
          <img src={ticketModal} alt="ticket" className="w-full rounded-xl object-contain max-h-[70vh]" />
        </Modal>
      )}
    </div>
  );
}
