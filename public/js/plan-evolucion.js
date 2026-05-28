/* eslint-disable */
/**
 * Plan 2026 · Tablero de Evolución
 * Firmada Dusan 2026-05-28 · BLOQUE C
 *
 * Conecta el tab #tabEvolucion con la RPC public.plan_tablero.
 * Renderea: KPIs de hoy vs ayer, gráfico de línea, barras comparativas,
 * timeline 7 días, semáforos, lista de bloqueantes, lista de inputs.
 *
 * Realtime: subscribe a plan.snapshot_diario · refresh cada 60s + on insert.
 * Si última actualización >24h muestra banner.
 */
(function () {
  'use strict';
  const sb = window.sb || window.supabase;
  if (!sb) { console.warn('[plan-evolucion] window.sb no disponible'); return; }

  const COLORS = { verde: '#059669', gris: '#64748b', rojo: '#dc2626', ambar: '#d97706', azul: '#3b82f6' };

  let chartLinea = null;
  let realtimeChannel = null;
  let dashboardData = null;

  function fmtPct(n) { return (n == null || isNaN(n)) ? '—' : `${Number(n).toFixed(1)}%`; }
  function fmtNum(n) { return (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('es-CL'); }
  function fmtDelta(n) {
    if (n == null || isNaN(n)) return '—';
    const sign = n > 0 ? '+' : '';
    return `${sign}${Number(n).toFixed(1)}%`;
  }
  function deltaClass(n) {
    if (n == null || isNaN(n)) return 'text-slate-400';
    if (n > 0.5) return 'text-emerald-700';
    if (n < -0.5) return 'text-rose-700';
    return 'text-slate-500';
  }
  function semaforo(n) {
    if (n == null) return { color: '#64748b', label: '—' };
    if (n > 5) return { color: COLORS.verde, label: 'positiva' };
    if (n < -5) return { color: COLORS.rojo, label: 'negativa' };
    return { color: COLORS.ambar, label: 'normal' };
  }

  async function loadDashboard() {
    try {
      const { data, error } = await sb.rpc('plan_tablero', { p_dias: 14 });
      if (error) throw error;
      dashboardData = data;
      render(data);
    } catch (e) {
      console.error('[plan-evolucion] rpc plan_tablero:', e);
      const cont = document.getElementById('plan-evolucion-error');
      if (cont) cont.textContent = '⚠️ No pude cargar el tablero. ' + (e?.message || e);
    }
  }

  function render(d) {
    if (!d) return;
    renderHeader(d);
    renderBarras(d);
    renderSemaforo(d);
    renderInputs(d);
    renderBloqueantes(d);
    renderChart(d);
    renderBanner(d);
  }

  function renderHeader(d) {
    const hoyPct = d.hoy?.avance_real_pct;
    const ayerPct = d.ayer?.avance_real_pct;
    const delta = d.delta_vs_ayer;
    const proy = d.proyeccion_30d_pct;
    const vel = d.velocidad_diaria_pct;
    const hoyStr = d.hoy?.fecha || '—';
    const ayerStr = d.ayer?.fecha || '—';
    const el = (id) => document.getElementById(id);
    if (el('plev_fecha_hoy')) el('plev_fecha_hoy').textContent = hoyStr;
    if (el('plev_fecha_ayer')) el('plev_fecha_ayer').textContent = ayerStr;
    if (el('plev_avance_real')) el('plev_avance_real').textContent = fmtPct(hoyPct);
    if (el('plev_delta')) {
      el('plev_delta').textContent = fmtDelta(delta) + ' vs ayer';
      el('plev_delta').className = 'text-sm font-medium ' + deltaClass(delta);
    }
    if (el('plev_proy')) el('plev_proy').textContent = fmtPct(proy);
    if (el('plev_vel')) el('plev_vel').textContent = (vel == null ? '—' : (vel > 0 ? '+' : '') + Number(vel).toFixed(2) + '%/día');
    if (el('plev_planificado')) el('plev_planificado').textContent = fmtPct(d.hoy?.avance_planificado_pct);
  }

  function renderBarras(d) {
    const filas = [
      { label: 'Hitos', hoy: d.hoy?.hitos_cumplidos, ayer: d.ayer?.hitos_cumplidos },
      { label: 'KPIs', hoy: d.hoy?.kpis_con_valor,   ayer: d.ayer?.kpis_con_valor },
      { label: 'Inputs', hoy: d.hoy?.inputs_con_datos, ayer: d.ayer?.inputs_con_datos },
      { label: 'Bloqueantes', hoy: d.hoy?.bloqueantes_abiertos, ayer: d.ayer?.bloqueantes_abiertos, esBloqueo: true },
    ];
    const cont = document.getElementById('plev_barras');
    if (!cont) return;
    cont.innerHTML = filas.map(f => {
      const dif = (f.hoy != null && f.ayer != null) ? f.hoy - f.ayer : null;
      let cls = 'text-slate-500'; let icon = '⏸';
      if (dif != null) {
        if (f.esBloqueo) { // para bloqueantes, menos es mejor
          if (dif < 0) { cls = 'text-emerald-700'; icon = '✅'; }
          else if (dif > 0) { cls = 'text-rose-700'; icon = '🔴'; }
        } else {
          if (dif > 0) { cls = 'text-emerald-700'; icon = '✅'; }
          else if (dif < 0) { cls = 'text-rose-700'; icon = '⚠️'; }
        }
      }
      const deltaStr = dif == null ? '—' : (dif > 0 ? '+' : '') + dif;
      return `<tr class="border-b border-slate-100">
        <td class="py-2 font-medium text-slate-700">${f.label}</td>
        <td class="text-right py-2 text-slate-500">${fmtNum(f.ayer)}</td>
        <td class="text-right py-2 font-semibold text-slate-800">${fmtNum(f.hoy)}</td>
        <td class="text-right py-2 ${cls}">${deltaStr} ${icon}</td>
      </tr>`;
    }).join('');
  }

  function renderSemaforo(d) {
    const real = Number(d.hoy?.avance_real_pct ?? 0);
    const plan = Number(d.hoy?.avance_planificado_pct ?? 0);
    const diff = real - plan;
    const sem = semaforo(diff);
    const el = document.getElementById('plev_semaforo');
    if (!el) return;
    el.innerHTML = `<div class="flex items-center gap-3">
      <div class="w-4 h-4 rounded-full" style="background:${sem.color}"></div>
      <div class="text-sm">
        <div class="font-semibold text-slate-700">Desviación ${sem.label}</div>
        <div class="text-xs text-slate-500">${diff > 0 ? '+' : ''}${diff.toFixed(1)}% (real ${fmtPct(real)} vs plan ${fmtPct(plan)})</div>
      </div>
    </div>`;
  }

  function renderInputs(d) {
    const cont = document.getElementById('plev_inputs');
    if (!cont) return;
    const items = d.inputs || [];
    if (items.length === 0) {
      cont.innerHTML = '<div class="text-slate-400 text-sm text-center py-4">—</div>';
      return;
    }
    cont.innerHTML = items.map(i => {
      const dias = Number(i.dias_sin_update ?? 999);
      let badge, msg;
      if (i.filas_total === 0 || i.ultimo_periodo == null) {
        badge = 'bg-rose-100 text-rose-700';
        msg = `⚠️ Requiere carga de ${i.responsable}`;
      } else if (dias > 35) {
        badge = 'bg-rose-100 text-rose-700';
        msg = `⚠️ ${Math.round(dias)} días sin update · ${i.responsable}`;
      } else if (dias > 1) {
        badge = 'bg-amber-100 text-amber-700';
        msg = `${Math.round(dias)} días · ${i.responsable}`;
      } else {
        badge = 'bg-emerald-100 text-emerald-700';
        msg = `✅ ${i.responsable}`;
      }
      const inputName = (i.input || '').replace('input_', '');
      return `<div class="flex items-center justify-between py-2 border-b border-slate-100">
        <div>
          <div class="font-semibold text-slate-700 text-sm">${inputName}</div>
          <div class="text-xs text-slate-400">último: ${i.ultimo_periodo ?? '—'} · ${i.filas_total} filas</div>
        </div>
        <span class="badge ${badge}" style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;">${msg}</span>
      </div>`;
    }).join('');
  }

  function renderBloqueantes(d) {
    const cont = document.getElementById('plev_bloqueantes');
    if (!cont) return;
    const items = d.bloqueantes || [];
    if (items.length === 0) {
      cont.innerHTML = '<div class="text-emerald-700 text-sm text-center py-4">✅ Sin bloqueantes</div>';
      return;
    }
    cont.innerHTML = items.map(b => {
      const sevColor = b.severidad === 'urgente' ? 'border-l-rose-600 bg-rose-50' :
                      b.severidad === 'pendiente' ? 'border-l-amber-500 bg-amber-50' :
                      b.severidad === 'parcial' ? 'border-l-sky-500 bg-sky-50' : 'border-l-slate-300 bg-slate-50';
      const sevBadge = b.severidad === 'urgente' ? 'bg-rose-600 text-white' :
                      b.severidad === 'pendiente' ? 'bg-amber-500 text-white' :
                      b.severidad === 'parcial' ? 'bg-sky-500 text-white' : 'bg-slate-300';
      return `<div class="border-l-4 ${sevColor} p-3 rounded">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-slate-800">${b.id}</span>
              <span class="text-xs px-2 py-0.5 rounded-full ${sevBadge}">${b.severidad}</span>
              <span class="text-xs text-slate-500">${b.dias_pendiente} días</span>
            </div>
            <div class="text-sm font-medium text-slate-700">${b.descripcion}</div>
            <div class="text-xs text-slate-500 mt-1">Impacta: <span class="font-medium">${b.impacta || '—'}</span></div>
            <div class="text-xs text-slate-400 mt-1 italic">Última acción: ${b.ultima_accion || '—'}</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderChart(d) {
    if (typeof Chart === 'undefined') {
      console.warn('[plan-evolucion] Chart.js no cargado');
      return;
    }
    const ctx = document.getElementById('plev_chart_canvas');
    if (!ctx) return;
    const timeline = d.timeline || [];
    const labels = timeline.map(t => t.fecha);
    const realData = timeline.map(t => Number(t.real ?? 0));
    const planData = timeline.map(t => Number(t.planificado ?? 0));

    // Proyección: prolongar real con velocidad diaria 30 días más
    const hoyVal = realData[realData.length - 1] ?? 0;
    const vel = Number(d.velocidad_diaria_pct ?? 0);
    const ahora = new Date();
    const proyLabels = [];
    const proyData = [];
    for (let i = 1; i <= 30; i++) {
      const dt = new Date(ahora);
      dt.setDate(dt.getDate() + i);
      proyLabels.push(dt.toISOString().slice(0, 10));
      proyData.push(Math.min(100, hoyVal + vel * i));
    }
    const allLabels = labels.concat(proyLabels);
    const realFill = realData.concat(new Array(30).fill(null));
    const proyFill = new Array(realData.length).fill(null).concat([hoyVal, ...proyData.slice(0, 29)]);
    // Para plan, extender lineal
    const planAhora = planData[planData.length - 1] ?? 0;
    const planFuturo = proyLabels.map((_, i) => Math.min(100, planAhora + (100 - planAhora) * (i + 1) / 365));
    const planFull = planData.concat(planFuturo);

    if (chartLinea) chartLinea.destroy();
    chartLinea = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Avance Real',
            data: realFill,
            borderColor: COLORS.verde,
            backgroundColor: 'rgba(5,150,105,0.10)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: COLORS.verde,
          },
          {
            label: 'Avance Planificado',
            data: planFull,
            borderColor: COLORS.gris,
            borderDash: [6, 4],
            borderWidth: 2,
            tension: 0.1,
            fill: false,
            pointRadius: 0,
          },
          {
            label: 'Proyección 30 días',
            data: proyFill,
            borderColor: COLORS.azul,
            borderDash: [2, 2],
            borderWidth: 2,
            tension: 0.2,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false, callbacks: { label: (c) => `${c.dataset.label}: ${(c.parsed.y ?? 0).toFixed(1)}%` } },
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(100,116,139,0.1)' }, ticks: { callback: (v) => v + '%' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
        },
      },
    });
  }

  function renderBanner(d) {
    const cont = document.getElementById('plev_banner_stale');
    if (!cont) return;
    const ultima = d.hoy?.created_at ? new Date(d.hoy.created_at) : null;
    if (!ultima) { cont.classList.add('hidden'); return; }
    const horas = (Date.now() - ultima.getTime()) / 3600000;
    if (horas > 24) {
      cont.classList.remove('hidden');
      cont.innerHTML = `⚠️ Sin actualizaciones desde hace ${horas.toFixed(0)}h. <button onclick="window.plevPedirRevisarDiego?.()" class="underline font-semibold">¿Querés que Diego revise?</button>`;
    } else {
      cont.classList.add('hidden');
    }
  }

  // Realtime
  function setupRealtime() {
    if (realtimeChannel) return;
    try {
      realtimeChannel = sb.channel('plan_snapshot_diario_rt')
        .on('postgres_changes', { event: '*', schema: 'plan', table: 'snapshot_diario' }, () => loadDashboard())
        .subscribe();
    } catch (e) { console.warn('[plan-evolucion] realtime setup:', e); }
  }

  window.plevPedirRevisarDiego = function () {
    if (typeof window.openFabDiego === 'function') window.openFabDiego();
    setTimeout(() => {
      const input = document.querySelector('#diegoChatInput, #diegoInputTextarea');
      if (input) {
        input.value = 'No hay actualizaciones del tablero hace más de 24h. ¿Podés revisar qué pasa?';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 600);
  };

  function boot() {
    loadDashboard();
    setupRealtime();
    setInterval(loadDashboard, 60000); // refresco cada minuto
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
