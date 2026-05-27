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
    target.innerHTML = top.map((tr, idx) => buildCard(tr, idx)).join('');

    // Bind clicks de las CTAs
    target.querySelectorAll('[data-bd-action]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const action = btn.dataset.bdAction;
        const rowIdx = parseInt(btn.dataset.bdRow, 10);
        const tr = top[rowIdx];
        if (!tr) return;
        // Disparar click en la row original (abre drawer existente)
        tr.click();
        // Aguja amor: + por usar las prioritarias
        if (window.amorDivorcio) {
          window.amorDivorcio.mover(+1, `acción bandeja: ${action}`, 'bandeja_dieg');
        }
      });
    });
  }

  function buildCard(tr, idx) {
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
