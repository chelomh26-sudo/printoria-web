import { useState, useMemo, useCallback } from 'react';
import { useFinance } from '../store/FinanceContext';
import Modal from '../components/Modal';
import { fmt, TODAY, getNextId } from '../store/financeUtils';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-500 transition-colors';
const lbl = 'block text-xs font-medium text-zinc-500 mb-1';
const sel = `${inp} cursor-pointer`;

const COLORS = ['#22c55e','#3b82f6','#ef4444','#f97316','#8b5cf6','#ec4899','#06b6d4','#f59e0b','#64748b','#14b8a6'];

const TIPO_ICONS = { efectivo: '💵', banco: '🏦', credito: '💳', inversion: '📊' };

const EMPTY_ACC = { nombre: '', tipo: 'banco', balanceInicial: 0, color: '#3b82f6' };

function CuentaForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_ACC);
  const setE = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.nombre.trim()) return alert('Ingresa un nombre para la cuenta');
    onSave({ ...form, balanceInicial: Number(form.balanceInicial) || 0 });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Nombre *</label>
        <input type="text" value={form.nombre} onChange={setE('nombre')} placeholder="Ej. BBVA, Efectivo..." className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo</label>
          <select value={form.tipo} onChange={setE('tipo')} className={sel}>
            <option value="efectivo">💵 Efectivo</option>
            <option value="banco">🏦 Banco</option>
            <option value="credito">💳 Tarjeta crédito</option>
            <option value="inversion">📊 Inversión</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Balance inicial</label>
          <input type="number" step="0.01" value={form.balanceInicial} onChange={setE('balanceInicial')} placeholder="0.00" className={inp} />
          <p className="text-[10px] text-zinc-600 mt-0.5">Negativo si es deuda existente</p>
        </div>
      </div>
      <div>
        <label className={lbl}>Color</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-zinc-100 scale-110' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={submit} className="btn-brand flex-1">Guardar</button>
        <button onClick={onClose} className="btn-outline">Cancelar</button>
      </div>
    </div>
  );
}

function TransferModal({ fromAccount, accounts, onSave, onClose, simbolo }) {
  const [form, setForm] = useState({ cuentaDestinoId: '', monto: '', descripcion: 'Transferencia', fecha: TODAY() });
  const setE = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.cuentaDestinoId) return alert('Selecciona cuenta destino');
    if (!form.monto || Number(form.monto) <= 0) return alert('Ingresa un monto');
    onSave({ ...form, monto: Number(form.monto) });
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ background: fromAccount.color }} />
        <span className="text-sm font-bold text-zinc-100">Desde: {fromAccount.nombre}</span>
      </div>
      <div>
        <label className={lbl}>Cuenta destino</label>
        <select value={form.cuentaDestinoId} onChange={setE('cuentaDestinoId')} className={sel}>
          <option value="">— Selecciona —</option>
          {accounts.filter(a => a.id !== fromAccount.id).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Monto ({simbolo})</label>
          <input type="number" min="0" step="0.01" value={form.monto} onChange={setE('monto')} placeholder="0.00" className={inp} />
        </div>
        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" value={form.fecha} onChange={setE('fecha')} className={inp} />
        </div>
      </div>
      <div>
        <label className={lbl}>Descripción</label>
        <input type="text" value={form.descripcion} onChange={setE('descripcion')} className={inp} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={submit} className="btn-brand flex-1">Transferir</button>
        <button onClick={onClose} className="btn-outline">Cancelar</button>
      </div>
    </div>
  );
}

export default function Cuentas() {
  const { accounts, setAccounts, transactions, setTransactions, config, calcBalance } = useFinance();
  const [modal, setModal]       = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);
  const { simbolo } = config;

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + calcBalance(a), 0), [accounts, calcBalance]);

  const save = useCallback(form => {
    if (form.id) {
      setAccounts(prev => prev.map(a => a.id === form.id ? form : a));
    } else {
      setAccounts(prev => [...prev, { ...form, id: getNextId(prev, 'CTA') }]);
    }
    setModal(null);
  }, [setAccounts]);

  const del = id => {
    const hasTxns = transactions.some(t => t.cuentaId === id || t.cuentaDestinoId === id);
    if (hasTxns) return alert('No puedes eliminar una cuenta con transacciones. Elimina las transacciones primero.');
    if (!confirm('¿Eliminar esta cuenta?')) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const doTransfer = useCallback((fromAcc, form) => {
    const newTxn = {
      id: getNextId(transactions, 'TXN'),
      fecha: form.fecha,
      monto: form.monto,
      tipo: 'transferencia',
      categoriaId: null,
      cuentaId: fromAcc.id,
      cuentaDestinoId: form.cuentaDestinoId,
      descripcion: form.descripcion || 'Transferencia',
      ambito: 'personal',
      notas: '',
      ticket: null,
    };
    setTransactions(prev => [...prev, newTxn]);
    setTransferFrom(null);
  }, [transactions, setTransactions]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Cuentas</h1>
        <button onClick={() => setModal({ form: null })} className="btn-brand">+ Nueva cuenta</button>
      </div>

      {/* Balance total */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">Balance total</p>
        <p className={`text-3xl font-black ${totalBalance < 0 ? 'text-red-400' : 'text-blue-400'}`}>
          {totalBalance < 0 ? '-' : ''}{fmt(Math.abs(totalBalance), simbolo)}
        </p>
        <p className="text-xs text-zinc-600 mt-1">Suma de todas las cuentas</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => {
          const bal = calcBalance(a);
          const isDebt = a.tipo === 'credito' && bal < 0;
          return (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TIPO_ICONS[a.tipo] || '💰'}</span>
                  <div>
                    <p className="font-bold text-zinc-100">{a.nombre}</p>
                    <p className="text-xs text-zinc-500 capitalize">{a.tipo}</p>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: a.color }} />
              </div>

              <div className="mb-4">
                {isDebt ? (
                  <>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Deuda</p>
                    <p className="text-2xl font-black text-red-400">-{fmt(Math.abs(bal), simbolo)}</p>
                  </>
                ) : (
                  <p className="text-2xl font-black" style={{ color: a.color }}>{fmt(bal, simbolo)}</p>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button onClick={() => setTransferFrom(a)} className="btn-outline text-xs py-1.5 flex-1">Transferir</button>
                <button onClick={() => setModal({ form: a })} className="btn-outline text-xs py-1.5 flex-1">Editar</button>
                <button onClick={() => del(a.id)} className="btn-danger text-xs py-1.5 px-2">✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.form ? 'Editar cuenta' : 'Nueva cuenta'} onClose={() => setModal(null)}>
          <CuentaForm initial={modal.form} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}

      {transferFrom && (
        <Modal title="Transferir entre cuentas" onClose={() => setTransferFrom(null)}>
          <TransferModal
            fromAccount={transferFrom}
            accounts={accounts}
            simbolo={simbolo}
            onSave={form => doTransfer(transferFrom, form)}
            onClose={() => setTransferFrom(null)}
          />
        </Modal>
      )}
    </div>
  );
}
