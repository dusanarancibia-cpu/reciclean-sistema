// ============================================================
// VALES / PORTAL PAGAR — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  let _vpPagar = [];
  function $$(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmtCLP(n) { if (n == null || isNaN(n)) return '—'; return '$' + Number(n).toLocaleString('es-CL', { maximumFractionDigits: 0 }); }
  function fmtKg(n) { if (n == null || isNaN(n)) return '—'; return Number(n).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' kg'; }
  function fmtFecha(s) { if (!s) return '—'; try { return new Date(s).toLocaleDateString('es-CL'); } catch (e) { return s; } }
  function badgeEstadoVale(estado) {
    var n = Number(estado);
    if (n === 1) return '<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">🟡 Pendiente</span>';
    if (n === 2) return '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">✅ Cerrado</span>';
    if (n === 9) return '<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">❌ Anulado</span>';
    return '<span class="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs">—</span>';
  }

  async function loadVales() {
    if (!window.sb) return;
    var estado = $$('vp_estado_pipeline');
    if (estado) estado.textContent = 'Cargando...';

    try {
      var sucP = sb.schema('panel').from('v_pesajes_resumen_sucursal').select('*');
      var pagarP = sb.schema('panel').from('v_cuentas_pagar_generadores').select('*').limit(500);
      var recientesP = sb.schema('curated').from('vales_portal_externo').select('folio,fecha,sucursal,razon_social,tipo_servicio,peso_final,total_vale,saldo_vale,estado').order('fecha', { ascending: false }).order('folio', { ascending: false }).limit(50);

      var [sucR, pagarR, recR] = await Promise.all([sucP, pagarP, recientesP]);

      if (sucR.error) throw sucR.error;
      if (pagarR.error) throw pagarR.error;
      if (recR.error) throw recR.error;

      var sucRows = sucR.data || [];
      _vpPagar = pagarR.data || [];
      var recRows = recR.data || [];

      var totalVales = sucRows.reduce(function (a, r) { return a + (Number(r.vales) || 0); }, 0);
      var totalSaldo = _vpPagar.reduce(function (a, r) { return a + (Number(r.saldo_clp) || 0); }, 0);
      var ultimoVale = sucRows.reduce(function (max, r) {
        if (!r.ultimo_vale) return max;
        if (!max || new Date(r.ultimo_vale) > new Date(max)) return r.ultimo_vale;
        return max;
      }, null);

      if ($$('vp_kpi_vales')) $$('vp_kpi_vales').textContent = totalVales.toLocaleString('es-CL');
      if ($$('vp_kpi_saldo')) $$('vp_kpi_saldo').textContent = fmtCLP(totalSaldo);
      if ($$('vp_kpi_clientes')) $$('vp_kpi_clientes').textContent = _vpPagar.length.toLocaleString('es-CL');
      if ($$('vp_kpi_ultimo')) $$('vp_kpi_ultimo').textContent = fmtFecha(ultimoVale);

      if (totalVales === 0) {
        $$('vp_banner_sin_datos')?.classList.remove('hidden');
      } else {
        $$('vp_banner_sin_datos')?.classList.add('hidden');
      }

      var sucBody = $$('vp_sucursal_body');
      if (sucBody) {
        if (sucRows.length === 0) {
          sucBody.innerHTML = '<tr><td colspan="7" class="text-center text-stone-400 py-4">Sin datos · pipeline aún sin ejecutar</td></tr>';
        } else {
          sucBody.innerHTML = sucRows.map(function (r) {
            return '<tr class="border-t border-stone-100 hover:bg-stone-50">' +
              '<td class="px-3 py-2 font-semibold">' + esc(r.sucursal) + '</td>' +
              '<td class="text-right px-3 py-2">' + (Number(r.vales) || 0).toLocaleString('es-CL') + '</td>' +
              '<td class="text-right px-3 py-2">' + (Number(r.clientes_unicos) || 0).toLocaleString('es-CL') + '</td>' +
              '<td class="text-right px-3 py-2">' + fmtKg(r.kg_total) + '</td>' +
              '<td class="text-right px-3 py-2">' + fmtCLP(r.clp_total) + '</td>' +
              '<td class="text-right px-3 py-2 text-emerald-700 font-semibold">' + fmtCLP(r.saldo_pendiente_clp) + '</td>' +
              '<td class="text-right px-3 py-2 text-xs text-stone-500">' + fmtFecha(r.ultimo_vale) + '</td>' +
              '</tr>';
          }).join('');
        }
      }

      renderPagar();

      var recBody = $$('vp_recientes_body');
      if (recBody) {
        if (recRows.length === 0) {
          recBody.innerHTML = '<tr><td colspan="9" class="text-center text-stone-400 py-4">Sin vales · cargá la clave portal para que la EF arranque</td></tr>';
        } else {
          recBody.innerHTML = recRows.map(function (r) {
            return '<tr class="border-t border-stone-100 hover:bg-stone-50">' +
              '<td class="px-3 py-2 font-mono text-xs">' + esc(r.folio) + '</td>' +
              '<td class="px-3 py-2 text-xs">' + fmtFecha(r.fecha) + '</td>' +
              '<td class="px-3 py-2 text-xs">' + esc(r.sucursal || '—') + '</td>' +
              '<td class="px-3 py-2">' + esc(r.razon_social || '—') + '</td>' +
              '<td class="px-3 py-2 text-xs">' + esc(r.tipo_servicio || '—') + '</td>' +
              '<td class="text-right px-3 py-2">' + fmtKg(r.peso_final) + '</td>' +
              '<td class="text-right px-3 py-2">' + fmtCLP(r.total_vale) + '</td>' +
              '<td class="text-right px-3 py-2 font-semibold ' + (Number(r.saldo_vale) > 0 ? 'text-emerald-700' : 'text-stone-400') + '">' + fmtCLP(r.saldo_vale) + '</td>' +
              '<td class="px-3 py-2">' + badgeEstadoVale(r.estado) + '</td>' +
              '</tr>';
          }).join('');
        }
      }

      if (estado) estado.textContent = 'Última carga ' + new Date().toLocaleTimeString('es-CL');
    } catch (e) {
      if (estado) estado.textContent = 'Error: ' + (e && e.message ? e.message : e);
      console.error('[vales_portal] error:', e);
    }
  }

  function renderPagar() {
    var body = $$('vp_pagar_body');
    if (!body) return;
    var filtro = ($$('vp_filtro_generador')?.value || '').toLowerCase().trim();
    var rows = _vpPagar;
    if (filtro) {
      rows = rows.filter(function (r) {
        return (r.razon_social || '').toLowerCase().includes(filtro) ||
               String(r.rut || '').toLowerCase().includes(filtro);
      });
    }
    if (rows.length === 0) {
      body.innerHTML = '<tr><td colspan="6" class="text-center text-stone-400 py-4">' + (filtro ? 'Sin coincidencias' : 'Sin saldos pendientes') + '</td></tr>';
      return;
    }
    body.innerHTML = rows.slice(0, 200).map(function (r) {
      return '<tr class="border-t border-stone-100 hover:bg-stone-50">' +
        '<td class="px-3 py-2 font-semibold">' + esc(r.razon_social || '—') + '</td>' +
        '<td class="px-3 py-2 font-mono text-xs">' + esc(r.rut ? r.rut + (r.dv ? '-' + r.dv : '') : '—') + '</td>' +
        '<td class="px-3 py-2 text-xs">' + esc(r.banco || '—') + '</td>' +
        '<td class="text-right px-3 py-2">' + (Number(r.vales_pendientes) || 0).toLocaleString('es-CL') + '</td>' +
        '<td class="text-right px-3 py-2 text-emerald-700 font-semibold">' + fmtCLP(r.saldo_clp) + '</td>' +
        '<td class="px-3 py-2 text-xs text-stone-500">' + fmtFecha(r.ultimo_vale) + '</td>' +
        '</tr>';
    }).join('');
  }

  function init() {
    document.querySelector('button[data-tab="vales_portal"]')?.addEventListener('click', function () { setTimeout(loadVales, 100); });
    document.querySelector('a[data-v4-tab="vales_portal"]')?.addEventListener('click', function () { setTimeout(loadVales, 100); });
    $$('vp_refresh')?.addEventListener('click', loadVales);
    $$('vp_filtro_generador')?.addEventListener('input', renderPagar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
