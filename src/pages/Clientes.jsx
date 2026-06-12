import { useState } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import Modal from '../components/Modal';
import { getNextId, TODAY } from '../store/utils';

const inp = 'w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400';
const lbl = 'block text-xs font-medium text-zinc-400 mb-1';

const TIPOS = ['MAYOREO', 'MINOREO', 'REGULAR', 'NUEVO', 'VIP'];

function empty(clients) {
  return { id: getNextId(clients, 'C'), nombre: '', telefono: '', instagram: '', tipo: 'REGULAR', notas: '', fechaRegistro: TODAY(), _new: true };
}

function ClienteForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ ...data });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function submit(e) {
    e.preventDefault();
    if (!f.nombre.trim()) return alert('Nombre requerido');
    onSave(f);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>ID</label>
          <input className={inp} value={f.id} onChange={e => set('id', e.target.value.toUpperCase())} disabled={!f._new} />
        </div>
        <div>
          <label className={lbl}>Fecha registro</label>
          <input type="date" className={inp} value={f.fechaRegistro} onChange={e => set('fechaRegistro', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Nombre *</label>
          <input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} placeholder="NOMBRE DEL CLIENTE" />
        </div>
        <div>
          <label className={lbl}>Teléfono</label>
          <input className={inp} value={f.telefono} onChange={e => set('telefono', e.target.value)} placeholder="555-1234" />
        </div>
        <div>
          <label className={lbl}>Instagram / Contacto</label>
          <input className={inp} value={f.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" />
        </div>
        <div>
          <label className={lbl}>Tipo</label>
          <select className={inp} value={f.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Notas</label>
          <textarea className={inp} rows={3} value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
        <button type="button" onClick={onCancel} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
        <button type="submit" className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">Guardar</button>
      </div>
    </form>
  );
}

const TIPO_COLOR = { MAYOREO: 'bg-purple-400/15 text-purple-300', VIP: 'bg-[#a3dc3f]/15 text-[#78b01e]', MINOREO: 'bg-blue-400/15 text-blue-300', REGULAR: 'bg-zinc-200 text-zinc-600', NUEVO: 'bg-green-400/15 text-green-300' };

export default function Clientes() {
  const { clients, setClients } = usePrintoria();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    [c.id, c.nombre, c.tipo, c.instagram].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  function save(f) {
    const data = { ...f };
    delete data._new;
    if (f._new) {
      if (clients.find(c => c.id === f.id)) return alert(`ID ${f.id} ya existe`);
      setClients([...clients, data]);
    } else {
      setClients(clients.map(c => c.id === f.id ? data : c));
    }
    setEditing(null);
  }

  function del(id) {
    if (window.confirm(`¿Eliminar cliente ${id}?`)) setClients(clients.filter(c => c.id !== id));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Clientes</h1>
          <p className="text-zinc-500 text-sm">{clients.length} registrados</p>
        </div>
        <button onClick={() => setEditing(empty(clients))}
          className="bg-[#96d629] hover:bg-[#78b01e] text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors">
          + Nuevo Cliente
        </button>
      </div>

      <input className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:border-[#96d629] focus:outline-none placeholder-zinc-400"
        placeholder="Buscar por ID, nombre, tipo..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                {['ID', 'Nombre', 'Tipo', 'Teléfono', 'Instagram', 'Notas', 'Registro', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-zinc-100/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-[#96d629]">{c.id}</td>
                  <td className="py-3 px-4 text-sm font-medium text-zinc-800">{c.nombre}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TIPO_COLOR[c.tipo] || 'bg-zinc-200 text-zinc-600'}`}>{c.tipo}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-600">{c.telefono || '—'}</td>
                  <td className="py-3 px-4 text-sm text-zinc-600">{c.instagram || '—'}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400 max-w-xs truncate">{c.notas || '—'}</td>
                  <td className="py-3 px-4 text-sm text-zinc-400">{c.fechaRegistro || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...c })}
                        className="bg-zinc-200 hover:bg-zinc-500 text-white px-3 py-1.5 rounded text-xs transition-colors">✏️</button>
                      <button onClick={() => del(c.id)}
                        className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-zinc-500">Sin clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing._new ? 'Nuevo Cliente' : `Editar ${editing.id}`} onClose={() => setEditing(null)}>
          <ClienteForm data={editing} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

