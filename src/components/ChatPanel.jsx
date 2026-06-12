import { useState, useRef, useEffect } from 'react';
import { usePrintoria } from '../store/PrintoriaContext';
import { callClaude, buildSystemPrompt, buildDataSummary } from '../ai/claudeApi';

function getNextId(items, prefix) {
  if (!items.length) return `${prefix}001`;
  const nums = items.map(i => parseInt(i.id.replace(prefix, '')) || 0);
  return prefix + String(Math.max(...nums) + 1).padStart(3, '0');
}

const WELCOME = '¡Hola! Soy tu asistente PRINTORIA 🖨️\n\nPuedo:\n• 📸 Analizar foto del slicer → registrar gramos y tiempo\n• 💸 "Agrega gasto Bambu A1 Mini $4500" → lo registro\n• ⚠️ "Falla hoy M003 perdí 90g" → registra falla\n• 🏠 "Uso personal 200g blanco 3h" → registra UP\n• 📦 "Nuevo producto llavero 15g 45min $35"\n• ❓ "Cuánto vendí este mes"\n\nEscribe, habla 🎤 o pega una imagen 📎';

export default function ChatPanel() {
  const ctx = usePrintoria();
  const { config, products, setProducts, personal, setPersonal, failures, setFailures,
    gastos, setGastos, clients, setClients, cola, setCola,
    materials, sales, wholesale, multiSales, proceso } = ctx;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingTool, setPendingTool] = useState(null);

  const bottomRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function addMsg(role, content, extra = {}) {
    setMessages(prev => [...prev, { role, content, ...extra }]);
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Tu navegador no soporta micrófono. Usa Chrome o Edge.'); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = 'es-MX';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = e => {
      const text = e.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + text : text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target.result.split(',')[1];
      setImage({ base64, mediaType: file.type, preview: e.target.result });
    };
    reader.readAsDataURL(file);
  }

  function handlePaste(e) {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (item) handleImageFile(item.getAsFile());
  }

  function executeToolCall(toolName, toolInput) {
    const today = new Date().toISOString().slice(0, 10);
    if (toolName === 'registrar_uso_personal') {
      const newItem = {
        id: getNextId(personal, 'UP'),
        fecha: today,
        descripcion: toolInput.descripcion || '',
        impresora: toolInput.impresora || 'Bambu',
        materiales: toolInput.materialId ? [{ materialId: toolInput.materialId, gramos: toolInput.gramos || 0 }] : [],
        tiempo: toolInput.tiempo || 0,
      };
      setPersonal(prev => [...prev, newItem]);
      return `✅ Uso personal registrado: ${newItem.id} — ${newItem.descripcion} (${toolInput.gramos}g)`;
    }
    if (toolName === 'registrar_falla') {
      const newItem = {
        id: getNextId(failures, 'F'),
        fecha: today,
        descripcion: toolInput.descripcion || '',
        materialId: toolInput.materialId || '',
        gramosPerdidos: toolInput.gramosPerdidos || 0,
        tiempoPerdido: toolInput.tiempoPerdido || 0,
        impresora: toolInput.impresora || 'Bambu',
      };
      setFailures(prev => [...prev, newItem]);
      return `⚠️ Falla registrada: ${newItem.id} — ${newItem.descripcion} (${newItem.gramosPerdidos}g perdidos)`;
    }
    if (toolName === 'registrar_producto') {
      const newItem = {
        id: getNextId(products, 'P'),
        nombre: toolInput.nombre || '',
        descripcion: toolInput.descripcion || '',
        gramos: toolInput.gramos || 0,
        tiempoBambu: toolInput.tiempoBambu || 0,
        tiempoEnder: toolInput.tiempoEnder || 0,
        precioVenta: toolInput.precioVenta || 0,
        publicar: false,
        foto: '',
        descripcionPublica: '',
      };
      setProducts(prev => [...prev, newItem]);
      return `📦 Producto registrado: ${newItem.id} — ${newItem.nombre} (${newItem.gramos}g, $${newItem.precioVenta})`;
    }
    if (toolName === 'registrar_gasto') {
      const newItem = {
        id: getNextId(gastos, 'G'),
        fecha: toolInput.fecha || today,
        categoria: toolInput.categoria || 'Otros',
        descripcion: toolInput.descripcion || '',
        monto: parseFloat(toolInput.monto) || 0,
      };
      setGastos(prev => [...prev, newItem]);
      return `💸 Gasto registrado: ${newItem.id} — ${newItem.descripcion} $${newItem.monto} (${newItem.categoria})`;
    }
    if (toolName === 'registrar_cliente') {
      const newItem = {
        id: getNextId(clients, 'C'),
        nombre: toolInput.nombre || '',
        telefono: toolInput.telefono || '',
        instagram: toolInput.instagram || '',
        tipo: toolInput.tipo || 'MENUDEO',
        notas: toolInput.notas || '',
        fechaRegistro: today,
      };
      setClients(prev => [...prev, newItem]);
      return `👤 Cliente registrado: ${newItem.id} — ${newItem.nombre}`;
    }
    if (toolName === 'consultar_negocio') {
      return buildDataSummary(toolInput.tipo, { sales, wholesale, materials, proceso, products, multiSales });
    }
    if (toolName === 'iniciar_cola') {
      const printer = toolInput.impresora; // 'bambu' or 'ender'
      const [h, m] = (toolInput.hora || '00:00').split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      const startedAt = d.getTime();
      setCola(prev => ({ ...prev, [`${printer}StartedAt`]: startedAt }));
      const label = printer === 'bambu' ? 'Bambu' : 'Ender';
      return `▶ ${label} iniciada a las ${toolInput.hora}`;
    }
    return 'Acción completada.';
  }

  async function send() {
    const text = input.trim();
    if (!text && !image) return;
    if (!config.apiKey) {
      addMsg('assistant', '⚠️ Necesitas configurar tu API Key de Anthropic en **Configuración** para usar el asistente.');
      return;
    }

    // Build user message content
    const userContent = [];
    if (image) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
    }
    if (text) {
      userContent.push({ type: 'text', text });
    }

    addMsg('user', text || '📎 Imagen adjunta', { imagePreview: image?.preview });
    setInput('');
    setImage(null);
    setLoading(true);

    // Build full message history for API (only role+content, no extras)
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => !m.isToolResult)
      .map(m => ({ role: m.role, content: m.content }));

    const apiMessages = [
      ...history,
      { role: 'user', content: userContent },
    ];

    const appData = { materials, products, sales, wholesale, personal, failures, proceso, multiSales };

    try {
      let response = await callClaude({
        apiKey: config.apiKey,
        messages: apiMessages,
        systemPrompt: buildSystemPrompt(appData),
      });

      // Handle tool_use loop
      while (response.stop_reason === 'tool_use') {
        const toolUseBlock = response.content.find(b => b.type === 'tool_use');
        const textBlock = response.content.find(b => b.type === 'text');

        if (textBlock?.text) addMsg('assistant', textBlock.text);

        setLoading(false);
        const toolName = toolUseBlock.name;
        const toolInput = toolUseBlock.input;
        const toolId = toolUseBlock.id;

        // Show preview of what will happen
        const preview = formatToolPreview(toolName, toolInput);
        addMsg('assistant', preview, { isToolPreview: true, toolName, toolInput });

        // Wait for user confirmation
        const confirmed = await new Promise(resolve => {
          setPendingTool({ toolName, toolInput, toolId, resolve });
        });
        setPendingTool(null);
        setLoading(true);

        let toolResult;
        if (confirmed) {
          toolResult = executeToolCall(toolName, toolInput);
          addMsg('assistant', toolResult, { isToolResult: true });
        } else {
          toolResult = 'El usuario canceló la acción.';
          addMsg('assistant', '❌ Acción cancelada.', { isToolResult: true });
        }

        // Continue conversation
        apiMessages.push({ role: 'assistant', content: response.content });
        apiMessages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolId, content: toolResult }],
        });

        response = await callClaude({
          apiKey: config.apiKey,
          messages: apiMessages,
          systemPrompt: buildSystemPrompt(appData),
        });
      }

      // Final text response
      const finalText = response.content.find(b => b.type === 'text')?.text;
      if (finalText) addMsg('assistant', finalText);

    } catch (err) {
      addMsg('assistant', `❌ Error: ${err.message}`);
    }

    setLoading(false);
  }

  function formatToolPreview(toolName, input) {
    if (toolName === 'registrar_uso_personal') {
      return `📋 **Uso personal a registrar:**\n• Descripción: ${input.descripcion}\n• Material: ${input.materialId || 'sin especificar'}\n• Gramos: ${input.gramos}g\n• Tiempo: ${input.tiempo || 0} min\n• Impresora: ${input.impresora || 'Bambu'}`;
    }
    if (toolName === 'registrar_falla') {
      return `⚠️ **Falla a registrar:**\n• Descripción: ${input.descripcion}\n• Material: ${input.materialId || 'sin especificar'}\n• Gramos perdidos: ${input.gramosPerdidos}g\n• Tiempo perdido: ${input.tiempoPerdido || 0} min`;
    }
    if (toolName === 'registrar_producto') {
      return `📦 **Producto a registrar:**\n• Nombre: ${input.nombre}\n• Gramos: ${input.gramos}g\n• Tiempo Bambu: ${input.tiempoBambu || 0} min\n• Precio: $${input.precioVenta || 0}`;
    }
    if (toolName === 'registrar_gasto') {
      return `💸 **Gasto a registrar:**\n• Descripción: ${input.descripcion}\n• Categoría: ${input.categoria}\n• Monto: $${input.monto}\n• Fecha: ${input.fecha || 'hoy'}`;
    }
    if (toolName === 'registrar_cliente') {
      return `👤 **Cliente a registrar:**\n• Nombre: ${input.nombre}\n• Teléfono: ${input.telefono || '—'}\n• Instagram: ${input.instagram ? '@' + input.instagram : '—'}\n• Tipo: ${input.tipo || 'MENUDEO'}`;
    }
    return `🔧 Acción: ${toolName}`;
  }

  function renderContent(msg) {
    return msg.content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          {'\n'}
        </span>
      );
    });
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          open ? 'bg-zinc-700 shadow-zinc-900/60 text-2xl text-white' : 'bg-[#96d629] hover:bg-[#a3dc3f] shadow-[#96d629]/50'
        }`}
        title="Asistente PRINTORIA"
      >
        {open ? '✕' : <img src="/mascot.png" className="w-9 h-9 object-contain drop-shadow-sm" alt="Asistente" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border-b border-zinc-700 flex-shrink-0">
            <div className="w-9 h-9 bg-[#96d629] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="/mascot.png" className="w-8 h-8 object-contain" alt="mascot" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">Asistente PRINTORIA</p>
              <p className="text-xs text-zinc-500">Análisis de slicers · Registro rápido</p>
            </div>
            {!config.apiKey && (
              <span className="ml-auto text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Sin API Key</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#96d629] text-black rounded-br-sm font-medium'
                    : msg.isToolPreview
                    ? 'bg-zinc-700 border border-[#96d629]/40 text-zinc-100 rounded-bl-sm w-full'
                    : msg.isToolResult
                    ? 'bg-zinc-800 border border-zinc-600 text-zinc-300 rounded-bl-sm'
                    : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                }`}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="adjunto" className="w-full rounded-lg mb-2 max-h-40 object-contain bg-zinc-950" />
                  )}
                  {renderContent(msg)}

                  {/* Confirm/Cancel buttons for tool preview */}
                  {msg.isToolPreview && pendingTool && i === messages.length - 1 && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => pendingTool.resolve(true)}
                        className="flex-1 bg-[#96d629] hover:bg-[#a3dc3f] text-black font-bold py-1.5 rounded-lg text-xs transition-colors">
                        ✓ Confirmar
                      </button>
                      <button onClick={() => pendingTool.resolve(false)}
                        className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-zinc-200 font-bold py-1.5 rounded-lg text-xs transition-colors">
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-[#96d629] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#96d629] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#96d629] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {image && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="relative inline-block">
                <img src={image.preview} alt="adjunto" className="h-16 rounded-lg border border-zinc-600 object-contain bg-zinc-950" />
                <button onClick={() => setImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-700 hover:bg-red-600 rounded-full text-xs text-white flex items-center justify-center transition-colors">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-zinc-700 flex-shrink-0">
            {listening && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Escuchando... habla ahora</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-9 h-9 bg-zinc-700 hover:bg-zinc-600 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Adjuntar imagen del slicer">
                📎
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e.target.files?.[0])} />

              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={config.apiKey ? (listening ? '🎤 Escuchando...' : 'Escribe, habla o pega imagen...') : 'Configura tu API Key primero...'}
                className="flex-1 bg-zinc-700 border border-zinc-600 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#96d629] focus:outline-none resize-none"
                disabled={loading}
              />

              {/* Micrófono */}
              <button onClick={toggleVoice} disabled={loading}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                  listening
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-zinc-200'
                }`}
                title={listening ? 'Parar grabación' : 'Hablar'}>
                🎤
              </button>

              <button onClick={send} disabled={loading || (!input.trim() && !image)}
                className="flex-shrink-0 w-9 h-9 bg-[#96d629] hover:bg-[#a3dc3f] disabled:opacity-40 rounded-xl flex items-center justify-center text-black transition-colors font-bold">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
