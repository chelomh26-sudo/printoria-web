import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialConfig, initialMaterials, initialProducts, initialMultiProducts,
  initialClients, initialSales, initialMultiSales, initialWholesale,
  initialQuotes, initialPersonal, initialFailures, initialProceso, initialGastos,
  initialStock,
} from '../data/initialData';
import { sbGet, sbSet, SUPABASE_READY } from '../lib/supabase';

// Incrementa este valor cada vez que se actualicen los datos en initialData.js
// para forzar un reset del localStorage en todos los browsers.
const DATA_VERSION = '20260625-v2';

const initialCola = { bambu: [], ender: [] };

/* ââ localStorage persistente (datos privados) ââââââââââââ */
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState];
}

/* ââ Supabase + localStorage (datos pÃºblicos del catÃ¡logo) â */
function usePublicState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : defaultValue;
    } catch { return defaultValue; }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!SUPABASE_READY) { setLoaded(true); return; }
    sbGet(key).then(remote => {
      if (remote !== null) setState(remote);
      setLoaded(true);
    });
  }, [key]);

  const setPublic = useCallback((valueOrFn) => {
    setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      localStorage.setItem(key, JSON.stringify(next));
      sbSet(key, next);
      return next;
    });
  }, [key]);

  return [state, setPublic, loaded];
}

const Ctx = createContext(null);

export function PrintoriaProvider({ children }) {
  // ââ Reset de localStorage cuando DATA_VERSION cambia ââââââââââ
  useEffect(() => {
    const stored = localStorage.getItem('printoria_data_version');
    if (stored !== DATA_VERSION) {
      const keys = [
        'printoria_sales', 'printoria_products', 'printoria_materials',
        'printoria_clients', 'printoria_stock', 'printoria_proceso',
        'printoria_personal', 'printoria_failures', 'printoria_gastos',
        'printoria_wholesale', 'printoria_quotes', 'printoria_multiProducts',
        'printoria_multiSales', 'printoria_addons', 'printoria_config',
      ];
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('printoria_data_version', DATA_VERSION);
      window.location.reload();
    }
  }, []);

  const [theme, setTheme] = usePersistentState('printoria_theme', 'dark');

  // Datos PÃBLICOS â se sincronizan con Supabase
  const [_config, setConfigRaw, configLoaded] = usePublicState('printoria_config', initialConfig);
  const config = { ...initialConfig, ..._config };
  const setConfig = setConfigRaw;

  const [products, setProducts, productsLoaded] = usePublicState('printoria_products', initialProducts);
  const [galeriaFotos, setGaleriaFotos] = usePublicState('printoria_galeria', []);

  // Datos PRIVADOS â solo localStorage
  const [materials, setMaterials] = usePersistentState('printoria_materials', initialMaterials);
  const [multiProducts, setMultiProducts] = usePersistentState('printoria_multiProducts', initialMultiProducts);
  const [clients, setClients] = usePersistentState('printoria_clients', initialClients);
  const [sales, setSales] = usePersistentState('printoria_sales', initialSales);
  const [multiSales, setMultiSales] = usePersistentState('printoria_multiSales', initialMultiSales);
  const [wholesale, setWholesale] = usePersistentState('printoria_wholesale', initialWholesale);
  const [quotes, setQuotes] = usePersistentState('printoria_quotes', initialQuotes);
  const [personal, setPersonal] = usePersistentState('printoria_personal', initialPersonal);
  const [failures, setFailures] = usePersistentState('printoria_failures', initialFailures);
  const [proceso, setProceso] = usePersistentState('printoria_proceso', initialProceso);
  const [gastos, setGastos] = usePersistentState('printoria_gastos', initialGastos);
  const [selectedMonth, setSelectedMonth] = usePersistentState('printoria_selectedMonth', 'all');
  const [cola, setCola] = usePersistentState('printoria_cola', initialCola);
  const [stock, setStock] = usePersistentState('printoria_stock', initialStock);
  const [addons, setAddons] = usePersistentState('printoria_addons', []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Ctx.Provider value={{
      theme, setTheme,
      config, setConfig,
      materials, setMaterials,
      products, setProducts,
      multiProducts, setMultiProducts,
      clients, setClients,
      sales, setSales,
      multiSales, setMultiSales,
      wholesale, setWholesale,
      quotes, setQuotes,
      personal, setPersonal,
      failures, setFailures,
      proceso, setProceso,
      gastos, setGastos,
      selectedMonth, setSelectedMonth,
      cola, setCola,
      stock, setStock,
      addons, setAddons,
      galeriaFotos, setGaleriaFotos,
      supabaseReady: SUPABASE_READY,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePrintoria() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePrintoria must be inside PrintoriaProvider');
  return ctx;
}
