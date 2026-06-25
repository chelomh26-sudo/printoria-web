export const initialConfig = {
  costLuzMin: 0.005,
  costDesgasteMin: 0.035,
  costLuzMinBambu: 0.008,
  costDesgasteMinBambu: 0.05,
  costLuzMinEnder: 0.005,
  costDesgasteMinEnder: 0.035,
  precioHoraTrabajo: 100,
  iva: 0,
  margenMinimo: 0.30,
  whatsapp: '528341112949',
  instagram: 'printoria3dstudio',
  facebook: 'printoria3dstudio',
  telefono: '8341112949',
  gmail: 'printoria3dmmh@gmail.com',
  slogan: 'Imprimiendo Posibilidades',
  ciudad: 'Victoria, Tamaulipas',
  apiKey: '',
  sobreNosotros: 'En Printoria transformamos ideas en productos reales mediante impresion 3D. Desde articulos personalizados y decoracion hasta soluciones para negocios.',
};

export const initialMaterials = [
  { id: 'M001', nombre: '',             marca: '',         rollos: 0, pesoInicial: 0,    precioRollo: 0 },
  { id: 'M002', nombre: 'PLA AMARILLO', marca: 'ELEGOO',   rollos: 3, pesoInicial: 3000, precioRollo: 290 },
  { id: 'M003', nombre: 'PLA GRIS',     marca: 'SUNLU',    rollos: 1, pesoInicial: 1000, precioRollo: 297 },
  { id: 'M004', nombre: 'PLA ROJO',     marca: 'CRALITY',  rollos: 1, pesoInicial: 1000, precioRollo: 450 },
  { id: 'M005', nombre: 'PLA GRIS',     marca: 'XINGTONG', rollos: 1, pesoInicial: 1000, precioRollo: 250 },
  { id: 'M006', nombre: 'PLA BLANCO',   marca: 'CREALITY', rollos: 3, pesoInicial: 3000, precioRollo: 265.5 },
  { id: 'M007', nombre: 'PLA AZUL',     marca: 'ELEGOO',   rollos: 1, pesoInicial: 1000, precioRollo: 290 },
  { id: 'M008', nombre: 'PLA VERDE',    marca: 'SUNLU',    rollos: 1, pesoInicial: 1000, precioRollo: 270 },
  { id: 'M009', nombre: 'PLA VERDE',    marca: 'CCTREE',   rollos: 1, pesoInicial: 1000, precioRollo: 0 },
  { id: 'M010', nombre: 'PLA VERDE',    marca: 'SUNLU',    rollos: 1, pesoInicial: 1000, precioRollo: 300 },
];

export const initialProducts = [
  { id: 'P001', nombre: 'CAJA MUNDIAL',           descripcion: 'caja para guardar estampas del mundial',    gramos: 225.52, tiempoEnder: 696,  tiempoBambu: 348,  precioVenta: 190, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P002', nombre: 'MONEDERO',               descripcion: 'monedero para el carro',                    gramos: 74.75,  tiempoEnder: 502,  tiempoBambu: 251,  precioVenta: 100, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P003', nombre: 'CUBO CARGADOR',          descripcion: 'organizador portacables',                   gramos: 36,     tiempoEnder: 204,  tiempoBambu: 102,  precioVenta: 50,  publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P004', nombre: 'AGUJA CUERDA',           descripcion: 'sacar cuerda ropa',                         gramos: 3.44,   tiempoEnder: 10.7, tiempoBambu: 5.35, precioVenta: 35,  publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P005', nombre: 'LLAVERO SUPER PAPA',     descripcion: 'llavero dia del padre estilo Superman multicolor + argolla', gramos: 3.97, tiempoEnder: 27, tiempoBambu: 13.7, precioVenta: 40, publicar: false, foto: '', descripcionPublica: '' },
  { id: 'P006', nombre: 'KEYBOARD CLICKER FIDGET',descripcion: 'fidget tipo teclado con 3 clickers + argolla', gramos: 8.07, tiempoEnder: 37, tiempoBambu: 18.5, precioVenta: 75, publicar: false, foto: '', descripcionPublica: '' },
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
  { id: 'C001', nombre: 'FRAN CRUZ',         telefono: '', instagram: '', tipo: 'MAYOREO', notas: 'Pedido cajas mundiales', fechaRegistro: '2026-06-16' },
  { id: 'C002', nombre: 'RESUMEN CAJAS',     telefono: '', instagram: '', tipo: 'MAYOREO', notas: '', fechaRegistro: '2026-06-16' },
  { id: 'C003', nombre: 'RESUMEN MONEDERO',  telefono: '', instagram: '', tipo: 'MAYOREO', notas: '', fechaRegistro: '2026-06-16' },
];

export const initialSales = [
  // --- Lotes anteriores (junio 16) ---
  { id: 'V001', fecha: '2026-06-16', clienteId: 'C002', cantidad: 17, productoId: 'P001', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
  { id: 'V002', fecha: '2026-06-16', clienteId: 'C003', cantidad: 14, productoId: 'P002', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
  { id: 'V003', fecha: '2026-06-16', clienteId: 'C002', cantidad: 2,  productoId: 'P001', materialId: 'M009', impresora: 'Bambu', extras: 0, estado: 'TERMINADO' },
  // --- Cajas del Mundial (junio 23) ---
  { id: 'V004', fecha: '2026-06-23', clienteId: '', cantidad: 6, productoId: 'P001', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', precioUnitario: 17, notas: 'Cajas del Mundial â 6 vendidas' },
  { id: 'V005', fecha: '2026-06-23', clienteId: '', cantidad: 1, productoId: 'P001', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'PROCESO',    precioUnitario: 17, notas: 'APARTADA â pendiente de cobro y entrega' },
  // --- Llavero Super Papa (junio 23) ---
  { id: 'V006', fecha: '2026-06-23', clienteId: '', cantidad: 5, productoId: 'P005', materialId: 'M007', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', precioUnitario: 40, notas: 'Llavero Super Papa â 5 vendidos' },
  { id: 'V007', fecha: '2026-06-23', clienteId: '', cantidad: 1, productoId: 'P005', materialId: 'M007', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', precioUnitario: 0,  notas: 'REGALO â Llavero Super Papa' },
  // --- Keyboard Clicker Fidget (junio 23) ---
  { id: 'V008', fecha: '2026-06-23', clienteId: '', cantidad: 3, productoId: 'P006', materialId: 'M010', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', precioUnitario: 75, notas: 'Clicker Verde â 3 vendidos' },
  { id: 'V009', fecha: '2026-06-23', clienteId: '', cantidad: 2, productoId: 'P006', materialId: 'M002', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', precioUnitario: 75, notas: 'Clicker Amarillo â 2 vendidos' },
  // --- Portacables y monederos ---
  { id: 'V010', fecha: '2026-06-23', clienteId: '', cantidad: 1, productoId: 'P003', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', notas: 'Portacables â 1 vendido' },
  { id: 'V011', fecha: '2026-06-23', clienteId: '', cantidad: 3, productoId: 'P002', materialId: 'M001', impresora: 'Bambu', extras: 0, estado: 'TERMINADO', notas: 'Monederos â 3 vendidos' },
];

export const initialMultiSales = [];

export const initialWholesale = [
  { id: 'MM001', fecha: '2026-06-16', clienteId: 'C001', productoId: 'P001', materialId: 'M003', impresora: 'Bambu', cantidad: 4, precioUnitario: 190, descuento: 40, estado: 'ENTREGADO' },
];

export const initialQuotes = [];

export const initialPersonal = [
  { id: 'UP001', fecha: '2026-06-16', descripcion: 'VERDE ACABADO',               impresora: 'Bambu', materiales: [{ materialId: 'M009', gramos: 500 }],  tiempo: 0 },
  { id: 'UP002', fecha: '2026-06-16', descripcion: 'BLANCO ACABADO',              impresora: 'Bambu', materiales: [{ materialId: 'M006', gramos: 1000 }], tiempo: 0 },
  { id: 'UP003', fecha: '2026-06-23', descripcion: 'Keyboard Clicker Fidget Verde â personal', impresora: 'Bambu', materiales: [{ materialId: 'M010', gramos: 8 }], tiempo: 0 },
];

export const initialFailures = [];

export const initialGastos = [];

export const initialProceso = [
  { orderId: 'V001',  tipo: 'venta',   hechasBambu: 0,  hechasEnder: 0, fechaEntrega: '',           pagado: false, entregado: false, estado: 'PENDIENTE' },
  { orderId: 'V002',  tipo: 'venta',   hechasBambu: 14, hechasEnder: 0, fechaEntrega: '',           pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V003',  tipo: 'venta',   hechasBambu: 2,  hechasEnder: 0, fechaEntrega: '',           pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'MM001', tipo: 'mayoreo', hechasBambu: 0,  hechasEnder: 0, fechaEntrega: '',           pagado: false, entregado: false, estado: 'PENDIENTE' },
  { orderId: 'V004',  tipo: 'venta',   hechasBambu: 6,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V005',  tipo: 'venta',   hechasBambu: 1,  hechasEnder: 0, fechaEntrega: '',           pagado: false, entregado: false, estado: 'PENDIENTE' },
  { orderId: 'V006',  tipo: 'venta',   hechasBambu: 5,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V007',  tipo: 'venta',   hechasBambu: 1,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: false, entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V008',  tipo: 'venta',   hechasBambu: 3,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V009',  tipo: 'venta',   hechasBambu: 2,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V010',  tipo: 'venta',   hechasBambu: 1,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
  { orderId: 'V011',  tipo: 'venta',   hechasBambu: 3,  hechasEnder: 0, fechaEntrega: '2026-06-23', pagado: true,  entregado: true,  estado: 'ENTREGADO' },
];

export const initialStock = [
  // Cajas del Mundial (P001) â 3 en casa
  { id: 'SK001',  fechaProduccion: '2026-06-23', productoId: 'P001', materialId: 'M001', cantidad: 3,  gramosUsados: 0,   ubicacion: 'casa',         notas: 'Cajas del Mundial' },
  // Llavero Super Papa (P005) â 9 casa + 15 Tienda Cubos
  { id: 'SK002',  fechaProduccion: '2026-06-20', productoId: 'P005', materialId: 'M007', cantidad: 9,  gramosUsados: 36,  ubicacion: 'casa',         notas: 'Llavero Super Papa â casa' },
  { id: 'SK002B', fechaProduccion: '2026-06-20', productoId: 'P005', materialId: 'M007', cantidad: 15, gramosUsados: 60,  ubicacion: 'tienda_cubos', notas: 'Llavero Super Papa â Tienda Cubos' },
  // Keyboard Clicker Fidget (P006) â 7 verdes + 9 amarillos en Tienda Cubos
  { id: 'SK003',  fechaProduccion: '2026-06-20', productoId: 'P006', materialId: 'M010', cantidad: 7,  gramosUsados: 57,  ubicacion: 'tienda_cubos', notas: 'Clicker Verde â Tienda Cubos' },
  { id: 'SK004',  fechaProduccion: '2026-06-20', productoId: 'P006', materialId: 'M002', cantidad: 9,  gramosUsados: 73,  ubicacion: 'tienda_cubos', notas: 'Clicker Amarillo â Tienda Cubos' },
  // Portacables/Cubo Cargador (P003) â 1 casa + 4 Tienda Cubos
  { id: 'SK005',  fechaProduccion: '2026-06-16', productoId: 'P003', materialId: 'M001', cantidad: 1,  gramosUsados: 36,  ubicacion: 'casa',         notas: 'Portacables â casa' },
  { id: 'SK006',  fechaProduccion: '2026-06-16', productoId: 'P003', materialId: 'M001', cantidad: 4,  gramosUsados: 144, ubicacion: 'tienda_cubos', notas: 'Portacables â Tienda Cubos' },
  // Monederos/Organizadores (P002) â 2 en casa
  { id: 'SK007',  fechaProduccion: '2026-06-16', productoId: 'P002', materialId: 'M001', cantidad: 2,  gramosUsados: 150, ubicacion: 'casa',         notas: 'Monederos â 2 restantes' },
];
