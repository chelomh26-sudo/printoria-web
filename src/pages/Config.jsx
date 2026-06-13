import { useState, useRef } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { initialConfig } from '../data/initialData';
import { getNextId } from '../store/utils';

function emptyAddon(addons) {
  return { id: getNextId(addons, 'AO'), nombre: '', precioExtra: 0, stock: 0, _new: true };
}

function AddonForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp2 = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none';
  const lbl2 = 'block text-xs font-medium text-zinc-400 mb-1';

  function submit(e) {
    e.preventDefault();
    if (!f.nombre.trim()) return alert('Nombre requerido');
    onSave({ ...f, precioExtra: Number(f.precioExtra), stock: Number(f.stock) });
  }

  return (
    <form onSubmit={submit} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 mt-3">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{f._new ? 'Nuevo add-on' : `Editar ${f.id}`}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl2}>ID</label>
          <input className={inp2} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} />
        </div>
        <div className="col-span-2">
          <label className={lbl2}>Nombre *</label>
          <input className={inp2} value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Luz LED, Cadena llavero" />
        </div>
        <div>
          <label className={lbl2}>Precio extra ($)</label>
          <input type="number" step="0.01" min="0" className={inp2} value={f.precioExtra} onChange={e => set('precioExtra', e.target.value)} />
        </div>
        <div>
          <label className={lbl2}>Stock actual</label>
          <input type="number" min="0" step="1" className={inp2} value={f.stock} onChange={e => set('stock', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-1.5 rounded-lg text-sm">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-1.5 rounded-lg text-sm">Guardar</button>
      </div>
    </form>
  );
}

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

export default function Config() {
  const { config, setConfig, addons, setAddons } = usePrintoria();
  const [editingAddon, setEditingAddon] = useState(null);
  // Merge con initialConfig para que campos nuevos tengan valor por defecto
  const [form, setForm] = useState({ ...initialConfig, ...config });
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setConfig({
      costLuzMin: parseFloat(form.costLuzMin) || 0,
      costDesgasteMin: parseFloat(form.costDesgasteMin) || 0,
      costLuzMinBambu: parseFloat(form.costLuzMinBambu) || 0,
      costDesgasteMinBambu: parseFloat(form.costDesgasteMinBambu) || 0,
      costLuzMinEnder: parseFloat(form.costLuzMinEnder) || 0,
      costDesgasteMinEnder: parseFloat(form.costDesgasteMinEnder) || 0,
      precioHoraTrabajo: parseFloat(form.precioHoraTrabajo) || 0,
      iva: parseFloat(form.iva) || 0,
      margenMinimo: parseFloat(form.margenMinimo) || 0,
      apiKey: form.apiKey || '',
      whatsapp: form.whatsapp || '',
      instagram: form.instagram || '',
      facebook: form.facebook || '',
      telefono: form.telefono || '',
      gmail: form.gmail || '',
      slogan: form.slogan || '',
      ciudad: form.ciudad || '',
      sobreNosotros: form.sobreNosotros || '',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fileRef = useRef();
  const [restoreMsg, setRestoreMsg] = useState('');

  const LS_KEYS = [
    'printoria_config', 'printoria_materials', 'printoria_products', 'printoria_multiProducts',
    'printoria_clients', 'printoria_sales', 'printoria_multiSales', 'printoria_wholesale',
    'printoria_quotes', 'printoria_personal', 'printoria_failures', 'printoria_proceso',
    'printoria_gastos', 'printoria_cola', 'printoria_theme',
  ];

  function handleBackup() {
    const backup = {};
    LS_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) backup[k] = JSON.parse(v);
    });
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printoria_backup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        let count = 0;
        LS_KEYS.forEach(k => {
          if (data[k] !== undefined) {
            localStorage.setItem(k, JSON.stringify(data[k]));
            count++;
          }
        });
        setRestoreMsg(`✓ ${count} claves restauradas. Recargando...`);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setRestoreMsg('✗ Archivo inválido. Usa un backup generado por PRINTORIA.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800 mb-1">Configuración</h1>
        <p className="text-zinc-500 text-sm">Estos valores afectan todos los cálculos.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={lbl}>Costo luz / minuto ($)</label>
            <input type="number" step="0.001" className={inp} value={form.costLuzMin}
              onChange={e => set('costLuzMin', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Costo desgaste / minuto ($)</label>
            <input type="number" step="0.001" className={inp} value={form.costDesgasteMin}
              onChange={e => set('costDesgasteMin', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Precio hora de trabajo ($)</label>
            <input type="number" step="1" className={inp} value={form.precioHoraTrabajo}
              onChange={e => set('precioHoraTrabajo', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>IVA (%)</label>
            <input type="number" step="0.01" className={inp} value={form.iva}
              onChange={e => set('iva', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Margen mínimo (decimal)</label>
            <input type="number" step="0.01" min="0" max="1" className={inp} value={form.margenMinimo}
              onChange={e => set('margenMinimo', e.target.value)} />
            <p className="text-xs text-zinc-500 mt-1">0.30 = 30%</p>
          </div>
        </div>

        {/* Tarifas por impresora */}
        <div className="border-t border-zinc-200 pt-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tarifas por impresora</p>
          <p className="text-xs text-zinc-600">Se usan en cálculos de costos. Si son 0, usa las tarifas generales.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#96d629]/5 border border-[#96d629]/20 rounded-lg p-3 space-y-3">
              <p className="text-xs font-bold text-[#96d629]">🖨️ Bambu</p>
              <div>
                <label className={lbl}>Luz / minuto ($)</label>
                <input type="number" step="0.001" className={inp} value={form.costLuzMinBambu ?? ''}
                  onChange={e => set('costLuzMinBambu', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Desgaste / minuto ($)</label>
                <input type="number" step="0.001" className={inp} value={form.costDesgasteMinBambu ?? ''}
                  onChange={e => set('costDesgasteMinBambu', e.target.value)} />
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-3">
              <p className="text-xs font-bold text-blue-400">🖨️ Ender</p>
              <div>
                <label className={lbl}>Luz / minuto ($)</label>
                <input type="number" step="0.001" className={inp} value={form.costLuzMinEnder ?? ''}
                  onChange={e => set('costLuzMinEnder', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Desgaste / minuto ($)</label>
                <input type="number" step="0.001" className={inp} value={form.costDesgasteMinEnder ?? ''}
                  onChange={e => set('costDesgasteMinEnder', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-4 flex items-center gap-4">
          <button type="submit"
            className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-6 py-2 rounded-lg text-sm transition-colors">
            Guardar
          </button>
          {saved && <span className="text-green-400 text-sm font-medium">✓ Guardado</span>}
        </div>

        <div className="bg-zinc-100/40 rounded-lg p-4 mt-2">
          <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Valores actuales guardados</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
            <span className="text-zinc-500">Costo luz/min:</span><span>${config.costLuzMin}</span>
            <span className="text-zinc-500">Costo desgaste/min:</span><span>${config.costDesgasteMin}</span>
            <span className="text-zinc-500">Precio hora trabajo:</span><span>${config.precioHoraTrabajo}</span>
            <span className="text-zinc-500">IVA:</span><span>{config.iva}%</span>
            <span className="text-zinc-500">Margen mínimo:</span><span>{(config.margenMinimo * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* API Key asistente */}
        <div className="border-t border-zinc-200 pt-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Asistente IA — API Key</p>
          <div>
            <label className={lbl}>Anthropic API Key</label>
            <input type="password" className={inp} placeholder="sk-ant-..." value={form.apiKey || ''}
              onChange={e => set('apiKey', e.target.value)} />
            <p className="text-xs text-zinc-600 mt-1">Regístrate en console.anthropic.com · Se guarda solo en tu navegador, nunca sale de aquí.</p>
          </div>
        </div>

        {/* Catálogo público */}
        <div className="border-t border-zinc-200 pt-5 space-y-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Catálogo Público — Datos de contacto</p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>WhatsApp (con código de país)</label>
              <input type="text" className={inp} placeholder="528341112949" value={form.whatsapp || ''}
                onChange={e => set('whatsapp', e.target.value)} />
              <p className="text-xs text-zinc-600 mt-1">52 + 10 dígitos (México)</p>
            </div>
            <div>
              <label className={lbl}>Instagram (sin @)</label>
              <input type="text" className={inp} placeholder="printoria3dstudio" value={form.instagram || ''}
                onChange={e => set('instagram', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Facebook (nombre de página)</label>
              <input type="text" className={inp} placeholder="printoria3dstudio" value={form.facebook || ''}
                onChange={e => set('facebook', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Teléfono visible</label>
              <input type="text" className={inp} placeholder="8341112949" value={form.telefono || ''}
                onChange={e => set('telefono', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Gmail / correo</label>
              <input type="text" className={inp} placeholder="printoria3dmmh@gmail.com" value={form.gmail || ''}
                onChange={e => set('gmail', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Slogan</label>
              <input type="text" className={inp} value={form.slogan || ''} onChange={e => set('slogan', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Ciudad</label>
              <input type="text" className={inp} placeholder="Victoria, Tamaulipas" value={form.ciudad || ''} onChange={e => set('ciudad', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Sobre nosotros (texto breve)</label>
            <textarea rows={3} className={`${inp} resize-none`} value={form.sobreNosotros || ''} onChange={e => set('sobreNosotros', e.target.value)} />
          </div>
        </div>
      </form>

      {/* Add-ons globales */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-800">Add-ons / Extras de producto</p>
            <p className="text-xs text-zinc-500 mt-0.5">Accesorios opcionales con costo extra y stock propio. Ej: Luz LED, Cadena de llavero.</p>
          </div>
          <button
            onClick={() => setEditingAddon(emptyAddon(addons))}
            className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-1.5 rounded-lg text-sm transition-colors"
          >
            + Nuevo
          </button>
        </div>

        {editingAddon && (
          <AddonForm
            data={editingAddon}
            onSave={f => {
              const data = { ...f }; delete data._new;
              if (f._new) {
                if (addons.find(a => a.id === f.id)) return alert(`ID ${f.id} ya existe`);
                setAddons([...addons, data]);
              } else {
                setAddons(addons.map(a => a.id === f.id ? data : a));
              }
              setEditingAddon(null);
            }}
            onCancel={() => setEditingAddon(null)}
          />
        )}

        {addons.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">Sin add-ons. Crea uno con el botón +</p>
        ) : (
          <div className="space-y-2">
            {addons.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded">{a.id}</span>
                  <span className="text-sm font-medium text-zinc-800">{a.nombre}</span>
                  <span className="text-xs text-zinc-500">+${a.precioExtra?.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">Stock:</span>
                    <span className={`text-xs font-bold ${a.stock <= 0 ? 'text-red-400' : a.stock < 5 ? 'text-yellow-500' : 'text-green-500'}`}>{a.stock}</span>
                    <button
                      onClick={() => setAddons(addons.map(x => x.id === a.id ? { ...x, stock: x.stock + 1 } : x))}
                      className="text-xs bg-zinc-200 hover:bg-zinc-300 text-zinc-700 w-5 h-5 rounded flex items-center justify-center font-bold"
                      title="Agregar 1 al stock"
                    >+</button>
                    <button
                      onClick={() => setAddons(addons.map(x => x.id === a.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x))}
                      className="text-xs bg-zinc-200 hover:bg-zinc-300 text-zinc-700 w-5 h-5 rounded flex items-center justify-center font-bold"
                      title="Quitar 1 del stock"
                    >−</button>
                  </div>
                  <button onClick={() => setEditingAddon({ ...a })} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50">Editar</button>
                  <button onClick={() => { if (window.confirm(`¿Eliminar add-on ${a.nombre}?`)) setAddons(addons.filter(x => x.id !== a.id)); }}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup / Restore */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm font-bold text-zinc-800">Copia de seguridad</p>
          <p className="text-xs text-zinc-500 mt-1">Exporta todos tus datos a un archivo JSON. Guárdalo en lugar seguro — si borras el navegador, pierdes todo sin esto.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button onClick={handleBackup}
            className="flex items-center gap-2 bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">
            ⬇ Descargar backup
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-5 py-2 rounded-lg text-sm transition-colors border border-zinc-300">
              ⬆ Restaurar backup
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
          </div>
        </div>
        {restoreMsg && (
          <p className={`text-sm font-medium ${restoreMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {restoreMsg}
          </p>
        )}
        <p className="text-xs text-zinc-600">Solo restaura archivos descargados desde esta app. Datos inválidos serán ignorados.</p>
      </div>
    </div>
  );
}
