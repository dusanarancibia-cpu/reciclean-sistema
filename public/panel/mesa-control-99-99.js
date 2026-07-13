// ============================================================
// MESA DE CONTROL 99-99 — extraído de panel-rdo.html (antifragilidad
// panel, bloque 11 PR 1)
//
// Dominio propio, reclasificado: incluye Mesa V3 Pulso del Negocio +
// Calibrador de Margen + Mesa Control 99-99 (D-PLAN-99-99-001 Fase 3).
// Los 3 renderizan al mismo tab (tabMesaControl9999) y estaban integrados
// entre sí a propósito (comentario original: "CALIBRADOR DE MARGEN...
// integrado Mesa Control 99-99"). Verificado antes de extraer: comparten
// autoría/fecha (PC5_dusan 26-jun-2026 los dos primeros, PC2 Pablo 15-jun
// D-PLAN-99-99-001 el tercero) y mecanismo de acceso a datos propio
// (fetch() directo a EF mesa-control-v3-api + RPCs estatus_plan_99_99/
// mesa_control_99_99_kpis/v_pc_score_individual/v_margen_vs_costos).
//
// NO usa los 6 helpers de Firmas/Tarifas (ready/resolveEmail/esc/
// fmtFecha/fmtCLP/showError/isAdmin) — verificado con grep exhaustivo,
// cero coincidencias. Ese archivo hermano (Firmas Pendientes + Firmas
// Reglas + Tarifas Externas) queda para un PR 2 separado, ya limpio de
// este dominio.
//
// Timers/auto-refresh propios (dentro de setupMesaControl9999AutoRefresh,
// self-registrada vía DOMContentLoaded, independiente del init() que
// compartía con Firmas/Tarifas):
//   - setInterval 60s: refresca Mesa Control 99-99 + Mesa V3 si el tab
//     está visible.
//   - setInterval 300s (5 min): refresca solo Mesa V3, independiente.
//   - setTimeout inicial 1.5-2s si window.PERMS?.es_admin (carga inicial
//     silenciosa para admins).
//
// Reads estándar a globals: window.PERMS?.es_admin (gate admin, fuente
// canónica del núcleo de autenticación — no se toca, misma lectura del
// original).
//
// Dependencia de shell del panel (mismo patrón ya documentado en Cartero
// y Cumplimiento, no nuevo): se auto-registra a button[data-tab=
// "mesa_control_99_99"] / a[data-v4-tab="mesa_control_99_99"] (cambio de
// tab dispara primera carga — antes vivía como 2 líneas bind(...) en el
// init() compartido con Firmas/Tarifas, relocadas aquí explícitamente) +
// engancha [data-mc-drill] (tarjetas drill-down de Mesa de Control, mismo
// patrón visto en Cumplimiento).
//
// Sin IIFE-splitting adicional: se envuelve el bloque completo (que antes
// vivía como fragmento dentro de una IIFE más grande compartida con
// Firmas/Tarifas) en su propia IIFE nueva, preservando el comportamiento
// idéntico.
//
// Fuera de alcance (no tocado): Firmas Pendientes/Reglas, Tarifas Externas
// (quedan en panel-rdo.html para PR 2), Diego LLM, Precios, el núcleo.
// ============================================================

(function () {

  // ============================================================
  // Mesa V3 — Pulso del Negocio (PC5_dusan · 26-jun-2026)
  // EF mesa-control-v3-api · verify_jwt=false · auto-refresh 5min
  // ============================================================
  var _v3Chart = null;
  async function loadMesaV3Pulso() {
    var EF = 'https://eknmtsrtfkzroxnovfqn.functions.supabase.co/mesa-control-v3-api';
    var set = function(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    try {
      var r = await fetch(EF);
      if (!r.ok) throw new Error('EF ' + r.status);
      var d = await r.json();
      var p = d.pulso || {};

      // Ton hoy
      var tonHoy = parseFloat(p.ton_hoy) || 0;
      set('v3TonHoy', tonHoy.toFixed(1) + ' t');
      var semTon = p.ton_semaforo || 'rojo';
      var semColor = semTon === 'verde' ? 'text-emerald-400' : semTon === 'amarillo' ? 'text-amber-400' : 'text-red-400';
      var elSem = document.getElementById('v3TonSem');
      if (elSem) { elSem.textContent = (p.ton_pct_meta || 0) + '% meta · ' + semTon; elSem.className = 'text-[10px] mt-0.5 ' + semColor; }

      // Caja
      var cajaClp = p.caja_clp;
      set('v3Caja', cajaClp != null ? '$' + (cajaClp / 1000000).toFixed(1) + 'M' : '—');
      var cajaSem = p.caja_semaforo || '';
      var cajaColor = cajaSem === 'verde' ? 'text-emerald-400' : cajaSem === 'amarillo' ? 'text-amber-400' : 'text-red-400';
      var elCajaDias = document.getElementById('v3CajaDias');
      if (elCajaDias) { elCajaDias.textContent = (p.caja_dias || 0) + ' días cobertura'; elCajaDias.className = 'text-[10px] mt-0.5 ' + cajaColor; }

      // Seed badge
      var seedEl = document.getElementById('v3Seed');
      if (seedEl) { if (d.caja_es_seed) seedEl.classList.remove('hidden'); else seedEl.classList.add('hidden'); }

      // Sucursales card (reemplaza USD/CLP)
      var sucList = d.sucursales || [];
      var sucActHoy = parseInt(p.sucursales_activas) || 0;
      var totalSuc = sucList.length || 5;
      set('v3SucCard', sucActHoy + '/' + totalSuc);
      var elSucSub = document.getElementById('v3SucSub');
      if (elSucSub) {
        var enRojo = sucList.filter(function(s){ return (s.dias_con_actividad||0)/30 < 0.4; }).length;
        elSucSub.textContent = enRojo > 0 ? enRojo + ' bajo rendimiento' : 'todas activas';
        elSucSub.className = 'text-[10px] mt-0.5 ' + (enRojo > 0 ? 'text-amber-400' : 'text-emerald-400');
      }

      // Chips sucursales (30d)
      var rowEl = document.getElementById('v3SucRow');
      if (rowEl) {
        rowEl.innerHTML = sucList.map(function(s) {
          var pct = (s.dias_con_actividad||0) / 30;
          var color = pct >= 0.7 ? '#10b981' : pct >= 0.4 ? '#f59e0b' : '#ef4444';
          var dot = pct >= 0.7 ? '🟢' : pct >= 0.4 ? '🟡' : '🔴';
          var nom = (s.sucursal||'').replace(/reciclean\s*/i,'').replace(/farex\s*/i,'').replace(/\s+/g,' ').trim().split(' ')[0];
          var ton = (parseFloat(s.ton_prom_dia)||0).toFixed(1);
          return '<span style="background:#1e293b;border:1px solid ' + color + ';color:#e2e8f0;font-size:10px;padding:2px 8px;border-radius:10px;white-space:nowrap">' + dot + ' ' + nom + ' ' + ton + 't/d</span>';
        }).join('');
      }

      // Línea alerta (Hoy: ...)
      var alertEl = document.getElementById('v3Alerta');
      if (alertEl) {
        var alertas = [];
        var bajasRend = sucList.filter(function(s){ return (s.dias_con_actividad||0)/30 < 0.4; });
        if (bajasRend.length > 0) alertas.push('📍 ' + bajasRend.map(function(s){ return (s.sucursal||'').split(' ')[0]; }).join(', ') + ' bajo rendimiento');
        if ((p.clientes_morosos||0) > 0) alertas.push('💸 ' + p.clientes_morosos + ' cobros urgentes');
        if ((p.desv_abiertas||0) > 0) alertas.push('⚡ ' + p.desv_abiertas + ' desvíos abiertos');
        alertEl.textContent = alertas.length > 0 ? 'Hoy: ' + alertas.join(' · ') : '✅ Todo en orden';
        alertEl.classList.remove('hidden');
      }

      // Cobros vencidos
      var cobros = p.cobros_vencidos_clp;
      set('v3Cobros', cobros != null ? '$' + (cobros / 1000000).toFixed(1) + 'M' : '—');
      set('v3CobrosMax', (p.cobros_max_dias || 0) + ' días · ' + (p.clientes_morosos || 0) + ' clientes');

      // Desviaciones
      set('v3Desv', p.desv_abiertas != null ? String(p.desv_abiertas) : '—');

      // Hora actualización
      if (d.last_updated_at) {
        var dt = new Date(d.last_updated_at);
        set('v3UpdatedAt', 'datos: ' + dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
      }

      // Chart ton 14d
      var hist = d.ton_historico || [];
      if (hist.length >= 2 && typeof Chart !== 'undefined') {
        var canvas = document.getElementById('v3ChartTon');
        if (canvas) {
          var labels = hist.map(function(h) { return (h.fecha || '').slice(5); });
          var values = hist.map(function(h) { return parseFloat(h.ton_total) || 0; });
          if (_v3Chart) { _v3Chart.destroy(); _v3Chart = null; }
          _v3Chart = new Chart(canvas, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{ data: values, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1.5, pointRadius: 2, fill: true, tension: 0.3 }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: '#334155' }, min: 0 }
              }
            }
          });
        }
      }
    } catch (err) {
      var el = document.getElementById('v3TonHoy');
      if (el) el.textContent = 'Error';
    }
  }

  // ============================================================
  // CALIBRADOR DE MARGEN · datos reales curated.v_margen_vs_costos
  // PC5_dusan · 26-jun-2026 · integrado Mesa Control 99-99
  // ============================================================
  var calDatos = [], calFSuc = 'todas', calFChip = 'todos', calAprobados = {};
  function calSemNorm(s) { var v = (s||'').toLowerCase(); return v.includes('rojo')?'rojo':v.includes('amarillo')?'amarillo':'verde'; }
  function calFiltrado() {
    return calDatos.filter(function(d){
      return (calFSuc==='todas'||d.sucursal_nombre===calFSuc) && (calFChip==='todos'||calSemNorm(d.semaforo)===calFChip);
    }).sort(function(a,b){
      var o={rojo:0,amarillo:1,verde:2};
      var sa=calSemNorm(a.semaforo),sb=calSemNorm(b.semaforo);
      if(sa!==sb) return (o[sa]||0)-(o[sb]||0);
      return (parseFloat(a.mg_vs_meta)||0)-(parseFloat(b.mg_vs_meta)||0);
    });
  }
  function calIniciarSucursales() {
    var sucs=['todas'], seen={};
    calDatos.forEach(function(d){ if(!seen[d.sucursal_nombre]){sucs.push(d.sucursal_nombre);seen[d.sucursal_nombre]=1;} });
    var bar=document.getElementById('cal-suc-bar'); if(!bar) return;
    bar.innerHTML=sucs.map(function(s){
      var filtS=s==='todas'?calDatos:calDatos.filter(function(d){return d.sucursal_nombre===s;});
      var nr=filtS.filter(function(d){return calSemNorm(d.semaforo)==='rojo';}).length;
      var bdg=nr>0?' <span style="background:#fee2e2;color:#dc2626;border-radius:8px;padding:1px 5px;font-size:9px;font-weight:700">'+nr+'🔴</span>':'';
      return '<button class="cal-suc-btn'+(calFSuc===s?' on':'')+'" onclick="calSelSuc(this,\''+s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">'+(s==='todas'?'Todas · '+calDatos.length:s)+bdg+'</button>';
    }).join('');
  }
  function calSelSuc(el,s){calFSuc=s;document.querySelectorAll('#cal-bloque .cal-suc-btn').forEach(function(b){b.classList.remove('on');});el.classList.add('on');calRender();calUpdCeoBanner();}
  function calChip(el,v){calFChip=v;document.querySelectorAll('#cal-bloque .cal-chip').forEach(function(b){b.classList.remove('cal-chip-on');});el.classList.add('cal-chip-on');calRender();}
  function calRender() {
    var datos=calFiltrado();
    var elC=document.getElementById('cal-cargando'); if(elC) elC.classList.add('hidden');
    var tbl=document.getElementById('cal-tabla'); if(tbl) tbl.classList.remove('hidden');
    var tbody=document.getElementById('cal-tbody'); if(!tbody) return;
    var filtAll=calFSuc==='todas'?calDatos:calDatos.filter(function(d){return d.sucursal_nombre===calFSuc;});
    var nV=filtAll.filter(function(d){return calSemNorm(d.semaforo)==='verde';}).length;
    var nA=filtAll.filter(function(d){return calSemNorm(d.semaforo)==='amarillo';}).length;
    var nR=filtAll.filter(function(d){return calSemNorm(d.semaforo)==='rojo';}).length;
    var el=document.getElementById('cal-k-tot'); if(el) el.textContent=filtAll.length;
    el=document.getElementById('cal-k-suc'); if(el) el.textContent=calFSuc==='todas'?'4 sucursales':calFSuc;
    el=document.getElementById('cal-k-v'); if(el) el.textContent=nV;
    el=document.getElementById('cal-k-a'); if(el) el.textContent=nA;
    el=document.getElementById('cal-k-r'); if(el) el.textContent=nR;
    el=document.getElementById('cal-badge'); if(el) el.textContent=datos.length+' materiales';
    if(!datos.length){tbody.innerHTML='<tr><td colspan="10" class="text-center text-stone-400 py-6 text-xs">Sin materiales para este filtro</td></tr>';return;}
    tbody.innerHTML=datos.map(function(d){
      var key=d.material_id+'_'+d.sucursal_id;
      var sem=calSemNorm(d.semaforo);
      var semBdg=sem==='verde'?'<span class="cal-sem-v">🟢 verde</span>':sem==='amarillo'?'<span class="cal-sem-a">🟡 alerta</span>':'<span class="cal-sem-r">🔴 bajo mín</span>';
      var mg=parseFloat(d.mg_real_pct)||0, meta=parseFloat(d.mg_meta_pct)||0, br=parseFloat(d.mg_vs_meta)||0;
      var brCol=br>=0?'color:#166534':'color:#dc2626';
      var vig=d.vigencia_desde||'—';
      var ap=!!calAprobados[key];
      var btnAp=ap?'<span class="text-[10px] text-emerald-700 font-semibold">✓ Aprobado</span>':'<button onclick="calAprobar(\''+key.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',this)" class="cal-btn-ap">Aprobar</button>';
      var trBg=sem==='rojo'?'background:#fff5f5':sem==='amarillo'?'background:#fffbeb':'';
      return '<tr style="border-bottom:1px solid #f1f5f9;'+trBg+'">'
        +'<td class="px-3 py-2 font-semibold text-stone-800" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+d.nombre.replace(/"/g,'&quot;')+'">'+d.nombre+'</td>'
        +'<td class="px-3 py-2 text-stone-500 text-[11px]">'+d.sucursal_nombre+'</td>'
        +'<td class="px-3 py-2 text-right font-bold">'+(d.precio_compra_clp?'$'+Math.round(parseFloat(d.precio_compra_clp)).toLocaleString('es-CL'):'—')+'</td>'
        +'<td class="px-3 py-2 text-right font-bold text-emerald-700">'+(d.precio_venta_clp?'$'+Math.round(parseFloat(d.precio_venta_clp)).toLocaleString('es-CL'):'—')+'</td>'
        +'<td class="px-3 py-2 text-right font-bold">'+mg.toFixed(1)+'%</td>'
        +'<td class="px-3 py-2 text-right text-stone-500">'+meta.toFixed(1)+'%</td>'
        +'<td class="px-3 py-2 text-right font-bold" style="'+brCol+'">'+(br>=0?'+':'')+br.toFixed(1)+'%</td>'
        +'<td class="px-3 py-2 text-center">'+semBdg+'</td>'
        +'<td class="px-3 py-2 text-center text-[10px] text-stone-400">'+vig+'</td>'
        +'<td class="px-3 py-2 text-center">'+btnAp+'</td>'
        +'</tr>';
    }).join('');
  }
  function calAprobar(key) {
    var prev=!!calAprobados[key];
    calToastUndo('✅ Precio aprobado','cal-tv',
      function(){calAprobados[key]=true;calRender();},
      function(){delete calAprobados[key];calRender();calToast('↩ Deshecho','cal-ta');}
    );
  }
  function calAprobarRojosSuc() {
    if(!calFSuc||calFSuc==='todas') return;
    var rojos=calDatos.filter(function(d){return d.sucursal_nombre===calFSuc&&calSemNorm(d.semaforo)==='rojo';});
    var prev={};rojos.forEach(function(d){var k=d.material_id+'_'+d.sucursal_id;prev[k]=!!calAprobados[k];});
    calToastUndo('✅ '+rojos.length+' rojos de '+calFSuc+' aprobados','cal-tv',
      function(){rojos.forEach(function(d){calAprobados[d.material_id+'_'+d.sucursal_id]=true;});calRender();calUpdCeoBanner();},
      function(){rojos.forEach(function(d){var k=d.material_id+'_'+d.sucursal_id;if(!prev[k])delete calAprobados[k];});calRender();calUpdCeoBanner();calToast('↩ Deshecho','cal-ta');}
    );
  }
  function calUpdCeoBanner() {
    var btn=document.getElementById('cal-ceo-btn'); if(!btn) return;
    var rojos=calFSuc!=='todas'?calDatos.filter(function(d){return d.sucursal_nombre===calFSuc&&calSemNorm(d.semaforo)==='rojo'&&!calAprobados[d.material_id+'_'+d.sucursal_id];}).length:0;
    btn.textContent=rojos>0?'✅ Aprobar '+rojos+' rojos de '+calFSuc:'✓ Todo OK';
    btn.disabled=rojos===0; btn.style.opacity=rojos===0?'0.6':'1';
  }
  function calCerrarCeo() {
    var b=document.getElementById('cal-ceo-banner'); if(b) b.classList.add('hidden');
    calFChip='todos';
    document.querySelectorAll('#cal-bloque .cal-chip').forEach(function(c){c.classList.remove('cal-chip-on');if(c.dataset.calChip==='todos')c.classList.add('cal-chip-on');});
    calRender();
  }
  function calRefresh() { if(calDatos.length>0){calIniciarSucursales();calRender();} }
  function calUpdTS(vig) {
    var dot=document.getElementById('cal-ts-dot'), txt=document.getElementById('cal-ts'); if(!txt) return;
    if(vig){ var d=new Date(vig), df=Math.round((new Date()-d)/86400000);
      if(dot) dot.style.background=df<=3?'#22c55e':'#f59e0b';
      txt.textContent='Vigente desde '+vig+(df>3?' · ⚠ hace '+df+'d':'');
    } else { txt.textContent='Sin fecha vigencia'; }
  }
  function calToastUndo(msg,cls,doFn,undoFn) {
    doFn();
    var ct=document.getElementById('cal-toasts'); if(!ct) return;
    var t=document.createElement('div'); t.className='cal-toast '+(cls||'');
    t.innerHTML='<span>'+msg+'</span><button class="cal-tundo" onclick="calUndoT(this)">↩ Deshacer</button>';
    t._undo=undoFn; ct.appendChild(t);
    t._tm=setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},5000);
  }
  function calUndoT(btn){var t=btn.parentNode;if(t&&t._undo){clearTimeout(t._tm);t._undo();if(t.parentNode)t.parentNode.removeChild(t);}}
  function calToast(msg,cls) {
    var ct=document.getElementById('cal-toasts'); if(!ct) return;
    var t=document.createElement('div'); t.className='cal-toast '+(cls||''); t.textContent=msg;
    ct.appendChild(t); setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},3000);
  }
  async function loadCalibradorMargen(token,SUPA,apikey) {
    var el=document.getElementById('cal-cargando'); if(!el) return;
    el.textContent='Cargando datos reales…';
    try {
      var h={'apikey':apikey,'Authorization':'Bearer '+token,'Accept-Profile':'curated'};
      var r=await fetch(SUPA+'/rest/v1/v_margen_vs_costos?select=*&order=semaforo.asc,mg_vs_meta.asc&limit=500',{headers:h});
      if(!r.ok){el.textContent='Error '+r.status+' al cargar materiales';return;}
      var datos=await r.json();
      if(!Array.isArray(datos)||!datos.length){el.textContent='Sin datos en curated.v_margen_vs_costos';return;}
      calDatos=datos;
      calIniciarSucursales();
      calRender();
      var firstVig=datos.find(function(d){return d.vigencia_desde;});
      calUpdTS(firstVig?firstVig.vigencia_desde:null);
    } catch(e){if(el)el.textContent='Error: '+(e.message||e);}
  }

  // ============================================================
  // Mesa de Control Plan 99-99 (D-PLAN-99-99-001 Fase 3 · PC2 Pablo 15-jun)
  // Consume RPCs panel.estatus_plan_99_99 + public.mesa_control_99_99_kpis
  // + public.v_pc_score_individual (widget H)
  // ============================================================
  async function loadMesaControl9999() {
    var setText = function(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    var setHTML = function(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; };
    try {
      var token = (typeof currentUser !== 'undefined' && currentUser && (currentUser.access_token || currentUser.token))
                  || (sb && sb.auth && sb.auth.getSession ? (await sb.auth.getSession()).data.session?.access_token : null);
      if (!token) { setHTML('mcFasesTbody', '<tr><td colspan="4" class="text-center text-amber-700 py-4">Sin sesión</td></tr>'); return; }
      var SUPA = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : (typeof SUPABASE_URL_LOCAL !== 'undefined' ? SUPABASE_URL_LOCAL : 'https://eknmtsrtfkzroxnovfqn.supabase.co');
      var apikey = (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : null;
      var headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
      if (apikey) headers.apikey = apikey;
      var [rEstatus, rKpis, rPcScore] = await Promise.all([
        fetch(SUPA + '/rest/v1/rpc/estatus_plan_99_99', { method: 'POST', headers: headers, body: '{}' }),
        fetch(SUPA + '/rest/v1/rpc/mesa_control_99_99_kpis', { method: 'POST', headers: headers, body: '{}' }),
        fetch(SUPA + '/rest/v1/v_pc_score_individual?select=*', { headers: headers })
      ]);
      var estatus = await rEstatus.json();
      var kpis = await rKpis.json();
      var pcScore = await rPcScore.json();
      if (!rEstatus.ok) { setHTML('mcFasesTbody', '<tr><td colspan="4" class="text-center text-red-600 py-4">Error</td></tr>'); return; }
      var k = (kpis && kpis.kpis) || {};
      setText('mcKpiVerif', (k.verificadas_30d_pct != null ? k.verificadas_30d_pct + '%' : '—'));
      setText('mcKpiSanciones', (k.sanciones_activas != null ? k.sanciones_activas : '—'));
      setText('mcKpiTareas', (k.tareas_criticas_pablo != null ? k.tareas_criticas_pablo : '—'));
      setText('mcKpiScore', (k.score_salud != null ? k.score_salud + '/100' : '—'));
      var sideBadge = document.getElementById('mesaControl9999Score');
      if (sideBadge && k.score_salud != null) {
        sideBadge.textContent = k.score_salud + '/100';
        sideBadge.classList.remove('hidden');
        sideBadge.className = 'ml-auto text-[10px] px-1.5 rounded font-medium ' +
          (k.score_salud >= 70 ? 'bg-emerald-200 text-emerald-800' : k.score_salud >= 40 ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800');
      }
      var fases = (kpis && kpis.fases) || [];
      var colorMap = { verde: 'bg-emerald-100 text-emerald-800', amarillo: 'bg-amber-100 text-amber-800', rojo: 'bg-red-100 text-red-800', gris: 'bg-stone-100 text-stone-700' };
      var rows = fases.map(function(f) {
        var badge = colorMap[f.color] || colorMap.gris;
        var det = (f.detalle || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
        var nom = (f.nombre || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return '<tr class="border-t border-stone-100"><td class="px-2 py-1.5 text-stone-500">' + f.n + '</td><td class="px-2 py-1.5 text-stone-800">' + nom + '</td><td class="px-2 py-1.5"><span class="text-[10px] px-1.5 py-0.5 rounded ' + badge + '">' + (f.estado || '—') + '</span></td><td class="px-2 py-1.5 text-stone-500">' + det + '</td></tr>';
      }).join('');
      setHTML('mcFasesTbody', rows || '<tr><td colspan="4" class="text-center text-stone-400 py-4">Sin fases</td></tr>');
      var o1 = estatus.onda_1 || {};
      var o2 = estatus.onda_2 || {};
      var br = estatus.d_nnn_brechas_14jun || {};
      setText('mcOnda1', o1.estado === 'completada' ? '✓ ' + (o1.piezas || 10) + ' piezas' : (o1.estado || '—'));
      setText('mcOnda1Det', 'commits: ' + ((o1.commits_main || []).join(', ')));
      setText('mcOnda2', (o2.done || 0) + '/' + (o2.total || 8) + ' · ' + (o2.progreso_pct || 0) + '%');
      setText('mcOnda2Det', 'pend: ' + (o2.pendiente || 0) + ' · claimed: ' + (o2.claimed || 0));
      setText('mcBrechas', (br.specs || []).length + ' SPECs v2 · ' + (br.pendientes || 0) + ' pend');
      setText('mcBrechasDet', (br.specs || []).slice(0, 2).join(' · '));
      setText('mcShadowTotal', (k.shadow_v12_total != null ? k.shadow_v12_total : '—'));
      setText('mcShadowVerdes', (k.shadow_v12_verdes != null ? k.shadow_v12_verdes + ' (' + (k.shadow_v12_pct_sentenciadas || 0) + '%)' : '—'));
      setText('mcShadowFalsas', (k.shadow_v12_falsas != null ? k.shadow_v12_falsas : '—'));
      setText('mcFirmasPend', (k.firmas_pendientes_panel_alt3 != null ? k.firmas_pendientes_panel_alt3 : '—'));
      // Trend SHADOW v12 sparkline (consume RPC public.shadow_v12_trend)
      try {
        var rTrend = await fetch(SUPA + '/rest/v1/rpc/shadow_v12_trend', { method: 'POST', headers: headers, body: JSON.stringify({ p_horas: 24 }) });
        var trend = await rTrend.json();
        if (Array.isArray(trend) && trend.length >= 2) {
          var svg = document.getElementById('mcTrendSparkline');
          if (svg) {
            var W = 600, H = 80, P = 4;
            var pcts = trend.map(function(p) { return parseFloat(p.pct) || 0; });
            var minP = Math.min.apply(null, pcts), maxP = Math.max.apply(null, pcts);
            var rangeP = Math.max(maxP - minP, 1);
            var step = (W - 2*P) / Math.max(trend.length - 1, 1);
            var pts = trend.map(function(p, i) {
              var x = P + i * step;
              var y = P + (H - 2*P) * (1 - (parseFloat(p.pct) - minP) / rangeP);
              return x + ',' + y;
            }).join(' ');
            var dotsHtml = trend.map(function(p, i) {
              var x = P + i * step;
              var y = P + (H - 2*P) * (1 - (parseFloat(p.pct) - minP) / rangeP);
              var color = parseFloat(p.pct) === maxP ? '#059669' : parseFloat(p.pct) === minP ? '#dc2626' : '#78716c';
              return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + color + '"><title>' + (p.version || '') + ': ' + p.pct + '% (' + p.verdes + ' verdes / ' + p.rojas + ' falsas)</title></circle>';
            }).join('');
            var metaY = P + (H - 2*P) * (1 - (70 - minP) / rangeP);
            var metaLine = (70 >= minP && 70 <= maxP) ? '<line x1="' + P + '" y1="' + metaY + '" x2="' + (W - P) + '" y2="' + metaY + '" stroke="#d97706" stroke-dasharray="3,3" stroke-width="0.5"><title>Meta SPEC 70%</title></line>' : '';
            svg.innerHTML = metaLine
              + '<polyline points="' + pts + '" fill="none" stroke="#059669" stroke-width="1.5"></polyline>'
              + dotsHtml;
            setText('mcTrendInfo', trend.length + ' puntos · ' + minP.toFixed(1) + '% → ' + maxP.toFixed(1) + '%');
          }
        } else {
          setText('mcTrendInfo', 'esperando 2+ snapshots');
        }
      } catch (errT) { /* silent */ }
      // Widget H · Score por PC
      var pcRows = (Array.isArray(pcScore) ? pcScore : []).map(function(pc) {
        var pctFalso = parseFloat(pc.shadow_pct_falso_real) || 0;
        var color = pctFalso >= 5 ? 'text-red-700' : pctFalso >= 2 ? 'text-amber-700' : 'text-stone-700';
        var sancion = pc.sancion_activa ? '<span class="text-[10px] bg-red-200 text-red-800 px-1.5 rounded">sí</span>' : '<span class="text-stone-400">—</span>';
        return '<tr class="border-t border-stone-100"><td class="px-2 py-1.5 font-medium text-stone-800">' + (pc.pc_nombre || '—').replace(/</g, '&lt;') + '</td><td class="px-2 py-1.5 text-stone-600">' + (pc.total_afirmaciones || 0) + '</td><td class="px-2 py-1.5 text-emerald-700">' + (pc.shadow_verdes || 0) + '</td><td class="px-2 py-1.5 text-red-700">' + (pc.shadow_falsas || 0) + '</td><td class="px-2 py-1.5 ' + color + '">' + pctFalso + '%</td><td class="px-2 py-1.5 text-stone-600">' + (pc.shadow_cobertura_pct || 0) + '%</td><td class="px-2 py-1.5">' + sancion + '</td></tr>';
      }).join('');
      setHTML('mcPcScoreTbody', pcRows || '<tr><td colspan="7" class="text-center text-stone-400 py-3">Sin datos</td></tr>');
      setText('mcReglasHoy', (estatus.reglas_grabadas_hoy || []).join(', ') || '—');
      setText('mcCanary', estatus.canary_pieza_10 || '—');
      setText('mcAlt3', estatus.alt3_panel_firma || '—');
      setText('mcBranchProt', estatus.branch_protection_reciclean_sistema || '—');
      setText('mcSnapshot', 'Snapshot: ' + (estatus.ts ? new Date(estatus.ts).toLocaleString('es-CL') : '—'));
      // Widget Canarios · consume panel.v_canary_estado (PC2 15-jun · HTML L274+L432#6)
      try {
        var rCan = await fetch(SUPA + '/rest/v1/v_canary_estado?select=*&limit=20', { headers: headers });
        var canarios = await rCan.json();
        if (Array.isArray(canarios) && canarios.length) {
          var canRows = canarios.map(function(c) {
            var stage = c.stage || 0;
            var stageBadge = stage === 0 ? 'bg-stone-200 text-stone-700' : stage === 100 ? 'bg-emerald-200 text-emerald-800' : stage >= 10 ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700';
            var errBase = parseFloat((c.baseline_metricas || {}).error_rate) || 0;
            var errCur = parseFloat((c.current_metricas || {}).error_rate) || 0;
            var errRatio = errBase > 0 ? (errCur / errBase).toFixed(2) : '—';
            var latBase = parseFloat((c.baseline_metricas || {}).latencia_p95_ms) || 0;
            var latCur = parseFloat((c.current_metricas || {}).latencia_p95_ms) || 0;
            var latRatio = latBase > 0 ? (latCur / latBase).toFixed(2) : '—';
            var ratioColor = (parseFloat(errRatio) >= 2 || parseFloat(latRatio) >= 1.5) ? 'text-red-700' : 'text-stone-600';
            var ud = c.ultima_decision || {};
            var udText = ud.motivo ? (ud.motivo + ' · ' + (ud.decidido_por || '')) : '—';
            var slugEsc = (c.slug || '').replace(/</g, '&lt;');
            return '<tr class="border-t border-stone-100"><td class="px-2 py-1.5 font-medium text-stone-800">' + slugEsc
                 + (c.activo ? '' : ' <span class="text-[10px] text-stone-400">(inactivo)</span>') + '</td>'
                 + '<td class="px-2 py-1.5"><span class="text-[10px] px-1.5 py-0.5 rounded ' + stageBadge + '">' + stage + '%</span></td>'
                 + '<td class="px-2 py-1.5 text-[10px] ' + ratioColor + '">' + errRatio + ' · ' + latRatio + '</td>'
                 + '<td class="px-2 py-1.5 text-stone-500 text-[11px]">' + udText.replace(/</g, '&lt;') + '</td>'
                 + '<td class="px-2 py-1.5 text-stone-500">' + (c.decisiones_total || 0) + '</td></tr>';
          }).join('');
          setHTML('mcCanariosTbody', canRows);
        } else {
          setHTML('mcCanariosTbody', '<tr><td colspan="5" class="text-center text-stone-400 py-3">Sin canarios activos · primer flag desde panel.canary_promover(slug)</td></tr>');
        }
      } catch (errC) {
        setHTML('mcCanariosTbody', '<tr><td colspan="5" class="text-center text-red-600 py-3">Error vista: ' + (errC?.message || errC) + '</td></tr>');
      }
      var sync = document.getElementById('mesaControl9999Sync');
      if (sync) sync.textContent = 'Sync: ' + new Date().toLocaleTimeString('es-CL');
      // Calibrador de Margen — datos reales curated.v_margen_vs_costos
      try { await loadCalibradorMargen(token, SUPA, apikey); } catch(eC) { console.warn('calibrador', eC); }
    } catch (e) {
      setHTML('mcFasesTbody', '<tr><td colspan="4" class="text-center text-red-600 py-4">Error: ' + (e?.message || e) + '</td></tr>');
    }
  }
  function setupMesaControl9999AutoRefresh() {
    var btn = document.getElementById('mesaControl9999Refresh');
    if (btn) btn.addEventListener('click', loadMesaControl9999);
    // Mesa V3 refresh button
    var v3Btn = document.getElementById('v3Refresh');
    if (v3Btn) v3Btn.addEventListener('click', loadMesaV3Pulso);
    document.querySelectorAll('[data-mc-drill]').forEach(function(card) {
      card.addEventListener('click', function() {
        var dest = card.getAttribute('data-mc-drill');
        var btnDest = document.querySelector('button[data-tab="' + dest + '"]') || document.querySelector('a[data-v4-tab="' + dest + '"]');
        if (btnDest) btnDest.click();
      });
    });

    // Relocado desde el init() compartido de Firmas/Tarifas (antifragilidad
    // panel, bloque 11 PR 1): registro de que el cambio de tab dispara la
    // primera carga. Antes vivia como bind('mesa_control_99_99', ...) x2
    // en ese init() -- se preserva el mismo comportamiento aqui, self-registrado.
    document.querySelector('button[data-tab="mesa_control_99_99"]')?.addEventListener('click', function () { setTimeout(loadMesaControl9999, 100); });
    document.querySelector('a[data-v4-tab="mesa_control_99_99"]')?.addEventListener('click', function () { setTimeout(loadMesaControl9999, 100); });
    document.querySelector('button[data-tab="mesa_control_99_99"]')?.addEventListener('click', function () { setTimeout(loadMesaV3Pulso, 100); });
    document.querySelector('a[data-v4-tab="mesa_control_99_99"]')?.addEventListener('click', function () { setTimeout(loadMesaV3Pulso, 100); });
    setInterval(function() {
      var sec = document.getElementById('tabMesaControl9999');
      if (sec && !sec.classList.contains('hidden')) { loadMesaControl9999(); loadMesaV3Pulso(); }
    }, 60000);
    // Mesa V3 auto-refresh cada 5 min independiente
    setInterval(function() {
      var sec = document.getElementById('tabMesaControl9999');
      if (sec && !sec.classList.contains('hidden')) loadMesaV3Pulso();
    }, 300000);
    // Fase 4 · gate admin via PERMS.es_admin (canónico)
    if (window.PERMS?.es_admin) {
      setTimeout(loadMesaControl9999, 2000);
      setTimeout(loadMesaV3Pulso, 1500); // V3 carga un poco antes (no requiere auth)
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMesaControl9999AutoRefresh);
  } else {
    setupMesaControl9999AutoRefresh();
  }

})();
