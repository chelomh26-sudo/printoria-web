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

const PAGES = {
  dashboard: Dashboard,
  config: Config,
  materiales: Materiales,
  productos: Productos,
  productosMulti: ProductosMulti,
  clientes: Clientes,
  ventas: Ventas,
  ventasMulti: VentasMulti,
  mayoreo: Mayoreo,
  cotizaciones: Cotizaciones,
  personal: UsoPersonal,
  fallas: Fallas,
  proceso: Proceso,
  cola: ColaImpresion,
  stock: Stock,
  galeria: GaleriaAdmin,
  catalogo: CatalogoPublico,
  finances: Finances,
};

function AppContent() {
  const [current, setCurrent] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  const Page = PAGES[current] || Dashboard;

  // Escucha cambios de hash para routing reactivo
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Modo catálogo público: URL con #catalogo → sin sidebar, solo vitrina
  if (hash === '#catalogo') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <CatalogoPublico />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" sty