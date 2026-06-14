export const initialConfig = {
  password: '2696',
  moneda: 'MXN',
  simbolo: '$',
  nombre: 'Mis Finanzas',
};

export const initialAccounts = [
  { id: 'CTA001', nombre: 'Efectivo',          tipo: 'efectivo',    balanceInicial: 0, color: '#22c55e' },
  { id: 'CTA002', nombre: 'Banco',             tipo: 'banco',       balanceInicial: 0, color: '#3b82f6' },
  { id: 'CTA003', nombre: 'Tarjeta Crédito',   tipo: 'credito',     balanceInicial: 0, color: '#ef4444' },
  { id: 'CTA004', nombre: 'Printoria Negocio', tipo: 'banco',       balanceInicial: 0, color: '#f97316' },
];

export const initialCategories = [
  { id: 'CAT001', nombre: 'Alimentación',     tipo: 'gasto',   ambito: 'personal', color: '#f97316', icono: '🍔' },
  { id: 'CAT002', nombre: 'Transporte',        tipo: 'gasto',   ambito: 'personal', color: '#8b5cf6', icono: '🚗' },
  { id: 'CAT003', nombre: 'Renta',             tipo: 'gasto',   ambito: 'personal', color: '#ec4899', icono: '🏠' },
  { id: 'CAT004', nombre: 'Entretenimiento',   tipo: 'gasto',   ambito: 'personal', color: '#06b6d4', icono: '🎮' },
  { id: 'CAT005', nombre: 'Salud',             tipo: 'gasto',   ambito: 'personal', color: '#10b981', icono: '💊' },
  { id: 'CAT006', nombre: 'Ropa',              tipo: 'gasto',   ambito: 'personal', color: '#f59e0b', icono: '👕' },
  { id: 'CAT007', nombre: 'Sueldo',            tipo: 'ingreso', ambito: 'personal', color: '#22c55e', icono: '💼' },
  { id: 'CAT008', nombre: 'Otros ingresos',    tipo: 'ingreso', ambito: 'personal', color: '#3b82f6', icono: '💰' },
  { id: 'CAT009', nombre: 'Materiales',        tipo: 'gasto',   ambito: 'negocio',  color: '#64748b', icono: '🧵' },
  { id: 'CAT010', nombre: 'Electricidad',      tipo: 'gasto',   ambito: 'negocio',  color: '#fbbf24', icono: '⚡' },
  { id: 'CAT011', nombre: 'Equipos',           tipo: 'gasto',   ambito: 'negocio',  color: '#6366f1', icono: '🖨️' },
  { id: 'CAT012', nombre: 'Otros gastos biz',  tipo: 'gasto',   ambito: 'negocio',  color: '#94a3b8', icono: '📦' },
  { id: 'CAT013', nombre: 'Ventas 3D',         tipo: 'ingreso', ambito: 'negocio',  color: '#f97316', icono: '🖨️' },
  { id: 'CAT014', nombre: 'Mayoreo',           tipo: 'ingreso', ambito: 'negocio',  color: '#22c55e', icono: '🏪' },
];

export const initialTransactions = [];
export const initialRecurrentes = [];
export const initialConfirmaciones = [];
