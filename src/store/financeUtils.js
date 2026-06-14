export const fmt = (v, simbolo = '$') =>
  `${simbolo}${Math.abs(Number(v || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtSigned = (v, simbolo = '$') => {
  const abs = Math.abs(Number(v || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-${simbolo}${abs}` : `${simbolo}${abs}`;
};

export const TODAY = () => new Date().toISOString().split('T')[0];

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export function getNextId(items, prefix) {
  const nums = items.map(i => parseInt(i.id.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export const filterByMonth = (txns, month) =>
  month === 'all' ? txns : txns.filter(t => t.fecha.startsWith(month));

export function getLastNMonths(n = 6) {
  const result = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    result.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

export function getMonthlyTotals(transactions, months) {
  const LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return months.map(month => {
    const txns = filterByMonth(transactions.filter(t => t.tipo !== 'transferencia'), month);
    const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
    const gastos   = txns.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
    const [, m] = month.split('-');
    return { month, label: LABELS[parseInt(m) - 1], ingresos, gastos, ahorro: ingresos - gastos };
  });
}

export function getAccountBalance(account, transactions) {
  let balance = account.balanceInicial || 0;
  transactions.forEach(t => {
    if (t.cuentaId === account.id) {
      if (t.tipo === 'ingreso') balance += t.monto;
      else balance -= t.monto;
    }
    if (t.cuentaDestinoId === account.id && t.tipo === 'transferencia') {
      balance += t.monto;
    }
  });
  return balance;
}

export function isConfirmadoEsteMes(recurrenteId, confirmaciones, mes) {
  return confirmaciones.some(c => c.recurrenteId === recurrenteId && c.mes === mes);
}

export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const monthLabel = m => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${MESES[parseInt(mo) - 1]} ${y}`;
};
