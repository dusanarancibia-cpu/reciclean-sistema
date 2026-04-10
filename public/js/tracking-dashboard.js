/**
 * Dashboard de Monitoreo — Tab I del Admin Panel
 * Lee eventos_asistente de Supabase y renderiza KPIs, tabla, embudo, timeline
 */
var _trkPeriodo = 'hoy';
var _trkData = [];
var _trkNombres = {};
var _trkRealtimeSub = null;

function setTrkPeriodo(p, btn) {
  _trkPeriodo = p;
  document.querySelectorAll('#trk-periodo-grp .btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderTracking();
}

function _trkFechaInicio() {
  var now = new Date();
  if (_trkPeriodo === 'hoy') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (_trkPeriodo === '7d') { var d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
  var d2 = new Date(now); d2.setDate(d2.getDate() - 30); return d2.toISOString();
}

async function renderTracking() {
  if (typeof _supabase === 'undefined' || !_supabase) return;
  var sucFilter = document.getElementById('trk-suc-filter') ? document.getElementById('trk-suc-filter').value : '';

  try {
    var query = _supabase.from('eventos_asistente')
      .select('*')
      .gte('client_ts', _trkFechaInicio())
      .order('client_ts', { ascending: false })
      .limit(5000);
    if (sucFilter) query = query.eq('sucursal', sucFilter);
    var result = await query;
    if (result.error) throw result.error;
    _trkData = result.data || [];
  } catch(e) {
    console.warn('Error cargando eventos:', e);
    _trkData = [];
  }

  _renderKPIs();
  _renderTablaUsuarios();
  _renderFunnel();
  _renderTimeline();

  if (!_trkRealtimeSub) {
    try {
      _trkRealtimeSub = _supabase.channel('tracking-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos_asistente' }, function(payload) {
          _trkData.unshift(payload.new);
          _renderKPIs(); _renderTablaUsuarios(); _renderFunnel(); _prependTimeline(payload.new);
        })
        .subscribe();
    } catch(e) { console.warn('Realtime tracking:', e); }
  }
}

// ── Nombres de usuario (cache) ──
async function _trkGetNombre(uid) {
  if (_trkNombres[uid]) return _trkNombres[uid];
  try {
    var r = await _supabase.from('usuarios_autorizados').select('nombre').eq('id', uid).single();
    _trkNombres[uid] = r.data ? r.data.nombre : ('Usuario ' + uid);
  } catch(e) { _trkNombres[uid] = 'Usuario ' + uid; }
  return _trkNombres[uid];
}

// ── KPIs ──
function _renderKPIs() {
  var sesiones = {};
  _trkData.forEach(function(e) {
    if (!sesiones[e.session_id]) sesiones[e.session_id] = new Set();
    sesiones[e.session_id].add(e.evento);
  });
  var total = Object.keys(sesiones).length;
  var completo = 0, soloPrecios = 0, pdfs = 0;
  Object.values(sesiones).forEach(function(evs) {
    if (evs.has('compartir_whatsapp') || evs.has('generar_pdf')) completo++;
    else if (!evs.has('ingresar_kg') && !evs.has('completar_datos_negocio')) soloPrecios++;
  });
  pdfs = _trkData.filter(function(e) { return e.evento === 'generar_pdf'; }).length;

  document.getElementById('trk-kpi-sesiones').textContent = total;
  document.getElementById('trk-kpi-completo').textContent = total > 0 ? Math.round(completo / total * 100) + '%' : '—';
  document.getElementById('trk-kpi-solo-precios').textContent = total > 0 ? Math.round(soloPrecios / total * 100) + '%' : '—';
  document.getElementById('trk-kpi-pdfs').textContent = pdfs;
}

// ── Tabla de usuarios ──
async function _renderTablaUsuarios() {
  var tbody = document.getElementById('trk-tabla-body');
  var porUsuario = {};
  _trkData.forEach(function(e) {
    if (!porUsuario[e.usuario_id]) porUsuario[e.usuario_id] = { eventos: new Set(), sesiones: new Set(), busquedas: 0, materiales: 0, pdfs: 0, compartidos: 0, ultimaTs: e.client_ts };
    var u = porUsuario[e.usuario_id];
    u.eventos.add(e.evento); u.sesiones.add(e.session_id);
    if (e.evento === 'buscar_material') u.busquedas++;
    if (e.evento === 'ingresar_kg') u.materiales++;
    if (e.evento === 'generar_pdf') u.pdfs++;
    if (e.evento === 'compartir_whatsapp') u.compartidos++;
    if (e.client_ts > u.ultimaTs) u.ultimaTs = e.client_ts;
  });

  if (Object.keys(porUsuario).length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px;">Sin datos en este período</td></tr>';
    return;
  }

  var uids = Object.keys(porUsuario);
  for (var i = 0; i < uids.length; i++) await _trkGetNombre(parseInt(uids[i]));

  var html = '';
  var sorted = Object.entries(porUsuario).sort(function(a, b) { return b[1].ultimaTs.localeCompare(a[1].ultimaTs); });

  sorted.forEach(function(pair) {
    var uid = pair[0], u = pair[1];
    var nombre = _trkNombres[parseInt(uid)] || uid;
    var hace = _tiempoRelativo(u.ultimaTs);
    var etapa, color, label;
    if (u.compartidos > 0 || u.pdfs > 0) { color = '#2E7D32'; label = 'Completo'; }
    else if (u.eventos.has('cerrar_consulta') || u.eventos.has('ver_preview')) { color = '#F57F17'; label = 'Parcial'; }
    else if (u.eventos.has('ingresar_kg') || u.eventos.has('completar_datos_negocio')) { color = '#E65100'; label = 'Cotizando'; }
    else { color = '#C62828'; label = 'Solo precios'; }

    html += '<tr>' +
      '<td style="text-align:left;font-weight:700;">' + nombre + '</td>' +
      '<td style="text-align:center;font-size:11px;color:var(--text3);">' + hace + '</td>' +
      '<td style="text-align:center;font-weight:700;">' + u.sesiones.size + '</td>' +
      '<td style="text-align:center;"><span style="background:' + color + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">' + label + '</span></td>' +
      '<td style="text-align:center;">' + u.busquedas + '</td>' +
      '<td style="text-align:center;">' + u.materiales + '</td>' +
      '<td style="text-align:center;font-weight:700;">' + u.pdfs + '</td>' +
      '<td style="text-align:center;font-weight:700;">' + u.compartidos + '</td>' +
      '<td style="text-align:center;"><button onclick="generarInformePDF(' + uid + ')" style="background:#1565C0;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;">PDF</button></td>' +
      '</tr>';
  });
  tbody.innerHTML = html;
}

// ── Embudo ──
function _renderFunnel() {
  var el = document.getElementById('trk-funnel');
  var sessionMap = {};
  _trkData.forEach(function(e) {
    if (!sessionMap[e.session_id]) sessionMap[e.session_id] = new Set();
    sessionMap[e.session_id].add(e.evento);
  });
  var total = Object.keys(sessionMap).length;
  if (total === 0) { el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:24px;">Sin datos</div>'; return; }

  var etapas = [
    { keys: ['login'], label: 'Login', icon: '' },
    { keys: ['seleccionar_sucursal'], label: 'Sucursal', icon: '' },
    { keys: ['completar_datos_negocio'], label: 'Datos negocio', icon: '' },
    { keys: ['ingresar_kg'], label: 'Materiales (kg)', icon: '' },
    { keys: ['cerrar_consulta'], label: 'Cerrar consulta', icon: '' },
    { keys: ['ver_preview'], label: 'Preview', icon: '' },
    { keys: ['compartir_whatsapp', 'generar_pdf'], label: 'Compartir', icon: '' }
  ];

  var html = '';
  etapas.forEach(function(et) {
    var count = Object.values(sessionMap).filter(function(evs) { return et.keys.some(function(k) { return evs.has(k); }); }).length;
    var pct = Math.round(count / total * 100);
    var barColor = pct >= 60 ? '#2E7D32' : pct >= 30 ? '#F57F17' : '#C62828';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;font-size:12px;">' +
      '<div style="width:120px;flex-shrink:0;font-weight:600;">' + et.label + '</div>' +
      '<div style="flex:1;background:var(--bg3);border-radius:4px;height:22px;overflow:hidden;position:relative;">' +
      '<div style="width:' + pct + '%;background:' + barColor + ';height:100%;border-radius:4px;transition:width .3s;"></div>' +
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">' + pct + '% (' + count + ')</div>' +
      '</div></div>';
  });
  el.innerHTML = html;
}

// ── Timeline ──
var _trkIconos = {
  login: '🔑', seleccionar_sucursal: '📍', abrir_datos_negocio: '📋',
  completar_datos_negocio: '✅', buscar_material: '🔍', filtrar_categoria: '🏷',
  ver_tabla_precios: '📊', ingresar_kg: '📦', ingresar_precio: '💰',
  cerrar_consulta: '📝', ver_preview: '👁', generar_pdf: '📄',
  compartir_whatsapp: '📱', logout: '🚪'
};
var _trkLabels = {
  login: 'Inicio sesion', seleccionar_sucursal: 'Selecciono sucursal',
  abrir_datos_negocio: 'Abrio datos negocio', completar_datos_negocio: 'Completo datos',
  buscar_material: 'Busco material', filtrar_categoria: 'Filtro categoria',
  ver_tabla_precios: 'Vio tabla precios', ingresar_kg: 'Ingreso kg',
  ingresar_precio: 'Ingreso precio', cerrar_consulta: 'Cerro consulta',
  ver_preview: 'Vio resumen', generar_pdf: 'Genero PDF',
  compartir_whatsapp: 'Compartio WhatsApp', logout: 'Cerro sesion'
};

async function _renderTimeline() {
  var el = document.getElementById('trk-timeline');
  var recientes = _trkData.slice(0, 50);
  if (recientes.length === 0) { el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:24px;">Sin actividad reciente</div>'; return; }

  var uids = []; recientes.forEach(function(e) { if (uids.indexOf(e.usuario_id) === -1) uids.push(e.usuario_id); });
  for (var i = 0; i < uids.length; i++) await _trkGetNombre(uids[i]);

  var html = '';
  recientes.forEach(function(e) {
    var d = new Date(e.client_ts);
    var hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    var fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    var nombre = _trkNombres[e.usuario_id] || e.usuario_id;
    var icono = _trkIconos[e.evento] || '•';
    var label = _trkLabels[e.evento] || e.evento;
    var meta = e.metadata || {};
    var detalle = '';
    if (meta.query) detalle = '"' + meta.query + '"';
    if (meta.material) detalle = meta.material + (meta.kg ? ' · ' + meta.kg + ' kg' : '');
    if (meta.sucursal) detalle = meta.sucursal;
    if (meta.proveedor) detalle = meta.proveedor;

    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;">' +
      '<div style="color:var(--text3);font-size:10px;width:65px;flex-shrink:0;text-align:center;">' + fecha + '<br>' + hora + '</div>' +
      '<div style="font-weight:700;width:90px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + nombre + '</div>' +
      '<div style="flex:1;">' + icono + ' ' + label + (detalle ? ' <span style="color:var(--text3);font-size:11px;">· ' + detalle + '</span>' : '') + '</div>' +
      '<div style="font-size:10px;color:var(--text3);flex-shrink:0;">' + (e.sucursal || '') + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function _prependTimeline(ev) {
  var el = document.getElementById('trk-timeline');
  if (!el) return;
  var d = new Date(ev.client_ts);
  var hora = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  var fecha = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
  var nombre = _trkNombres[ev.usuario_id] || ev.usuario_id;
  var icono = _trkIconos[ev.evento] || '•';
  var label = _trkLabels[ev.evento] || ev.evento;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px;';
  div.innerHTML = '<div style="color:var(--text3);font-size:10px;width:65px;flex-shrink:0;text-align:center;">' + fecha + '<br>' + hora + '</div>' +
    '<div style="font-weight:700;width:90px;flex-shrink:0;">' + nombre + '</div>' +
    '<div style="flex:1;">' + icono + ' ' + label + '</div>' +
    '<div style="font-size:10px;color:var(--text3);flex-shrink:0;">' + (ev.sucursal || '') + '</div>';
  el.prepend(div);
}

// ═══════════════════════════════════════════════════════════
// INFORME PDF POR TRABAJADOR
// ═══════════════════════════════════════════════════════════
async function generarInformePDF(uid) {
  var nombre = _trkNombres[uid] || await _trkGetNombre(uid);
  var eventos = _trkData.filter(function(e) { return e.usuario_id === uid; });
  if (eventos.length === 0) { alert('Sin datos para este trabajador'); return; }

  // Agrupar por sesion
  var sesiones = {};
  var stats = { busquedas: 0, materiales: 0, pdfs: 0, compartidos: 0, tablaPrecios: 0 };
  eventos.forEach(function(e) {
    if (!sesiones[e.session_id]) sesiones[e.session_id] = { eventos: [], eventoSet: new Set(), inicio: e.client_ts, sucursal: e.sucursal || '' };
    sesiones[e.session_id].eventos.push(e);
    sesiones[e.session_id].eventoSet.add(e.evento);
    if (e.client_ts < sesiones[e.session_id].inicio) sesiones[e.session_id].inicio = e.client_ts;
    if (e.sucursal) sesiones[e.session_id].sucursal = e.sucursal;
    if (e.evento === 'buscar_material') stats.busquedas++;
    if (e.evento === 'ingresar_kg') stats.materiales++;
    if (e.evento === 'generar_pdf') stats.pdfs++;
    if (e.evento === 'compartir_whatsapp') stats.compartidos++;
    if (e.evento === 'ver_tabla_precios') stats.tablaPrecios++;
  });

  var totalSesiones = Object.keys(sesiones).length;
  var sesCompletas = 0, sesSoloPrecios = 0;
  Object.values(sesiones).forEach(function(s) {
    if (s.eventoSet.has('compartir_whatsapp') || s.eventoSet.has('generar_pdf')) sesCompletas++;
    else if (!s.eventoSet.has('ingresar_kg') && !s.eventoSet.has('completar_datos_negocio')) sesSoloPrecios++;
  });

  // Etapa maxima global
  var etapaLabel, etapaColor;
  if (stats.compartidos > 0 || stats.pdfs > 0) { etapaLabel = 'COMPLETO'; etapaColor = [46,125,50]; }
  else if (eventos.some(function(e){ return e.evento==='cerrar_consulta'||e.evento==='ver_preview'; })) { etapaLabel = 'PARCIAL'; etapaColor = [245,127,23]; }
  else if (eventos.some(function(e){ return e.evento==='ingresar_kg'||e.evento==='completar_datos_negocio'; })) { etapaLabel = 'COTIZANDO'; etapaColor = [230,81,0]; }
  else { etapaLabel = 'SOLO MIRA PRECIOS'; etapaColor = [198,40,40]; }

  // Periodo
  var periodoMap = { 'hoy': 'Hoy', '7d': 'Ultimos 7 dias', '30d': 'Ultimos 30 dias' };
  var periodoTxt = periodoMap[_trkPeriodo] || _trkPeriodo;
  var hoy = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Generar PDF ──
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF('p', 'mm', 'a4');
  var W = 210, mg = 15, y = 0;

  // ── HEADER ──
  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('INFORME DE USO — ASISTENTE COMERCIAL', mg, 13);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(79, 195, 247);
  doc.text('Grupo Reciclean · Farex', mg, 20);
  doc.setTextColor(180, 180, 180);
  doc.text('Generado: ' + hoy, mg, 26);
  doc.text('Periodo: ' + periodoTxt, W - mg, 26, { align: 'right' });
  y = 38;

  // ── DATOS DEL TRABAJADOR ──
  doc.setFillColor(240, 242, 245);
  doc.rect(mg, y, W - 2 * mg, 22, 'F');
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 35, 50);
  doc.text(nombre, mg + 6, y + 9);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(totalSesiones + ' sesiones en el periodo', mg + 6, y + 16);
  // Etapa badge
  doc.setFillColor(etapaColor[0], etapaColor[1], etapaColor[2]);
  doc.roundedRect(W - mg - 45, y + 4, 40, 10, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(etapaLabel, W - mg - 25, y + 10.5, { align: 'center' });
  y += 30;

  // ── RESUMEN NUMERICO ──
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 35, 50);
  doc.text('Resumen', mg, y); y += 6;

  var resumenData = [
    ['Sesiones totales', '' + totalSesiones],
    ['Flujo completo', '' + sesCompletas + ' (' + (totalSesiones > 0 ? Math.round(sesCompletas / totalSesiones * 100) : 0) + '%)'],
    ['Solo mira precios', '' + sesSoloPrecios + ' (' + (totalSesiones > 0 ? Math.round(sesSoloPrecios / totalSesiones * 100) : 0) + '%)'],
    ['Busquedas de material', '' + stats.busquedas],
    ['Materiales con kg', '' + stats.materiales],
    ['Veces tabla de precios', '' + stats.tablaPrecios],
    ['PDFs generados', '' + stats.pdfs],
    ['Compartidos WhatsApp', '' + stats.compartidos]
  ];

  resumenData.forEach(function(row, i) {
    var bg = i % 2 === 0 ? [248, 249, 250] : [255, 255, 255];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(mg, y, W - 2 * mg, 6, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    doc.text(row[0], mg + 4, y + 4.2);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 35, 50);
    doc.text(row[1], W - mg - 4, y + 4.2, { align: 'right' });
    y += 6;
  });
  y += 8;

  // ── DETALLE POR SESION ──
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 35, 50);
  doc.text('Detalle por Sesion', mg, y); y += 6;

  var sesOrdenadas = Object.entries(sesiones).sort(function(a, b) { return b[1].inicio.localeCompare(a[1].inicio); });

  sesOrdenadas.forEach(function(pair, idx) {
    var sesId = pair[0], ses = pair[1];
    if (y > 270) { doc.addPage(); y = mg; }

    // Titulo sesion
    var fechaSes = new Date(ses.inicio);
    var fechaTxt = fechaSes.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    var horaTxt = fechaSes.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    // Etapa de la sesion
    var sesEtapa, sesColor;
    if (ses.eventoSet.has('compartir_whatsapp') || ses.eventoSet.has('generar_pdf')) { sesEtapa = 'Completo'; sesColor = [46,125,50]; }
    else if (ses.eventoSet.has('cerrar_consulta') || ses.eventoSet.has('ver_preview')) { sesEtapa = 'Parcial'; sesColor = [245,127,23]; }
    else if (ses.eventoSet.has('ingresar_kg') || ses.eventoSet.has('completar_datos_negocio')) { sesEtapa = 'Cotizando'; sesColor = [230,81,0]; }
    else { sesEtapa = 'Solo precios'; sesColor = [198,40,40]; }

    doc.setFillColor(31, 56, 100);
    doc.rect(mg, y, W - 2 * mg, 7, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('Sesion ' + (idx + 1) + ' — ' + fechaTxt + ' ' + horaTxt + (ses.sucursal ? ' — ' + ses.sucursal : ''), mg + 3, y + 5);
    // Etapa badge
    doc.setFillColor(sesColor[0], sesColor[1], sesColor[2]);
    doc.roundedRect(W - mg - 28, y + 1, 25, 5, 1, 1, 'F');
    doc.setFontSize(6); doc.setTextColor(255, 255, 255);
    doc.text(sesEtapa, W - mg - 15.5, y + 4.5, { align: 'center' });
    y += 9;

    // Eventos de la sesion (ordenados cronologicamente)
    var evOrdenados = ses.eventos.sort(function(a, b) { return a.client_ts.localeCompare(b.client_ts); });
    evOrdenados.forEach(function(ev, j) {
      if (y > 280) { doc.addPage(); y = mg; }
      var bg = j % 2 === 0 ? [248, 249, 250] : [255, 255, 255];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(mg, y, W - 2 * mg, 5, 'F');

      var evHora = new Date(ev.client_ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var evLabel = _trkLabels[ev.evento] || ev.evento;
      var meta = ev.metadata || {};
      var detalle = '';
      if (meta.query) detalle = '"' + meta.query + '"';
      if (meta.material) detalle = meta.material + (meta.kg ? ' — ' + meta.kg + ' kg' : '') + (meta.precio ? ' — $' + meta.precio : '');
      if (meta.sucursal) detalle = meta.sucursal;
      if (meta.ejec) detalle = meta.ejec + ' / ' + (meta.prov || '');

      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
      doc.text(evHora, mg + 3, y + 3.5);
      doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'bold');
      doc.text(evLabel, mg + 22, y + 3.5);
      if (detalle) {
        doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
        doc.text(detalle.substring(0, 60), mg + 65, y + 3.5);
      }
      y += 5;
    });
    y += 4;
  });

  // ── PIE DE PAGINA ──
  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 180);
    doc.text('Reciclean-Farex · Informe de Monitoreo · Pagina ' + p + '/' + totalPages, W / 2, 290, { align: 'center' });
  }

  var fname = 'Informe_' + nombre.replace(/\s/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(fname);
}

function _tiempoRelativo(ts) {
  var diff = Date.now() - new Date(ts).getTime();
  var min = Math.floor(diff / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return 'Hace ' + min + ' min';
  var hrs = Math.floor(min / 60);
  if (hrs < 24) return 'Hace ' + hrs + 'h';
  return 'Hace ' + Math.floor(hrs / 24) + 'd';
}
