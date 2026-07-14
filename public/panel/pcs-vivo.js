// ============================================================
// ESTADO VIVO 4 PCS (R-AUD-042) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  let pollTimer = null;
  let cmdTargetPc = null;

  const PC_LABELS = {
    'PC1_dusan': { emoji: '🟦', titulo: 'PC1 Dusan', subtitulo: 'Comandante · interactivo con Dusan' },
    'PC2_pablo': { emoji: '🟩', titulo: 'PC2 Pablo', subtitulo: 'Supervisor excepciones · DDL + prod' },
    'PC3_camaras': { emoji: '🟨', titulo: 'PC3 Cámaras', subtitulo: 'Operador externo · scrapes + EFs' },
    'PC4_desocupado': { emoji: '🟪', titulo: 'PC4 Desocupado', subtitulo: 'Ingeniero autónomo · DDL + merges' },
  };

  const MODO_BADGES = {
    'produccion': { text: 'producción', cls: 'bg-emerald-100 text-emerald-800' },
    'interactivo': { text: 'interactivo', cls: 'bg-amber-100 text-amber-800' },
    'apagado': { text: 'apagado', cls: 'bg-stone-200 text-stone-600' },
    'ventana_exclusiva': { text: 'ventana exclusiva', cls: 'bg-indigo-100 text-indigo-800' },
    'sancionado': { text: 'sancionado', cls: 'bg-red-100 text-red-800' },
  };

  function timeAgo(ts) {
    if (!ts) return '—';
    const diffMs = Date.now() - new Date(ts).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'hace <1 min';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
  }

  function renderCard(row) {
    const meta = PC_LABELS[row.pc_nombre] || { emoji: '⬜', titulo: row.pc_nombre, subtitulo: '' };
    const modoBadge = MODO_BADGES[row.modo_actual] || { text: row.modo_actual, cls: 'bg-stone-100 text-stone-700' };
    const modoCls = row.modo_actual === 'apagado' ? 'modo-apagado'
                  : row.modo_actual === 'interactivo' ? 'modo-interactivo'
                  : row.modo_actual === 'sancionado' ? 'modo-sancionado'
                  : row.ventana_exclusiva_activa ? 'modo-ventana' : '';
    const apagado = row.modo_actual === 'apagado';
    const cmdsBadge = row.comandos_pendientes > 0 ? `<span class="pcs-badge bg-blue-100 text-blue-800 ml-1">${row.comandos_pendientes} cmd</span>` : '';
    const sancBadge = row.sanciones_activas > 0 ? `<span class="pcs-badge bg-red-100 text-red-800 ml-1">${row.sanciones_activas} sanción</span>` : '';
    const ventBadge = row.ventana_exclusiva_activa ? `<span class="pcs-badge bg-indigo-100 text-indigo-800 ml-1">ventana R-AUD-037</span>` : '';

    return `<div class="pcs-card ${modoCls}">
      <div class="flex items-start justify-between mb-2">
        <div>
          <div class="text-sm font-bold text-stone-800">${meta.emoji} ${meta.titulo}</div>
          <div class="text-xs text-stone-500">${meta.subtitulo}</div>
        </div>
        <div class="text-right">
          <span class="pcs-badge ${modoBadge.cls}">${modoBadge.text}</span>
          ${cmdsBadge}${sancBadge}${ventBadge}
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2 my-3">
        <div><div class="pcs-stat text-emerald-700">${row.cola_pendientes ?? 0}</div><div class="pcs-stat-label">pendientes</div></div>
        <div><div class="pcs-stat text-amber-600">${row.cola_en_curso ?? 0}</div><div class="pcs-stat-label">en curso</div></div>
        <div><div class="pcs-stat text-indigo-600">${row.cola_built ?? 0}</div><div class="pcs-stat-label">built</div></div>
        <div><div class="pcs-stat text-stone-700">${row.cola_done_24h ?? 0}</div><div class="pcs-stat-label">done 24h</div></div>
      </div>
      <div class="text-xs text-stone-500 mb-3"><span class="font-semibold">Último latido:</span> ${timeAgo(row.ultimo_latido)}</div>
      ${row.ultimo_resumen ? `<div class="text-sm text-stone-700 bg-stone-50 p-2 rounded mb-3">${row.ultimo_resumen}</div>` : ''}
      ${row.tarea_actual_titulo ? `<div class="text-xs text-stone-600 mb-3"><span class="font-semibold">Tarea actual:</span> ${row.tarea_actual_titulo}</div>` : ''}
      <div class="flex gap-2 flex-wrap">
        <button onclick="pcsVivoOpenCmd('${row.pc_nombre}')" class="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded">📨 Comando</button>
        ${!apagado ? `<button onclick="pcsVivoCloseSession('${row.pc_nombre}')" class="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded">🛑 Cerrar</button>` : ''}
        ${apagado ? `<button onclick="pcsVivoStartSession('${row.pc_nombre}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded">▶ Iniciar</button>` : ''}
      </div>
    </div>`;
  }

  async function refrescar() {
    try {
      const { data, error } = await sb.rpc('pcs_vivo_feed');
      const grid = document.getElementById('pcsVivoGrid');
      if (error) {
        console.warn('[PcsVivo] rpc error:', error);
        if (grid) grid.innerHTML = `<div class="bg-amber-50 p-4 rounded col-span-full text-sm text-amber-800">No se pudo cargar el estado. ${error.message}</div>`;
        return;
      }
      if (!data || data.length === 0) {
        if (grid) grid.innerHTML = `<div class="bg-stone-50 p-4 rounded col-span-full text-sm text-stone-600 text-center">Sin acceso a este tablero (solo Dusan y Pablo).</div>`;
        return;
      }
      const order = ['PC1_dusan', 'PC2_pablo', 'PC3_camaras', 'PC4_desocupado'];
      const sorted = data.slice().sort((a, b) => order.indexOf(a.pc_nombre) - order.indexOf(b.pc_nombre));
      if (grid) grid.innerHTML = sorted.map(renderCard).join('');
      const el = document.getElementById('pcsVivoLastUpdate');
      if (el) el.textContent = `actualizado ${new Date().toLocaleTimeString('es-CL')}`;
    } catch (e) {
      console.warn('[PcsVivo] exception:', e);
    }
  }

  function isTabActive() {
    const sec = document.getElementById('tabPcsVivo');
    return sec && !sec.classList.contains('hidden');
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => { if (isTabActive()) refrescar(); }, 10_000);
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  window.pcsVivoOpenCmd = function (pcNombre) {
    cmdTargetPc = pcNombre;
    const tgt = document.getElementById('pcsVivoCmdTarget');
    if (tgt) tgt.textContent = pcNombre;
    document.getElementById('pcsVivoCmdMotivo').value = '';
    document.getElementById('pcsVivoCmdTipo').value = 'cerrar';
    document.getElementById('pcsVivoCmdError').classList.add('hidden');
    document.getElementById('pcsVivoCmdModal').classList.remove('hidden');
  };
  window.pcsVivoCloseModal = function () {
    document.getElementById('pcsVivoCmdModal').classList.add('hidden');
    cmdTargetPc = null;
  };
  window.pcsVivoSendCmd = async function () {
    const tipo = document.getElementById('pcsVivoCmdTipo').value;
    const motivo = document.getElementById('pcsVivoCmdMotivo').value.trim();
    const errEl = document.getElementById('pcsVivoCmdError');
    if (!motivo) { errEl.textContent = 'El motivo es obligatorio.'; errEl.classList.remove('hidden'); return; }
    if (!cmdTargetPc) return;
    const btn = document.getElementById('pcsVivoCmdSendBtn');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const { data, error } = await sb.rpc('enviar_comando_panel', { p_pc_destino: cmdTargetPc, p_tipo: tipo, p_motivo: motivo });
      if (error || (data && !data.ok)) {
        errEl.textContent = (data && data.razon) || error?.message || 'Error desconocido.';
        errEl.classList.remove('hidden');
      } else {
        pcsVivoCloseModal();
        refrescar();
      }
    } catch (e) {
      errEl.textContent = String(e); errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Enviar';
    }
  };
  window.pcsVivoCloseSession = async function (pcNombre) {
    if (!confirm(`¿Cerrar sesión de ${pcNombre}? Esto inserta un comando 'cerrar' con tu firma.`)) return;
    const motivo = prompt('Motivo del cierre:', 'Cierre solicitado desde panel');
    if (!motivo) return;
    const { data, error } = await sb.rpc('enviar_comando_panel', { p_pc_destino: pcNombre, p_tipo: 'cerrar', p_motivo: motivo });
    if (error || (data && !data.ok)) alert('Error: ' + ((data && data.razon) || error?.message)); else refrescar();
  };
  window.pcsVivoStartSession = async function (pcNombre) {
    const motivo = prompt(`Iniciar ${pcNombre}. Motivo / mensaje al humano de esa PC:`, 'Solicitud de inicio desde panel');
    if (!motivo) return;
    const { data, error } = await sb.rpc('enviar_comando_panel', { p_pc_destino: pcNombre, p_tipo: 'reanudar', p_motivo: motivo });
    if (error || (data && !data.ok)) alert('Error: ' + ((data && data.razon) || error?.message)); else { alert('Comando enviado. Avisar al humano de ' + pcNombre + ' por WhatsApp/email.'); refrescar(); }
  };

  function init() {
    document.querySelector('button[data-tab="pcs_vivo"]')?.addEventListener('click', () => {
      setTimeout(() => { refrescar(); startPolling(); }, 100);
    });
    document.querySelectorAll('button[data-tab]:not([data-tab="pcs_vivo"])').forEach(b => b.addEventListener('click', stopPolling));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
