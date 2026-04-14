// ══════════════════════════════════════════════════════════════
// ACI — MODULO MAPA VIRTUAL
// Mapa interactivo con Leaflet: sucursales, proveedores, GPS
// Actualización en tiempo real via Supabase Realtime
// Asistente Comercial Integrado
// ══════════════════════════════════════════════════════════════

const SUCURSALES_GEO = [
  { nombre: 'Cerrillos', lat: -33.4928, lng: -70.7154, empresa: 'Farex + Reciclean', color: '#1B5E20', activa: true },
  { nombre: 'Maipú',    lat: -33.5100, lng: -70.7558, empresa: 'Farex + Reciclean', color: '#2E7D32', activa: true },
  { nombre: 'Talca',    lat: -35.4264, lng: -71.6554, empresa: 'Reciclean',         color: '#4CAF50', activa: true },
  { nombre: 'Puerto Montt', lat: -41.4693, lng: -72.9424, empresa: 'Reciclean', color: '#9E9E9E', activa: false }
];

let _mapaLeaflet = null;
let _mapaMarkers = { sucursales: [], proveedores: [], gps: null };
let _mapaGeoWatch = null;

// ── Inicializar mapa ──────────────────────────────────────────

function aciInitMapa() {
  const container = document.getElementById('mapa-leaflet');
  if (!container) return;

  // Si ya existe, destruir y recrear
  if (_mapaLeaflet) {
    _mapaLeaflet.remove();
    _mapaLeaflet = null;
  }

  // Centrar en Chile (-33.45, -70.65) zoom 6
  _mapaLeaflet = L.map('mapa-leaflet', {
    zoomControl: true,
    attributionControl: false
  }).setView([-33.45, -70.65], 6);

  // Tiles de OpenStreetMap (gratis)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap'
  }).addTo(_mapaLeaflet);

  // Agregar sucursales
  _mapaRenderSucursales();

  // Agregar proveedores con GPS
  _mapaRenderProveedores();

  // Iniciar tracking GPS del usuario
  _mapaTrackGPS();

  // Suscribir a cambios realtime de proveedores
  _mapaSubscribeRealtime();

  // Fix tiles grises (Leaflet necesita invalidar tamaño)
  setTimeout(() => _mapaLeaflet.invalidateSize(), 200);
}

// ── Render sucursales ─────────────────────────────────────────

function _mapaRenderSucursales() {
  if (!_mapaLeaflet) return;

  // Limpiar markers anteriores
  _mapaMarkers.sucursales.forEach(m => _mapaLeaflet.removeLayer(m));
  _mapaMarkers.sucursales = [];

  SUCURSALES_GEO.forEach(suc => {
    const icon = L.divIcon({
      className: 'mapa-suc-icon',
      html: '<div style="background:' + suc.color + ';width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:16px">'
        + (suc.activa ? '🏭' : '🔒') + '</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([suc.lat, suc.lng], { icon })
      .addTo(_mapaLeaflet)
      .bindPopup(
        '<div style="font-weight:700;font-size:14px;color:#1A2332">' + suc.nombre + '</div>'
        + '<div style="font-size:11px;color:#666;margin-top:2px">' + suc.empresa + '</div>'
        + (suc.activa
          ? '<div style="color:#1B5E20;font-size:10px;font-weight:600;margin-top:4px">Operativa</div>'
          : '<div style="color:#F44336;font-size:10px;font-weight:600;margin-top:4px">En espera de permisos</div>')
      );

    _mapaMarkers.sucursales.push(marker);
  });
}

// ── Render proveedores ────────────────────────────────────────

function _mapaRenderProveedores() {
  if (!_mapaLeaflet) return;

  // Limpiar markers anteriores
  _mapaMarkers.proveedores.forEach(m => _mapaLeaflet.removeLayer(m));
  _mapaMarkers.proveedores = [];

  if (typeof aciGetProveedores !== 'function') return;

  const provs = aciGetProveedores();
  const conGPS = provs.filter(p => p.lat && p.lng);

  const priColors = { 'MÁX': '#1a6b3c', 'ALTA': '#2471a3', 'MEDIA': '#d35400', 'BAJA': '#c0392b' };

  conGPS.forEach(p => {
    const col = priColors[p.prioridad] || '#607D8B';
    const icon = L.divIcon({
      className: 'mapa-prov-icon',
      html: '<div style="background:' + col + ';width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700">'
        + (p.nombre || '?').charAt(0).toUpperCase() + '</div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const ultimaCompra = p.ultima_compra
      ? new Date(p.ultima_compra).toLocaleDateString('es-CL')
      : 'Sin registro';

    const marker = L.marker([p.lat, p.lng], { icon })
      .addTo(_mapaLeaflet)
      .bindPopup(
        '<div style="font-weight:700;font-size:13px;color:#1A2332">' + p.nombre + '</div>'
        + '<div style="font-size:10px;color:#888;margin-top:2px">' + (p.direccion || p.zona || '') + '</div>'
        + '<div style="font-size:10px;margin-top:4px"><span style="color:' + col + ';font-weight:700">' + (p.prioridad || '—') + '</span> · ' + (p.estado_comercial || '') + '</div>'
        + '<div style="font-size:10px;color:#666;margin-top:2px">Materiales: ' + (p.materiales || '—').substring(0, 60) + '</div>'
        + '<div style="font-size:10px;color:#999;margin-top:2px">Ultima compra: ' + ultimaCompra + '</div>'
        + (p.telefono ? '<a href="tel:' + p.telefono + '" style="font-size:10px;color:#1565C0;display:block;margin-top:4px">Llamar: ' + p.telefono + '</a>' : '')
      );

    _mapaMarkers.proveedores.push(marker);
  });

  // Actualizar contador
  const countEl = document.getElementById('mapa-prov-count');
  if (countEl) countEl.textContent = conGPS.length + ' proveedores con GPS';
}

// ── GPS del usuario ───────────────────────────────────────────

function _mapaTrackGPS() {
  if (!navigator.geolocation || !_mapaLeaflet) return;

  navigator.geolocation.getCurrentPosition(
    pos => _mapaUpdateGPS(pos),
    () => {},
    { enableHighAccuracy: true, timeout: 10000 }
  );

  _mapaGeoWatch = navigator.geolocation.watchPosition(
    pos => _mapaUpdateGPS(pos),
    () => {},
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
  );
}

function _mapaUpdateGPS(pos) {
  if (!_mapaLeaflet) return;
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const acc = Math.round(pos.coords.accuracy);

  if (_mapaMarkers.gps) {
    _mapaMarkers.gps.setLatLng([lat, lng]);
  } else {
    const icon = L.divIcon({
      className: 'mapa-gps-icon',
      html: '<div style="position:relative"><div style="width:16px;height:16px;background:#4FC3F7;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(79,195,247,.3),0 2px 6px rgba(0,0,0,.3)"></div></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    _mapaMarkers.gps = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
      .addTo(_mapaLeaflet)
      .bindPopup('<div style="font-weight:700;font-size:12px">Tu ubicacion</div><div style="font-size:10px;color:#888">Precision: ' + acc + 'm</div>');
  }

  // Actualizar indicador GPS
  const gpsEl = document.getElementById('mapa-gps-status');
  if (gpsEl) {
    gpsEl.innerHTML = '<span style="color:#4CAF50">GPS activo · ' + acc + 'm</span>';
  }
}

// ── Realtime: actualizar proveedores cuando cambien ───────────

function _mapaSubscribeRealtime() {
  if (!_supa) return;

  _supa.channel('mapa-proveedores-ch')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'proveedores'
    }, () => {
      // Recargar proveedores del cache y re-render
      if (typeof aciSyncProveedores === 'function') {
        aciSyncProveedores().then(() => _mapaRenderProveedores());
      } else {
        _mapaRenderProveedores();
      }
    })
    .subscribe();
}

// ── Centrar mapa en diferentes vistas ─────────────────────────

function mapaCentrarSucursales() {
  if (!_mapaLeaflet) return;
  const activas = SUCURSALES_GEO.filter(s => s.activa);
  if (activas.length) {
    const bounds = L.latLngBounds(activas.map(s => [s.lat, s.lng]));
    _mapaLeaflet.fitBounds(bounds, { padding: [40, 40] });
  }
}

function mapaCentrarProveedores() {
  if (!_mapaLeaflet || !_mapaMarkers.proveedores.length) return;
  const bounds = L.latLngBounds(_mapaMarkers.proveedores.map(m => m.getLatLng()));
  _mapaLeaflet.fitBounds(bounds, { padding: [30, 30] });
}

function mapaCentrarGPS() {
  if (!_mapaLeaflet || !_mapaMarkers.gps) return;
  _mapaLeaflet.setView(_mapaMarkers.gps.getLatLng(), 14);
}

function mapaCentrarSucursal(nombre) {
  if (!_mapaLeaflet) return;
  const suc = SUCURSALES_GEO.find(s => s.nombre === nombre);
  if (suc) _mapaLeaflet.setView([suc.lat, suc.lng], 14);
}

// ── Filtrar proveedores en mapa ───────────────────────────────

function mapaFiltrarProveedores() {
  const zona = document.getElementById('mapa-filtro-zona')?.value || '';
  const prioridad = document.getElementById('mapa-filtro-prioridad')?.value || '';

  if (!_mapaLeaflet) return;

  // Limpiar
  _mapaMarkers.proveedores.forEach(m => _mapaLeaflet.removeLayer(m));
  _mapaMarkers.proveedores = [];

  if (typeof aciGetProveedores !== 'function') return;

  const filtros = {};
  if (zona) filtros.zona = zona;
  if (prioridad) filtros.prioridad = prioridad;

  const provs = aciGetProveedores(Object.keys(filtros).length ? filtros : undefined);
  const conGPS = provs.filter(p => p.lat && p.lng);
  const priColors = { 'MÁX': '#1a6b3c', 'ALTA': '#2471a3', 'MEDIA': '#d35400', 'BAJA': '#c0392b' };

  conGPS.forEach(p => {
    const col = priColors[p.prioridad] || '#607D8B';
    const icon = L.divIcon({
      className: 'mapa-prov-icon',
      html: '<div style="background:' + col + ';width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700">'
        + (p.nombre || '?').charAt(0).toUpperCase() + '</div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker([p.lat, p.lng], { icon })
      .addTo(_mapaLeaflet)
      .bindPopup(
        '<div style="font-weight:700;font-size:13px">' + p.nombre + '</div>'
        + '<div style="font-size:10px;color:#888">' + (p.zona || '') + ' · ' + (p.prioridad || '') + '</div>'
      );
    _mapaMarkers.proveedores.push(marker);
  });

  const countEl = document.getElementById('mapa-prov-count');
  if (countEl) countEl.textContent = conGPS.length + ' proveedores con GPS';

  if (conGPS.length) mapaCentrarProveedores();
}

// ── Cleanup ───────────────────────────────────────────────────

function aciMapaDestroy() {
  if (_mapaGeoWatch !== null) {
    navigator.geolocation.clearWatch(_mapaGeoWatch);
    _mapaGeoWatch = null;
  }
  if (_mapaLeaflet) {
    _mapaLeaflet.remove();
    _mapaLeaflet = null;
  }
}

console.log('ACI mapa.js cargado');
