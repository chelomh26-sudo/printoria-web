import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialConfig, initialMaterials, initialProducts, initialMultiProducts,
  initialClients, initialSales, initialMultiSales, initialWholesale,
  initialQuotes, initialPersonal, initialFailures, initialProceso, initialGastos,
} from '../data/initialData';
import { sbGet, sbSet, SUPABASE_READY } from '../lib/supabase';

const initialCola = { bambu: [], ender: [] };

/* ── localStorage only (preferencias UI, no necesitan sincronización) ── */
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

/* ── Supabase + localStorage fallback (todos los datos de negocio) ─── */
function usePublicState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : defaultValue;
    } catch { return defaultValue; }
  });

  // Al montar: carga desde Supabase si está disponible
  useEffect(() => {
    if (!SUPABASE_READY) return;
    sbGet(key).then(remote => {
      if (remote !== null) setState(remote);
    });
  }, [key]);

  // Guarda en localStorage Y en Supabase simultáneamente
  const setPublic = useCallback((valueOrFn) => {
    setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      localStorage.setItem(key, JSON.stringify(next));
      sbSet(key, next);
      return next;
    });
  }, [key]);

  return [state, setPublic];
}

const Ctx = createContext(null);

export function PrintoriaProvider({ children }) {
  // Preferencias UI — solo localStorage
  const [theme, setTheme]               = usePersistentState('printoria_theme', 'dark');
  const [selectedMonth, setSelectedMonth] = usePersistentState('printoria_selectedMonth', 'all');
  const [cola, setCola]                 = usePersistentState('printoria_cola', initialCola);

  // Datos de negocio — Supabase + localStorage fallback
  const [_config, setConfig]            = usePublicState('printoria_config',       initialConfig);
  const config = { ...initialConfig, ..._config };

  const [products, setProducts]         = usePublicState('printoria_products',     initialProducts);
  const [galeriaFotos, setGaleriaFotos] = usePublicState('printoria_galeria',      []);
  const [materials, setMaterials]       = usePublicState('printoria_materials',    initialMaterials);
  const [multiProducts, setMultiProducts] = usePublicState('printoria_multiProducts', initialMultiProducts);
  const [clients, setClients]           = usePublicState('printoria_clients',      initialClients);
  const [sales, setSales]               = usePublicState('printoria_sales',        initialSales);
  const [multiSales, setMultiSales]     = usePublicState('printoria_multiSales',   initialMultiSales);
  const [wholesale, setWholesale]       = usePublicState('printoria_wholesale',    initialWholesale);
  const [quotes, setQuotes]             = usePublicState('printoria_quotes',       initialQuotes);
  const [personal, setPersonal]         = usePublicState('printoria_personal',     initialPersonal);
  const [failures, setFailures]         = usePublicState('printoria_failures',     initialFailures);
  const [proceso, setProceso]           = usePublicState('printoria_proceso',      initialProceso);
  const [gastos, setGastos]             = usePublicState('printoria_gastos',       initialGastos);
  const [stock, setStock]               = usePublicState('printoria_stock',        []);
  const [addons, setAddons]             = usePublicState('printoria_addons',       []);

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
