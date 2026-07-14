// ============================================================
// DOD DASHBOARD (esquema-dod-dora-space-v1) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  async function refrescar() {
    try {
      // Wave 6 mig 204: usar wrappers public.v_dod_* (schema dod no expuesto en PostgREST por default).
      const [equipos, proyectos, criterios, metricas, etapas, criteriosEs] = await Promise.all([
        sb.from('v_dod_equipos').select('id', { count: 'exact', head: true }),
        sb.from('v_dod_proyectos').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
        sb.from('v_dod_criterios_generales').select('id', { count: 'exact', head: true }).eq('activo', true),
        sb.from('v_dod_metricas_calidad').select('id, nombre, categoria, unidad, umbral_minimo, umbral_maximo, direccion_optima').eq('activo', true).order('categoria').order('nombre'),
        sb.from('v_dod_etapas_ciclo_vida').select('id, nombre, orden, descripcion').order('orden'),
        sb.from('v_dod_criterios_entrada_salida').select('id, etapa_id, tipo, descripcion, es_obligatorio')
      ]);

      document.getElementById('dodEquiposCount').textContent = equipos.count ?? '—';
      document.getElementById('dodProyectosCount').textContent = proyectos.count ?? '—';
      document.getElementById('dodCriteriosCount').textContent = criterios.count ?? '—';
      document.getElementById('dodMetricasCount').textContent = metricas.data?.length ?? '—';

      // Etapas con sus criterios
      const etapasEl = document.getElementById('dodEtapasLista');
      const etapasRows = etapas.data || [];
      const criteriosEsRows = criteriosEs.data || [];
      if (!etapasRows.length) {
        etapasEl.innerHTML = '<div class="text-stone-400 italic">Sin etapas configuradas</div>';
      } else {
        etapasEl.innerHTML = etapasRows.map(e => {
          const entradas = criteriosEsRows.filter(c => c.etapa_id === e.id && c.tipo === 'entrada');
          const salidas = criteriosEsRows.filter(c => c.etapa_id === e.id && c.tipo === 'salida');
          return `<div class="border border-stone-200 rounded p-2">
            <div class="font-semibold text-stone-800 text-sm">${escapeHtml(e.nombre)}</div>
            <div class="text-xs text-stone-500 mb-1">${escapeHtml(e.descripcion || '')}</div>
            ${entradas.length ? `<div class="text-xs"><strong class="text-blue-700">entrada (${entradas.length}):</strong> ${entradas.map(c => escapeHtml(c.descripcion)).join(' · ')}</div>` : ''}
            ${salidas.length ? `<div class="text-xs"><strong class="text-emerald-700">salida (${salidas.length}):</strong> ${salidas.map(c => escapeHtml(c.descripcion)).join(' · ')}</div>` : ''}
          </div>`;
        }).join('');
      }

      // Métricas por categoría
      const metEl = document.getElementById('dodMetricasLista');
      const metRows = metricas.data || [];
      const porCat = {};
      metRows.forEach(m => { (porCat[m.categoria] = porCat[m.categoria] || []).push(m); });
      const catEmoji = { codigo:'💻', sistema:'⚙️', producto:'📦', proceso:'🔄' };
      metEl.innerHTML = Object.entries(porCat).map(([cat, ms]) => `
        <div class="border border-stone-200 rounded p-2">
          <div class="font-semibold text-stone-700 text-sm mb-1">${catEmoji[cat] || ''} ${cat} (${ms.length})</div>
          <ul class="text-xs space-y-0.5">
            ${ms.map(m => {
              const umbralTxt = m.direccion_optima === 'mayor_mejor' && m.umbral_minimo != null
                ? `≥ ${m.umbral_minimo} ${m.unidad}`
                : m.direccion_optima === 'menor_mejor' && m.umbral_maximo != null
                  ? `≤ ${m.umbral_maximo} ${m.unidad}`
                  : 'sin umbral';
              return `<li><strong>${escapeHtml(m.nombre)}</strong> · <span class="text-stone-500">${umbralTxt}</span></li>`;
            }).join('')}
          </ul>
        </div>`).join('') || '<div class="text-stone-400 italic">Sin métricas</div>';
    } catch (e) {
      console.error('[DoD]', e);
      document.getElementById('dodEtapasLista').innerHTML = `<div class="text-red-600 text-sm">Error: ${escapeHtml(e.message || e)}</div>`;
    }
  }

  function init() {
    document.querySelector('button[data-tab="dod_dashboard"]')?.addEventListener('click', refrescar);
    document.querySelector('a[data-v4-tab="dod_dashboard"]')?.addEventListener('click', refrescar);
    document.getElementById('dodRefreshBtn')?.addEventListener('click', refrescar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
