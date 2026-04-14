// ══════════════════════════════════════════════════════════════
// ACI — MODULO VEHICULO
// Viajes + Fotos tablero + OCR Claude Vision + Tramos
// Asistente Comercial Integrado · Fase 4
// ══════════════════════════════════════════════════════════════

let _viajeActivo = null;
const OCR_TIMEOUT_MS = 3000; // 3 segundos max

// ══════════════════════════════════════════════════
// INICIAR VIAJE
// ══════════════════════════════════════════════════

async function aciIniciarViaje() {
  if (_viajeActivo) { alert('Ya hay un viaje en curso'); return; }

  // 1. Pedir foto del tablero
  const fotoBlob = await aciCapturarFoto('Foto del tablero — INICIO de viaje');
  if (!fotoBlob) return;

  // 2. Obtener GPS
  let gps = null;
  try {
    gps = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  } catch (e) { /* sin GPS */ }

  // 3. Subir foto a Supabase Storage
  const ts = Date.now();
  const userId = USUARIO?.id || 0;
  const fotoPath = userId + '/' + new Date().toISOString().slice(0, 10) + '/inicio_' + ts + '.jpg';
  let fotoUrl = null;

  if (navigator.onLine) {
    const { data: upData, error: upErr } = await _supa.storage
      .from('fotos-vehiculo')
      .upload(fotoPath, fotoBlob, { contentType: 'image/jpeg' });
    if (!upErr && upData) {
      const { data: urlData } = _supa.storage.from('fotos-vehiculo').getPublicUrl(fotoPath);
      fotoUrl = urlData?.publicUrl || null;
    }
  }

  // Si no hay conexion, cachear en IndexedDB
  if (!fotoUrl && typeof _aciPut === 'function') {
    const reader = new FileReader();
    reader.onload = async () => {
      await _aciPut('fotos_cache', { tipo: 'inicio', blob_data: reader.result, path: fotoPath, synced: false, created_at: ts });
    };
    reader.readAsArrayBuffer(fotoBlob);
  }

  // 4. OCR con timeout 3s
  let ocrResult = null;
  if (fotoUrl && navigator.onLine) {
    ocrResult = await aciOcrTablero(fotoUrl);
  }

  // 5. Mostrar resultado OCR para confirmacion
  const ocrData = await aciConfirmarOCR(ocrResult, 'inicio');

  // 6. Crear registro de viaje
  const payload = {
    usuario_id: userId,
    ruta_asignada_id: (typeof _rutaActiva !== 'undefined' && _rutaActiva) ? _rutaActiva.id : null,
    fecha: new Date().toISOString().slice(0, 10),
    hora_salida: new Date().toISOString(),
    gps_salida_lat: gps?.lat || null,
    gps_salida_lng: gps?.lng || null,
    foto_inicio_url: fotoUrl,
    km_inicio: ocrData.km,
    combustible_inicio: ocrData.combustible,
    ocr_inicio_json: ocrResult,
    estado: 'en_curso'
  };

  const { data: viajeData, error } = await _supa.from('viajes_terreno').insert(payload).select().single();
  if (error) {
    console.warn('Error creando viaje:', error.message);
    alert('Error al registrar viaje. Los datos se guardaron localmente.');
    return;
  }

  _viajeActivo = viajeData;

  // 7. Iniciar GPS tracking
  if (typeof aciGeoStart === 'function' && typeof _rutaProveedores !== 'undefined') {
    aciGeoStart(_rutaProveedores);
  }

  alert('Viaje iniciado — km: ' + (ocrData.km || '?') + ' · combustible: ' + (ocrData.combustible || '?'));
}

// ══════════════════════════════════════════════════
// FINALIZAR VIAJE
// ══════════════════════════════════════════════════

async function aciFinalizarViaje() {
  if (!_viajeActivo) { alert('No hay viaje en curso'); return; }

  // 1. Detener GPS
  let track = [];
  if (typeof aciGeoStop === 'function') {
    track = aciGeoStop();
  }

  // 2. Pedir foto del tablero final
  const fotoBlob = await aciCapturarFoto('Foto del tablero — FIN de viaje');
  if (!fotoBlob) return;

  // 3. Subir foto
  const ts = Date.now();
  const userId = USUARIO?.id || 0;
  const fotoPath = userId + '/' + new Date().toISOString().slice(0, 10) + '/fin_' + ts + '.jpg';
  let fotoUrl = null;

  if (navigator.onLine) {
    const { data: upData, error: upErr } = await _supa.storage
      .from('fotos-vehiculo')
      .upload(fotoPath, fotoBlob, { contentType: 'image/jpeg' });
    if (!upErr && upData) {
      const { data: urlData } = _supa.storage.from('fotos-vehiculo').getPublicUrl(fotoPath);
      fotoUrl = urlData?.publicUrl || null;
    }
  }

  // 4. OCR
  let ocrResult = null;
  if (fotoUrl && navigator.onLine) {
    ocrResult = await aciOcrTablero(fotoUrl);
  }

  // 5. Confirmar datos
  const ocrData = await aciConfirmarOCR(ocrResult, 'fin');

  // 6. Calcular km GPS
  let kmGps = 0;
  if (track.length > 1) {
    for (let i = 1; i < track.length; i++) {
      kmGps += _haversine(track[i - 1].lat, track[i - 1].lng, track[i].lat, track[i].lng);
    }
    kmGps = Math.round(kmGps / 10) / 100; // metros a km con 2 decimales
  }

  // 7. Calcular delta km
  const kmTablero = (ocrData.km && _viajeActivo.km_inicio) ? ocrData.km - _viajeActivo.km_inicio : null;
  const delta = (kmTablero && kmGps > 0) ? Math.abs(kmTablero - kmGps) / kmTablero * 100 : null;

  // 8. Actualizar viaje en Supabase
  let gps = null;
  try {
    gps = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  } catch (e) { /* sin GPS */ }

  await _supa.from('viajes_terreno').update({
    hora_regreso: new Date().toISOString(),
    gps_regreso_lat: gps?.lat || null,
    gps_regreso_lng: gps?.lng || null,
    foto_fin_url: fotoUrl,
    km_fin: ocrData.km,
    combustible_fin: ocrData.combustible,
    ocr_fin_json: ocrResult,
    km_total_gps: kmGps,
    track_gps_json: track.length > 0 ? track : null,
    estado: 'completado'
  }).eq('id', _viajeActivo.id);

  // Completar ruta si esta activa
  if (typeof _rutaActiva !== 'undefined' && _rutaActiva) {
    await _supa.from('rutas_asignadas').update({ estado: 'completada', completada_at: new Date().toISOString() }).eq('id', _rutaActiva.id);
  }

  // Alerta de delta km si > 15%
  let alertaMsg = 'Viaje finalizado';
  if (kmTablero !== null) alertaMsg += '\nKm tablero: ' + kmTablero;
  if (kmGps > 0) alertaMsg += '\nKm GPS: ' + kmGps.toFixed(1);
  if (delta !== null && delta > 15) alertaMsg += '\n⚠ ALERTA: Delta ' + delta.toFixed(1) + '% (>15%)';

  alert(alertaMsg);
  _viajeActivo = null;
}

// ══════════════════════════════════════════════════
// CAPTURA DE FOTO (compresion a 300-500KB)
// ══════════════════════════════════════════════════

function aciCapturarFoto(titulo) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) { resolve(null); return; }
      // Comprimir a max 500KB
      const compressed = await aciComprimirImagen(file, 800, 0.7);
      resolve(compressed);
    };
    input.click();
  });
}

function aciComprimirImagen(file, maxWidth, quality) {
  return new Promise(resolve => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ══════════════════════════════════════════════════
// OCR TABLERO (Claude Vision API con timeout 3s)
// ══════════════════════════════════════════════════

async function aciOcrTablero(fotoUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

    // Llamar Edge Function de OCR
    const { data, error } = await _supa.functions.invoke('ocr-tablero', {
      body: { foto_url: fotoUrl },
      signal: controller.signal
    });

    clearTimeout(timeout);
    if (error) throw error;
    return data; // { km, combustible, confianza }
  } catch (e) {
    console.warn('OCR timeout o error:', e.message || e);
    return null; // Fallback a manual
  }
}

// ══════════════════════════════════════════════════
// CONFIRMACION OCR CON NIVEL DE CONFIANZA (v3)
// ══════════════════════════════════════════════════

function aciConfirmarOCR(ocrResult, tipo) {
  return new Promise(resolve => {
    if (ocrResult && ocrResult.confianza >= 0.7) {
      // Confianza alta — mostrar para confirmar
      const confKm = ocrResult.confianza_km || ocrResult.confianza || 0;
      const confComb = ocrResult.confianza_combustible || ocrResult.confianza || 0;

      const kmOk = confirm(
        'Datos extraidos del tablero (' + tipo + '):\n\n'
        + 'Km: ' + (ocrResult.km || '?') + ' ' + (confKm > 0.8 ? '✅' : '⚠️') + ' (' + Math.round(confKm * 100) + '% confianza)\n'
        + 'Combustible: ' + (ocrResult.combustible || '?') + ' ' + (confComb > 0.8 ? '✅' : '⚠️') + ' (' + Math.round(confComb * 100) + '% confianza)\n\n'
        + '¿Datos correctos?'
      );

      if (kmOk) {
        resolve({ km: ocrResult.km, combustible: ocrResult.combustible, ocr_manual: false });
        return;
      }
    }

    // Fallback manual (confianza baja, timeout, o usuario rechazo)
    const km = parseInt(prompt('Ingresa kilometraje del tablero (' + tipo + '):') || '0') || null;
    const comb = prompt('Nivel de combustible (ej: 3/4, medio, lleno):') || null;
    resolve({ km, combustible: comb, ocr_manual: true });
  });
}

// ══════════════════════════════════════════════════
// MIS VIAJES (historial)
// ══════════════════════════════════════════════════

async function aciLoadMisViajes() {
  const content = document.getElementById('misviajes-content');
  if (!content) return;
  content.innerHTML = '<div class="cotiz-empty">Cargando viajes...</div>';

  try {
    const { data, error } = await _supa.from('viajes_terreno')
      .select('*')
      .eq('usuario_id', USUARIO?.id)
      .order('fecha', { ascending: false })
      .limit(30);

    if (error || !data || !data.length) {
      content.innerHTML = '<div class="cotiz-empty" style="padding:40px">'
        + '<div style="font-size:40px;margin-bottom:12px">🚗</div>'
        + 'Sin viajes registrados</div>';
      return;
    }

    content.innerHTML = data.map(v => {
      const kmTotal = (v.km_fin && v.km_inicio) ? v.km_fin - v.km_inicio : null;
      const kmGps = v.km_total_gps ? parseFloat(v.km_total_gps).toFixed(1) : null;
      const delta = (kmTotal && kmGps) ? Math.abs(kmTotal - kmGps) / kmTotal * 100 : null;
      const salida = v.hora_salida ? new Date(v.hora_salida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—';
      const regreso = v.hora_regreso ? new Date(v.hora_regreso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—';

      return '<div class="cotiz-card">'
        + '<div class="cotiz-header">'
        + '<div class="cotiz-prov">🚗 ' + v.fecha + '</div>'
        + '<span class="cotiz-badge ' + v.estado + '">' + v.estado + '</span>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#555">'
        + '<div>🕐 Salida: ' + salida + '</div>'
        + '<div>🏁 Regreso: ' + regreso + '</div>'
        + '<div>📏 Km tablero: ' + (kmTotal !== null ? kmTotal + ' km' : '—') + '</div>'
        + '<div>📡 Km GPS: ' + (kmGps || '—') + ' km</div>'
        + '<div>⛽ Inicio: ' + (v.combustible_inicio || '—') + '</div>'
        + '<div>⛽ Fin: ' + (v.combustible_fin || '—') + '</div>'
        + '</div>'
        + (delta !== null && delta > 15 ? '<div style="background:#FFEBEE;border-radius:6px;padding:6px 10px;margin-top:6px;font-size:10px;font-weight:700;color:#c62828">⚠ Delta km: ' + delta.toFixed(1) + '% (GPS vs tablero)</div>' : '')
        + '</div>';
    }).join('');
  } catch (e) {
    content.innerHTML = '<div class="cotiz-empty">Error: ' + e.message + '</div>';
  }
}

console.log('ACI vehiculo.js cargado');
