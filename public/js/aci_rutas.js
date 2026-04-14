// ══════════════════════════════════════════════════════════════
// ACI — MODULO RUTAS
// Planificar (Ingrid) + Recibir/Ejecutar (Cristian)
// Asistente Comercial Integrado · Fase 3
// ══════════════════════════════════════════════════════════════

let _rutaActiva = null; // ruta asignada en ejecucion
let _rutaProveedores = []; // proveedores de la ruta activa (ordenados)

// ══════════════════════════════════════════════════
// PLANIFICAR (Ingrid / admin / editor)
// ══════════════════════════════════════════════════

async function aciLoadPlanificar() {
  const content = document.getElementById('planificar-content');
  if (!content) return;
  content.innerHTML = '<div class="cotiz-empty">Cargando proveedores...</div>';

  if (typeof aciGetProveedores !== 'function') {
    content.innerHTML = '<div class="cotiz-empty">Modulo proveedores no disponible</div>';
    return;
  }

  const provs = aciGetProveedores();
  if (!provs.length) {
    content.innerHTML = '<div class="cotiz-empty">Sin proveedores</div>';
    return;
  }

  // Render filtros + lista + mapa
  content.innerHTML = renderPlanificarUI(provs);
  aciAplicarFiltrosPlan();
}

function renderPlanificarUI(provs) {
  const zonas = typeof aciGetZonas === 'function' ? aciGetZonas() : [];
  return '<div style="margin-bottom:12px">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'
    + '<select id="plan-zona" class="neg-input" onchange="aciAplicarFiltrosPlan()" style="background:#1A2D3E;color:#fff;border-color:#2C3E50"><option value="">Todas las zonas</option>' + zonas.map(z => '<option>' + z + '</option>').join('') + '</select>'
    + '<select id="plan-prioridad" class="neg-input" onchange="aciAplicarFiltrosPlan()" style="background:#1A2D3E;color:#fff;border-color:#2C3E50"><option value="">Todas prioridades</option><option>MÁX</option><option>ALTA</option><option>MEDIA</option><option>BAJA</option></select>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'
    + '<select id="plan-segmento" class="neg-input" onchange="aciAplicarFiltrosPlan()" style="background:#1A2D3E;color:#fff;border-color:#2C3E50"><option value="">Todos segmentos</option><option>sorepa</option><option>prospecto</option><option>retazo</option></select>'
    + '<select id="plan-estado" class="neg-input" onchange="aciAplicarFiltrosPlan()" style="background:#1A2D3E;color:#fff;border-color:#2C3E50"><option value="">Todos estados</option><option>prospecto</option><option>contactado</option><option>cotizado</option><option>activo</option><option>inactivo</option></select>'
    + '</div>'
    + '<label style="display:flex;align-items:center;gap:6px;color:#CBD5E0;font-size:11px;font-weight:600;margin-bottom:8px">'
    + '<input type="checkbox" id="plan-sin30d" onchange="aciAplicarFiltrosPlan()"> Sin compra 30+ dias'
    + '</label>'
    + '</div>'
    + '<div id="plan-map-container" style="background:#1A2B3A;border-radius:12px;height:200px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;overflow:hidden">'
    + '<div id="plan-map" style="width:100%;height:100%"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    + '<div style="font-size:12px;font-weight:700;color:#1A2332" id="plan-count">0 proveedores</div>'
    + '<div style="display:flex;gap:6px">'
    + '<button class="seg-btn wa" style="font-size:10px;padding:6px 10px" onclick="aciSeleccionarTodos()">Seleccionar todos</button>'
    + '<button class="seg-btn email" style="font-size:10px;padding:6px 10px" onclick="aciDeseleccionarTodos()">Ninguno</button>'
    + '</div></div>'
    + '<div id="plan-list"></div>'
    + '<div style="margin-top:12px">'
    + '<select id="plan-ejecutivo" class="neg-input" style="width:100%;background:#1A2D3E;color:#fff;border-color:#2C3E50;margin-bottom:8px"><option value="">Asignar a ejecutivo...</option></select>'
    + '<button class="close-btn" style="background:linear-gradient(135deg,#1B5E20,#2E7D32)" onclick="aciAsignarRuta()">Asignar ruta seleccionada</button>'
    + '</div>';
}

let _planSeleccionados = new Set();

function aciAplicarFiltrosPlan() {
  const filtros = {
    zona: document.getElementById('plan-zona')?.value || '',
    prioridad: document.getElementById('plan-prioridad')?.value || '',
    segmento: document.getElementById('plan-segmento')?.value || '',
    estado: document.getElementById('plan-estado')?.value || '',
    sinCompra30d: document.getElementById('plan-sin30d')?.checked || false
  };

  const provs = aciGetProveedores({
    zona: filtros.zona || undefined,
    prioridad: filtros.prioridad || undefined,
    segmento: filtros.segmento || undefined,
    estado: filtros.estado || undefined,
    sinCompra30d: filtros.sinCompra30d
  });

  document.getElementById('plan-count').textContent = provs.length + ' proveedores';
  renderPlanList(provs);
  renderPlanMap(provs);
  loadEjecutivosSelect();
}

function renderPlanList(provs) {
  const list = document.getElementById('plan-list');
  if (!provs.length) { list.innerHTML = '<div class="seg-empty">Sin resultados con estos filtros</div>'; return; }

  const priColors = { 'MÁX': '#1a6b3c', 'ALTA': '#2471a3', 'MEDIA': '#d35400', 'BAJA': '#c0392b' };

  list.innerHTML = provs.map(p => {
    const checked = _planSeleccionados.has(p.id) ? 'checked' : '';
    return '<div style="background:#fff;border-radius:8px;padding:8px 10px;margin-bottom:4px;display:flex;align-items:center;gap:8px;border-left:3px solid ' + (priColors[p.prioridad] || '#ccc') + '">'
      + '<input type="checkbox" ' + checked + ' onchange="aciTogglePlanProv(' + p.id + ', this.checked)" style="width:18px;height:18px;flex-shrink:0">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:12px;font-weight:700;color:#1A2332;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.nombre + '</div>'
      + '<div style="font-size:9px;color:#888">' + (p.zona || '') + ' · ' + (p.estado_comercial || '') + ' · ' + (p.materiales || '').substring(0, 40) + '</div>'
      + '</div>'
      + '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;color:#fff;background:' + (priColors[p.prioridad] || '#999') + ';flex-shrink:0">' + (p.prioridad || '') + '</span>'
      + '</div>';
  }).join('');
}

function renderPlanMap(provs) {
  const mapDiv = document.getElementById('plan-map');
  if (!mapDiv) return;

  const conGPS = provs.filter(p => p.lat && p.lng);
  if (!conGPS.length) {
    mapDiv.innerHTML = '<div style="color:#6B8FA8;font-size:11px;text-align:center;padding:20px">Sin coordenadas GPS para mostrar mapa</div>';
    return;
  }

  // Calcular centro
  const avgLat = conGPS.reduce((s, p) => s + p.lat, 0) / conGPS.length;
  const avgLng = conGPS.reduce((s, p) => s + p.lng, 0) / conGPS.length;

  // Google Maps Embed con markers
  const markers = conGPS.slice(0, 20).map(p => p.lat + ',' + p.lng).join('|');
  const src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + avgLat + ',' + avgLng
    + '&zoom=10&size=400x200&maptype=roadmap&markers=color:green|' + markers
    + '&key='; // Sin API key usa version basica

  // Fallback: mapa simple con puntos CSS
  mapDiv.innerHTML = '<div style="position:relative;width:100%;height:100%;background:#1A2B3A;overflow:hidden">'
    + '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">'
    + '<div style="font-size:28px;margin-bottom:4px">🗺</div>'
    + '<div style="color:#4FC3F7;font-size:11px;font-weight:700">' + conGPS.length + ' proveedores con GPS</div>'
    + '<div style="color:#6B8FA8;font-size:9px;margin-top:2px">' + (new Set(conGPS.map(p => p.zona))).size + ' zonas</div>'
    + '</div></div>';
}

function aciTogglePlanProv(id, checked) {
  if (checked) _planSeleccionados.add(id);
  else _planSeleccionados.delete(id);
}

function aciSeleccionarTodos() {
  document.querySelectorAll('#plan-list input[type=checkbox]').forEach(cb => { cb.checked = true; });
  const provs = aciGetProveedores();
  provs.forEach(p => _planSeleccionados.add(p.id));
}

function aciDeseleccionarTodos() {
  document.querySelectorAll('#plan-list input[type=checkbox]').forEach(cb => { cb.checked = false; });
  _planSeleccionados.clear();
}

async function loadEjecutivosSelect() {
  const sel = document.getElementById('plan-ejecutivo');
  if (!sel) return;
  try {
    const { data } = await _supa.from('usuarios_autorizados')
      .select('id, nombre, sucursal')
      .eq('activo', true)
      .eq('acceso_asistente', true)
      .in('rol', ['ejecutivo'])
      .order('nombre');
    if (data) {
      sel.innerHTML = '<option value="">Asignar a ejecutivo...</option>'
        + data.map(u => '<option value="' + u.id + '">' + u.nombre + (u.sucursal ? ' (' + u.sucursal + ')' : '') + '</option>').join('');
    }
  } catch (e) { /* silencioso */ }
}

async function aciAsignarRuta() {
  const ejecutivoId = document.getElementById('plan-ejecutivo')?.value;
  if (!ejecutivoId) { alert('Selecciona un ejecutivo'); return; }
  if (!_planSeleccionados.size) { alert('Selecciona al menos un proveedor'); return; }

  const provIds = [..._planSeleccionados];
  const proveedoresOrdenados = provIds.map((id, i) => ({
    proveedor_id: id,
    orden: i + 1
  }));

  const filtros = {
    zona: document.getElementById('plan-zona')?.value || 'todas',
    prioridad: document.getElementById('plan-prioridad')?.value || 'todas',
    segmento: document.getElementById('plan-segmento')?.value || 'todos'
  };

  const payload = {
    fecha: new Date().toISOString().slice(0, 10),
    ejecutivo_id: parseInt(ejecutivoId),
    creada_por_id: USUARIO?.id || null,
    proveedores_json: proveedoresOrdenados,
    criterios_json: filtros,
    estado: 'pendiente'
  };

  const { error } = await _supa.from('rutas_asignadas').insert(payload);
  if (error) { alert('Error: ' + error.message); return; }

  alert('Ruta asignada con ' + provIds.length + ' proveedores');
  _planSeleccionados.clear();
  aciAplicarFiltrosPlan();
}

// ══════════════════════════════════════════════════
// MI RUTA DEL DIA (Cristian / ejecutivo)
// ══════════════════════════════════════════════════

async function aciLoadMiRuta() {
  const content = document.getElementById('miruta-content');
  if (!content) return;
  content.innerHTML = '<div class="cotiz-empty">Buscando ruta del dia...</div>';

  try {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await _supa.from('rutas_asignadas')
      .select('*')
      .eq('ejecutivo_id', USUARIO?.id)
      .eq('fecha', hoy)
      .in('estado', ['pendiente', 'en_curso'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      content.innerHTML = '<div class="cotiz-empty" style="padding:40px 20px">'
        + '<div style="font-size:40px;margin-bottom:12px">📭</div>'
        + '<div style="font-size:14px;font-weight:700;margin-bottom:4px">Sin ruta asignada hoy</div>'
        + '<div style="font-size:11px;color:#aaa">Contacta a tu supervisor para que te asigne una ruta</div>'
        + '</div>';
      return;
    }

    _rutaActiva = data;
    // Cargar proveedores de la ruta
    const provIds = (data.proveedores_json || []).map(p => p.proveedor_id);
    _rutaProveedores = provIds.map(id => aciGetProveedorById(id)).filter(Boolean);

    // Cargar eventos del dia para esta ruta (visitas ya hechas)
    const { data: eventosHoy } = await _supa.from('eventos')
      .select('proveedor_id, tipo, resultado, created_at')
      .eq('usuario_id', USUARIO?.id)
      .gte('created_at', hoy + 'T00:00:00')
      .eq('tipo', 'visita');
    const visitados = new Set((eventosHoy || []).map(e => e.proveedor_id));

    renderMiRuta(visitados);
  } catch (e) {
    content.innerHTML = '<div class="cotiz-empty">Error: ' + e.message + '</div>';
  }
}

function renderMiRuta(visitados) {
  const content = document.getElementById('miruta-content');
  const total = _rutaProveedores.length;
  const vis = _rutaProveedores.filter(p => visitados.has(p.id)).length;
  const pct = total > 0 ? Math.round(vis / total * 100) : 0;

  const priColors = { 'MÁX': '#1a6b3c', 'ALTA': '#2471a3', 'MEDIA': '#d35400', 'BAJA': '#c0392b' };

  let html = '<div style="padding:12px">';

  // Header con progreso
  html += '<div style="background:#0D1B2A;border-radius:12px;padding:14px;margin-bottom:12px;color:#fff">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    + '<div style="font-size:14px;font-weight:800">Ruta del dia</div>'
    + '<div style="font-size:20px;font-weight:800;color:#4FC3F7">' + vis + '/' + total + '</div>'
    + '</div>'
    + '<div style="background:#1A2B3A;border-radius:6px;height:8px;overflow:hidden">'
    + '<div style="background:#4FC3F7;height:100%;width:' + pct + '%;border-radius:6px;transition:width .3s"></div>'
    + '</div>'
    + '<div style="font-size:10px;color:#6B8FA8;margin-top:4px">' + pct + '% completado</div>'
    + '</div>';

  // Boton iniciar/finalizar ruta (Fase 4 — vehiculo)
  if (typeof aciIniciarViaje === 'function') {
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'
      + '<button class="close-btn" style="background:#1B5E20;font-size:12px;padding:10px;margin:0" onclick="aciIniciarViaje()">🚗 Iniciar Viaje</button>'
      + '<button class="close-btn" style="background:#B71C1C;font-size:12px;padding:10px;margin:0" onclick="aciFinalizarViaje()">🏁 Finalizar Viaje</button>'
      + '</div>';
  }

  // Lista de proveedores
  _rutaProveedores.forEach((p, i) => {
    const done = visitados.has(p.id);
    html += '<div style="background:' + (done ? '#E8F5E9' : '#fff') + ';border-radius:10px;padding:10px 12px;margin-bottom:6px;border-left:3px solid ' + (done ? '#4CAF50' : priColors[p.prioridad] || '#ccc') + ';opacity:' + (done ? '.7' : '1') + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start">'
      + '<div>'
      + '<div style="font-size:11px;color:#aaa;font-weight:700">#' + (i + 1) + '</div>'
      + '<div style="font-size:13px;font-weight:700;color:#1A2332">' + (done ? '✅ ' : '') + p.nombre + '</div>'
      + '<div style="font-size:10px;color:#888;margin-top:2px">📍 ' + (p.direccion || p.zona || '') + '</div>'
      + '<div style="font-size:9px;color:#999;margin-top:2px">' + (p.materiales || '').substring(0, 60) + '</div>'
      + '</div>'
      + (done ? '' : '<button class="seg-btn wa" style="font-size:10px;flex-shrink:0" onclick="aciMarcarVisita(' + p.id + ')">Visitar</button>')
      + '</div></div>';
  });

  html += '</div>';
  content.innerHTML = html;
}

async function aciMarcarVisita(provId) {
  const percepcion = prompt('Percepcion del proveedor:\n1. Buena\n2. Neutra\n3. Mala\n\nIngresa numero (1-3):');
  if (!percepcion) return;
  const perMap = { '1': 'buena', '2': 'neutra', '3': 'mala' };
  const per = perMap[percepcion] || 'neutra';

  const nota = prompt('Nota de la visita (opcional):') || '';
  const kg = parseFloat(prompt('Kg estimados (0 si no aplica):') || '0') || 0;

  // Registrar evento de visita
  if (typeof aciRegistrarEvento === 'function') {
    await aciRegistrarEvento({
      tipo: 'visita',
      proveedor_id: provId,
      canal: 'presencial',
      resultado: per,
      ruta_asignada_id: _rutaActiva?.id || null,
      detalle_json: { nota, kg_estimados: kg, percepcion: per }
    });
  }

  // Actualizar ruta a en_curso si estaba pendiente
  if (_rutaActiva && _rutaActiva.estado === 'pendiente') {
    await _supa.from('rutas_asignadas').update({ estado: 'en_curso' }).eq('id', _rutaActiva.id);
    _rutaActiva.estado = 'en_curso';
  }

  // Obtener posicion GPS si disponible
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      _supa.from('eventos').update({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }).eq('tipo', 'visita').eq('proveedor_id', provId)
        .order('created_at', { ascending: false }).limit(1);
    }, () => {}, { enableHighAccuracy: true, timeout: 5000 });
  }

  alert('Visita registrada');
  aciLoadMiRuta(); // Refrescar
}

// ── Suscripcion Realtime para nuevas rutas asignadas ──
function aciSubscribeRutas() {
  if (!_supa || !USUARIO?.id) return;
  _supa.channel('aci-rutas-ch')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'rutas_asignadas',
      filter: 'ejecutivo_id=eq.' + USUARIO.id
    }, payload => {
      // Notificar nueva ruta
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      const banner = document.getElementById('update-banner');
      if (banner) {
        banner.innerHTML = '📋 Nueva ruta asignada — <strong>toca para ver</strong>';
        banner.style.display = 'block';
        banner.style.background = '#1B5E20';
        banner.onclick = () => {
          banner.style.display = 'none';
          switchMainPage('mi-ruta');
        };
      }
    })
    .subscribe();
}

console.log('ACI rutas.js cargado');
