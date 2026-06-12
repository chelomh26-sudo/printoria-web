import { useState, useRef } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';

/* Comprime imagen a máx 1200px / JPEG 80% para que quepan en localStorage */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function getNextId(arr) {
  if (!arr.length) return 'G001';
  const nums = arr.map(f => parseInt(f.id?.replace('G', '') || '0')).filter(n => !isNaN(n));
  return 'G' + String((Math.max(0, ...nums) + 1)).padStart(3, '0');
}

export default function GaleriaAdmin() {
  const { galeriaFotos, setGaleriaFotos } = usePrintoria();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editando, setEditando] = useState(null); // id de foto editando título
  const [titulo, setTitulo] = useState('');
  const fileRef = useRef();

  async function processFiles(files) {
    const validas = [...files].filter(f => f.type.startsWith('image/'));
    if (!validas.length) return;
    setUploading(true);
    try {
      const nuevas = [];
      for (const file of validas) {
        const url = await compressImage(file);
        const id = getNextId([...galeriaFotos, ...nuevas]);
        nuevas.push({
          id,
          titulo: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          url,
          fecha: new Date().toISOString().slice(0, 10),
        });
      }
      setGaleriaFotos(prev => [...prev, ...nuevas]);
    } catch (err) {
      alert('Error al procesar alguna imagen: ' + err.message);
    }
    setUploading(false);
  }

  function onFiles(e) { processFiles(e.target.files); e.target.value = ''; }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    processFiles(e.dataTransfer.files);
  }

  function eliminar(id) {
    if (window.confirm('¿Eliminar esta foto del catálogo?'))
      setGaleriaFotos(prev => prev.filter(f => f.id !== id));
  }

  function startEdit(f) { setEditando(f.id); setTitulo(f.titulo); }

  function saveEdit(id) {
    setGaleriaFotos(prev => prev.map(f => f.id === id ? { ...f, titulo: titulo.trim() || f.titulo } : f));
    setEditando(null);
  }

  const mbUsed = Math.round(galeriaFotos.reduce((s, f) => s + (f.url?.length || 0), 0) / 1024 / 1024 * 100) / 100;

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-800">📸 Galería de trabajos</h1>
          <p className="text-sm text-zinc-500 font-medium mt-0.5">
            {galeriaFotos.length} foto{galeriaFotos.length !== 1 ? 's' : ''} · estas fotos aparecen en tu catálogo público
            {galeriaFotos.length > 0 && (
              <span className="ml-2 text-zinc-400">· {mbUsed} MB usados</span>
            )}
          </p>
        </div>
        <button onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="bg-[#96d629] hover:bg-[#78b01e] disabled:opacity-60 text-black font-bold px-4 py-2 rounded-xl text-sm shadow-sm transition-all active:scale-95">
          {uploading ? '⏳ Procesando...' : '+ Agregar fotos'}
        </button>
      </div>

      {/* Zona de drop */}
      <div
        onClick={() => !uploading && fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none"
        style={{
          borderColor: dragOver ? '#96d629' : '#d1d5db',
          background: dragOver ? 'rgba(150,214,41,0.04)' : 'rgba(0,0,0,0.01)',
          padding: '36px 24px',
          textAlign: 'center',
        }}>
        <p className="text-4xl mb-3">{dragOver ? '✅' : '📂'}</p>
        <p className="font-bold text-zinc-600 text-sm">
          {dragOver ? 'Suelta las fotos aquí' : 'Arrastra fotos aquí o haz clic para seleccionar'}
        </p>
        <p className="text-zinc-400 text-xs mt-1">JPG, PNG, WEBP · Se comprimen automáticamente · Puedes subir varias a la vez</p>
        {uploading && (
          <p className="text-[#96d629] font-bold text-sm mt-3 animate-pulse">Procesando imágenes...</p>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

      {/* Grid de fotos */}
      {galeriaFotos.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-5xl mb-4">🖼️</p>
          <p className="font-semibold text-zinc-500">Aún no hay fotos</p>
          <p className="text-sm mt-1">Sube fotos de tus trabajos y aparecerán en el catálogo público</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {galeriaFotos.map(f => (
            <div key={f.id} className="group relative rounded-xl overflow-hidden bg-zinc-100"
              style={{ aspectRatio: '1/1' }}>
              <img src={f.url} alt={f.titulo}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100">
                {/* Botón eliminar */}
                <div className="flex justify-end">
                  <button onClick={() => eliminar(f.id)}
                    className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                    ✕
                  </button>
                </div>
                {/* ID */}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 text-white/70 self-start">{f.id}</span>
              </div>

              {/* Título editable */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-4">
                {editando === f.id ? (
                  <input
                    autoFocus
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    onBlur={() => saveEdit(f.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(f.id); if (e.key === 'Escape') setEditando(null); }}
                    className="w-full bg-white/20 text-white text-xs font-bold px-2 py-1 rounded border border-white/30 outline-none"
                    style={{ backdropFilter: 'blur(4px)' }}
                  />
                ) : (
                  <p onClick={() => startEdit(f)}
                    title="Clic para editar el título"
                    className="text-white text-xs font-bold truncate cursor-text hover:text-[#96d629] transition-colors">
                    {f.titulo || 'Sin título'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nota de almacenamiento */}
      {galeriaFotos.length > 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-500 flex items-start gap-2">
          <span>💡</span>
          <p>Las fotos se guardan en este navegador. Si abres la app en otro dispositivo, tendrás que subir las fotos de nuevo allí. Las fotos se comprimen automáticamente para ahorrar espacio.</p>
        </div>
      )}
    </div>
  );
}
