import { useState, useMemo, useCallback } from 'react';
import { useFinance } from '../store/FinanceContext';
import Modal from '../components/Modal';
import { getNextId } from '../store/financeUtils';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-500 transition-colors';
const lbl = 'block text-xs font-medium text-zinc-500 mb-1';
const sel = `${inp} cursor-pointer`;

const COLORS = [
  '#f97316','#8b5cf6','#ec4899','#06b6d4','#10b981',
  '#f59e0b','#22c55e','#3b82f6','#ef4444','#64748b',
  '#6366f1','#14b8a6','#fbbf24','#a78bfa','#fb7185',
];

const EMPTY_CAT = { nombre: '', tipo: 'gasto', ambito: 'personal', color: '#3b82f6', icono: '📌' };

function CatForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_CAT);
  const setE = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.nombre.trim()) return alert('Ingresa un nombre');
    if (!form.icono.trim()) return alert('Ingresa un emoji como icono');
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo</label>
          <select value={form.tipo} onChange={setE('tipo')} className={sel}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
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
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className={lbl}>Nombre *</label>
          <input type="text" value={form.nombre} onChange={setE('nombre')} placeholder="Ej. Alimentación..." className={inp} />
        </div>
        <div>
          <label className={lbl}>Icono (emoji)</label>
          <input type="text" value={form.icono} onChange={setE('icono')} placeholder="🍔" maxLength={2} className={`${inp} text-center text-xl`} />
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

function CatGrid({ title, cats, onEdit, onDelete, txnCount }) {
  return (
    <div>
      <p className="section-title mb-3">{title}</p>
      {cats.length === 0 ? (
        <p className="text-zinc-600 text-sm">Sin categorías</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cats.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{c.icono}</span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: c.color }} />
              </div>
              <p className="text-sm font-bold text-zinc-100 truncate">{c.nombre}</p>
              <p className="text-xs text-zinc-600 mb-3">{txnCount[c.id] || 0} transacciones</p>
              <div className="flex gap-1">
                <button onClick={() => onEdit(c)} className="text-zinc-500 hover:text-blue-400 text-xs font-bold transition-colors">Editar</button>
                <span className="text-zinc-700">·</span>
                <button onClick={() => onDelete(c)} className="text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categorias() {
  const { categories, setCategories, transactions } = useFinance();
  const [modal, setModal] = useState(null);

  const txnCount = useMemo(() => {
    const map = {};
    transactions.forEach(t => { if (t.categoriaId) map[t.categoriaId] = (map[t.categoriaId] || 0) + 1; });
    return map;
  }, [transactions]);

  const save = useCallback(form => {
    if (form.id) {
      setCategories(prev => prev.map(c => c.id === form.id ? form : c));
    } else {
      setCategories(prev => [...prev, { ...form, id: getNextId(prev, 'CAT') }]);
    }
    setModal(null);
  }, [setCategories]);

  const del = cat => {
    const count = txnCount[cat.id] || 0;
    if (count > 0) {
      if (!confirm(`Esta categoría tiene ${count} transacción(es). ¿Eliminar de todas formas?`)) return;
    } else {
      if (!confirm(`¿Eliminar "${cat.nombre}"?`)) return;
    }
    setCategories(prev => prev.filter(c => c.id !== cat.id));
  };

  const sections = [
    { title: 'Gastos personales',  f: c => c.tipo === 'gasto'   && c.ambito === 'personal' },
    { title: 'Ingresos personales', f: c => c.tipo === 'ingreso' && c.ambito === 'personal' },
    { title: 'Gastos negocio',     f: c => c.tipo === 'gasto'   && c.ambito === 'negocio' },
    { title: 'Ingresos negocio',   f: c => c.tipo === 'ingreso' && c.ambito === 'negocio' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-100">Categorías</h1>
        <button onClick={() => setModal({ form: null })} className="btn-brand">+ Nueva</button>
      </div>

      {sections.map(s => (
        <CatGrid
          key={s.title}
          title={s.title}
          cats={categories.filter(s.f)}
          onEdit={c => setModal({ form: c })}
          onDelete={del}
          txnCount={txnCount}
        />
      ))}

      {modal && (
        <Modal title={modal.form ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setModal(null)}>
          <CatForm initial={modal.form} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
