import { useState } from 'react';
import { FinanceProvider, useFinance } from './store/FinanceContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transacciones from './pages/Transacciones';
import Recurrentes from './pages/Recurrentes';
import Cuentas from './pages/Cuentas';
import Reportes from './pages/Reportes';
import Categorias from './pages/Categorias';
import Configuracion from './pages/Configuracion';

const PAGES = {
  dashboard:     Dashboard,
  transacciones: Transacciones,
  recurrentes:   Recurrentes,
  cuentas:       Cuentas,
  reportes:      Reportes,
  categorias:    Categorias,
  configuracion: Configuracion,
};

const pinInp = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-lg tracking-widest text-center focus:border-blue-500 focus:outline-none placeholder-zinc-600 transition-colors';

function PinGate({ onUnlock }) {
  const { config } = useFinance();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const check = () => {
    if (pin === config.password) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-xs shadow-2xl text-center">
        <div className="text-4xl mb-3">💰</div>
        <h1 className="text-xl font-black text-zinc-100 mb-1">{config.nombre}</h1>
        <p className="text-xs text-zinc-500 mb-6">Ingresa tu PIN para continuar</p>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="••••"
          maxLength={20}
          className={`${pinInp} ${error ? 'border-red-500' : ''} mb-3`}
          autoFocus
        />
        {error && <p className="text-xs text-red-400 mb-3">PIN incorrecto</p>}
        <button onClick={check} className="btn-brand w-full">Entrar</button>
      </div>
    </div>
  );
}

function AppContent() {
  const [current, setCurrent] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  const Page = PAGES[current] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar
        current={current}
        setCurrent={setCurrent}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="flex-1 overflow-auto bg-zinc-950">
        <Page navigate={setCurrent} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
