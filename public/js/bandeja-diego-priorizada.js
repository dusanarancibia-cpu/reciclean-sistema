/* ═══════════════════════════════════════════════════════════
   Panel RDO · Bandeja Diego Priorizada
   Branch: claude/panel-amor-verde-26may
   Propósito: convertir las notificaciones acumuladas en cards amigables
   con CTA claros (Resolver / Asignar / Pedir contexto / Devolver).
   Lee del DOM existente (bdTbody) · NO hace fetch nuevo.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TARGET_LISTA = 'bdPrioritariasLista';

  // Cache de datos reales de Supabase para enriquecer las cards
  let datosRealesCache = null;
  let ultimaConsultaSb = 0;
  const CACHE_TTL_MS = 60 * 1000; // 1 min

  async function obtenerDatosReales() {
    if (datosRealesCache && Date.now() - ultimaConsultaSb < CACHE_TTL_MS) {
      return datosRealesCache;
    }
    const sb = window.sb || window.supabase;
    if (!sb || typeof sb.from !== 'function') return null;
    try {
      const { data, error } = await sb
        .schema('panel')
        .from('diego_bandeja')
        .select('id, mensaje, remitente, what, who, where_, when_, why, how_, responsable, estado, creado_en')
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: true })
        .limit(5);
      if (error) {
        console.warn('Bandeja priorizada · supabase error:', error.message);
        return null;
      }
      datosRealesCache = data || [];
      ultimaConsultaSb = Date.now();
      return datosRealesCache;
    } catch (e) {
      return null;
    }
  }

  // Detecta el contenido de la tabla y construye las top cards
  function renderPrioritarias() {
    const target = document.getElementById(TARGET_LISTA);
    const tbody = document.getElementById('bdTbody');
    if (!target || !tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => {
      // Filtrar el "Cargando…" inicial
      const td = r.querySelector('td');
      return td && td.colSpan !== 5;
    });

    if (rows.length === 0) {
      target.innerHTML = `
        <div class="amor-notif-card cierra-negocio">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <div class="text-xs text-emerald-700 font-bold mb-1">✨ TODO AL DÍA</div>
              <div class="text-sm text-stone-800 font-semibold">No hay notificaciones acumuladas.</div>
              <div class="text-xs text-stone-500 mt-1">Diego procesó todo · el equipo está en flujo.</div>
            </div>
            <span class="text-2xl">💚</span>
          </div>
        </div>
      `;
      return;
    }

    // Top 3 más urgentes (por edad descendente)
    const top = rows.slice(0, 3);
    target.innerHTML = top.map((tr, idx) => buildCard(tr, idx, null)).join('');

    // Bind clicks de las CTAs
    target.querySelectorAll('[data-bd-action]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const action = btn.dataset.bdAction;
        const rowIdx = parseInt(btn.dataset.bdRow, 10);
        const tr = top[rowIdx];
        if (!tr) return;
        tr.click();
        if (window.amorDivorcio) {
          window.amorDivorcio.mover(+1, `acción bandeja: ${action}`, 'bandeja_dieg');
        }
      });
    });

    // En paralelo · enriquecer con datos reales de Supabase si están disponibles
    obtenerDatosReales().then(datos => {
      if (!datos || datos.length === 0) return;
      const targetActual = document.getElementById(TARGET_LISTA);
      if (!targetActual) return;
      // Re-renderizar con datos reales (top 3 por edad)
      targetActual.innerHTML = datos.slice(0, 3).map((d, idx) => buildCardSupabase(d, idx)).join('');
      // Bind clicks
      targetActual.querySelectorAll('[data-bd-action-id]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = btn.dataset.bdActionId;
          const action = btn.dataset.bdAction;
          // Buscar fila de la tabla con ese id y disparar click (para abrir drawer real)
          const trReal = Array.from(document.querySelectorAll('#bdTbody tr')).find(tr =>
            tr.dataset?.id === id || (tr.textContent || '').includes(id)
          );
          if (trReal) trReal.click();
          if (window.amorDivorcio) window.amorDivorcio.mover(+1, `acción bandeja real: ${action}`, 'bandeja_dieg');
        });
      });
    });
  }

  function buildCardSupabase(d, idx) {
    const mensaje = d.mensaje || '(sin asunto)';
    const remitente = d.remitente || 'desconocido';
    const responsable = d.responsable || '<em>sin responsable</em>';
    const what = d.what || '';
    const why = d.why || '';
    const how = d.how_ || '';
    const edad = relativoEdad(d.creado_en);
    const urgente = /vencid|urgente|crítico/i.test(mensaje + ' ' + what + ' ' + why) || (esVencida(d.creado_en));
    const cierra = /cerrar|negocio|firma|aprobar/i.test(mensaje + ' ' + what);
    const cssExtra = urgente ? 'urgente' : (cierra ? 'cierra-negocio' : '');
    const tagEmoji = urgente ? '🚨' : (cierra ? '💼' : '📥');
    const tagText = urgente ? 'URGENTE' : (cierra ? 'CIERRA NEGOCIO' : 'PENDIENTE');
    const tagColor = urgente ? 'rojo' : (cierra ? 'verde' : 'amarillo');

    // Propuesta de Diego desde datos reales (why / how_)
    const propuesta = how || why || proponerAccion(mensaje, remitente);

    return `
      <div class="amor-notif-card ${cssExtra}" data-id="${escapeHtml(d.id)}">
        <div class="flex justify-between items-start gap-3 mb-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="amor-badge ${tagColor}">${tagEmoji} ${tagText}</span>
              <span class="text-xs text-stone-400">⏱️ ${edad}</span>
              <span class="text-xs text-emerald-700 font-bold" title="Datos en vivo desde Supabase">● en vivo</span>
            </div>
            <div class="text-sm font-semibold text-stone-800">${escapeHtml(mensaje)}</div>
            <div class="text-xs text-stone-500 mt-1">
              <strong>Viene de:</strong> ${escapeHtml(remitente)} ·
              <strong>Asignada a:</strong> ${responsable}
            </div>
            ${what ? `<div class="text-xs text-stone-600 mt-1"><strong>Qué:</strong> ${escapeHtml(what)}</div>` : ''}
            ${why ? `<div class="text-xs text-stone-600"><strong>Por qué:</strong> ${escapeHtml(why)}</div>` : ''}
            ${propuesta ? `<div class="text-xs text-emerald-700 mt-1 italic">💚 Diego sugiere: ${escapeHtml(propuesta)}</div>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <button class="amor-notif-cta resolver" data-bd-action="resolver" data-bd-action-id="${d.id}">✅ Resolver</button>
          <button class="amor-notif-cta asignar" data-bd-action="asignar" data-bd-action-id="${d.id}">🤝 Asignar</button>
          <button class="amor-notif-cta contexto" data-bd-action="contexto" data-bd-action-id="${d.id}">🔍 Pedir contexto</button>
          <button class="amor-notif-cta devolver" data-bd-action="devolver" data-bd-action-id="${d.id}">↩️ Devolver</button>
        </div>
      </div>
    `;
  }

  function relativoEdad(ts) {
    if (!ts) return '?';
    const ms = Date.now() - new Date(ts).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 60) return 'hace ' + m + 'm';
    const h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + 'h';
    const d = Math.floor(h / 24);
    return 'hace ' + d + 'd';
  }

  function esVencida(ts) {
    if (!ts) return false;
    return Date.now() - new Date(ts).getTime() > 48 * 3600 * 1000;
  }

  function buildCard(tr, idx, _) {
    const cols = tr.querySelectorAll('td');
    const mensaje = (cols[0]?.textContent || '').trim();
    const remitente = (cols[1]?.textContent || 'desconocido').trim();
    const responsable = (cols[2]?.textContent || 'sin asignar').trim();
    const edad = (cols[3]?.textContent || '?').trim();
    const estado = (cols[4]?.textContent || '').trim();

    const urgente = /vencid|urgente|>48h|crítico/i.test(edad + ' ' + estado);
    const cierra = /cerrar|negocio|firma|aprobar/i.test(mensaje);
    const cssExtra = urgente ? 'urgente' : (cierra ? 'cierra-negocio' : '');

    const tagEmoji = urgente ? '🚨' : (cierra ? '💼' : '📥');
    const tagText = urgente ? 'URGENTE' : (cierra ? 'CIERRA NEGOCIO' : 'PENDIENTE');
    const tagColor = urgente ? 'rojo' : (cierra ? 'verde' : 'amarillo');

    // Resumen Diego (heurística mientras EF no procese)
    const propuesta = proponerAccion(mensaje, remitente);

    return `
      <div class="amor-notif-card ${cssExtra}">
        <div class="flex justify-between items-start gap-3 mb-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="amor-badge ${tagColor}">${tagEmoji} ${tagText}</span>
              <span class="text-xs text-stone-400">⏱️ ${edad}</span>
            </div>
            <div class="text-sm font-semibold text-stone-800 truncate">${escapeHtml(mensaje) || '(sin asunto)'}</div>
            <div class="text-xs text-stone-500 mt-1">
              <strong>Viene de:</strong> ${escapeHtml(remitente)} ·
              <strong>Asignada a:</strong> ${escapeHtml(responsable) || '<em>sin responsable</em>'}
            </div>
            ${propuesta ? `<div class="text-xs text-emerald-700 mt-1 italic">💚 Diego sugiere: ${propuesta}</div>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <button class="amor-notif-cta resolver" data-bd-action="resolver" data-bd-row="${idx}">✅ Resolver</button>
          <button class="amor-notif-cta asignar" data-bd-action="asignar" data-bd-row="${idx}">🤝 Asignar</button>
          <button class="amor-notif-cta contexto" data-bd-action="contexto" data-bd-row="${idx}">🔍 Pedir contexto</button>
          <button class="amor-notif-cta devolver" data-bd-action="devolver" data-bd-row="${idx}">↩️ Devolver</button>
        </div>
      </div>
    `;
  }

  function proponerAccion(mensaje, remitente) {
    const m = (mensaje || '').toLowerCase();
    const r = (remitente || '').toLowerCase();
    if (/talca/.test(m)) return 'cerrar este negocio antes que la competencia (Andrea es la dueña del cliente)';
    if (/precio|cotiz/.test(m)) return 'aprobar precio reportado · Andrea/Dusan firman';
    if (/factura|sii/.test(m)) return 'verificar con Dyana antes de aprobar';
    if (/chofer|viaje|despacho/.test(m)) return 'asignar viaje · disponibilidad flota propia primero';
    if (/diego|asistente/.test(r)) return 'revisar respuesta de Diego · si es incoherente, retroalimentar';
    if (/whatsapp/.test(r)) return 'capturar al panel · no responder por WhatsApp';
    return null;
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Observer del tbody para re-renderizar cuando cambia
  function observe() {
    const tbody = document.getElementById('bdTbody');
    if (!tbody) return;
    const mo = new MutationObserver(() => renderPrioritarias());
    mo.observe(tbody, { childList: true, subtree: true });
    renderPrioritarias();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    setTimeout(observe, 500); // espera a que panel cargue
  }
  console.log('📥 Bandeja Diego priorizada activada');
})();
