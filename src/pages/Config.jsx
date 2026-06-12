import { useState, useRef } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { initialConfig } from '../data/initialData';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

export default function Config() {
  const { config, setConfig } = usePrintoria();
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
          <p className={`text-sm font-medium ${restoreMsg.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>{restoreMsg}</p>
        )}
      </div>
    </div>
  );
}
