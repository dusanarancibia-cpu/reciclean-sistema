// ══════════════════════════════════════════════════════════════
// ACI — MODULO GEOLOCALIZACION
// GPS tracking 60s + Geofence + Autodeteccion zona rural
// Asistente Comercial Integrado · Fase 3
// ══════════════════════════════════════════════════════════════

const GEO_INTERVAL_MS = 60000; // 60 segundos
const GEOFENCE_RADIO_M = 100;  // metros
const GPS_RURAL_THRESHOLD_M = 100; // precision > 100m = rural

let _geoWatchId = null;
let _geoTrack = [];
let _geoActive = false;
let _geoLastPos = null;
let _geoModoRural = false;
let _geoGeofences = []; // { proveedor_id, lat, lng, nombre, registrado: false }

// ── Iniciar tracking GPS ─────────────────────────────────────

function aciGeoStart(proveedoresRuta) {
  if (_geoActive) return;
  if (!navigator.geolocation) {
    console.warn('GPS no disponible en este dispositivo');
    return;
  }

  _geoActive = true;
  _geoTrack = [];
  _geoModoRural = false;

  // Configurar geofences de proveedores
  _geoGeofences = (proveedoresRuta || [])
    .filter(p => p.lat && p.lng)
    .map(p => ({ proveedor_id: p.id, lat: p.lat, lng: p.lng, nombre: p.nombre, registrado: false }));

  // Primer punto inmediato
  navigator.geolocation.getCurrentPosition(
    pos => _geoOnPosition(pos),
    err => console.warn('GPS error inicial:', err.message),
    { enableHighAccuracy: true, timeout: 10000 }
  );

  // Tracking periodico cada 60s
  _geoWatchId = navigator.geolocation.watchPosition(
    pos => _geoOnPosition(pos),
    err => { /* silencioso — GPS puede fallar momentaneamente */ },
    { enableHighAccuracy: true, maximumAge: GEO_INTERVAL_MS, timeout: 15000 }
  );

  aciGeoUpdateUI('tracking');
  console.log('ACI GPS: tracking iniciado (60s interval, ' + _geoGeofences.length + ' geofences)');
}

function aciGeoStop() {
  if (_geoWatchId !== null) {
    navigator.geolocation.clearWatch(_geoWatchId);
    _geoWatchId = null;
  }
  _geoActive = false;
  aciGeoUpdateUI('stopped');
  console.log('ACI GPS: tracking detenido (' + _geoTrack.length + ' puntos)');
  return [..._geoTrack];
}

// ── Procesamiento de cada posicion GPS ───────────────────────

function _geoOnPosition(pos) {
  const point = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    speed: pos.coords.speed,
    heading: pos.coords.heading,
    timestamp: pos.timestamp || Date.now()
  };

  _geoTrack.push(point);
  _geoLastPos = point;

  // Autodeteccion zona rural (v3)
  if (point.accuracy > GPS_RURAL_THRESHOLD_M && !_geoModoRural) {
    _geoModoRural = true;
    aciGeoMostrarSugerenciaManual();
  } else if (point.accuracy <= GPS_RURAL_THRESHOLD_M && _geoModoRural) {
    _geoModoRural = false;
  }

  // Verificar geofences
  _geoGeofences.forEach(gf => {
    if (gf.registrado) return;
    const dist = _haversine(point.lat, point.lng, gf.lat, gf.lng);
    if (dist <= GEOFENCE_RADIO_M) {
      gf.registrado = true;
      _geoOnGeofenceEnter(gf, point);
    }
  });

  aciGeoUpdateUI('tracking');
}

function _geoOnGeofenceEnter(geofence, pos) {
  console.log('ACI GEOFENCE: llegada detectada a ' + geofence.nombre + ' (' + pos.accuracy.toFixed(0) + 'm precision)');

  // Vibrar
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  // Registrar tramo si hay viaje activo
  if (typeof _viajeActivo !== 'undefined' && _viajeActivo) {
    _supa.from('tramos_viaje').insert({
      viaje_id: _viajeActivo.id,
      proveedor_id: geofence.proveedor_id,
      orden: _geoGeofences.filter(g => g.registrado).length,
      hora_llegada: new Date().toISOString(),
      metodo_llegada: 'geofence',
      gps_llegada_lat: pos.lat,
      gps_llegada_lng: pos.lng,
      distancia_km: _geoTrack.length > 1 ? _geoCalcDistanciaTotal() / 1000 : null
    });
  }

  // Mostrar notificacion en UI
  const banner = document.getElementById('update-banner');
  if (banner) {
    banner.innerHTML = '📍 Llegaste a <strong>' + geofence.nombre + '</strong> — toca para registrar visita';
    banner.style.display = 'block';
    banner.style.background = '#1B5E20';
    banner.onclick = () => {
      banner.style.display = 'none';
      aciMarcarVisita(geofence.proveedor_id);
    };
  }
}

// ── Sugerencia modo manual (zona rural) ──────────────────────

function aciGeoMostrarSugerenciaManual() {
  const banner = document.getElementById('update-banner');
  if (banner) {
    banner.innerHTML = '📡 GPS impreciso en esta zona — usa el boton <strong>"Visitar"</strong> para registrar llegada';
    banner.style.display = 'block';
    banner.style.background = '#F57F17';
    banner.onclick = () => { banner.style.display = 'none'; };
    setTimeout(() => { if (banner.style.background === 'rgb(245, 127, 23)') banner.style.display = 'none'; }, 8000);
  }
}

// ── Utilidades geo ───────────────────────────────────────────

function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _geoCalcDistanciaTotal() {
  let total = 0;
  for (let i = 1; i < _geoTrack.length; i++) {
    total += _haversine(_geoTrack[i - 1].lat, _geoTrack[i - 1].lng, _geoTrack[i].lat, _geoTrack[i].lng);
  }
  return total; // metros
}

function aciGeoGetTrack() { return [..._geoTrack]; }
function aciGeoGetLastPos() { return _geoLastPos; }
function aciGeoIsActive() { return _geoActive; }
function aciGeoIsRural() { return _geoModoRural; }

function aciGeoUpdateUI(estado) {
  const el = document.getElementById('geo-status');
  if (!el) return;
  if (estado === 'tracking') {
    const acc = _geoLastPos ? Math.round(_geoLastPos.accuracy) + 'm' : '—';
    el.innerHTML = '<span style="color:#4CAF50;font-size:9px;font-weight:700">📡 GPS ' + acc + (_geoModoRural ? ' (rural)' : '') + ' · ' + _geoTrack.length + ' pts</span>';
  } else {
    el.innerHTML = '<span style="color:#999;font-size:9px">GPS inactivo</span>';
  }
}

console.log('ACI geo.js cargado');
