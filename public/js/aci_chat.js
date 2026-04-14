// ══════════════════════════════════════════════════════════════
// ACI — MODULO CHAT INTELIGENTE
// Chat con contexto del proyecto Reciclean-Farex
// Conectado a datos en tiempo real del sistema
// Asistente Comercial Integrado
// ══════════════════════════════════════════════════════════════

let _chatHistorial = [];
let _chatLoading = false;

// ── Contexto del sistema para el chat ─────────────────────────

function _chatBuildContext() {
  const sucActual = document.getElementById('neg-suc')?.value || 'No seleccionada';
  const usuario = typeof USUARIO !== 'undefined' ? USUARIO : {};

  // Obtener snapshot de precios activos
  let preciosResumen = '';
  if (typeof _snapshotData !== 'undefined' && _snapshotData && _snapshotData.length) {
    const muestra = _snapshotData.slice(0, 20).map(m =>
      m.material + ': Lista $' + (m.precio_lista || 0) + ', Ejec $' + (m.precio_ejecutivo || 0) + ', Max $' + (m.precio_maximo || 0)
    ).join('\n');
    preciosResumen = '\n\nPrecios activos (muestra):\n' + muestra;
  }

  // Obtener proveedores si disponibles
  let provsResumen = '';
  if (typeof aciGetProveedores === 'function') {
    const provs = aciGetProveedores();
    if (provs.length) {
      provsResumen = '\n\nProveedores registrados: ' + provs.length;
      const top5 = provs.slice(0, 5).map(p => p.nombre + ' (' + (p.zona || '?') + ', ' + (p.prioridad || '?') + ')').join(', ');
      provsResumen += '\nEjemplos: ' + top5;
    }
  }

  // Materiales del sistema
  let matsResumen = '';
  if (typeof MATS_LOCAL !== 'undefined') {
    const cats = [...new Set(MATS_LOCAL.map(m => m.cat))];
    matsResumen = '\n\nMateriales: ' + MATS_LOCAL.length + ' SKUs en ' + cats.length + ' categorias';
    matsResumen += '\nCategorias: ' + cats.join(', ');
  }

  // Sucursales
  const sucursalesInfo = 'Sucursales: Cerrillos (Farex+Reciclean), Maipu (Farex+Reciclean), Talca (Reciclean), Puerto Montt (Reciclean, NO operativa - en espera de permisos)';

  return 'Eres el asistente inteligente de Grupo Reciclean-Farex, empresa de reciclaje de materiales en Chile.\n'
    + 'Responde en espanol, de forma clara y concisa.\n'
    + 'Tienes acceso a los datos del sistema comercial.\n\n'
    + 'Usuario actual: ' + (usuario.nombre || 'Desconocido') + ' (rol: ' + (usuario.rol || '?') + ')\n'
    + 'Sucursal seleccionada: ' + sucActual + '\n'
    + sucursalesInfo + '\n'
    + 'Empresas: Farex (metales, con IVA retencion 19%) y Reciclean (plasticos, carton, vidrio, sin IVA)\n'
    + 'Contacto: WhatsApp +56 9 9534 2437 (Andrea Rivera), email comercial@gestionrepchile.cl\n'
    + matsResumen
    + preciosResumen
    + provsResumen
    + '\n\nPuerto Montt NO esta operativa. NUNCA indicar que esta activa.\n'
    + 'Palabras prohibidas: gratis, gratuito, sin costo, el mejor precio, garantizado.\n'
    + 'Redondeo: siempre Math.floor.\n'
    + 'Puedes responder sobre precios, materiales, sucursales, proveedores, procesos de cotizacion, y cualquier duda del equipo.';
}

// ── Render chat UI ────────────────────────────────────────────

function aciLoadChat() {
  const content = document.getElementById('chat-content');
  if (!content) return;

  content.innerHTML = '<div id="chat-messages" style="flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px;min-height:200px">'
    + _chatRenderMessages()
    + '</div>'
    + '<div style="padding:8px;border-top:1px solid #E0E0E0;background:#fff;border-radius:0 0 12px 12px">'
    + '<div style="display:flex;gap:6px">'
    + '<input type="text" id="chat-input" placeholder="Pregunta sobre precios, materiales, proveedores..." '
    + 'style="flex:1;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;outline:none;background:#F8F9FA" '
    + 'onkeydown="if(event.key===\'Enter\')aciChatSend()">'
    + '<button onclick="aciChatSend()" style="padding:10px 16px;background:#1565C0;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;flex-shrink:0" id="chat-send-btn">Enviar</button>'
    + '</div>'
    + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap" id="chat-sugerencias">'
    + _chatRenderSugerencias()
    + '</div>'
    + '</div>';

  // Focus en input
  setTimeout(() => document.getElementById('chat-input')?.focus(), 100);

  // Scroll al final
  _chatScrollToBottom();
}

function _chatRenderMessages() {
  if (!_chatHistorial.length) {
    return '<div style="text-align:center;padding:40px 16px">'
      + '<div style="font-size:36px;margin-bottom:12px">💬</div>'
      + '<div style="font-size:14px;font-weight:700;color:#1A2332;margin-bottom:4px">Chat Inteligente</div>'
      + '<div style="font-size:11px;color:#888;line-height:1.6">Preguntame sobre precios, materiales, proveedores, sucursales o cualquier duda del sistema.<br>Tengo acceso a los datos en tiempo real.</div>'
      + '</div>';
  }

  return _chatHistorial.map(msg => {
    if (msg.role === 'user') {
      return '<div style="align-self:flex-end;background:#1565C0;color:#fff;padding:10px 14px;border-radius:14px 14px 4px 14px;max-width:85%;font-size:13px;line-height:1.5">'
        + _chatEscapeHTML(msg.content) + '</div>';
    } else {
      return '<div style="align-self:flex-start;background:#F0F4F8;color:#1A2332;padding:10px 14px;border-radius:14px 14px 14px 4px;max-width:85%;font-size:13px;line-height:1.5">'
        + '<div style="font-size:9px;color:#1565C0;font-weight:700;margin-bottom:4px">ASISTENTE IA</div>'
        + _chatFormatResponse(msg.content) + '</div>';
    }
  }).join('');
}

function _chatRenderSugerencias() {
  const sugerencias = [
    'Precio del cobre hoy',
    'Materiales Reciclean',
    'Sucursales activas',
    'Como cotizar',
    'Materiales mas rentables'
  ];
  return sugerencias.map(s =>
    '<button onclick="aciChatQuick(\'' + s + '\')" style="padding:4px 10px;background:#E8EDF2;border:none;border-radius:12px;font-size:10px;color:#555;cursor:pointer;font-weight:600">' + s + '</button>'
  ).join('');
}

function _chatEscapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function _chatFormatResponse(text) {
  // Formato basico: negritas, saltos de linea, listas
  return _chatEscapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n(\d+)\. /g, '<br>$1. ')
    .replace(/\n/g, '<br>')
    .replace(/\$([\d,.]+)/g, '<span style="color:#1B5E20;font-weight:700">$$1</span>');
}

function _chatScrollToBottom() {
  setTimeout(() => {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }, 50);
}

// ── Enviar mensaje ────────────────────────────────────────────

async function aciChatSend() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim() || _chatLoading) return;

  const mensaje = input.value.trim();
  input.value = '';

  // Agregar mensaje del usuario
  _chatHistorial.push({ role: 'user', content: mensaje });

  // Mostrar loading
  _chatLoading = true;
  const messagesEl = document.getElementById('chat-messages');
  if (messagesEl) {
    messagesEl.innerHTML = _chatRenderMessages()
      + '<div id="chat-loading" style="align-self:flex-start;background:#F0F4F8;color:#888;padding:10px 14px;border-radius:14px;font-size:12px">'
      + '<div style="font-size:9px;color:#1565C0;font-weight:700;margin-bottom:4px">ASISTENTE IA</div>'
      + 'Pensando<span class="chat-dots">...</span></div>';
    _chatScrollToBottom();
  }

  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '...'; }

  try {
    const respuesta = await _chatGetResponse(mensaje);
    _chatHistorial.push({ role: 'assistant', content: respuesta });
  } catch (e) {
    _chatHistorial.push({ role: 'assistant', content: 'Error al procesar: ' + e.message + '. Intenta de nuevo.' });
  }

  _chatLoading = false;
  if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Enviar'; }

  // Re-render mensajes
  if (messagesEl) {
    messagesEl.innerHTML = _chatRenderMessages();
    _chatScrollToBottom();
  }
}

function aciChatQuick(texto) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = texto;
    aciChatSend();
  }
}

// ── Obtener respuesta (local inteligente + fallback API) ──────

async function _chatGetResponse(pregunta) {
  const q = pregunta.toLowerCase();

  // Intentar respuesta local primero (rapida, sin API)
  const local = _chatResponderLocal(q, pregunta);
  if (local) return local;

  // Si hay API disponible, usar Claude
  return _chatCallAPI(pregunta);
}

// ── Respuestas locales (sin API, instantaneas) ────────────────

function _chatResponderLocal(q, original) {
  // Precios de material especifico
  if ((q.includes('precio') || q.includes('cuanto') || q.includes('cuánto') || q.includes('vale')) && typeof MATS_LOCAL !== 'undefined') {
    const mat = MATS_LOCAL.find(m => q.includes(m.nombre.toLowerCase()));
    if (mat) {
      const empresa = mat.farex ? 'Farex' : 'Reciclean';
      return '**' + mat.nombre + '** (' + empresa + ', ' + mat.cat + ')\n\n'
        + '- Precio Lista: $' + mat.lista + '/kg\n'
        + '- Precio Ejecutivo: $' + mat.ejec + '/kg\n'
        + '- Precio Maximo: $' + mat.max + '/kg\n'
        + '- Precio Compra (cliente): $' + mat.compra + '/kg\n'
        + '- Margen: ' + (mat.margen * 100) + '%\n'
        + '- IVA: ' + (mat.iva ? 'Si (retencion 19%)' : 'No') + '\n'
        + '- Flete: $' + mat.flete + '/kg\n'
        + (mat.meta > 0 ? '- Meta mensual: ' + mat.meta.toLocaleString('es-CL') + ' kg' : '');
    }
  }

  // Sucursales
  if (q.includes('sucursal')) {
    return '**Sucursales Reciclean-Farex:**\n\n'
      + '- **Cerrillos** — Farex + Reciclean (operativa)\n'
      + '- **Maipu** — Farex + Reciclean (operativa)\n'
      + '- **Talca** — Reciclean (operativa)\n'
      + '- **Puerto Montt** — Reciclean (NO operativa, en espera de permisos)\n\n'
      + 'Farex opera solo en Cerrillos y Maipu. Reciclean en las 4 sucursales.';
  }

  // Materiales por empresa
  if (q.includes('materiales reciclean') || q.includes('materiales de reciclean')) {
    if (typeof MATS_LOCAL !== 'undefined') {
      const mats = MATS_LOCAL.filter(m => m.reciclean);
      const cats = [...new Set(mats.map(m => m.cat))];
      return '**Materiales Reciclean** (' + mats.length + ' materiales):\n\n'
        + cats.map(c => '**' + c + ':** ' + mats.filter(m => m.cat === c).map(m => m.nombre).join(', ')).join('\n\n')
        + '\n\nReciclean no aplica IVA.';
    }
  }

  if (q.includes('materiales farex') || q.includes('materiales de farex')) {
    if (typeof MATS_LOCAL !== 'undefined') {
      const mats = MATS_LOCAL.filter(m => m.farex);
      const cats = [...new Set(mats.map(m => m.cat))];
      return '**Materiales Farex** (' + mats.length + ' materiales):\n\n'
        + cats.map(c => '**' + c + ':** ' + mats.filter(m => m.cat === c).map(m => m.nombre).join(', ')).join('\n\n')
        + '\n\nFarex aplica IVA con retencion 19%.';
    }
  }

  // Contacto
  if (q.includes('contacto') || q.includes('whatsapp') || q.includes('telefono') || q.includes('teléfono') || q.includes('andrea')) {
    return '**Contacto Reciclean-Farex:**\n\n'
      + '- WhatsApp: +56 9 9534 2437 (Andrea Rivera)\n'
      + '- Email: comercial@gestionrepchile.cl';
  }

  // Como cotizar
  if (q.includes('cotizar') || q.includes('cotizacion') || q.includes('cotización') || q.includes('como uso')) {
    return '**Como cotizar en el Asistente:**\n\n'
      + '1. Selecciona tu **sucursal** (determina precios y materiales)\n'
      + '2. Completa los **datos del negocio** (nombre, proveedor, RUT)\n'
      + '3. Busca el **material** en el buscador o filtra por categoria\n'
      + '4. Ingresa los **kilos** — el semaforo indica nivel de negociacion\n'
      + '5. Ajusta el **precio ejecutivo** (entre lista y maximo)\n'
      + '6. Cierra la consulta para generar resumen y WhatsApp\n\n'
      + 'El precio Lista es el minimo y el Maximo es el techo. Nunca superar sin autorizacion.';
  }

  // Proveedores
  if (q.includes('proveedor') && typeof aciGetProveedores === 'function') {
    const provs = aciGetProveedores();
    if (provs.length) {
      const porEstado = {};
      provs.forEach(p => {
        const est = p.estado_comercial || 'sin estado';
        porEstado[est] = (porEstado[est] || 0) + 1;
      });
      return '**Proveedores registrados:** ' + provs.length + '\n\n'
        + 'Por estado:\n' + Object.entries(porEstado).map(([k, v]) => '- ' + k + ': ' + v).join('\n')
        + '\n\nPuedes ver todos en el mapa virtual o en la seccion de planificacion de rutas.';
    }
  }

  // Materiales mas rentables
  if ((q.includes('rentable') || q.includes('margen') || q.includes('ganancia')) && typeof MATS_LOCAL !== 'undefined') {
    const conMargen = MATS_LOCAL.filter(m => m.margen > 0 && m.lista > 0)
      .sort((a, b) => b.margen - a.margen)
      .slice(0, 10);
    return '**Materiales con mayor margen:**\n\n'
      + conMargen.map((m, i) => (i + 1) + '. **' + m.nombre + '** — ' + (m.margen * 100) + '% margen (Lista: $' + m.lista + '/kg)').join('\n');
  }

  // Puerto Montt
  if (q.includes('puerto montt')) {
    return '**Puerto Montt** actualmente NO esta operativa. Se encuentra en espera de permisos finales.\n\nNo se deben publicar precios vigentes ni mostrarla como activa.';
  }

  // No match — usar API
  return null;
}

// ── Llamada a API Claude ──────────────────────────────────────

async function _chatCallAPI(pregunta) {
  const systemPrompt = _chatBuildContext();
  const messages = _chatHistorial.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));

  // Usar Supabase Edge Function como proxy (si existe)
  try {
    const { data, error } = await _supa.functions.invoke('chat-asistente', {
      body: { messages, system: systemPrompt }
    });
    if (!error && data?.response) return data.response;
  } catch (e) { /* fallback */ }

  // Fallback: respuesta inteligente local si la API no esta disponible
  return _chatFallbackLocal(pregunta);
}

function _chatFallbackLocal(pregunta) {
  return 'No tengo acceso a la IA en este momento, pero puedo ayudarte con consultas basicas.\n\n'
    + 'Intenta preguntar sobre:\n'
    + '- Precios de un material especifico (ej: "precio del cobre")\n'
    + '- Materiales de Reciclean o Farex\n'
    + '- Sucursales activas\n'
    + '- Como cotizar\n'
    + '- Proveedores registrados\n'
    + '- Contacto de la empresa';
}

// ── Limpiar historial ─────────────────────────────────────────

function aciChatLimpiar() {
  _chatHistorial = [];
  aciLoadChat();
}

console.log('ACI chat.js cargado');
