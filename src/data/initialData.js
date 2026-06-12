export const initialConfig = {
  costLuzMin: 0.005,
  costDesgasteMin: 0.035,
  // Tarifas por impresora (si están vacías usa las generales)
  costLuzMinBambu: 0.008,
  costDesgasteMinBambu: 0.05,
  costLuzMinEnder: 0.005,
  costDesgasteMinEnder: 0.035,
  precioHoraTrabajo: 100,
  iva: 0,
  margenMinimo: 0.30,
  // Catálogo público
  whatsapp: '528341112949',
  instagram: 'printoria3dstudio',
  facebook: 'printoria3dstudio',
  telefono: '8341112949',
  gmail: 'printoria3dmmh@gmail.com',
  slogan: 'Imprimiendo Posibilidades',
  ciudad: 'Victoria, Tamaulipas',
  apiKey: '',
  sobreNosotros: 'En Printoria transformamos ideas en productos reales mediante impresión 3D. Desde artículos personalizados y decoración hasta soluciones para negocios.',
};

export const initialMaterials = [
  { id: 'M001', nombre: '', marca: '', rollos: 0, pesoInicial: 0, precioRollo: 0 },
  { id: 'M002', nombre: 'PLA AMARILLO', marca: 'ELEGOO', rollos: 3, pesoInicial: 3000, precioRollo: 290 },
  { id: 'M003', nombre: 'PLA GRIS', marca: 'SUNLU', rollos: 1, pesoInicial: 1000, precioRollo: 297 },
  { id: 'M004', nombre: 'PLA ROJO', marca: 'CRALITY', rollos: 1, pesoInicial: 1000, precioRollo: 450 },
  { id: 'M005', nombre: 'PLA GRIS', marca: 'XINGTONG', rollos: 1, pesoInicial: 1000, precioRollo: 250 },
  { id: 'M006', nombre: 'PLA BLANCO', marca: 'CREALITY', rollos: 3, pesoInicial: 3000, precioRollo: 265.5 },
  { id: 'M007', nombre: 'PLA AZUL', marca: 'ELEGOO', rollos: 1, pesoInicial: 1000, precioRollo: 290 },
  { id: 'M008', nombre: 'PLA VERDE', marca: 'SUNLU', rollos: 1, pesoInicial: 1000, precioRollo: 270 },
  { id: 'M009', nombre: 'PLA VERDE', marca: 'CCTREE', rollos: 1, pesoInicial: 1000, precioRollo: 0 },
];

export const initialProducts = [
  { id: 'P001', nombre: 'CAJA MUNDIAL', descripcion: 'caja para guardar estampas', gramos: 225.52, tiempoEnder: 696, tiempoBambu: 348, precioVenta: 190, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P002', nombre: 'MONEDERO', descripcion: 'monedero para el carro', gramos: 74.75, tiempoEnder: 502, tiempoBambu: 251, precioVenta: 100, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P003', nombre: 'CUBO CARGADOR', descripcion: 'guarda cables', gramos: 36, tiempoEnder: 204, tiempoBambu: 102, precioVenta: 50, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P004', nombre: 'AGUJA CUERDA', descripcion: 'sacar cuerda ropa', gramos: 3.44, tiempoEnder: 10.7, tiempoBambu: 5.35, precioVenta: 35, publicar: false, foto: '', descripcionPublica: '' },
];

export const initialMultiProducts = [
  {
    id: 'PM001', nombre: '', descripcion: '',
    slots: [
      { label: '', gramos: 0 },
      { label: '', gramos: 0 },
      { label: '', gramos: 0 },
      { label: '', gramos: 0 },
    ],
    tiempoBambu: 0, precioVenta: 0, publicar: false, foto: '', descripcionPublica: '',
  },
];

export const initialClients = [
  { id: 'C001', nombre: 'FRAN CRUZ', telefono: '', instagram: '', tipo: 'MAYOREO', notas: 'Pedido cajas mundiales', fechaRegistro: '2026-06-16' },
  { id: 'C002', nombre: 'RESUMEN CAJAS', telefono: '', instagram: '', tipo: 'MAYOREO', notas: '', fechaRegistro: '2026-06-16' },
  { id: 'C003', nombre: 'RESUMEN MONEDERO', telefono: '', instagram: '', tipo: 'MAYOREO', notas: '', fechaRegistro: '2026-06-16' },
];

export const initialSales = [
  { id: 'V001', fecha: '2026-06-16', clienteId: 'C002', cantidad: 17, productoId: 'P001', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
  { id: 'V002', fecha: '2026-06-16', clienteId: 'C003', cantidad: 14, productoId: 'P002', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
  { id: 'V003', fecha: '2026-06-16', clienteId: 'C002', cantidad: 2, productoId: 'P001', materialId: 'M009', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
];

export const initialMultiSales = [];

export const initialWholesale = [
  { id: 'MM001', fecha: '2026-06-16', clienteId: 'C001', productoId: 'P001', materialId: 'M003', impresora: 'Bambu', cantidad: 4, precioUnitario: 190, descuento: 40, estado: 'ENTREGADO' },
];

export const initialQuotes = [];

export const initialPersonal = [
  { id: 'UP001', fecha: '2026-06-16', descripcion: 'VERDE ACABADO', impresora: 'Bambu', materiales: [{ materialId: 'M009', gramos: 500 }], tiempo: 0 },
  { id: 'UP002', fecha: '2026-06-16', descripcion: 'BLANCO ACABADO', impresora: 'Bambu', materiales: [{ materialId: 'M006', gramos: 1000 }], tiempo: 0 },
];

export const initialFailures = [];

export const initialGastos = [];

export const initialProceso = [
  { orderId: 'V001', tipo: 'venta', hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: false, estado: 'PENDIENTE' },
  { orderId: 'V002', tipo: 'venta', hechasBambu: 14, hechasEnder: 0, fechaEntrega: '', pagado: true, entregado: true, estado: 'ENTREGADO' },
  { orderId: 'V003', tipo: 'venta', hechasBambu: 2, hechasEnder: 0, fechaEntrega: '', pagado: true, entregado: true, estado: 'ENTREGADO' },
  { orderId: 'MM001', tipo: 'mayoreo', hechasBambu: 0, hechasEnder: 0, fechaEntrega: '', pagado: false, entregado: