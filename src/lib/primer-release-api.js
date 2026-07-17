import { supabase } from './supabase.js';
import {
  adjuntarComprobanteDemo,
  consultarPrecioVigenteDemo,
  createOrRecoverExpedienteDemo,
  createSignedStorageUrlDemo,
  disablePrimerReleaseDemo,
  enablePrimerReleaseDemo,
  fetchComprobantesByFacturaDemo,
  fetchExpedienteDemo,
  fetchExpedienteEventosDemo,
  fetchFacturasByExpedienteDemo,
  fetchPagosByExpedienteDemo,
  fetchPagosByFacturaDemo,
  fetchPesajeByExpedienteDemo,
  fetchReleaseOverviewSnapshotDemo,
  getDemoSession,
  isPrimerReleaseDemoEnabled,
  listExpedientesReleaseDemo,
  listarPendientesPagoDemo,
  loadDemoLookups,
  registrarPagoManualDemo,
  registrarPesajeDemo,
  resetPrimerReleaseDemo,
  syncDemoModeFromQuery,
  uploadComprobanteDemo
} from './primer-release-demo.js';

const CURATED = 'curated';

syncDemoModeFromQuery();

function normalizedMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.error_description || fallback;
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    throw new Error(normalizedMessage(error, `No se pudo ejecutar ${name}`));
  }
  if (data?.ok === false) {
    throw new Error(data.error || `La operacion ${name} no fue aceptada`);
  }
  return data;
}

export {
  enablePrimerReleaseDemo,
  disablePrimerReleaseDemo,
  isPrimerReleaseDemoEnabled,
  resetPrimerReleaseDemo
};

export async function signInRomanero(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo iniciar sesion'));
  }
  return data;
}

export async function signOutRomanero() {
  if (isPrimerReleaseDemoEnabled()) {
    disablePrimerReleaseDemo();
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo cerrar sesion'));
  }
}

export async function getRomaneroSession() {
  if (isPrimerReleaseDemoEnabled()) {
    return getDemoSession();
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo leer la sesion'));
  }
  return data.session;
}

export async function loadRomaneroLookups() {
  if (isPrimerReleaseDemoEnabled()) {
    return loadDemoLookups();
  }
  const [clientesRes, materialesRes, sucursalesRes] = await Promise.all([
    supabase.schema(CURATED)
      .from('clientes')
      .select('cliente_id, razon_social, rut, sucursal_principal, activo')
      .eq('activo', true)
      .order('razon_social', { ascending: true })
      .limit(500),
    supabase.schema(CURATED)
      .from('materiales')
      .select('material_id, nombre, activo')
      .eq('activo', true)
      .order('nombre', { ascending: true })
      .limit(500),
    supabase.schema(CURATED)
      .from('sucursales')
      .select('sucursal_id, nombre')
      .order('nombre', { ascending: true })
  ]);

  if (clientesRes.error) {
    throw new Error(normalizedMessage(clientesRes.error, 'No se pudieron cargar clientes'));
  }
  if (materialesRes.error) {
    throw new Error(normalizedMessage(materialesRes.error, 'No se pudieron cargar materiales'));
  }
  if (sucursalesRes.error) {
    throw new Error(normalizedMessage(sucursalesRes.error, 'No se pudieron cargar sucursales'));
  }

  return {
    clientes: clientesRes.data || [],
    materiales: materialesRes.data || [],
    sucursales: sucursalesRes.data || []
  };
}

export async function consultarPrecioVigente(materialId, sucursalId) {
  if (isPrimerReleaseDemoEnabled()) {
    return consultarPrecioVigenteDemo(materialId, sucursalId);
  }
  return rpc('consultar_precio_vigente_release', {
    p_material_id: materialId,
    p_sucursal_id: sucursalId || null
  });
}

export async function createOrRecoverExpediente(payload) {
  if (isPrimerReleaseDemoEnabled()) {
    return createOrRecoverExpedienteDemo(payload);
  }
  return rpc('create_or_recover_expediente_operacional', payload);
}

export async function registrarPesaje(payload) {
  if (isPrimerReleaseDemoEnabled()) {
    return registrarPesajeDemo(payload);
  }
  return rpc('registrar_pesaje_expediente', payload);
}

export async function listarPendientesPago(sucursalId, limit = 100) {
  if (isPrimerReleaseDemoEnabled()) {
    return listarPendientesPagoDemo(sucursalId, limit);
  }
  const data = await rpc('listar_pendientes_pago_release', {
    p_sucursal_id: sucursalId || null,
    p_limit: limit
  });
  return Array.isArray(data) ? data : [];
}

export async function registrarPagoManual(payload) {
  if (isPrimerReleaseDemoEnabled()) {
    return registrarPagoManualDemo(payload);
  }
  return rpc('registrar_pago_manual_release', payload);
}

export async function adjuntarComprobante(payload) {
  if (isPrimerReleaseDemoEnabled()) {
    return adjuntarComprobanteDemo(payload);
  }
  return rpc('adjuntar_comprobante_pago_release', payload);
}

export async function fetchExpediente(expedienteId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchExpedienteDemo(expedienteId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('expedientes_operacionales')
    .select('*')
    .eq('expediente_id', expedienteId)
    .single();

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo leer el expediente'));
  }

  return data;
}

export async function fetchExpedienteEventos(expedienteId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchExpedienteEventosDemo(expedienteId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('expediente_eventos')
    .select('evento_id, tipo_evento, actor, payload, created_at')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo leer la trazabilidad'));
  }

  return data || [];
}

export async function fetchPagosByFactura(facturaRawId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchPagosByFacturaDemo(facturaRawId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('pagos_operacionales')
    .select('*')
    .eq('factura_raw_id', facturaRawId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudieron leer los pagos'));
  }

  return data || [];
}

export async function fetchComprobantesByFactura(facturaRawId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchComprobantesByFacturaDemo(facturaRawId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('comprobantes_pago')
    .select('*')
    .eq('factura_raw_id', facturaRawId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudieron leer los comprobantes'));
  }

  return data || [];
}

export async function uploadComprobante(file, pagoId) {
  if (isPrimerReleaseDemoEnabled()) {
    return uploadComprobanteDemo(file, pagoId);
  }
  const safeName = String(file.name || 'comprobante')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_');
  const path = `primer-release/comprobantes/${pagoId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from('impulsa-documentos')
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo subir el comprobante'));
  }

  return {
    bucket: 'impulsa-documentos',
    path,
    fileName: safeName
  };
}

export async function listExpedientesRelease(sucursalId, limit = 150) {
  if (isPrimerReleaseDemoEnabled()) {
    return listExpedientesReleaseDemo(sucursalId, limit);
  }
  let query = supabase.schema(CURATED)
    .from('expedientes_operacionales')
    .select('*')
    .order('fecha_operacion', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (sucursalId) {
    query = query.eq('sucursal_id', sucursalId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudieron listar los expedientes'));
  }
  return data || [];
}

export async function fetchPesajeByExpediente(expedienteId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchPesajeByExpedienteDemo(expedienteId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('pesajes')
    .select('*')
    .eq('expediente_id', expedienteId)
    .order('fecha_captura', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo leer el pesaje del expediente'));
  }

  return data || null;
}

export async function fetchFacturasByExpediente(expedienteId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchFacturasByExpedienteDemo(expedienteId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('facturacion_raw')
    .select('*')
    .eq('expediente_id', expedienteId)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudieron leer las facturas del expediente'));
  }

  return data || [];
}

export async function fetchPagosByExpediente(expedienteId) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchPagosByExpedienteDemo(expedienteId);
  }
  const { data, error } = await supabase.schema(CURATED)
    .from('pagos_operacionales')
    .select('*')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudieron leer los pagos del expediente'));
  }

  return data || [];
}

export async function createSignedStorageUrl(bucket, path, expiresIn = 300) {
  if (isPrimerReleaseDemoEnabled()) {
    return createSignedStorageUrlDemo(bucket, path);
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo abrir el archivo'));
  }

  return data?.signedUrl || null;
}

export async function fetchReleaseOverviewSnapshot(sucursalId = null, limit = 180) {
  if (isPrimerReleaseDemoEnabled()) {
    return fetchReleaseOverviewSnapshotDemo(sucursalId, limit);
  }

  const expedientes = await listExpedientesRelease(sucursalId, limit);
  const expedienteIds = Array.from(new Set(expedientes.map((item) => item.expediente_id).filter(Boolean)));
  if (!expedienteIds.length) {
    return {
      expedientes: [],
      pesajes: [],
      facturas: [],
      pagos: [],
      eventos: [],
      comprobantes: []
    };
  }

  const [pesajesRes, facturasRes, pagosRes, eventosRes] = await Promise.all([
    supabase.schema(CURATED)
      .from('pesajes')
      .select('*')
      .in('expediente_id', expedienteIds)
      .order('fecha_captura', { ascending: false }),
    supabase.schema(CURATED)
      .from('facturacion_raw')
      .select('*')
      .in('expediente_id', expedienteIds)
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false }),
    supabase.schema(CURATED)
      .from('pagos_operacionales')
      .select('*')
      .in('expediente_id', expedienteIds)
      .order('created_at', { ascending: false }),
    supabase.schema(CURATED)
      .from('expediente_eventos')
      .select('evento_id, expediente_id, tipo_evento, actor, payload, created_at')
      .in('expediente_id', expedienteIds)
      .order('created_at', { ascending: false })
      .limit(500)
  ]);

  if (pesajesRes.error) {
    throw new Error(normalizedMessage(pesajesRes.error, 'No se pudo leer el snapshot de pesajes'));
  }
  if (facturasRes.error) {
    throw new Error(normalizedMessage(facturasRes.error, 'No se pudo leer el snapshot de facturas'));
  }
  if (pagosRes.error) {
    throw new Error(normalizedMessage(pagosRes.error, 'No se pudo leer el snapshot de pagos'));
  }
  if (eventosRes.error) {
    throw new Error(normalizedMessage(eventosRes.error, 'No se pudo leer el snapshot de eventos'));
  }

  const facturas = facturasRes.data || [];
  const facturaIds = Array.from(new Set(facturas.map((item) => item.factura_raw_id ?? item.id).filter(Boolean)));
  let comprobantes = [];

  if (facturaIds.length) {
    const comprobantesRes = await supabase.schema(CURATED)
      .from('comprobantes_pago')
      .select('*')
      .in('factura_raw_id', facturaIds)
      .order('created_at', { ascending: false });

    if (comprobantesRes.error) {
      throw new Error(normalizedMessage(comprobantesRes.error, 'No se pudo leer el snapshot de comprobantes'));
    }

    comprobantes = comprobantesRes.data || [];
  }

  return {
    expedientes,
    pesajes: pesajesRes.data || [],
    facturas,
    pagos: pagosRes.data || [],
    eventos: eventosRes.data || [],
    comprobantes
  };
}
