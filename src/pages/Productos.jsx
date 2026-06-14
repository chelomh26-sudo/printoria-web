import { useState, useMemo, useRef } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
import Modal from '../components/Modal';
import { getNextId, fmt, fmtN, fmtTime } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
const ro = 'w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-400 text-sm';

const CATEGORIAS = ['Temporada','Hogar','Negocios','Decoración','Regalos','Cocina','Juguetes/Fidget','Colección','Eventos Sociales','Macetas','Deportes','Día a día'];

function empty(products) {
  return { id: getNextId(products, 'P'), nombre: '', descripcion: '', gramos: 0, tiempoEnder: 0, tiempoBambu: 0, precioVenta: 0, publicar: false, foto: '', descripcionPublica: '', categorias: [], videoUrl: '', _new: true };
}

function ProductoForm({ data, config, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const fotoRef = useRef();
  const [uploadingFoto, setUploadingFoto] = useState(false);

  async function handleFotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const url = await compressImage(file);
      set('foto', url);
    } catch { alert('Error al procesar la imagen'); }
    setUploadingFoto(false);
    e.target.value = '';
  }

  const calcs = useMemo(() => {
    const costoLuzEnder = (f.tiempoEnder || 0) * config.costLuzMin;
    const costoDesgasteEnder = (f.tiempoEnder || 0) * config.costDesgasteMin;
    const costoLuzBambu = (f.tiempoBambu || 0) * config.costLuzMin;
    const costoDesgasteBambu = (f.tiempoBambu || 0) * config.costDesgasteMin;
    const totalEnder = costoLuzEnder + costoDesgasteEnder;
    const totalBambu = costoLuzBambu + costoDesgasteBambu;
    return { costoLuzEnder, costoDesgasteEnder, costoLuzBambu, costoDesgasteBambu, totalEnder, totalBambu };
  }, [f.tiempoEnder, f.tiempoBambu, config]);

  function submit(e) {
    e.preventDefault();
    if (!f.nombre.trim()) return alert('Nombre requerido');
    onSave({ ...f, gramos: Number(f.gramos), tiempoEnder: Number(f.tiempoEnder), tiempoBambu: Number(f.tiempoBambu), precioVenta: Number(f.precioVenta) });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ID *</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} />
        </div>
        <div>
          <label className={lbl}>Precio venta ($)</label>
          <input type="number" step="0.01" className={inp} value={f.precioVenta} onChange={e => set('precioVenta', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Nombre *</label>
          <input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} placeholder="NOMBRE DEL PRODUCTO" />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Descripción interna</label>
          <input className={inp} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción corta" />
        </div>
        <div>
          <label className={lbl}>Gramos por pieza (g)</label>
          <input type="number" step="0.01" min="0" className={inp} value={f.gramos} onChange={e => set('gramos', e.target.value)} />
        </div>
        <div />
        <div>
          <label className={lbl}>Tiempo Ender (min)</label>
          <input type="number" step="0.1" min="0" className={inp} value={f.tiempoEnder} onChange={e => set('tiempoEnder', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Tiempo Bambu (min)</label>
          <input type="number" step="0.1" min="0" className={inp} value={f.tiempoBambu} onChange={e => set('tiempoBambu', e.target.value)} />
        </div>
      </div>

      {/* Calculated costs */}
      <div className="bg-zinc-100/30 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold text-zinc-600 mb-2">ENDER (por pieza)</p>
          <div className="space-y-1 text-zinc-400">
            <div className="flex justify-between"><span>Costo luz:</span><span className="text-zinc-700">{fmt(calcs.costoLuzEnder)}</span></div>
            <div className="flex justify-between"><span>Costo desgaste:</span><span className="text-zinc-700">{fmt(calcs.costoDesgasteEnder)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1 mt-1"><span className="font-semibold">Total op:</span><span className="text-[#96d629] font-bold">{fmt(calcs.totalEnder)}</span></div>
          </div>
        </div>
        <div>
          <p className="font-semibold text-zinc-600 mb-2">BAMBU (por pieza)</p>
          <div className="space-y-1 text-zinc-400">
            <div className="flex justify-between"><span>Costo luz:</span><span className="text-zinc-700">{fmt(calcs.costoLuzBambu)}</span></div>
            <div className="flex justify-between"><span>Costo desgaste:</span><span className="text-zinc-700">{fmt(calcs.costoDesgasteBambu)}</span></div>
            <div className="flex justify-between border-t border-zinc-300 pt-1 mt-1"><span className="font-semibold">Total op:</span><span className="text-[#96d629] font-bold">{fmt(calcs.totalBambu)}</span></div>
          </div>
        </div>
      </div>

      {/* Catálogo público */}
      <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="publicar" checked={f.publicar} onChange={e => set('publicar', e.target.checked)}
            className="w-4 h-4 accent-emerald-500" />
          <label htmlFor="publicar" className="text-sm font-medium text-zinc-600">Publicar en catálogo público</label>
        </div>
        {f.publicar && (
          <>
            <div>
              <label className={lbl}>Foto del producto (opcional)</label>
              <div className="flex items-center gap-3">
                {f.foto ? (
                  <div className="relative flex-shrink-0">
                    <img src={f.foto} alt="foto" className="w-16 h-16 object-cover rounded-lg border border-zinc-200" />
                    <button type="button" onClick={() => set('foto', '')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <div onClick={() => fotoRef.current.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-[#96d629] transition-colors flex-shrink-0">
                    <span className="text-2xl">{uploadingFoto ? '⏳' : '📷'}</span>
                  </div>
                )}
                <button type="button" onClick={() => fotoRef.current.click()}
                  disabled={uploadingFoto}
                  className="text-xs font-semibold text-[#96d629] hover:underline disabled:opacity-50">
                  {f.foto ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFotoFile} />
              </div>
            </div>
            <div>
              <label className={lbl}>Descripción pública</label>
              <textarea className={inp} rows={2} value={f.descripcionPublica} onChange={e => set('descripcionPublica', e.target.value)} placeholder="Descripción para clientes..." />
            </div>
            <div>
              <label className={lbl}>Video del producto (URL de YouTube)</label>
              <input className={inp} value={f.videoUrl || ''} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
                        <div>
              <label className={lbl}>Categorías (selecciona las que apliquen)</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {CATEGORIAS.map(cat => {
                  const cats = f.categorias || [];
                  const checked = cats.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer select-none hover:text-zinc-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => set('categorias', checked ? cats.filter(c => c !== cat) : [...cats, cat])}
                        className="w-3.5 h-3.5 accent-emerald-500 flex-shrink-0"
                      />
                      {cat}
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

export default function Productos() {
  const { products, setProducts, config } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    [p.id, p.nombre, p.descripcion].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f }; delete data._new;
    if (f._new) {
      if (products.find(p => p.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setProducts([...products, data]);
    } else {
      setProducts(products.map(p => p.id === f.id ? data : p));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar ${id}?`)) setProducts(products.filter(p => p.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Productos Simples</h1>
          <p className="text-zinc-500 text-sm">{products.length} productos · 1 material por impresión</p>
        </div>
        <button onClick={() => setEditing(empty(products))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm">
          + Nuevo Producto
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Nombre', 'Descripción', 'Gramos', 'T.Ender', 'T.Bambu', 'Precio', 'C.Op Ender', 'C.Op Bambu', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-100/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-[#96d629]">{p.id}</td>
                  <td className="py-3 px-3 font-medium text-zinc-800">{p.nombre}</td>
                  <td className="py-3 px-3 text-zinc-500 max-w[140px] truncate">{p.descripcion || '—'}</td>
                  <td className="py-3 px-3 text-zinc-400">{fmtN(p.gramos, 1)}g</td>
                  <td className="py-3 px-3 text-zinc-400">{fmtN(p.tiempoEnder, 0)}m</td>
                  <td className="py-3 px-3 text-zinc-400">{fmtN(p.tiempoBambu, 0)}m</td>
                  <td className="py-3 px-3 font-semibold text-zinc-800">{fmt(p.precioVenta)}</td>
                  <td className="py-3 px-3 text-red-400">{fmt((p.tiempoEnder||0)*(config.costLuzMin+config.costDesgasteMin))}</td>
                  <td className="py-3 px-3 text-red-400">{fmt((p.tiempoBambu||0)*(config.costLuzMin+config.costDesgasteMin))}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...p, _new: false })} className="bg-zinc-200 hover:bg-zinc-500 text-white text-xs px-2 py-1 rounded transition-colors">✏</button>
                      <button onClick={() => del(p.id)} className="bg-red-100 hover:bg-red-500 text-red-500 hover:text-white text-xs px-2 py-1 rounded transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-sm">
            {search ? 'Sin resultados.' : 'No hay productos. Crea el primero.'}
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Producto' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <ProductoForm data={editing} config={config} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
