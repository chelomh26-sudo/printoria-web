import { useState, useEffect } from 'react';
import { PrintoriaProvider } from './store/PrintoriaContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Config from './pages/Config';
import Materiales from './pages/Materiales';
import Productos from './pages/Productos';
import ProductosMulti from './pages/ProductosMulti';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import VentasMulti from './pages/VentasMulti';
import Mayoreo from './pages/Mayoreo';
import Cotizaciones from './pages/Cotizaciones';
import UsoPersonal from './pages/UsoPersonal';
import Fallas from './pages/Fallas';
import Proceso from './pages/Proceso';
import CatalogoPublico from './pages/CatalogoPublico';
import Finances from './pages/Finances';
import ColaImpresion from './pages/ColaImpresion';
import Stock from './pages/Stock';
import GaleriaAdmin from './pages/GaleriaAdmin';
import ChatPanel from './components/ChatPanel';

const ADMIN_PASSWORD = 'Chelo@2696';

function AdminLogin({ onLogin }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) { onLogin(); }
    else { setError(true); setPwd(''); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#e1e0e0' }}>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8 w-80 space-y-5">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Printoria" className="h-14 mx-auto object-contain" />
          <p className="text-zinc-400 text-sm">Panel de administración</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Contraseña</label>
          <input
            type="password"
            autoFocus
            className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-4 py-2.5 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none"
            placeholder="••••••••••"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(false); }}
          />
        