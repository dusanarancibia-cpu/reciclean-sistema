// ============================================================
// AUDITORÍA INGESTA — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function() {
  async function loadAuditoriaIngesta() {
    try {
      await window.__supabaseReady;
      const sb = window.supabase;

      // 1. Cargar frescura datos (semáforos)
      const { data: frescura, error: e1 } = await sb.schema('panel').from('v_frescura_datos').select('*');
      if (e1) throw e1;

      // Fase 2 Paso 2.4: bloque "logs recientes" que leía facturas_portal_raw eliminado.
      // La tabla fue droppeada. Se mantienen los semáforos vivos vía v_frescura_datos.

      // 3. Actualizar semáforos
      const frData = {};
      (frescura || []).forEach(f => { frData[f.fuente] = f; });

      const updateCard = (fuente, prefix) => {
        const data = frData[fuente];
        const semBtn = document.getElementById(prefix + '_semaforo');
        const fechaBtn = document.getElementById(prefix + '_fecha');
        const countBtn = document.getElementById(prefix + '_count');
        const estBtn = document.getElementById(prefix + '_estado');

        if (!data) {
          semBtn.textContent = '—';
          fechaBtn.textContent = '—';
          countBtn.textContent = '0';
          estBtn.textContent = 'Sin datos';
          return;
        }

        const estado = data.estado_semaforo || 'rojo';
        const emoji = { 'verde': '🟢', 'naranja': '🟠', 'rojo': '🔴' }[estado] || '⚪';
        semBtn.textContent = emoji;

        fechaBtn.textContent = data.ultima_actualizacion ?
          new Date(data.ultima_actualizacion).toLocaleString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) :
          '—';

        countBtn.textContent = data.registros_ultimas_24h || 0;
        estBtn.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);

        // Fase 2 Paso 2.5: badge +48h si la fuente no tiene registros últimos 2 días
        const alertaEl = document.getElementById(prefix + '_alerta_48h');
        if (alertaEl) {
          if (data.dentro_48h === false) {
            alertaEl.textContent = '⚠️ +48h';
            alertaEl.className = 'text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800';
            alertaEl.title = 'No hay registros en las últimas 48 horas · revisar ingesta';
          } else {
            alertaEl.textContent = '';
            alertaEl.className = 'text-xs';
            alertaEl.removeAttribute('title');
          }
        }
      };

      updateCard('pesajes', 'audit_pesajes');
      updateCard('facturas', 'audit_facturas');
      updateCard('banco', 'audit_banco');

      // Fase 2 Paso 2.4: render de tabla de logs eliminado.
      // Consumía facturas_portal_raw (droppeada). Se preservan solo los semáforos arriba.
      const tbody = document.getElementById('audit_logs_body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-stone-400 py-4 italic">Los logs recientes por corrida fueron discontinuados. Ver semáforos arriba para frescura por fuente.</td></tr>';
      }

      showToast('✅ Auditoría cargada', 'success', 2000);
    } catch (e) {
      console.error('[auditoria-ingesta] error:', e);
      const tbody = document.getElementById('audit_logs_body');
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-700 py-4">Error: ' + (e?.message || e) + '</td></tr>';
      showToast('❌ Error al cargar auditoría', 'error', 3000);
    }
  }
  window.loadAuditoriaIngesta = loadAuditoriaIngesta;

  async function forzarIngesta(fuente) {
    try {
      await window.__supabaseReady;
      const sb = window.supabase;
      const efName = fuente === 'pesajes' ? 'ingesta-vales-portal' :
                     fuente === 'facturas' ? 'ingesta-facturas-portal' :
                     'ingesta-movimientos-banco';

      const response = await fetch(`/.netlify/functions/${efName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      showToast(`✅ ${fuente}: ${data.insertados || 0} inserts, ${data.actualizados || 0} updates`, 'success', 3000);
      setTimeout(loadAuditoriaIngesta, 500);
    } catch (e) {
      console.error('[forzar-ingesta]', e);
      showToast(`❌ Error en ${fuente}: ${e?.message || e}`, 'error', 3000);
    }
  }
  window.forzarIngesta = forzarIngesta;

  function init() {
    document.querySelector('button[data-tab="auditoria_ingesta"]')?.addEventListener('click', function () { setTimeout(loadAuditoriaIngesta, 100); });
    document.getElementById('audit_refresh')?.addEventListener('click', loadAuditoriaIngesta);
    document.getElementById('audit_forzar_pesajes')?.addEventListener('click', function () { forzarIngesta('pesajes'); });
    // Fase 2 Paso 2.4: listener audit_forzar_facturas eliminado (EF ingesta-facturas-portal deprecada).
    document.getElementById('audit_forzar_banco')?.addEventListener('click', function () { forzarIngesta('banco'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
