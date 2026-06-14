import { useState, useMemo, useCallback } from 'react';
import { useFinance } from '../store/FinanceContext';
import Modal from '../components/Modal';
import {
  fmt, TODAY, currentMonth, getNextId,
  isConfirmadoEsteMes,
} from '../store/financeUtils';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-500 transition-colors';
const lbl = 'block text-xs font-medium text-zinc-500 mb-1';
const sel = `${inp} cursor-pointer`;

const EMPTY_REC = {
  nombre: '', tipo: 'gasto', monto: '', dia: '', ambito: 'personal',
  categoriaId: '', cuentaId: '', activo: true,
};

function RecForm({ initial, onSave, onClose, accounts, categories }) {
  const [form, setForm] = useState(initial || EMPTY_REC);
  const setE = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const filteredCats = categories.filter(c => c.tipo === form.tipo);

  const submit = () => {
    if (!form.nombre.trim()) return alert('Ingresa un nombre');
    if (!form.monto || Number(form.monto) <= 0) return alert('Ingresa un monto estimado');
    if (!form.cuentaId) return alert('Selecciona una cuenta');
    onSave({ ...form, monto: Number(form.monto), dia: form.dia ? Number(form.dia) : null });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo</label>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value, categoriaId: '' }))} className={sel}>
            <option value="gasto">Gasto fijo</option>
            <option value="ingreso">Ingreso esperado</option>
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
      <div>
        <label className={lbl}>Nombre *</label>
        <input type="text" value={form.nombre} onChange={setE('nombre')} placeholder="Ej. Netflix, Renta, Sueldo..." className={inp} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Monto estimado</label>
          <input type="number" min="0" step="0.01" value={form.monto} onChange={setE('monto')} placeholder="0.00" className={inp} />
        </div>
        <div>
          <label className={lbl}>Día del mes (opcional)</label>
          <input type="number" min="1" max="31" value={form.dia} onChange={setE('dia')} placeholder="Variable" className={inp} />
          <p className="text-[10px] text-zinc-600 mt-0.5">Deja vacío si es variable</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Cuenta</label>
          <select value={form.cuentaId} onChange={setE('cuentaId')} className={sel}>
            <option value="">— Selecciona —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Categoría</label>
          <select value={form.categoriaId} onChange={setE('categoriaId')} className={sel}>
            <option value="">— Sin categoría —</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={submit} className="btn-brand flex-1">Guardar</button>
        <button onClick={onClose} className="btn-outline">Cancelar</button>
      </div>
    </div>
  );
}

function ConfirmModal({ rec, simbolo, onConfirm, onClose }) {
  const [fecha, setFecha] = useState(TODAY());
  const [monto, setMonto] = useState(String(rec.monto));

  return (
    <div className="space-y-4">
      <p className="text-zinc-400 text-sm">
        {rec.tipo === 'ingreso' ? 'Confirma que recibiste este ingreso:' : 'Confirma que realizaste este pago:'}
      </p>
      <div className="bg-zinc-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-zinc-100">{rec.nombre}</p>
          <p className="text-xs text-zinc-500">{rec.ambito} · {rec.tipo}</p>
        </div>
        <span className={`text-lg font-black ${rec.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
          {rec.tipo === 'ingreso' ? '+' : '-'}{fmt(rec.monto, simbolo)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Fecha real</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Monto real ({simbolo})</label>
          <input type="number" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} className={inp} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => onConfirm(fecha, Number(monto))} className="btn-brand flex-1">
          {rec.tipo === 'ingreso' ? '✓ Confirmar ingreso' : '✓ Confirmar pago'}
        </button>
        <button onClick={onClose} className="btn-outline">Cancelar</button>
      </div>
    </div>
  );
}

export default function Recurrentes() {
  const { accounts, categories, recurrentes, setRecurrentes, confirmaciones, setConfirmaciones, transactions, setTransactions, config } = useFinance();
  const [modal, setModal]     = useState(null);
  const [confirmRec, setConfirmRec] = useState(null);
  const mes = currentMonth();

  const gastos   = useMemo(() => recurrentes.filter(r => r.tipo === 'gasto'), [recurrentes]);
  const ingresos = useMemo(() => recurrentes.filter(r => r.tipo === 'ingreso'), [recurrentes]);

  const save = useCallback(form => {
    if (form.id) {
      setRecurrentes(prev => prev.map(r => r.id === form.id ? form : r));
    } else {
      setRecurrentes(prev => [...prev, { ...form, id: getNextId(prev, 'REC') }]);
    }
    setModal(null);
  }, [setRecurrentes]);

  const del = id => {
    if (!confirm('¿Eliminar este recurrente?')) return;
    setRecurrentes(prev => prev.filter(r => r.id !== id));
    setConfirmaciones(prev => prev.filter(c => c.recurrenteId !== id));
  };

  const toggleActivo = id => {
    setRecurrentes(prev => prev.map(r => r.id === id ? { ...r, activo: !r.activo } : r));
  };

  const confirmar = (rec, fecha, monto) => {
    const newTxn = {
      id: getNextId(transactions, 'TXN'),
      fecha,
      monto,
      tipo: rec.tipo,
      categoriaId: rec.categoriaId || null,
      cuentaId: rec.cuentaId,
      cuentaDestinoId: null,
      descripcion: rec.nombre,
      ambito: rec.ambito,
      notas: `Recurrente confirmado`,
      ticket: null,
    };
    setTransactions(prev => [...prev, newTxn]);
    setConfirmaciones(prev => [...prev, {
      recurrenteId: rec.id,
      mes,
      transaccionId: newTxn.id,
      fechaConfirmacion: TODAY(),
    }]);
    setConfirmRec(null);
  };

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const accMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts]);
  const { simbolo } = config;

  const RecCard = ({ r }) => {
    const confirmado = isConfirmadoEsteMes(r.id, confirmaciones, mes);
    const cat = catMap[r.categoriaId];
    const acc = accMap[r.cuentaId];
    return (
      <div className={`bg-zinc-900 border rounded-2xl p-4 ${r.activo ? 'border-zinc-800' : 'border-zinc-800 opacity-50'}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-zinc-100">{r.nombre}</p>
            <p className="text-xs text-zinc-500">
              {cat ? `${cat.icono} ${cat.nombre}` : 'Sin categoría'} · {acc?.nombre || '—'}
              {r.dia ? ` · día ${r.dia}` : ' · día variable'}
            </p>
          </div>
          <span className={`text-lg font-black ${r.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
            {r.tipo === 'ingreso' ? '+' : '-'}{fmt(r.monto, simbolo)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${confirmado ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
            {confirmado ? '✓ Confirmado' : '● Pendiente'}
          </span>
          <div className="flex gap-2">
            {!confirmado && r.activo && (
              <button onClick={() => setConfirmRec(r)} className="btn-brand text-xs py-1 px-3">
                {r.tipo === 'ingreso' ? 'Recibí' : 'Pagué'}
              </button>
            )}
            <button onClick={() => setModal({ form: r })} className="text-zinc-500 hover:text-blue-400 text-xs font-bold transition-colors">Editar</button>
            <button onClick={() => toggleActivo(r.id)} className="text-zinc-500 hover:text-yellow-400 text-xs font-bold transition-colors">{r.activo ? 'Pausar' : 'Activar'}</button>
            <button onClick={() => del(r.id)} className="text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">Borrar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Recurrentes</h1>
        <button onClick={() => setModal({ form: null })} className="btn-brand">+ Nuevo</button>
      </div>

      {/* Gastos fijos */}
      <div>
        <p className="section-title mb-3">Gastos fijos</p>
        {gastos.length === 0 ? (
          <p className="text-zinc-600 text-sm">Sin gastos fijos registrados</p>
        ) : (
          <div className="space-y-3">
            {gastos.map(r => <RecCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {/* Ingresos esperados */}
      <div>
        <p className="section-title mb-3">Ingresos esperados</p>
        {ingresos.length === 0 ? (
          <p className="text-zinc-600 text-sm">Sin ingresos recurrentes registrados</p>
        ) : (
          <div className="space-y-3">
            {ingresos.map(r => <RecCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.form ? 'Editar recurrente' : 'Nuevo recurrente'} onClose={() => setModal(null)}>
          <RecForm
            initial={modal.form}
            onSave={save}
            onClose={() => setModal(null)}
            accounts={accounts}
            categories={categories}
          />
        </Modal>
      )}

      {confirmRec && (
        <Modal title="Confirmar movimiento" onClose={() => setConfirmRec(null)}>
          <ConfirmModal
            rec={confirmRec}
            simbolo={simbolo}
            onConfirm={(fecha, monto) => confirmar(confirmRec, fecha, monto)}
            onClose={() => setConfirmRec(null)}
          />
        </Modal>
      )}
    </div>
  );
}
