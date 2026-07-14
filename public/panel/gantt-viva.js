// ============================================================
// GANTT VIVA (D-GANTT-VIVA-001) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  const EF_URL = '/functions/v1/gantt-viva-feed';
  let ganttInstance = null;
  let pollTimer = null;
  let lastFetchAt = null;

  function buildQS() {
    const tipo  = document.getElementById('ganttFiltroTipo')?.value || '';
    const silo  = document.getElementById('ganttFiltroSilo')?.value || '';
    const color = document.getElementById('ganttFiltroColor')?.value || '';
    const qs = new URLSearchParams();
    if (tipo)  qs.set('tipo', tipo);
    if (silo)  qs.set('silo', silo);
    if (color) qs.set('color', color);
    return qs.toString();
  }

  async function fetchFeed() {
    try {
      const session = await sb.auth.getSession();
      const token = session?.data?.session?.access_token || SUPABASE_ANON_KEY;
      const qs = buildQS();
      const url = `${SUPABASE_URL}${EF_URL}${qs ? '?' + qs : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[GanttViva] fetch error:', e);
      return null;
    }
  }

  function renderResumen(resumen) {
    const el = document.getElementById('ganttResumenBadge');
    if (!el || !resumen) return;
    const r = resumen.rojo || 0, a = resumen.amarillo || 0, v = resumen.verde || 0, s = resumen.sin_datos || 0, t = resumen.total || 0;
    el.innerHTML = `<span class="text-red-600 font-semibold">🔴 ${r}</span> · <span class="text-amber-600 font-semibold">🟡 ${a}</span> · <span class="text-emerald-700 font-semibold">🟢 ${v}</span> · <span class="text-stone-400">⬜ ${s}</span> · <span class="text-stone-500">Σ ${t}</span>`;
  }

  function renderGantt(rows) {
    const container = document.getElementById('ganttContainer');
    if (!container) return;
    if (!rows || rows.length === 0) {
      container.innerHTML = '<div class="text-sm text-stone-500 p-6 text-center">Sin elementos para los filtros actuales.</div>';
      ganttInstance = null;
      return;
    }
    if (typeof Gantt === 'undefined') {
      // PC1 fix 31-may PM: mensaje accionable + auto-retry una vez (CDN suele resolver con un reintento)
      container.innerHTML = '<div class="text-sm text-amber-700 p-6 text-center">Frappe Gantt no cargó (CDN jsdelivr). Reintentando…<br><span class="text-xs text-stone-500">Si persiste: refrescar página con Ctrl+F5. Los KPIs de arriba sí están vivos.</span></div>';
      setTimeout(() => { if (typeof Gantt !== 'undefined') renderGantt(rows); }, 1500);
      return;
    }
    const tasks = rows
      .filter(r => r.start && r.end)
      .map(r => ({ id: r.id, name: r.name, start: r.start, end: r.end, progress: r.progress, custom_class: r.custom_class, dependencies: '' }));
    if (tasks.length === 0) {
      container.innerHTML = '<div class="text-sm text-stone-500 p-6 text-center">Hay elementos pero sin fechas mapeables (silos / PCs agregados).</div>';
      return;
    }
    container.innerHTML = '<svg id="ganttSvg" width="100%" height="480"></svg>';
    try {
      ganttInstance = new Gantt('#ganttSvg', tasks, {
        view_mode: 'Week',
        bar_height: 22,
        bar_corner_radius: 4,
        padding: 14,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: (t) => `<div style="padding:6px 10px;background:#fff;border:1px solid #d6d3d1;border-radius:6px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.1)"><strong>${t.name}</strong><br><span style="color:#78716c">${t.start} → ${t.end}</span><br><span style="color:#78716c">${t.progress}%</span></div>`
      });
    } catch (e) {
      console.error('[GanttViva] Gantt render error:', e);
      container.innerHTML = `<div class="text-sm text-red-600 p-6 text-center">Error renderizando Gantt: ${e.message}</div>`;
    }
  }

  function updateLastUpdate() {
    const el = document.getElementById('ganttLastUpdate');
    if (el) el.textContent = lastFetchAt ? `Última actualización: ${lastFetchAt.toLocaleTimeString('es-CL')}` : '—';
  }

  async function refrescar() {
    // DeepSeek ronda 3 LAZY: cargar Frappe Gantt on-demand antes de renderizar
    if (window.__loadFrappeGanttOnce) {
      try { await window.__loadFrappeGanttOnce(); }
      catch (e) { console.warn('[GanttViva] no se pudo cargar Frappe Gantt:', e); }
    }
    const data = await fetchFeed();
    if (!data || !data.ok) return;
    lastFetchAt = new Date();
    updateLastUpdate();
    renderResumen(data.resumen);
    renderGantt(data.rows);
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => { if (isTabActive()) refrescar(); }, 60_000);
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function isTabActive() {
    const sec = document.getElementById('tabGantt');
    return sec && !sec.classList.contains('hidden');
  }

  function init() {
    document.querySelector('button[data-tab="gantt"]')?.addEventListener('click', () => {
      setTimeout(() => { refrescar(); startPolling(); }, 100);
    });
    document.getElementById('ganttRefreshBtn')?.addEventListener('click', refrescar);
    ['ganttFiltroTipo','ganttFiltroSilo','ganttFiltroColor'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', refrescar);
    });
    document.querySelectorAll('button[data-tab]:not([data-tab="gantt"])').forEach(b => b.addEventListener('click', stopPolling));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
