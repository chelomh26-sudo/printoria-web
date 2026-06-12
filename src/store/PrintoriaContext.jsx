import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialConfig, initialMaterials, initialProducts, initialMultiProducts,
  initialClients, initialSales, initialMultiSales, initialWholesale,
  initialQuotes, initialPersonal, initialFailures, initialProceso, initialGastos,
} from '../data/initialData';
import { sbGet, sbSet, SUPABASE_READY } from '../lib/supabase';

const initialCola = { bambu: [], ender: [] };

/* -- localStorage persistente (datos privados) -- */
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

/* -- Supabase + localStorage (datos publicos del catalogo) -- */
function usePublicState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : defaultValue;
    } catch { return defaultValue; }
  });
  const [loaded, setLoaded] = useState(false);

  // On mount: if Supabase is ready, load from there
  useEffect(() => {
    if (!SUPABASE_READY) { setLoaded(true); return; }
    sbGet(key).then(remote => {
      if (remote !== null) setState(remote);
      setLoaded(true);
    });
  }, [key]);

  // Wrapper that saves to localStorage AND Supabase
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
  const [theme, setTheme] = usePersistentState('printoria_theme', 'dark');

  // PUBLIC data - synced with Supabase
  const [_config, setConfigRaw, configLoaded] = usePublicState('printoria_config', initialConfig);
  const config = { ...initialConfig, ..._config };
  const setConfig = setConfigRaw;

  const [products, setProducts, productsLoaded] = usePublicState('printoria_products', initialProducts);
  const [galeriaFotos, setGaleriaFotos] = usePublicState('printoria_galeria', []);

  // PRIVATE data - localStorage only
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
  const [stock, setStock] = usePersistentState('printoria_stock', []);

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
      galeriaFotos, setGaleriaFotos,
      // Loading indicators (useful for showing spinner while loading from Supabase)
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
