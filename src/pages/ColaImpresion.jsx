import { useState, useMemo, useEffect } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { fmtTime, getNextId, TODAY } from '../store/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function msToHHMM(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function calcTotalMin(jobs) {
  return jobs.reduce((s, j) => s + (j.tiempoUnitario || 0) * (j.cantPendiente || 1), 0);
}
function calcQueueTimes(jobs, startTs) {
  let cursor = startTs;
  return jobs.map(job => {
    const start = cursor;
    const durMs = (job.tiempoUnitario || 0) * (job.cantPendiente || 1) * 60_000;
    cursor += durMs;
    return { ...job, startTs: start, endTs: cursor, durMin: (durMs / 60_000) };
  });
}
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
async function scheduleNotification(printerLabel, endTs) {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return;
  const delay = endTs - Date.now();
  if (delay <= 0) return;
  setTimeout(() => new Notification(`🖨️ ${printerLabel} terminó`, { body: 'La cola de impresión finalizó. ¡A revisar!' }), delay);
}

// ── Brand Logos ───────────────────────────────────────────────────────────────

function BambuLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bambu Lab logo: two panels — left solid, right split with diagonal */}
      <rect x="2" y="4" width="19" height="44" rx="3" fill="white"/>
      <rect x="25" y="4" width="25" height="19" rx="3" fill="white"/>
      <rect x="25" y="29" width="25" height="19" rx="3" fill="white"/>
    </svg>
  );
}

function CrealityLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Creality / Ender logo: stylised "A" arrow shape */}
      {/* Left angled bar */}
      <polygon points="4,46 20,8 27,22 16,46" fill="white"/>
      {/* Right angled bar */}
      <polygon points="48,46 32,8 25,22 36,46" fill="white"/>
      {/* Bottom crossbar gap (cut) */}
      <polygon points="16,46 36,46 33,36 19,36" fill="currentColor"/>
    </svg>
  );
}

// ── Active orders not yet in any queue ────────────────────────────────────────

function useActiveJobs(cola) {
  const { proceso, sales, wholesale, multiSales, products, multiProducts, clients } = usePrintoria();
  return useMemo(() => {
    const inQueue = new Set([
      ...(cola.bambu || []).map(j => j.jobKey),
      ...(cola.ender || []).map(j => j.jobKey),
    ]);
    const jobs = [];
    proceso.forEach(proc => {
      if (proc.estado === 'ENTREGADO' || proc.estado === 'CANCELADO') return;
      const jobKey = `${proc.tipo}_${proc.orderId}`;
      if (inQueue.has(jobKey)) return;
      let order = null;
      if (proc.tipo === 'venta') order = sales.find(s => s.id === proc.orderId);
      else if (proc.tipo === 'mayoreo') order = wholesale.find(w => w.id === proc.orderId);
      else if (proc.tipo === 'multiVenta') order = multiSales.find(m => m.id === proc.orderId);
      if (!order) return;
      const cantTotal = order.cantidad || 1;
      const hechas = (proc.hechasBambu || 0) + (proc.hechasEnder || 0);
      const cantPendiente = Math.max(cantTotal - hechas, 1);
      let nombre = proc.orderId, tiempoBambu = 0, tiempoEnder = 0, clienteNombre = '';
      if (proc.tipo === 'venta' || proc.tipo === 'mayoreo') {
        const prod = products.find(p => p.id === order.productoId);
        if (prod) { nombre = prod.nombre; tiempoBambu = prod.tiempoBambu || 0; tiempoEnder = prod.tiempoEnder || 0; }
        const cl = clients.find(c => c.id === order.clienteId);
        clienteNombre = cl ? cl.nombre : '';
      } else if (proc.tipo === 'multiVenta') {
        const prod = multiProducts.find(p => p.id === order.productoMultiId);
        if (prod) { nombre = prod.nombre; tiempoBambu = prod.tiempoBambu || 0; tiempoEnder = tiempoBambu; }
        const cl = clients.find(c => c.id === order.clienteId);
        clienteNombre = cl ? cl.nombre : '';
      }
      jobs.push({ jobKey, orderId: proc.orderId, tipo: proc.tipo, nombre, clienteNombre, cantTotal, cantPendiente, tiempoBambu, tiempoEnder, estado: proc.estado, soloBAMBU: proc.tipo === 'multiVenta' });
    });
    return jobs;
  }, [cola, proceso, sales, wholesale, multiSales, products, multiProducts, clients]);
}

// ── Add panel ─────────────────────────────────────────────────────────────────

function AddPanel({ printer, color, activeJobs, onAddPedido, onAddPersonal, onClose }) {
  const { materials } = usePrintoria();
  const [tab, setTab] = useState('pedidos');
  const [form, setForm] = useState({ descripcion: '', materialId: '', gramos: '', tiempo: '' });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="mt-2 bg-white border-2 border-zinc-200 rounded-2xl overflow-hidden shadow-md">
      <div className="flex border-b border-zinc-200">
        <button onClick={() => setTab('pedidos')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'pedidos' ? `text-zinc-900 bg-white border-b-2 ${color.solidBorder}` : 'text-zinc-500 bg-zinc-50'}`}>
          📦 Pedidos activos
        </button>
        <button onClick={() => setTab('personal')}
          className={`flex-1 py-3 text-xs font-bold transition-colors ${tab === 'personal' ? `text-zinc-900 bg-white border-b-2 ${color.solidBorder}` : 'text-zinc-500 bg-zinc-50'}`}>
          🏠 Uso personal
        </button>
        <button onClick={onClose} className="px-3 text-zinc-400 hover:text-zinc-600 text-lg">✕</button>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        {tab === 'pedidos' && (
          <>
            {activeJobs.length === 0 && <p className="text-sm text-zinc-500 text-center py-6 font-medium">Sin órdenes activas</p>}
            {activeJobs.map(job => (
              <div key={job.jobKey} className="flex items-center gap-3 py-3 border-b border-zinc-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 truncate">{job.nombre}</p>
                  <p className="text-xs text-zinc-500 font-medium">{job.clienteNombre || job.orderId} · ×{job.cantPendiente}</p>
                  <p className={`text-xs font-bold ${color.text}`}>{fmtTime((printer === 'bambu' ? job.tiempoBambu : job.tiempoEnder) * job.cantPendiente)}</p>
                </div>
                <button onClick={() => onAddPedido(job)}
                  disabled={printer === 'ender' && job.soloBAMBU}
                  className={`text-xs ${color.addBtn} disabled:opacity-30 text-white px-3 py-1.5 rounded-xl font-bold transition-colors flex-shrink-0`}>
                  + Cola
                </button>
              </div>
            ))}
          </>
        )}
        {tab === 'personal' && (
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs text-zinc-600 font-bold block mb-1">Descripción *</label>
              <input type="text" placeholder="ej. Prototipo llavero" value={form.descripcion} onChange={e => set('descripcion')(e.target.value)}
                className={`w-full bg-white border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 font-medium focus:outline-none ${color.focusBorder}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-600 font-bold block mb-1">Material</label>
                <select value={form.materialId} onChange={e => set('materialId')(e.target.value)}
                  className={`w-full bg-white border-2 border-zinc-200 rounded-xl px-2 py-2 text-sm text-zinc-800 focus:outline-none ${color.focusBorder}`}>
                  <option value="">— ninguno —</option>
                  {materials.filter(m => m.nombre).map(m => <option key={m.id} value={m.id}>{m.nombre} {m.marca}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-600 font-bold block mb-1">Gramos</label>
                <input type="number" min="0" placeholder="0" value={form.gramos} onChange={e => set('gramos')(e.target.value)}
                  className={`w-full bg-white border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 focus:outline-none ${color.focusBorder}`} />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-600 font-bold block mb-1">Tiempo estimado (min) *</label>
              <input type="number" min="1" placeholder="ej. 120" value={form.tiempo} onChange={e => set('tiempo')(e.target.value)}
                className={`w-full bg-white border-2 border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 focus:outline-none ${color.focusBorder}`} />
            </div>
            <button disabled={!form.descripcion || !form.tiempo}
              onClick={() => { onAddPersonal(form); setForm({ descripcion: '', materialId: '', gramos: '', tiempo: '' }); }}
              className={`w-full ${color.addBtn} disabled:opacity-40 text-white text-sm font-black py-3 rounded-xl transition-colors`}>
              + Agregar a cola y registrar uso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Printer card ──────────────────────────────────────────────────────────────

function PrinterCard({ printer, label, color, LogoComponent, jobs, startedAt, activeJobs, now,
  onStart, onStop, onAddPedido, onAddPersonal, onRemove, onMove }) {

  const [addOpen, setAddOpen] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(nowTimeStr);
  const totalMin = calcTotalMin(jobs);
  const totalMs = totalMin * 60_000;
  const endTs = startedAt ? startedAt + totalMs : null;
  const finished = endTs && now >= endTs;
  const running = startedAt && !finished;

  const timedJobs = useMemo(() => {
    if (!startedAt) return jobs.map(j => ({ ...j, durMin: (j.tiempoUnitario || 0) * (j.cantPendiente || 1) }));
    return calcQueueTimes(jobs, startedAt);
  }, [jobs, startedAt]);

  const currentJob = running ? timedJobs.find(j => now >= j.startTs && now < j.endTs) : null;
  const upcomingJobs = running ? timedJobs.filter(j => j.startTs > now) : timedJobs;
  const doneJobs = running ? timedJobs.filter(j => j.endTs <= now) : [];
  const jobElapsed = currentJob
    ? Math.min((now - currentJob.startTs) / (currentJob.endTs - currentJob.startTs), 1) : 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className={`rounded-2xl bg-white shadow-lg overflow-hidden border-2 ${color.solidBorder}`}>

        {/* ── HEADER STRIP ── */}
        <div className={`${color.headerGradient} px-6 py-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Brand Logo */}
              <div className={`w-14 h-14 rounded-2xl ${color.logoBg} flex items-center justify-center shadow-inner flex-shrink-0`}
                style={{ color: color.logoBgHex }}>
                <LogoComponent size={38} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide">{label}</h2>
                <p className="text-sm font-semibold" style={{ color: color.headerSubHex }}>
                  {jobs.length} {jobs.length === 1 ? 'trabajo' : 'trabajos'}
                  {totalMin > 0 && ` · ${fmtTime(totalMin)}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {finished && (
                <span className="text-xs bg-white/25 text-white border border-white/40 rounded-full px-3 py-1.5 font-black">✅ Terminó</span>
              )}
              {running && (
                <span className="text-xs bg-white/20 text-white border border-white/30 rounded-full px-3 py-1.5 font-black animate-pulse">▶ En curso</span>
              )}
              {!running && !finished && jobs.length === 0 && (
                <span className="text-xs bg-white/15 text-white/70 border border-white/20 rounded-full px-3 py-1.5 font-bold">⏸ Vacío</span>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="p-5">

          {/* CURRENT JOB */}
          {running && currentJob && (
            <div className={`mb-4 rounded-2xl border-2 ${color.solidBorder} bg-zinc-50 p-4`}>
              <p className={`text-xs font-black ${color.text} uppercase tracking-widest mb-2`}>⚡ Ahora imprimiendo</p>
              <p className="text-lg font-black text-zinc-900 truncate">{currentJob.nombre}</p>
              <p className="text-sm text-zinc-600 font-semibold mb-3">{currentJob.clienteNombre || currentJob.orderId} · ×{currentJob.cantPendiente}</p>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Inició</p>
                  <p className={`text-2xl font-black ${color.text}`}>{msToHHMM(currentJob.startTs)}</p>
                </div>
                <div className="flex-1 mx-4 h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div className={`h-full ${color.bar} rounded-full transition-all duration-1000`} style={{ width: `${jobElapsed * 100}%` }} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Termina</p>
                  <p className="text-2xl font-black text-zinc-900">{msToHHMM(currentJob.endTs)}</p>
                </div>
              </div>
              <div className="h-3 bg-zinc-200 rounded-full overflow-hidden">
                <div className={`h-full ${color.bar} rounded-full transition-all duration-1000`} style={{ width: `${jobElapsed * 100}%` }} />
              </div>
              <p className="text-xs text-zinc-500 font-bold mt-1.5 text-right">{Math.round(jobElapsed * 100)}%</p>
            </div>
          )}

          {/* FINISHED */}
          {finished && (
            <div className={`mb-4 rounded-2xl border-2 ${color.solidBorder} bg-zinc-50 px-5 py-4 flex items-center justify-between`}>
              <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Inició</p><p className={`text-xl font-black ${color.text}`}>{msToHHMM(startedAt)}</p></div>
              <div className="text-right"><p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Terminó</p><p className="text-xl font-black text-[#78b01e]">{msToHHMM(endTs)}</p></div>
            </div>
          )}

          {/* EMPTY STATE */}
          {upcomingJobs.length === 0 && !running && !finished && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className={`w-16 h-16 rounded-2xl ${color.emptyBg} flex items-center justify-center`}
                style={{ color: color.logoBgHex }}>
                <LogoComponent size={32} />
              </div>
              <p className="text-base font-black text-zinc-700">Cola vacía</p>
              <p className="text-sm text-zinc-500 font-medium">Agrega trabajos con el botón de abajo</p>
            </div>
          )}

          {/* QUEUE */}
          {upcomingJobs.length > 0 && (
            <div className="space-y-2 mb-4">
              {running && upcomingJobs.length > 0 && (
                <p className={`text-xs font-black ${color.text} uppercase tracking-widest mb-3`}>⏳ En espera</p>
              )}
              {upcomingJobs.map((job, idx) => (
                <div key={job.jobKey} className="bg-zinc-50 border-2 border-zinc-100 rounded-xl p-3 flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full text-sm font-black flex items-center justify-center ${color.dotBg} ${color.dotText}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{job.nombre}</p>
                    <p className="text-xs text-zinc-600 font-semibold truncate">{job.clienteNombre || job.orderId}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-zinc-500 font-semibold">×{job.cantPendiente}</span>
                      <span className={`text-xs font-black ${color.text}`}>{fmtTime(job.durMin)}</span>
                      {startedAt && job.startTs && (
                        <span className="text-xs text-zinc-600 font-mono font-semibold">{msToHHMM(job.startTs)}→{msToHHMM(job.endTs)}</span>
                      )}
                    </div>
                  </div>
                  {!startedAt && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => onMove(timedJobs.indexOf(job), -1)} disabled={idx === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-sm leading-none py-0.5 font-bold">▲</button>
                      <button onClick={() => onMove(timedJobs.indexOf(job), 1)} disabled={idx === upcomingJobs.length - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-20 text-sm leading-none py-0.5 font-bold">▼</button>
                      <button onClick={() => onRemove(timedJobs.indexOf(job))} className="text-red-400 hover:text-red-600 text-sm leading-none py-0.5 font-bold">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {doneJobs.length > 0 && (
            <p className={`text-sm ${color.text} mb-3 font-bold`}>✓ {doneJobs.length} {doneJobs.length === 1 ? 'trabajo terminado' : 'trabajos terminados'}</p>
          )}

          {/* Start / Stop */}
          {!startedAt && jobs.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className={`flex items-center gap-2 border-2 ${color.solidBorder} bg-zinc-50 rounded-xl px-4 py-2.5`}>
                <span className={`${color.text} text-base`}>⏰</span>
                <input type="time" value={startTimeInput} onChange={e => setStartTimeInput(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-900 font-mono text-base font-bold focus:outline-none" />
                <button onClick={() => setStartTimeInput(nowTimeStr())}
                  className={`text-xs ${color.text} hover:opacity-70 font-black transition-opacity`}>Ahora</button>
              </div>
              <button
                onClick={() => { const [h, m] = startTimeInput.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); onStart(d.getTime()); }}
                className={`w-full py-3.5 rounded-xl font-black text-base transition-all shadow-md hover:shadow-lg ${color.startBtn}`}>
                ▶ Iniciar {label}
              </button>
            </div>
          )}
          {startedAt && (
            <button onClick={onStop} className="w-full py-3 rounded-xl border-2 border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-500 text-sm font-bold transition-all mb-3">
              ⏹ Detener / Reiniciar
            </button>
          )}

          {!startedAt && (
            <button onClick={() => setAddOpen(o => !o)}
              className={`w-full py-3 rounded-xl border-2 text-sm font-bold transition-all ${addOpen ? `${color.solidBorder} ${color.text} bg-zinc-50` : 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'}`}>
              {addOpen ? '✕ Cerrar' : `+ Agregar a ${label}`}
            </button>
          )}
        </div>
      </div>

      {addOpen && !startedAt && (
        <AddPanel printer={printer} color={color} activeJobs={activeJobs}
          onAddPedido={job => { onAddPedido(job); setAddOpen(false); }}
          onAddPersonal={data => { onAddPersonal(data); setAddOpen(false); }}
          onClose={() => setAddOpen(false)} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ColaImpresion() {
  const { cola, setCola, personal, setPersonal } = usePrintoria();
  const [now, setNow] = useState(Date.now());
  const activeJobs = useActiveJobs(cola);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  function startPrinter(printer, startedAt) {
    const jobs = cola[printer] || [];
    if (jobs.length === 0) return;
    const endTs = startedAt + calcTotalMin(jobs) * 60_000;
    setCola(prev => ({ ...prev, [`${printer}StartedAt`]: startedAt }));
    scheduleNotification(printer === 'bambu' ? 'Bambu' : 'Ender', endTs);
  }
  function stopPrinter(printer) { setCola(prev => ({ ...prev, [`${printer}StartedAt`]: null })); }
  function addPedido(printer, job) {
    const item = { jobKey: job.jobKey, orderId: job.orderId, tipo: job.tipo, nombre: job.nombre, clienteNombre: job.clienteNombre, cantPendiente: job.cantPendiente, tiempoUnitario: printer === 'bambu' ? job.tiempoBambu : job.tiempoEnder, estado: job.estado };
    setCola(prev => ({ ...prev, [printer]: [...(prev[printer] || []), item] }));
  }
  function addPersonal(printer, data) {
    const tiempo = parseFloat(data.tiempo) || 0;
    const jobKey = `personal_${Date.now()}`;
    const item = { jobKey, orderId: jobKey, tipo: 'personal', nombre: data.descripcion, clienteNombre: 'Uso personal', cantPendiente: 1, tiempoUnitario: tiempo, estado: 'PERSONAL' };
    setCola(prev => ({ ...prev, [printer]: [...(prev[printer] || []), item] }));
    const newId = getNextId(personal, 'UP');
    setPersonal(prev => [...prev, { id: newId, fecha: TODAY(), descripcion: data.descripcion, impresora: printer === 'bambu' ? 'Bambu' : 'Ender', materiales: data.materialId ? [{ materialId: data.materialId, gramos: parseFloat(data.gramos) || 0 }] : [], tiempo }]);
  }
  function removeFromQueue(printer, idx) { setCola(prev => ({ ...prev, [printer]: prev[printer].filter((_, i) => i !== idx) })); }
  function moveInQueue(printer, idx, dir) {
    setCola(prev => {
      const arr = [...prev[printer]]; const t = idx + dir;
      if (t < 0 || t >= arr.length) return prev;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return { ...prev, [printer]: arr };
    });
  }

  const shared = {
    activeJobs, now,
    onRemove: p => i => removeFromQueue(p, i),
    onMove: p => (i, d) => moveInQueue(p, i, d),
    onAddPedido: p => j => addPedido(p, j),
    onAddPersonal: p => d => addPersonal(p, d),
    onStart: p => ts => startPrinter(p, ts),
    onStop: p => () => stopPrinter(p),
  };

  // Bambu Lab — green brand
  const bambuColor = {
    solidBorder: 'border-[#96d629]',
    headerGradient: 'bg-gradient-to-br from-[#78b01e] to-[#5c891a]',
    headerSubHex: '#c5e87a',
    logoBg: 'bg-[#5c891a]',
    logoBgHex: '#78b01e',
    text: 'text-[#78b01e]',
    dotBg: 'bg-[#96d629]', dotText: 'text-black',
    bar: 'bg-[#96d629]',
    emptyBg: 'bg-[#96d629]/10',
    startBtn: 'bg-[#96d629] hover:bg-[#78b01e] text-black',
    addBtn: 'bg-[#78b01e] hover:bg-[#96d629]',
    focusBorder: 'focus:border-[#96d629]',
  };

  // Creality (Ender) — blue brand
  const enderColor = {
    solidBorder: 'border-blue-600',
    headerGradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
    headerSubHex: '#93c5fd',
    logoBg: 'bg-blue-800',
    logoBgHex: '#2563eb',
    text: 'text-blue-600',
    dotBg: 'bg-blue-600', dotText: 'text-white',
    bar: 'bg-blue-500',
    emptyBg: 'bg-blue-50',
    startBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    addBtn: 'bg-blue-700 hover:bg-blue-600',
    focusBorder: 'focus:border-blue-500',
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-zinc-900">Cola de Impresión</h1>
        <p className="text-base text-zinc-600 font-semibold mt-1">Gestiona cada impresora · Notificación al terminar</p>
      </div>

      {/* Status pills */}
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-[#96d629] px-4 py-2 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-[#96d629]" />
          <span className="text-sm font-black text-zinc-800">BAMBU LAB</span>
          <span className="text-xs font-bold text-zinc-500">· {(cola.bambu || []).length} trabajos</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-blue-600 px-4 py-2 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span className="text-sm font-black text-zinc-800">CREALITY ENDER</span>
          <span className="text-xs font-bold text-zinc-500">· {(cola.ender || []).length} trabajos</span>
        </div>
      </div>

      {/* Split cards */}
      <div className="flex gap-5 items-start">
        <PrinterCard printer="bambu" label="Bambu" color={bambuColor} LogoComponent={BambuLogo}
          jobs={cola.bambu || []} startedAt={cola.bambuStartedAt || null}
          onStart={shared.onStart('bambu')} onStop={shared.onStop('bambu')}
          activeJobs={shared.activeJobs} now={now}
          onAddPedido={shared.onAddPedido('bambu')} onAddPersonal={shared.onAddPersonal('bambu')}
          onRemove={shared.onRemove('bambu')} onMove={shared.onMove('bambu')} />

        {/* VS divider */}
        <div className="hidden md:flex flex-col items-center gap-2 pt-24 flex-shrink-0">
          <div className="w-px h-10 bg-zinc-300" />
          <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-zinc-300 flex items-center justify-center">
            <span className="text-zinc-500 text-xs font-black">VS</span>
          </div>
          <div className="w-px h-10 bg-zinc-300" />
        </div>

        <PrinterCard printer="ender" label="Ender" color={enderColor} LogoComponent={CrealityLogo}
          jobs={cola.ender || []} startedAt={cola.enderStartedAt || null}
          onStart={shared.onStart('ender')} onStop={shared.onStop('ender')}
          activeJobs={shared.activeJobs} now={now}
          onAddPedido={shared.onAddPedido('ender')} onAddPersonal={shared.onAddPersonal('ender')}
          onRemove={shared.onRemove('ender')} onMove={shared.onMove('ender')} />
      </div>
    </div>
  );
}
