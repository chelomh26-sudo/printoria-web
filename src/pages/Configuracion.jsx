import { useState } from 'react';
import { useFinance } from '../store/FinanceContext';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder-zinc-500 transition-colors';
const lbl = 'block text-xs font-medium text-zinc-500 mb-1';
const sel = `${inp} cursor-pointer`;

const LS_KEYS = [
  'finance_config', 'finance_accounts', 'finance_categories',
  'finance_transactions', 'finance_recurrentes', 'finance_confirmaciones',
];

export default function Configuracion() {
  const { config, setConfig, accounts, setAccounts } = useFinance();

  const [form, setForm] = useState({ ...config });
  const [pinForm, setPinForm] = useState({ actual: '', nuevo: '', confirmar: '' });
  const [pinMsg, setPinMsg] = useState('');

  const setE  = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPE  = k => e => setPinForm(f => ({ ...f, [k]: e.target.value }));

  const saveConfig = () => {
    setConfig({ ...config, nombre: form.nombre, moneda: form.moneda, simbolo: form.simbolo });
    alert('Configuración guardada');
  };

  const changePin = () => {
    if (pinForm.actual !== config.password) { setPinMsg('PIN actual incorrecto'); return; }
    if (pinForm.nuevo.length < 4) { setPinMsg('El nuevo PIN debe tener al menos 4 caracteres'); return; }
    if (pinForm.nuevo !== pinForm.confirmar) { setPinMsg('Los PINs no coinciden'); return; }
    setConfig(c => ({ ...c, password: pinForm.nuevo }));
    setPinForm({ actual: '', nuevo: '', confirmar: '' });
    setPinMsg('PIN cambiado correctamente ✓');
    setTimeout(() => setPinMsg(''), 3000);
  };

  const updateBalanceInicial = (id, val) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balanceInicial: Number(val) || 0 } : a));
  };

  const backup = () => {
    const data = {};
    LS_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const valid = LS_KEYS.some(k => k in data);
        if (!valid) return alert('Archivo de backup inválido');
        if (!confirm('¿Restaurar backup? Se sobreescribirán todos los datos actuales.')) return;
        LS_KEYS.forEach(k => { if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k])); });
        window.location.reload();
      } catch {
        alert('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-zinc-100">Configuración</h1>

      {/* Config general */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <p className="section-title">General</p>
        <div>
          <label className={lbl}>Nombre de la app</label>
          <input type="text" value={form.nombre} onChange={setE('nombre')} className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Moneda</label>
            <select value={form.moneda} onChange={e => {
              const map = { MXN: '$', USD: 'US$', EUR: '€' };
              setForm(f => ({ ...f, moneda: e.target.value, simbolo: map[e.target.value] || f.simbolo }));
            }} className={sel}>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Símbolo</label>
            <input type="text" value={form.simbolo} onChange={setE('simbolo')} maxLength={4} className={inp} />
          </div>
        </div>
        <button onClick={saveConfig} className="btn-brand">Guardar cambios</button>
      </div>

      {/* Cambiar PIN */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <p className="section-title">Cambiar PIN</p>
        <div>
          <label className={lbl}>PIN actual</label>
          <input type="password" value={pinForm.actual} onChange={setPE('actual')} placeholder="••••" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Nuevo PIN</label>
            <input type="password" value={pinForm.nuevo} onChange={setPE('nuevo')} placeholder="••••" className={inp} />
          </div>
          <div>
            <label className={lbl}>Confirmar PIN</label>
            <input type="password" value={pinForm.confirmar} onChange={setPE('confirmar')} placeholder="••••" className={inp} />
          </div>
        </div>
        {pinMsg && <p className={`text-sm ${pinMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{pinMsg}</p>}
        <button onClick={changePin} className="btn-outline">Cambiar PIN</button>
      </div>

      {/* Balances iniciales */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <p className="section-title">Balances iniciales</p>
        <p className="text-xs text-zinc-500">Ajusta el saldo inicial de cada cuenta. Útil para configurar el punto de partida.</p>
        <div className="space-y-2">
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color }} />
              <span className="text-sm text-zinc-300 flex-1">{a.nombre}</span>
              <input
                type="number"
                step="0.01"
                defaultValue={a.balanceInicial}
                onBlur={e => updateBalanceInicial(a.id, e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:border-blue-500 focus:outline-none w-32 text-right"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Backup / Restore */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <p className="section-title">Backup y restauración</p>
        <p className="text-xs text-zinc-500">Descarga todos tus datos como JSON para respaldarlos o migrarlos.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={backup} className="btn-brand">⬇ Descargar backup</button>
          <label className="btn-outline cursor-pointer">
            ⬆ Restaurar backup
            <input type="file" accept=".json" className="hidden" onChange={restore} />
          </label>
        </div>
        <p className="text-[10px] text-zinc-600">⚠ Restaurar un backup sobreescribirá todos los datos actuales</p>
      </div>
    </div>
  );
}
