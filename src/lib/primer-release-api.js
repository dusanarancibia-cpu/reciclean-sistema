import { supabase } from './supabase.js';

const CURATED = 'curated';

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
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo cerrar sesion'));
  }
}

export async function getRomaneroSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo leer la sesion'));
  }
  return data.session;
}

export async function loadRomaneroLookups() {
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
  return rpc('consultar_precio_vigente_release', {
    p_material_id: materialId,
    p_sucursal_id: sucursalId || null
  });
}

export async function createOrRecoverExpediente(payload) {
  return rpc('create_or_recover_expediente_operacional', payload);
}

export async function registrarPesaje(payload) {
  return rpc('registrar_pesaje_expediente', payload);
}

export async function listarPendientesPago(sucursalId, limit = 100) {
  const data = await rpc('listar_pendientes_pago_release', {
    p_sucursal_id: sucursalId || null,
    p_limit: limit
  });
  return Array.isArray(data) ? data : [];
}

export async function registrarPagoManual(payload) {
  return rpc('registrar_pago_manual_release', payload);
}

export async function adjuntarComprobante(payload) {
  return rpc('adjuntar_comprobante_pago_release', payload);
}

export async function fetchExpediente(expedienteId) {
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
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(normalizedMessage(error, 'No se pudo abrir el archivo'));
  }

  return data?.signedUrl || null;
}
