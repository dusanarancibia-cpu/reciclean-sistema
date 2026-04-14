// ══════════════════════════════════════════════════════════════
// ACI — MODULO PROVEEDORES
// CRUD + Cache IndexedDB + Sync Supabase
// Asistente Comercial Integrado · Fase 1
// ══════════════════════════════════════════════════════════════

const ACI_IDB_NAME = 'aci_asistente';
const ACI_IDB_VERSION = 1;
let _aciDb = null;

// ── IndexedDB Setup ──────────────────────────────────────────
function aciOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ACI_IDB_NAME, ACI_IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('proveedores'))
        db.createObjectStore('proveedores', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('pending_sync'))
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('fotos_cache'))
        db.createObjectStore('fotos_cache', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('config'))
        db.createObjectStore('config', { keyPath: 'clave' });
    };
    req.onsuccess = e => { _aciDb = e.target.result; resolve(_aciDb); };
    req.onerror = e => reject(e.target.error);
  });
}

function _aciTx(store, mode) {
  return _aciDb.transaction(store, mode).objectStore(store);
}

function _aciPut(store, obj) {
  return new Promise((res, rej) => {
    const r = _aciTx(store, 'readwrite').put(obj);
    r.onsuccess = () => res(r.result);
    r.onerror = e => rej(e.target.error);
  });
}

function _aciGetAll(store) {
  return new Promise((res, rej) => {
    const r = _aciTx(store, 'readonly').getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = e => rej(e.target.error);
  });
}

function _aciGet(store, key) {
  return new Promise((res, rej) => {
    const r = _aciTx(store, 'readonly').get(key);
    r.onsuccess = () => res(r.result || null);
    r.onerror = e => rej(e.target.error);
  });
}

function _aciDelete(store, key) {
  return new Promise((res, rej) => {
    const r = _aciTx(store, 'readwrite').delete(key);
    r.onsuccess = () => res();
    r.onerror = e => rej(e.target.error);
  });
}

function _aciClear(store) {
  return new Promise((res, rej) => {
    const r = _aciTx(store, 'readwrite').clear();
    r.onsuccess = () => res();
    r.onerror = e => rej(e.target.error);
  });
}

// ── Cache de proveedores ─────────────────────────────────────

let _proveedoresCache = [];
let _proveedoresLastSync = 0;
const PROV_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function aciInit() {
  try {
    await aciOpenDB();
    // Cargar cache local
    _proveedoresCache = await _aciGetAll('proveedores');
    if (_proveedoresCache.length) {
      console.log('ACI: ' + _proveedoresCache.length + ' proveedores desde cache local');
    }
    // Sync desde Supabase si hay conexion
    if (navigator.onLine) {
      await aciSyncProveedores();
    }
    // Limpiar cache antiguo de fotos
    await aciLimpiarFotosAntiguas();
    return true;
  } catch (e) {
    console.warn('ACI init error:', e);
    return false;
  }
}

// ── Sync proveedores desde Supabase ──────────────────────────

async function aciSyncProveedores() {
  try {
    const { data, error } = await _supa
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) { console.warn('ACI sync error:', error.message); return false; }
    if (!data || !data.length) return false;

    // Guardar en IndexedDB
    for (const p of data) {
      await _aciPut('proveedores', p);
    }
    _proveedoresCache = data;
    _proveedoresLastSync = Date.now();
    console.log('ACI: ' + data.length + ' proveedores sincronizados');
    return true;
  } catch (e) {
    console.warn('ACI sync proveedores error:', e);
    return false;
  }
}

// ── Consultas de proveedores ─────────────────────────────────

function aciGetProveedores(filtros) {
  let result = [..._proveedoresCache];

  if (filtros) {
    if (filtros.zona) result = result.filter(p => p.zona === filtros.zona);
    if (filtros.segmento) result = result.filter(p => p.segmento === filtros.segmento);
    if (filtros.prioridad) result = result.filter(p => p.prioridad === filtros.prioridad);
    if (filtros.estado) result = result.filter(p => p.estado_comercial === filtros.estado);
    if (filtros.sucursal) result = result.filter(p => p.sucursal === filtros.sucursal);
    if (filtros.buscar) {
      const q = filtros.buscar.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.direccion || '').toLowerCase().includes(q) ||
        (p.materiales || '').toLowerCase().includes(q)
      );
    }
    if (filtros.sinCompra30d) {
      const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      result = result.filter(p => !p.ultima_compra || p.ultima_compra < hace30d);
    }
    if (filtros.conTelefono) {
      result = result.filter(p => p.telefono && p.telefono.trim() !== '');
    }
  }

  return result;
}

function aciGetProveedorById(id) {
  return _proveedoresCache.find(p => p.id === id) || null;
}

function aciGetZonas() {
  const zonas = new Set(_proveedoresCache.map(p => p.zona).filter(Boolean));
  return [...zonas].sort();
}

function aciGetSegmentos() {
  const segs = new Set(_proveedoresCache.map(p => p.segmento).filter(Boolean));
  return [...segs].sort();
}

// ── Buscar proveedor por nombre (fuzzy para vincular cotizaciones) ──

function aciBuscarProveedor(nombre) {
  if (!nombre) return null;
  const q = nombre.toLowerCase().trim();

  // Exacto
  let found = _proveedoresCache.find(p => p.nombre.toLowerCase() === q);
  if (found) return found;

  // Parcial (nombre contiene query o query contiene nombre)
  found = _proveedoresCache.find(p => p.nombre.toLowerCase().includes(q) || q.includes(p.nombre.toLowerCase()));
  if (found) return found;

  // Sin resultado
  return null;
}

// ── Actualizar proveedor (local + Supabase) ──────────────────

async function aciUpdateProveedor(id, campos) {
  // Actualizar cache local
  const idx = _proveedoresCache.findIndex(p => p.id === id);
  if (idx >= 0) {
    Object.assign(_proveedoresCache[idx], campos, { updated_at: new Date().toISOString() });
    await _aciPut('proveedores', _proveedoresCache[idx]);
  }

  // Intentar sync a Supabase
  if (navigator.onLine) {
    const { error } = await _supa.from('proveedores').update(campos).eq('id', id);
    if (error) {
      console.warn('ACI update proveedor error:', error.message);
      await _aciPut('pending_sync', { tipo: 'update_proveedor', proveedor_id: id, campos, timestamp: Date.now() });
    }
  } else {
    await _aciPut('pending_sync', { tipo: 'update_proveedor', proveedor_id: id, campos, timestamp: Date.now() });
  }
}

// ── Registrar evento (visita, seguimiento, etc) ──────────────

async function aciRegistrarEvento(evento) {
  // evento: { tipo, proveedor_id, canal, resultado, detalle_json }
  const payload = {
    ...evento,
    usuario_id: (typeof USUARIO !== 'undefined' && USUARIO) ? USUARIO.id : null,
    created_at: new Date().toISOString()
  };

  if (navigator.onLine) {
    const { error } = await _supa.from('eventos').insert(payload);
    if (error) {
      console.warn('ACI evento error:', error.message);
      await _aciPut('pending_sync', { tipo: 'insert_evento', payload, timestamp: Date.now() });
    }
  } else {
    await _aciPut('pending_sync', { tipo: 'insert_evento', payload, timestamp: Date.now() });
  }

  // Actualizar estado comercial del proveedor si corresponde
  if (evento.proveedor_id) {
    await aciActualizarEstadoComercial(evento.proveedor_id, evento.tipo, evento.resultado);
  }

  // Trigger nurturing si visita con buena percepcion (Fase 5)
  if (evento.tipo === 'visita' && evento.resultado === 'buena' && evento.proveedor_id) {
    if (typeof aciEvaluarNurturing === 'function') {
      aciEvaluarNurturing(evento.proveedor_id, evento.resultado);
    }
  }
}

// ── Pipeline estado comercial automatico ─────────────────────

async function aciActualizarEstadoComercial(proveedorId, tipoEvento, resultado) {
  const prov = aciGetProveedorById(proveedorId);
  if (!prov) return;

  let nuevoEstado = null;
  let campos = {};

  switch (tipoEvento) {
    case 'visita':
      if (prov.estado_comercial === 'prospecto') nuevoEstado = 'contactado';
      campos.ultima_visita = new Date().toISOString();
      if (resultado) campos.percepcion = resultado;
      break;
    case 'seguimiento':
      if (prov.estado_comercial === 'prospecto') nuevoEstado = 'contactado';
      break;
    case 'cotizacion':
      if (['prospecto', 'contactado'].includes(prov.estado_comercial)) nuevoEstado = 'cotizado';
      break;
    case 'compra':
      nuevoEstado = 'activo';
      campos.ultima_compra = new Date().toISOString();
      break;
  }

  if (nuevoEstado) campos.estado_comercial = nuevoEstado;
  if (Object.keys(campos).length) {
    await aciUpdateProveedor(proveedorId, campos);
  }
}

// ── Sync pendientes al reconectar ────────────────────────────

async function aciSyncPendientes() {
  if (!_aciDb || !navigator.onLine) return;

  try {
    const pendientes = await _aciGetAll('pending_sync');
    if (!pendientes.length) return;

    let sincronizados = 0;
    for (const item of pendientes) {
      let ok = false;

      if (item.tipo === 'update_proveedor') {
        const { error } = await _supa.from('proveedores').update(item.campos).eq('id', item.proveedor_id);
        ok = !error;
      } else if (item.tipo === 'insert_evento') {
        const { error } = await _supa.from('eventos').insert(item.payload);
        ok = !error;
      }

      if (ok) {
        await _aciDelete('pending_sync', item.id);
        sincronizados++;
      }
    }

    if (sincronizados) {
      console.log('ACI: ' + sincronizados + ' operaciones sincronizadas');
    }
  } catch (e) {
    console.warn('ACI sync pendientes error:', e);
  }
}

// ── Limpieza de fotos antiguas (rotacion 7 dias) ─────────────

async function aciLimpiarFotosAntiguas() {
  if (!_aciDb) return;
  try {
    const fotos = await _aciGetAll('fotos_cache');
    const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let eliminadas = 0;
    for (const f of fotos) {
      if (f.synced && f.created_at < hace7dias) {
        await _aciDelete('fotos_cache', f.id);
        eliminadas++;
      }
    }
    if (eliminadas) console.log('ACI: ' + eliminadas + ' fotos antiguas limpiadas');
  } catch (e) { /* silencioso */ }
}

// ── Contar pendientes de sync ────────────────────────────────

async function aciCountPendientes() {
  if (!_aciDb) return 0;
  try {
    const items = await _aciGetAll('pending_sync');
    const cotiz = JSON.parse(localStorage.getItem('rf_pending_cotizaciones') || '[]');
    return items.length + cotiz.length;
  } catch (e) { return 0; }
}

// ── Estadisticas rapidas de proveedores ──────────────────────

function aciStats() {
  const all = _proveedoresCache;
  return {
    total: all.length,
    porZona: aciGroupBy(all, 'zona'),
    porSegmento: aciGroupBy(all, 'segmento'),
    porEstado: aciGroupBy(all, 'estado_comercial'),
    porPrioridad: aciGroupBy(all, 'prioridad'),
    sinTelefono: all.filter(p => !p.telefono || p.telefono.trim() === '').length,
    conGPS: all.filter(p => p.lat && p.lng).length,
  };
}

function aciGroupBy(arr, key) {
  const groups = {};
  arr.forEach(item => {
    const val = item[key] || 'sin_valor';
    groups[val] = (groups[val] || 0) + 1;
  });
  return groups;
}

// ── Hook para reconexion ─────────────────────────────────────

window.addEventListener('online', () => {
  aciSyncPendientes();
  aciSyncProveedores();
});

console.log('ACI proveedores.js cargado');
