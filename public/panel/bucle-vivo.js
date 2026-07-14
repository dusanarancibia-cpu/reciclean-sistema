// ============================================================
// BUCLE VIVO (SPEC-BUCLE-AUTOMATICO-RUNTIME-V1) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  const POLL_MS = 10_000;
  let pollTimer = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function semaforoChip(s) {
    const m = { verde:['🟢 Cerrado','bg-emerald-100 text-emerald-800'],
                amarillo:['🟡 Incidencias','bg-amber-100 text-amber-800'],
                rojo:['🔴 Crítico','bg-red-100 text-red-800'],
                gris:['⚪ Sin datos','bg-stone-200 text-stone-600'] };
    return m[s || 'gris'] || m.gris;
  }

  async function refrescar() {
    try {
      const { data, error } = await sb.from('v_bucle_estado').select('*').single();
      if (error) throw error;
      const sem = semaforoChip(data.semaforo_global);
      const semEl = document.getElementById('bucleVivoSemaforo');
      if (semEl) { semEl.textContent = sem[0]; semEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold ' + sem[1]; }

      const badge = document.getElementById('v4-bucle-vivo-badge');
      if (badge) {
        if (data.semaforo_global === 'rojo' || data.semaforo_global === 'amarillo') {
          badge.textContent = data.semaforo_global === 'rojo' ? '!' : '·';
          badge.className = 'ml-auto text-[10px] font-bold rounded-full px-2 py-0.5 ' +
            (data.semaforo_global === 'rojo' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700');
        } else {
          badge.classList.add('hidden');
        }
      }

      document.getElementById('bucleVivoEstado').textContent = data.bucle_cerrado
        ? `CERRADO (${data.reglas_aprobadas}/${data.reglas_evaluadas} reglas)`
        : `ABIERTO (${data.reglas_falladas} falladas)`;
      document.getElementById('bucleVivoUltimaVerif').textContent = data.ultima_verificacion
        ? 'Última verificación: ' + new Date(data.ultima_verificacion).toLocaleString('es-CL')
        : 'Sin verificaciones';
      document.getElementById('bucleVivoAccionesTotal').textContent = data.acciones_hoy || 0;
      document.getElementById('bucleVivoBloqueadas').textContent = data.acciones_bloqueadas_hoy || 0;
      document.getElementById('bucleVivoFailOpen').textContent = data.acciones_fail_open_hoy || 0;

      const scoreEl = document.getElementById('bucleVivoScorePcs');
      const scorePcs = data.score_promedio_pcs || {};
      const entries = Object.entries(scorePcs);
      scoreEl.innerHTML = entries.length
        ? entries.map(([pc, s]) => `<li><strong class="text-stone-700">${escapeHtml(pc)}</strong>: <span class="${s >= 70 ? 'text-red-700 font-bold' : s >= 50 ? 'text-amber-700' : 'text-stone-600'}">${s}</span></li>`).join('')
        : '<li class="text-stone-400 italic">sin hits 24h</li>';

      const reglasTbody = document.getElementById('bucleVivoReglasTbody');
      const reglas = data.reglas_con_incidencias || [];
      reglasTbody.innerHTML = reglas.length
        ? reglas.map(r => `<tr class="border-t border-stone-100"><td class="py-2 px-3"><code class="text-xs">${escapeHtml(r.detector)}</code></td><td class="text-right py-2 px-3">${r.hits}</td><td class="text-right py-2 px-3">${r.criticos > 0 ? '<strong class="text-red-700">' + r.criticos + '</strong>' : '0'}</td><td class="py-2 px-3 text-xs text-stone-600">${escapeHtml(r.pcs || '—')}</td></tr>`).join('')
        : '<tr><td colspan="4" class="text-stone-400 italic py-3 text-center">Sin incidencias últimas 24h ✅</td></tr>';

      document.getElementById('bucleVivoConsultadoEn').textContent = 'Snapshot a las ' + new Date(data.consultado_en).toLocaleTimeString('es-CL');
    } catch (e) {
      console.error('[BucleVivo]', e);
      const semEl = document.getElementById('bucleVivoSemaforo');
      if (semEl) { semEl.textContent = '⚪ Error'; semEl.className = 'text-xs px-2.5 py-1 rounded-full font-semibold bg-stone-200 text-stone-600'; }
      document.getElementById('bucleVivoEstado').textContent = 'Error: ' + (e.message || e);
    }
  }

  function start() { stop(); refrescar(); pollTimer = setInterval(refrescar, POLL_MS); }
  function stop()  { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function init() {
    document.querySelector('button[data-tab="bucle_vivo"]')?.addEventListener('click', start);
    document.querySelector('a[data-v4-tab="bucle_vivo"]')?.addEventListener('click', start);
    document.querySelectorAll('button[data-tab]:not([data-tab="bucle_vivo"])').forEach(b => b.addEventListener('click', stop));
    document.querySelectorAll('a[data-v4-tab]:not([data-v4-tab="bucle_vivo"])').forEach(a => a.addEventListener('click', stop));
    document.getElementById('bucleVivoRefreshBtn')?.addEventListener('click', refrescar);
    refrescar().catch(() => {});  // pre-cargar badge
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
