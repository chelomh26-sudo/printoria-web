import { useEffect } from 'react';

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${wide ? 'w-full max-w-4xl' : 'w-full max-w-2xl'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-zinc-800">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-800 text-2xl leading-none transition-colors">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
