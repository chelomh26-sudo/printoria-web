import { useState, useEffect, useRef } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { fmt } from '../store/utils';

/* ── Fixed category order ───────────────────────────────── */
const CATEGORIAS_ORDER = ['Temporada','Hogar','Negocios','Decoración','Regalos','Cocina','Juguetes/Fidget','Colección','Eventos Sociales','Macetas','Deportes','Día a día'];

/* ── Colors per card index ───────────────────────────────── */
const CARD_ACCENTS = [
  { grad: 'from-[#96d629] to-[#5c891a]', glow: '#96d62940', border: '#96d629' },
  { grad: 'from-orange-400 to-orange-600', glow: '#f9731640', border: '#fb923c' },
  { grad: 'from-violet-400 to-violet-600', glow: '#a855f740', border: '#a78bfa' },
  { grad: 'from-cyan-400 to-cyan-600', glow: '#06b6d440', border: '#22d3ee' },
  { grad: 'from-pink-400 to-pink-600', glow: '#ec489940', border: '#f472b6' },
  { grad: 'from-amber-400 to-amber-600', glow: '#f59e0b40', border: '#fbbf24' },
];

/* ── WhatsApp helper ─────────────────────────────────────── */
function waLink(num, msg) {
  const n = (num || '').replace(/\D/g, '');
  if (!n) return '#';
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}

/* ── Hero orbs + mascots on sides ───────────────────────── */

function Orbs() {
  return (
    <div className="pointer-events-none select-none" aria-hidden>
      {/* Color orbs */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, #96d62912 0%, transparent 70%)',
        top: -150, left: '50%', transform: 'translateX(-50%)',
        animation: 'orbFloat 8s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, #a855f718 0%, transparent 70%)',
        top: 100, left: -80,
        animation: 'orbFloat 10s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, #06b6d418 0%, transparent 70%)',
        top: 80, right: -60,
        animation: 'orbFloat 12s ease-in-out infinite',
      }}/>

      {/* mascot1 — escena completa con impresora y herramientas — lado izquierdo */}
      <div style={{
        position: 'absolute', left: 0, bottom: 0,
        width: 'clamp(180px, 26vw, 380px)',
        animation: 'orbFloat 7s ease-in-out infinite',
      }}>
        <img src="/mascot1.png" alt="" style={{
          width: '100%', display: 'block',
          filter: 'drop-shadow(0 0 40px #96d62940)',
        }}/>
      </div>

      {/* mascot4 — impresora "IMPRIMIENDO POSIBILIDADES" — lado derecho */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: 'clamp(180px, 26vw, 360px)',
        animation: 'orbFloat 9s ease-in-out infinite reverse',
      }}>
        <img src="/mascot4.png" alt="" style={{
          width: '100%', display: 'block',
          filter: 'drop-shadow(0 0 40px #96d62940)',
        }}/>
      </div>
    </div>
  );
}

/* ── Stats strip — value props (sin números inventados) ─── */
const STATS = [
  { icon: '⚡', label: 'Pedidos rápidos', color: '#96d629' },
  { icon: '🎨', label: '100% personalizable', color: '#22d3ee' },
  { icon: '📍', label: 'Entrega local VIC', color: '#a78bfa' },
  { icon: '💬', label: 'Cuéntame tu idea', color: '#fb923c' },
];

/* ── Product card ────────────────────────────────────────── */
/* ── YouTube embed helper ── */
function getYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

/* ── Compact card for category rows ── */
function CompactCard({ product: p, onOpen }) {
  return (
    <button
      onClick={onOpen}
      onTouchStart={e => { e.currentTarget._tx = e.touches[0].clientX; e.currentTarget._ty = e.touches[0].clientY; }}
      onTouchEnd={e => {
        const dx = Math.abs(e.changedTouches[0].clientX - (e.currentTarget._tx||0));
        const dy = Math.abs(e.changedTouches[0].clientY - (e.currentTarget._ty||0));
        if (dx < 10 && dy < 10) { e.preventDefault(); onOpen(); }
      }}
      style={{
        flex: '0 0 auto', width: 148,
        background: '#0e0e1a',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 16, overflow: 'hidden',
        cursor: 'pointer', textAlign: 'left', padding: 0,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <img
        src={p.foto || '/mascot1.png'}
        alt={p.nombre}
        style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        onError={e => { e.target.src = '/mascot1.png'; }}
      />
      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {p.nombre}
        </p>
        <p style={{ color: '#a78bfa', fontSize: 13, fontWeight: 800, margin: '5px 0 0' }}>
          {typeof p.precioVenta === 'number'
            ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p.precioVenta)
            : p.precioVenta}
        </p>
      </div>
    </button>
  );
}

/* ── Product detail modal ── */
function ProductDetailModal({ product: p, onClose, waHref, onAdd }) {
  const embedUrl = getYoutubeEmbed(p.videoUrl);
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
      <div style={{
        background: '#0e0e1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        width: '100%', maxWidth: 760,
        maxHeight: '92vh', overflowY: 'auto',
        position: 'relative',
      }}>
        <button onClick={onClose}
          style={{
            position: 'sticky', top: 12, float: 'right', marginRight: 12, zIndex: 10,
            background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

        {p.foto && (
          <div style={{ borderRadius: '24px 24px 0 0', overflow: 'hidden', maxHeight: 360 }}>
            <img src={p.foto} alt={p.nombre}
              style={{ width: '100%', objectFit: 'cover', maxHeight: 360, display: 'block' }} />
          </div>
        )}

        <div style={{ padding: '28px 28px 32px', clear: 'both' }}>
          {(p.categorias || []).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {p.categorias.map(c => (
                <span key={c} style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100,
                  background: 'rgba(150,214,41,0.1)', color: '#96d629',
                  border: '1px solid rgba(150,214,41,0.2)',
                }}>{c}</span>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: 'white', marginBottom: 14, lineHeight: 1.2 }}>
            {p.nombre}
          </h2>

          {(p.descripcionPublica || p.descripcion) && (
            <p style={{ fontSize: 15, color: '#9999bb', lineHeight: 1.75, marginBottom: 24, whiteSpace: 'pre-line' }}>
              {p.descripcionPublica || p.descripcion}
            </p>
          )}

          {embedUrl && (
            <div style={{
              marginBottom: 28, borderRadius: 16, overflow: 'hidden',
              position: 'relative', paddingTop: '56.25%',
              background: '#07070f',
            }}>
              <iframe
                src={embedUrl}
                title="Video del producto"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 'clamp(30px,5vw,40px)', fontWeight: 900,
              background: 'linear-gradient(135deg, #96d629, #5c891a)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{fmt(p.precioVenta)}</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
              background: 'rgba(37,211,102,0.12)', color: '#25d366',
              border: '1px solid rgba(37,211,102,0.25)',
            }}>✓ Disponible</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button
                onClick={() => { onAdd?.(); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
                  color: 'white', fontWeight: 800, fontSize: 15,
                  padding: '14px 28px', borderRadius: 100,
                  border: 'none', cursor: 'pointer', width: '100%',
                }}
              >
                <span style={{ fontSize: 20 }}>{"\u{1F6D2}"}</span> Agregar al carrito
              </button>
              <a href={waHref} target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'linear-gradient(135deg, #25d366, #128c4e)',
              color: 'white', fontWeight: 900, fontSize: 16,
              padding: '16px 32px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
            }}>
            💬 Pedir por WhatsApp
          </a>
            </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product: p, idx, onAdd, onWA, multi, onOpen }) {
  const acc = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onOpen?.()}
      onTouchStart={e => { e.currentTarget._tx = e.touches[0].clientX; e.currentTarget._ty = e.touches[0].clientY; }}
      onTouchEnd={e => {
        const dx = Math.abs(e.changedTouches[0].clientX - (e.currentTarget._tx||0));
        const dy = Math.abs(e.changedTouches[0].clientY - (e.currentTarget._ty||0));
        if (dx < 10 && dy < 10) { e.preventDefault(); onOpen?.(); }
      }}
      role="button"
      tabIndex={0}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group"
      style={{
        background: '#0e0e1a',
        border: `1.5px solid ${hovered ? acc.border : '#ffffff12'}`,
        boxShadow: hovered ? `0 0 30px ${acc.glow}, 0 8px 32px #00000060` : '0 2px 12px #00000040',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Colored top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${acc.grad}`} />

      {/* Image / placeholder */}
      <div className="aspect-video relative overflow-hidden" style={{ background: '#07070f' }}>
        {p.foto ? (
          <img src={p.foto} alt={p.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {/* Animated placeholder */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `conic-gradient(${acc.border}, transparent, ${acc.border})`,
              animation: 'spin 3s linear infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22 }}>{multi ? '🎨' : '📦'}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#ffffff30', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Imagen próximamente</span>
          </div>
        )}
        {/* Multi badge */}
        {multi && (
          <span className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(168,85,247,0.3)', color: '#c084fc', border: '1px solid #a855f740' }}>
            🎨 Multi-color
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-white text-lg leading-tight mb-1 line-clamp-2">{p.nombre}</h3>
        {(p.descripcionPublica || p.descripcion) && (
          <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: '#8888aa' }}>
            {p.descripcionPublica || p.descripcion}
          </p>
        )}
        <div className="flex items-end justify-between mt-auto gap-3">
          {/* Gradient price */}
          <span className={`text-3xl font-black bg-gradient-to-r ${acc.grad} bg-clip-text text-transparent`}>
            {fmt(p.precioVenta)}
          </span>
          {/* Add to cart */}
          <button onClick={onAdd}
            className="text-xs font-black px-3 py-1.5 rounded-xl border transition-all"
            style={{ borderColor: '#ffffff20', color: '#ffffffaa', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = acc.border; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ffffff20'; e.currentTarget.style.color = '#ffffffaa'; }}>
            + Carrito
          </button>
        </div>

        {/* WhatsApp CTA */}
        <a href={onWA}
          target="_blank" rel="noreferrer"
          className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all`}
          style={{ background: `linear-gradient(135deg, #25d366, #128c4e)`, color: 'white', boxShadow: '0 4px 14px #25d36640' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ── Gallery real photo card ────────────────────────────── */
const PHOTO_ACCENTS = ['#96d629','#22d3ee','#a78bfa','#fb923c','#f472b6','#fbbf24'];
function GalleryPhotoCard({ foto, idx }) {
  const accent = PHOTO_ACCENTS[idx % PHOTO_ACCENTS.length];
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        borderRadius: 16, overflow: 'hidden', position: 'relative',
        aspectRatio: '1/1',
        border: `1.5px solid ${hov ? accent : accent + '30'}`,
        boxShadow: hov ? `0 0 28px ${accent}30` : 'none',
        transition: 'all .3s', cursor: 'default',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <img src={foto.url} alt={foto.titulo}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform .4s',
          transform: hov ? 'scale(1.07)' : 'scale(1)',
        }}/>
      {foto.titulo && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          padding: '20px 12px 10px',
          opacity: hov ? 1 : 0, transition: 'opacity .3s',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{foto.titulo}</p>
        </div>
      )}
    </div>
  );
}

/* ── Gallery placeholder tiles ──────────────────────────── */
const GALLERY_PLACEHOLDERS = [
  { emoji: '🖨️', label: 'Próximamente', color: '#96d629' },
  { emoji: '🎨', label: 'Próximamente', color: '#22d3ee' },
  { emoji: '📦', label: 'Próximamente', color: '#a78bfa' },
  { emoji: '✨', label: 'Próximamente', color: '#fb923c' },
  { emoji: '🔧', label: 'Próximamente', color: '#f472b6' },
  { emoji: '🌟', label: 'Próximamente', color: '#fbbf24' },
];
function GalleryPlaceholder({ idx }) {
  const g = GALLERY_PLACEHOLDERS[idx % GALLERY_PLACEHOLDERS.length];
  return (
    <div className="aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3"
      style={{
        background: '#07070f',
        border: `1.5px solid ${g.color}20`,
      }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: `${g.color}12`,
        border: `1px solid ${g.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {g.emoji}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: g.color + '60', letterSpacing: 2, textTransform: 'uppercase' }}>
        {g.label}
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function CatalogoPublico() {
  const { products, multiProducts, config, galeriaFotos } = usePrintoria();
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCat, setActiveCat] = useState('Todos');
  const [navScrolled, setNavScrolled] = useState(false);

  const simples = products.filter(p => p.publicar);
  const multis   = multiProducts.filter(p => p.publicar);
  const allPublished = [
    ...simples.map(p => ({ ...p, multi: false })),
    ...multis.map(p => ({ ...p, multi: true })),
  ];

  const usedCats = new Set(allPublished.flatMap(p => p.categorias || []));
  const activeCats = ['Todos', ...CATEGORIAS_ORDER.filter(c => usedCats.has(c))];
  const filtered = activeCat === 'Todos'
    ? allPublished
    : allPublished.filter(p => (p.categorias || []).includes(activeCat));

  const cartTotal = cart.reduce((s, c) => s + c.precio * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const phone = (config.whatsapp || '8341112949').replace(/\D/g, '');

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }
  function updateQty(id, qty) {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  }
  function sendWhatsApp() {
    if (!phone) return;
    const lines = cart.map(c => `• ${c.nombre} x${c.qty} = $${(c.precio * c.qty).toFixed(2)}`).join('\n');
    const msg = `¡Hola PRINTORIA 3D! 🖨️\n\nQuiero hacer este pedido:\n\n${lines}\n\n💰 Total: ${fmt(cartTotal)}\n\n¡Quedo en espera! 😊`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div style={{ background: '#080810', color: '#e8e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>

      {/* ── GLOBAL ANIMATIONS ── */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes pulse-wa { 0%,100%{box-shadow:0 0 0 0 #25d36640} 50%{box-shadow:0 0 0 12px transparent} }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-fadeup { animation: fadeUp .7s ease both; }
        .animate-fadeup-delay { animation: fadeUp .7s .15s ease both; }
        .animate-fadeup-delay2 { animation: fadeUp .7s .3s ease both; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── FIXED NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navScrolled ? 'rgba(8,8,16,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all .3s ease',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <a href="#" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <img src="/logo-oficial.png" alt="Printoria 3D VIC" style={{ height: 40, objectFit: 'contain', borderRadius: 8 }} />
        </a>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {['#catalogo', '#nosotros', '#galeria', '#contacto'].map((href, i) => (
            <a key={href} href={href}
              style={{ fontSize: 13, fontWeight: 700, color: '#aaaacc', textDecoration: 'none', letterSpacing: 1, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#96d629'}
              onMouseLeave={e => e.currentTarget.style.color = '#aaaacc'}>
              {['Catálogo', 'Nosotros', 'Galería', 'Contacto'][i]}
            </a>
          ))}
        </div>

        {/* Ver catálogo pill */}
        <a href="#catalogo"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #96d629, #5c891a)',
            color: '#0a1200', fontWeight: 800, fontSize: 13,
            padding: '9px 18px', borderRadius: 100,
            textDecoration: 'none', boxShadow: '0 4px 16px #96d62940',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
          Ver catálogo ↓
        </a>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64,
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.88), rgba(8,8,16,0.92)), url(/impresora1.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <Orbs />

        {/* Filament lines decoration */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[
            { top:'10%', left:'-5%', w:400, rotate:-30, color:'#96d629' },
            { top:'60%', right:'-5%', w:350, rotate:20,  color:'#a855f7' },
            { top:'80%', left:'10%', w:250, rotate:10,   color:'#06b6d4' },
            { top:'20%', right:'10%',w:200, rotate:-15,  color:'#f97316' },
          ].map((l, i) => (
            <div key={i} style={{
              position: 'absolute', height: 1,
              width: l.w, top: l.top, left: l.left, right: l.right,
              background: `linear-gradient(90deg, transparent, ${l.color}60, transparent)`,
              transform: `rotate(${l.rotate}deg)`,
            }}/>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 24px', maxWidth: 700, margin: '0 auto' }}>
          {/* Badge */}
          <div className="animate-fadeup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(150,214,41,0.12)', border: '1px solid rgba(150,214,41,0.3)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#96d629', animation: 'pulse-wa 2s infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#96d629', letterSpacing: 3, textTransform: 'uppercase' }}>
              Impresión 3D · {config.ciudad || 'Victoria, Tamaulipas'}
            </span>
          </div>

          {/* Logo grande centrado */}
          <div className="animate-fadeup" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            {/* Glow ring behind logo */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', width: '140%', height: '140%', borderRadius: '50%',
                background: 'radial-gradient(circle, #96d62928 0%, transparent 65%)',
                animation: 'orbFloat 5s ease-in-out infinite',
              }}/>
              <img src="/logo-oficial.png" alt="Printoria 3D VIC"
                style={{
                  height: 'clamp(80px, 14vw, 130px)',
                  objectFit: 'contain',
                  position: 'relative',
                  filter: 'drop-shadow(0 4px 30px #96d62960)',
                }}
              />
            </div>
          </div>

          {/* Slogan */}
          <p className="animate-fadeup-delay2" style={{
            fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 700,
            color: '#8888aa', marginBottom: 40, lineHeight: 1.4,
          }}>
            {config.slogan || 'Imprimiendo Posibilidades'}
          </p>

          {/* CTAs */}
          <div className="animate-fadeup-delay2" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#catalogo" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #96d629, #5c891a)',
              color: '#0a1200', fontWeight: 900, fontSize: 16,
              padding: '14px 32px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 8px 32px #96d62940',
              transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 40px #96d62960'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px #96d62940'; }}>
              Ver catálogo ↓
            </a>
            <a href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola! Tengo una idea para imprimir en 3D 🖨️')}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', fontWeight: 800, fontSize: 16,
                padding: '14px 32px', borderRadius: 100, textDecoration: 'none',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
              💬 Cotizar idea
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 24, height: 38, border: '2px solid rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <div style={{ width: 4, height: 8, background: '#96d629', borderRadius: 2, animation: 'orbFloat 1.5s ease-in-out infinite' }}/>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '0 24px', margin: '-1px 0' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: 'linear-gradient(135deg, #0e0e1a, #131320)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          overflow: 'hidden', transform: 'translateY(-28px)',
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: '24px 20px', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <p style={{ fontSize: 30, lineHeight: 1, marginBottom: 8 }}>{s.icon}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: s.color, letterSpacing: 0.5 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section id="nosotros" style={{
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.85), rgba(8,8,16,0.85)), url(/impresora2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #a855f715, transparent 70%)', pointerEvents: 'none' }}/>
        {/* mascot3 — mascota imprimiendo — decoración lateral izquierda */}
        <div style={{ position: 'absolute', left: -20, bottom: 0, height: 300, pointerEvents: 'none', opacity: 0.45 }}>
          <img src="/mascot3.png" alt="" style={{
            height: '100%', width: 'auto',
            filter: 'drop-shadow(0 0 20px #96d62930)',
          }}/>
        </div>
        {/* mascot2 — mascota con herramienta — decoración lateral derecha */}
        <div style={{ position: 'absolute', right: -20, bottom: 0, height: 280, pointerEvents: 'none', opacity: 0.4 }}>
          <img src="/mascot2.png" alt="" style={{
            height: '100%', width: 'auto',
            filter: 'drop-shadow(0 0 20px #a855f730)',
          }}/>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', letterSpacing: 3, textTransform: 'uppercase' }}>Quiénes somos</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.1 }}>
              Fabricamos lo que<br/>
              <span style={{ background: 'linear-gradient(135deg, #a855f7, #06b6d4)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>imaginas</span>
            </h2>
            <p style={{ fontSize: 17, color: '#8888aa', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              {config.sobreNosotros || 'Somos un taller de impresión 3D local comprometido con la calidad, rapidez y personalización. Cada pieza es única, fabricada con precisión capa por capa para hacerla exactamente como la necesitas.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              {
                icon: '🎯', title: '100% Personalizado',
                desc: 'No vendemos productos genéricos. Fabricamos exactamente lo que imaginas.',
                color: '#96d629', mascot: '/mascot5.png',
              },
              {
                icon: '⚡', title: 'Entrega rápida',
                desc: 'Producción local. Sin esperas de semanas ni costos de envío extras.',
                color: '#22d3ee', mascot: '/mascot7.png',
              },
              {
                icon: '💬', title: 'Atención directa',
                desc: '¿Tienes una idea? Mándanos un mensaje y la hacemos realidad juntos.',
                color: '#a78bfa', mascot: '/mascot8.png',
              },
            ].map(f => (
              <div key={f.title}
                onClick={() => onOpen?.()} style={{ cursor: 'pointer', background: '#0e0e1a', border: `1px solid ${f.color}25`, borderRadius: 20, padding: '32px 28px', transition: 'all .3s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${f.color}60`; e.currentTarget.style.boxShadow = `0 0 30px ${f.color}15`; }}
                onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${f.color}25`; e.currentTarget.style.boxShadow = 'none'; }}>
                {/* Mascot contextual — bottom-right de cada card, PNG transparente */}
                <img src={f.mascot} alt="" style={{
                  position: 'absolute', right: -8, bottom: -8, height: 120,
                  opacity: 0.6, pointerEvents: 'none',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                }}/>
                <div style={{ fontSize: 42, marginBottom: 16, position: 'relative' }}>{f.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 12, position: 'relative' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#8888aa', lineHeight: 1.7, position: 'relative', maxWidth: '80%' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÁLOGO ── */}
      <section id="catalogo" style={{
        padding: '80px 24px', position: 'relative',
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.87), rgba(8,8,16,0.87)), url(/impresora3.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(150,214,41,0.3), transparent)' }}/>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: 'rgba(150,214,41,0.1)', border: '1px solid rgba(150,214,41,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#96d629', letterSpacing: 3, textTransform: 'uppercase' }}>Catálogo</span>
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: 'white', marginBottom: 12, lineHeight: 1.1 }}>
              Nuestros productos
            </h2>
            <p style={{ fontSize: 16, color: '#8888aa' }}>Selecciona y pide directamente por WhatsApp</p>
          </div>

          {/* Products by category - horizontal scroll */}
          {allPublished.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>{"\u{1F4E6}"}</div>
              <p style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Pronto habrá productos aquí</p>
            </div>
          ) : (() => {
            const allCats = [...new Set(allPublished.flatMap(p => p.categorias || []))].filter(Boolean);
            const uncategorized = allPublished.filter(p => !p.categorias || p.categorias.length === 0);
            const sections = allCats.length > 0
              ? [...allCats.map(cat => ({ label: cat, prods: allPublished.filter(p => (p.categorias || []).includes(cat)) })),
                 ...(uncategorized.length > 0 ? [{ label: 'Otros', prods: uncategorized }] : [])]
              : [{ label: null, prods: allPublished }];
            return (
              <div>
                {sections.map(({ label, prods }) => (
                  <div key={label || 'all'} style={{ marginBottom: 32 }}>
                    {label && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <h3 style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: 0 }}>{label}</h3>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{prods.length} producto{prods.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
                      scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {prods.map(p => (
                        <CompactCard key={p.id} product={p} onOpen={() => setSelectedProduct(p)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── GALERÍA ── */}
      <section id="galeria" style={{
        padding: '80px 24px', position: 'relative',
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.86), rgba(8,8,16,0.86)), url(/impresora1.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)' }}/>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#22d3ee', letterSpacing: 3, textTransform: 'uppercase' }}>Galería</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', marginBottom: 12 }}>
              Nuestro trabajo
            </h2>
            <p style={{ color: '#8888aa', fontSize: 15 }}>Aquí verás fotos reales de todo lo que hacemos · Próximamente</p>
          </div>

          {galeriaFotos.length > 0 ? (
            /* ── FOTOS REALES ── */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {galeriaFotos.map((f, i) => (
                <GalleryPhotoCard key={f.id} foto={f} idx={i} />
              ))}
            </div>
          ) : (
            /* ── PLACEHOLDER — sin fotos aún ── */
            <>
              <div style={{
                border: '2px dashed rgba(6,182,212,0.2)',
                borderRadius: 24, padding: '52px 32px',
                textAlign: 'center', marginBottom: 32,
                background: 'rgba(6,182,212,0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{ width: 'clamp(140px, 18vw, 220px)' }}>
                    <img src="/mascot6.png" alt="" style={{
                      width: '100%', display: 'block',
                      filter: 'drop-shadow(0 0 24px #96d62940)',
                    }}/>
                  </div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff80', marginBottom: 8 }}>
                  ¡Pronto aquí verás nuestras creaciones!
                </h3>
                <p style={{ color: '#444466', fontSize: 14, maxWidth: 380, margin: '0 auto 20px' }}>
                  Estamos construyendo nuestra galería. Mientras tanto síguenos en Instagram para ver los últimos trabajos.
                </p>
                {config.instagram && (
                  <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: 'white', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 4px 20px #fd1d1d30' }}>
                    📸 Seguir en @{config.instagram}
                  </a>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
                {Array.from({ length: 6 }).map((_, i) => <GalleryPlaceholder key={i} idx={i} />)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── B2B ── */}
      <section style={{
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(rgba(8,8,16,0.95), rgba(8,8,16,0.95))',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-block', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fb923c', letterSpacing: 3, textTransform: 'uppercase' }}>Para negocios</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'white', marginBottom: 14, lineHeight: 1.1 }}>
              ¿Tu negocio puede crecer<br/>
              <span style={{ background: 'linear-gradient(135deg, #fb923c, #f59e0b)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>con impresión 3D?</span>
            </h2>
            <p style={{ fontSize: 17, color: '#8888aa', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Si tienes un negocio, hay algo que podemos hacer juntos. Te ayudo a diferenciarte con piezas únicas que otros no tienen.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18, marginBottom: 52 }}>
            {[
              { icon: '🎂', biz: 'Pastelerías', color: '#f472b6', items: ['Toppers con nombre', 'Moldes personalizados', 'Displays de pastel'] },
              { icon: '🍽️', biz: 'Restaurantes', color: '#fb923c', items: ['Porta menús 3D', 'Dispensadores custom', 'Letreros de mesa'] },
              { icon: '💅', biz: 'Salones & Spas', color: '#a78bfa', items: ['Organizadores de productos', 'Exhibidores', 'Decoración con tu logo'] },
              { icon: '🏪', biz: 'Boutiques / Tiendas', color: '#22d3ee', items: ['Exhibidores de producto', 'Letreros 3D', 'Etiquetas personalizadas'] },
              { icon: '🔧', biz: 'Talleres / Industria', color: '#96d629', items: ['Piezas de repuesto', 'Herramientas custom', 'Prototipos rápidos'] },
              { icon: '🏆', biz: 'Clubes & Deportes', color: '#fbbf24', items: ['Trofeos personalizados', 'Llaveros del equipo', 'Accesorios de liga'] },
            ].map(item => (
              <div key={item.biz}
                style={{
                  background: '#0e0e1a',
                  border: `1px solid ${item.color}20`,
                  borderRadius: 20, padding: '24px 22px',
                }}>
                <div style={{ fontSize: 34, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'white', marginBottom: 10 }}>{item.biz}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {item.items.map(it => (
                    <li key={it} style={{ fontSize: 13, color: '#7777aa', paddingLeft: 14, position: 'relative', marginBottom: 5 }}>
                      <span style={{ position: 'absolute', left: 0, color: item.color, fontWeight: 900 }}>·</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(245,158,11,0.06))',
            border: '1px solid rgba(251,146,60,0.2)',
            borderRadius: 24, padding: '40px 32px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 10 }}>
              ¿Tienes una idea para tu negocio?
            </p>
            <p style={{ color: '#8888aa', fontSize: 15, marginBottom: 28 }}>
              Escríbeme y en menos de 24 horas te digo qué podemos hacer y a qué precio.
            </p>
            <a href={`https://wa.me/${(config.whatsapp || '8341112949').replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola Printoria! 🖨️ Tengo un negocio y me interesa ver cómo la impresión 3D puede ayudarme. ¿Podemos hablar?')}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
                color: '#0a0a00', fontWeight: 900, fontSize: 16,
                padding: '16px 36px', borderRadius: 100, textDecoration: 'none',
                boxShadow: '0 6px 28px rgba(251,146,60,0.35)',
              }}>
              💬 Hablar sobre mi negocio
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA IDEA ── */}
      <section style={{
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.82), rgba(8,8,16,0.86)), url(/impresora3.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(150,214,41,0.06), rgba(168,85,247,0.06))' }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.3), transparent)' }}/>
        {/* mascot8 — mascota con teléfono WhatsApp — PNG transparente */}
        <div style={{
          position: 'absolute', right: 0, bottom: 0,
          height: 'clamp(200px, 28vw, 340px)',
          pointerEvents: 'none',
        }}>
          <img src="/mascot8.png" alt="" style={{
            height: '100%', width: 'auto', display: 'block',
            opacity: 0.85,
            filter: 'drop-shadow(0 0 30px #25d36640)',
          }}/>
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: 'white', marginBottom: 16, lineHeight: 1.1 }}>
            ¿Tienes una<br/>
            <span style={{ background: 'linear-gradient(135deg, #96d629, #22d3ee)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>idea en mente?</span>
          </h2>
          <p style={{ fontSize: 18, color: '#8888aa', marginBottom: 36, lineHeight: 1.6 }}>
            Cuéntanos qué quieres y te damos precio en menos de 24 horas.
          </p>
          <a href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola Printoria! 🖨️ Tengo una idea que me gustaría hacer realidad. ¿Me pueden ayudar?')}`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(135deg, #25d366, #128c4e)',
              color: 'white', fontWeight: 900, fontSize: 18,
              padding: '18px 40px', borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 8px 40px #25d36650', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 50px #25d36670'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 40px #25d36650'; }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Mandar mensaje
          </a>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" style={{
        padding: '80px 24px',
        backgroundImage: 'linear-gradient(rgba(8,8,16,0.88), rgba(8,8,16,0.88)), url(/impresora2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}/>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: 'white', marginBottom: 12 }}>Encuéntranos</h2>
          <p style={{ color: '#8888aa', marginBottom: 40, fontSize: 16 }}>Síguenos y mantente al día con nuestros proyectos</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            {config.whatsapp && (
              <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #25d366, #128c4e)', color: 'white', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 16, textDecoration: 'none', boxShadow: '0 4px 20px #25d36640', flex: '1 1 200px', justifyContent: 'center', transition: 'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                💬 WhatsApp
              </a>
            )}
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: 'white', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 16, textDecoration: 'none', flex: '1 1 200px', justifyContent: 'center', transition: 'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                📸 @{config.instagram}
              </a>
            )}
            {config.gmail && (
              <a href={`mailto:${config.gmail}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(234,67,53,0.15)', border: '1px solid rgba(234,67,53,0.3)', color: '#ff6b6b', fontWeight: 800, fontSize: 15, padding: '14px 28px', borderRadius: 16, textDecoration: 'none', flex: '1 1 200px', justifyContent: 'center', transition: 'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                ✉️ {config.gmail}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <img src="/logo-oficial.png" alt="Printoria 3D VIC" style={{ height: 60, objectFit: 'contain', opacity: 0.85 }} />
        </div>
        <p style={{ color: '#444466', fontSize: 13 }}>© 2026 · Hecho con ❤️ en {config.ciudad || 'Victoria, Tamaulipas'}</p>
      </footer>

      {/* ── FLOATING WhatsApp button (single, always bottom-right) ── */}
      <a href={`https://wa.me/${phone}?text=${encodeURIComponent('¡Hola Printoria! Me gustaría hacer un pedido 🖨️')}`}
        target="_blank" rel="noreferrer"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #25d366, #128c4e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px #25d36680',
          animation: 'pulse-wa 2.5s ease infinite',
        }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ── CART BUTTON (bottom-left when active) ── */}
      {cartCount > 0 && (
        <button onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed', bottom: 24, left: 24, zIndex: 190,
            background: 'linear-gradient(135deg, #96d629, #5c891a)',
            color: '#0a1200', fontWeight: 900, fontSize: 14,
            padding: '14px 22px', borderRadius: 100,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 24px #96d62960',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          🛒 {cartCount} · {fmt(cartTotal)}
        </button>
      )}

      {/* ── PRODUCT DETAIL MODAL ── */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={() => { addToCart({ id: selectedProduct.id, nombre: selectedProduct.nombre, precio: selectedProduct.precioVenta }); }}
          waHref={waLink(phone, `¡Hola Printoria! 🖨️ Me interesa el producto:\n\n*${selectedProduct.nombre}*\nPrecio: ${fmt(selectedProduct.precioVenta)}\n\n¿Está disponible? 😊`)}
        />
      )}

      {/* ── CART MODAL ── */}
      {cartOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setCartOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxWidth: 480, padding: 28, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🛒 Tu pedido</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: '#666688', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{c.nombre}</p>
                    <p style={{ color: '#96d629', fontWeight: 800, fontSize: 13, marginTop: 2 }}>{fmt(c.precio)} c/u</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(c.id, c.qty - 1)}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>−</button>
                    <span style={{ width: 24, textAlign: 'center', fontWeight: 800, color: 'white' }}>{c.qty}</span>
                    <button onClick={() => updateQty(c.id, c.qty + 1)}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>+</button>
                  </div>
                  <p style={{ width: 56, textAlign: 'right', fontWeight: 800, color: 'white', fontSize: 13 }}>{fmt(c.precio * c.qty)}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#666688', fontWeight: 600 }}>Total</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#96d629' }}>{fmt(cartTotal)}</p>
                </div>
                <button onClick={sendWhatsApp}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #25d366, #128c4e)', color: 'white', fontWeight: 900, fontSize: 15, padding: '14px 24px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px #25d36640' }}>
                  💬 Pedir por WhatsApp
                </button>
              </div>
              <button onClick={() => { setCart([]); setCartOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#444466', fontSize: 12, cursor: 'pointer', width: '100%', fontWeight: 600 }}>
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
