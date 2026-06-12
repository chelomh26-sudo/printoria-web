export function calcCostoPorGramo(material) {
  if (!material || !material.pesoInicial || material.pesoInicial === 0) return 0;
  return (material.precioRollo * (material.rollos || 1)) / material.pesoInicial;
}

export function calcConsumedGrams(materialId, { sales, products, multiSales, wholesale, personal, failures }) {
  let consumed = 0;
  sales.forEach(s => {
    if (s.materialId === materialId) {
      const p = products.find(x => x.id === s.productoId);
      if (p) consumed += (s.cantidad || 1) * p.gramos;
    }
  });
  multiSales.forEach(s => {
    (s.materiales || []).forEach(m => {
      if (m.materialId === materialId) consumed += m.gramos || 0;
    });
  });
  wholesale.forEach(w => {
    if (w.materialId === materialId) {
      const p = products.find(x => x.id === w.productoId);
      if (p) consumed += (w.cantidad || 1) * p.gramos;
    }
  });
  personal.forEach(u => {
    (u.materiales || []).forEach(m => {
      if (m.materialId === materialId) consumed += m.gramos || 0;
    });
  });
  failures.forEach(f => {
    if (f.materialId === materialId) consumed += f.gramosPerdidos || 0;
  });
  return consumed;
}

export function getMaterialStatus(restante) {
  if (restante <= 50) return { label: 'AGOTADO', emoji: '🔴', cls: 'text-red-400 bg-red-400/10' };
  if (restante < 200) return { label: 'PEDIR', emoji: '🟡', cls: 'text-yellow-400 bg-yellow-400/10' };
  return { label: 'OK', emoji: '🟢', cls: 'text-green-400 bg-green-400/10' };
}

function getPrinterRates(impresora, config) {
  if (impresora === 'Bambu') {
    return {
      costLuz: config.costLuzMinBambu ?? config.costLuzMin,
      costDesgaste: config.costDesgasteMinBambu ?? config.costDesgasteMin,
    };
  }
  return {
    costLuz: config.costLuzMinEnder ?? config.costLuzMin,
    costDesgaste: config.costDesgasteMinEnder ?? config.costDesgasteMin,
  };
}

export function calcSaleCosts(sale, product, material, config) {
  if (!product || !config) return null;
  const tiempo = sale.impresora === 'Bambu' ? product.tiempoBambu : product.tiempoEnder;
  const tiempoTotal = tiempo * (sale.cantidad || 1);
  const gramosTotal = product.gramos * (sale.cantidad || 1);
  const cpg = material ? calcCostoPorGramo(material) : 0;
  const { costLuz, costDesgaste } = getPrinterRates(sale.impresora, config);
  const costoLuz = tiempoTotal * costLuz;
  const costoDesgaste = tiempoTotal * costDesgaste;
  const costoMaterial = gramosTotal * cpg;
  const costoTotal = costoLuz + costoDesgaste + costoMaterial + (sale.extras || 0);
  const precioUnitario = product.precioVenta;
  const precioPedido = precioUnitario * (sale.cantidad || 1);
  const ganancia = precioPedido - costoTotal;
  const margen = precioPedido > 0 ? ganancia / precioPedido : 0;
  return { tiempoTotal, gramosTotal, costoLuz, costoDesgaste, costoMaterial, costoTotal, precioUnitario, precioPedido, ganancia, margen };
}

export function calcWholesaleCosts(w, product, material, config) {
  if (!product || !config) return null;
  const tiempo = w.impresora === 'Bambu' ? product.tiempoBambu : product.tiempoEnder;
  const tiempoTotal = tiempo * (w.cantidad || 1);
  const gramosTotal = product.gramos * (w.cantidad || 1);
  const cpg = material ? calcCostoPorGramo(material) : 0;
  const { costLuz, costDesgaste } = getPrinterRates(w.impresora, config);
  const costoLuz = tiempoTotal * costLuz;
  const costoDesgaste = tiempoTotal * costDesgaste;
  const costoMaterial = gramosTotal * cpg;
  const costoProduccion = costoLuz + costoDesgaste + costoMaterial;
  const precioConDesc = (w.precioUnitario || 0) - (w.descuento || 0);
  const total = precioConDesc * (w.cantidad || 1);
  const ganancia = total - costoProduccion;
  return { tiempoTotal, gramosTotal, costoLuz, costoDesgaste, costoMaterial, costoProduccion, precioConDesc, total, ganancia };
}

export function getNextId(items, prefix) {
  const nums = items.map(i => parseInt(i.id.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export const fmt = (v, d = 2) => {
  if (v === null || v === undefined || isNaN(v)) return '$0.00';
  return `$${Number(v).toFixed(d)}`;
};

export const fmtN = (v, d = 2) => {
  if (v === null || v === undefined || isNaN(v)) return '0';
  return Number(v).toFixed(d);
};

export const fmtTime = mins => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h === 0 ? `${m}min` : `${h}h ${m}m`;
};

export function getSemaphore(fechaEntrega, estado) {
  if (estado === 'ENTREGADO' || estado === 'CANCELADO') return null;
  if (!fechaEntrega) return { emoji: '⚪', label: 'SIN FECHA' };
  const diff = (new Date(fechaEntrega) - new Date()) / 3600000;
  if (diff < 0) return { emoji: '🔴', label: 'VENCIDO' };
  if (diff < 48) return { emoji: '🟡', label: 'URGENTE' };
  return { emoji: '🟢', label: 'A TIEMPO' };
}

export const TODAY = () => new Date().toISOString().split('T')[0];
