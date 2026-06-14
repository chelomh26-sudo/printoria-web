import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialConfig, initialAccounts, initialCategories,
  initialTransactions, initialRecurrentes, initialConfirmaciones,
} from '../data/financeInitialData';
import { getAccountBalance } from './financeUtils';

const Ctx = createContext(null);

function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }, [key, state]);

  return [state, setState];
}

export function FinanceProvider({ children }) {
  const [config, setConfig]                 = usePersistentState('finance_config',         initialConfig);
  const [accounts, setAccounts]             = usePersistentState('finance_accounts',        initialAccounts);
  const [categories, setCategories]         = usePersistentState('finance_categories',      initialCategories);
  const [transactions, setTransactions]     = usePersistentState('finance_transactions',    initialTransactions);
  const [recurrentes, setRecurrentes]       = usePersistentState('finance_recurrentes',     initialRecurrentes);
  const [confirmaciones, setConfirmaciones] = usePersistentState('finance_confirmaciones',  initialConfirmaciones);

  const calcBalance = useCallback(
    (account) => getAccountBalance(account, transactions),
    [transactions],
  );

  const totalBalance = accounts.reduce((sum, a) => sum + calcBalance(a), 0);

  return (
    <Ctx.Provider value={{
      config, setConfig,
      accounts, setAccounts,
      categories, setCategories,
      transactions, setTransactions,
      recurrentes, setRecurrentes,
      confirmaciones, setConfirmaciones,
      calcBalance,
      totalBalance,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFinance must be inside FinanceProvider');
  return ctx;
}
