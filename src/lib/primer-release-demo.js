const DEMO_FLAG_KEY = 'primer-release-demo-enabled-v1';
const DEMO_STATE_KEY = 'primer-release-demo-state-v1';

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildInitialState() {
  const createdAt = nowIso();
  const expedienteId = 'demo-exp-001';
  const facturaId = 91001;
  const pagoId = 'demo-pago-001';

  return {
    seq: {
      expediente: 2,
      factura: 91002,
      pago: 2,
      comprobante: 2,
      evento: 6,
      pesaje: 2
    },
    lookups: {
      clientes: [
        {
          cliente_id: 'cli_demo_farex',
          razon_social: 'Farex Demo',
          rut: '76.123.456-7',
          sucursal_principal: 'cerrillos',
          activo: true
        },
        {
          cliente_id: 'cli_demo_reciclean',
          razon_social: 'Reciclean Operaciones',
          rut: '77.555.222-9',
          sucursal_principal: 'maipu',
          activo: true
        }
      ],
      materiales: [
        { material_id: 'carton_mixto', nombre: 'Carton Mixto', activo: true },
        { material_id: 'film_ldpe', nombre: 'Film LDPE', activo: true },
        { material_id: 'pet_transparente', nombre: 'PET Transparente', activo: true }
      ],
      sucursales: [
        { sucursal_id: 'cerrillos', nombre: 'Cerrillos' },
        { sucursal_id: 'maipu', nombre: 'Maipu' },
        { sucursal_id: 'quilicura', nombre: 'Quilicura' }
      ]
    },
    precios: {
      carton_mixto: { precio_compra_clp: 110, precio_venta_clp: 145 },
      film_ldpe: { precio_compra_clp: 280, precio_venta_clp: 335 },
      pet_transparente: { precio_compra_clp: 360, precio_venta_clp: 420 }
    },
    expedientes: [
      {
        expediente_id: expedienteId,
        expediente_codigo: 'EXP-DEMO-001',
        estado: 'pendiente_pago',
        cliente_id: 'cli_demo_farex',
        sucursal_id: 'cerrillos',
        material_id: 'film_ldpe',
        servicio_clase: 'compra_material',
        fecha_operacion: createdAt.slice(0, 10),
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    pesajes: [
      {
        pesaje_id: 'demo-pesaje-001',
        expediente_id: expedienteId,
        cliente_id: 'cli_demo_farex',
        material_id: 'film_ldpe',
        sucursal_id: 'cerrillos',
        peso_neto_kg: 1280.5,
        precio_unitario: 280,
        monto_total: 358540,
        origen_captura: 'romanero_demo',
        capturado_por: 'demo@primer-release.local',
        observaciones: 'Carga demo para preview Vercel',
        fecha_captura: createdAt,
        created_at: createdAt
      }
    ],
    facturas: [
      {
        id: facturaId,
        factura_raw_id: facturaId,
        expediente_id: expedienteId,
        folio: 'F-2026-001',
        proveedor_nombre: 'Transportes Demo Ltda.',
        proveedor_rut: '76.000.111-2',
        cliente_nombre: 'Farex Demo',
        sucursal_id: 'cerrillos',
        sucursal_nombre: 'Cerrillos',
        monto_total: 358540,
        estado_pago_release: 'pendiente_pago',
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    pagos: [
      {
        pago_id: pagoId,
        factura_raw_id: facturaId,
        expediente_id: expedienteId,
        fecha_pago: createdAt.slice(0, 10),
        monto_pagado: 180000,
        medio_pago: 'transferencia',
        estado: 'registrado',
        pagado_por_email: 'finanzas.demo@primer-release.local',
        notas: 'Abono parcial de referencia',
        created_at: createdAt
      }
    ],
    comprobantes: [
      {
        comprobante_id: 'demo-comp-001',
        pago_id: pagoId,
        factura_raw_id: facturaId,
        storage_path: 'primer-release/comprobantes/demo/demo-comp-001.pdf',
        nombre_archivo: 'comprobante-demo-001.pdf',
        mime_type: 'application/pdf',
        size_bytes: 48321,
        metadata: {
          bucket: 'impulsa-documentos',
          origen_ui: 'demo_seed'
        },
        created_at: createdAt
      }
    ],
    eventos: [
      {
        evento_id: 'demo-evt-001',
        expediente_id: expedienteId,
        tipo_evento: 'expediente_creado',
        actor: 'demo.seed',
        payload: { canal_origen: 'romanero_demo' },
        created_at: createdAt
      },
      {
        evento_id: 'demo-evt-002',
        expediente_id: expedienteId,
        tipo_evento: 'precio_consultado',
        actor: 'demo.seed',
        payload: { material_id: 'film_ldpe', sucursal_id: 'cerrillos', precio_compra_clp: 280 },
        created_at: createdAt
      },
      {
        evento_id: 'demo-evt-003',
        expediente_id: expedienteId,
        tipo_evento: 'pesaje_registrado',
        actor: 'romanero_demo',
        payload: { peso_neto_kg: 1280.5, monto_total: 358540 },
        created_at: createdAt
      },
      {
        evento_id: 'demo-evt-004',
        expediente_id: expedienteId,
        tipo_evento: 'factura_cola_pago',
        actor: 'sistema',
        payload: { factura_raw_id: facturaId, estado_pago_release: 'pendiente_pago' },
        created_at: createdAt
      },
      {
        evento_id: 'demo-evt-005',
        expediente_id: expedienteId,
        tipo_evento: 'pago_registrado',
        actor: 'finanzas.demo@primer-release.local',
        payload: { pago_id: pagoId, monto_pagado: 180000 },
        created_at: createdAt
      }
    ]
  };
}

function persistState(state) {
  window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

function readState() {
  const raw = window.localStorage.getItem(DEMO_STATE_KEY);
  if (!raw) {
    const initial = buildInitialState();
    persistState(initial);
    return initial;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const initial = buildInitialState();
    persistState(initial);
    return initial;
  }
}

function mutateState(mutator) {
  const draft = readState();
  const result = mutator(draft) ?? draft;
  persistState(result);
  return clone(result);
}

function clienteNombre(clientes, clienteId) {
  return clientes.find((item) => item.cliente_id === clienteId)?.razon_social || clienteId;
}

function sucursalNombre(sucursales, sucursalId) {
  return sucursales.find((item) => item.sucursal_id === sucursalId)?.nombre || sucursalId;
}

function pushEvento(state, expedienteId, tipo, actor, payload) {
  state.seq.evento += 1;
  state.eventos.unshift({
    evento_id: `demo-evt-${String(state.seq.evento).padStart(3, '0')}`,
    expediente_id: expedienteId,
    tipo_evento: tipo,
    actor,
    payload: payload || {},
    created_at: nowIso()
  });
}

export function syncDemoModeFromQuery() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') {
    enablePrimerReleaseDemo();
  }
  if (params.get('demo') === '0') {
    disablePrimerReleaseDemo();
  }
}

export function isPrimerReleaseDemoEnabled() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEMO_FLAG_KEY) === '1';
}

export function enablePrimerReleaseDemo() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_FLAG_KEY, '1');
  if (!window.localStorage.getItem(DEMO_STATE_KEY)) {
    persistState(buildInitialState());
  }
}

export function disablePrimerReleaseDemo() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_FLAG_KEY);
}

export function resetPrimerReleaseDemo() {
  if (typeof window === 'undefined') return;
  persistState(buildInitialState());
}

export async function getDemoSession() {
  return {
    access_token: 'demo-access-token',
    token_type: 'bearer',
    user: {
      id: 'demo-user-001',
      email: 'demo@primer-release.local'
    }
  };
}

export async function loadDemoLookups() {
  const state = readState();
  return clone(state.lookups);
}

export async function consultarPrecioVigenteDemo(materialId, sucursalId) {
  const state = readState();
  const precio = state.precios[materialId];
  if (!precio) {
    throw new Error('No hay precio demo para ese material');
  }
  return {
    material_id: materialId,
    sucursal_id: sucursalId || null,
    precio_compra_clp: precio.precio_compra_clp,
    precio_venta_clp: precio.precio_venta_clp,
    vigencia_desde: nowIso().slice(0, 10),
    fuente: 'demo_local'
  };
}

export async function createOrRecoverExpedienteDemo(payload) {
  const state = mutateState((draft) => {
    const found = draft.expedientes.find((item) =>
      item.cliente_id === payload.p_cliente_id &&
      item.sucursal_id === payload.p_sucursal_id &&
      item.material_id === payload.p_material_id &&
      item.fecha_operacion === payload.p_fecha_operacion &&
      item.estado !== 'cerrado' &&
      item.estado !== 'cancelado'
    );

    if (found) {
      found.updated_at = nowIso();
      return draft;
    }

    draft.seq.expediente += 1;
    const suffix = String(draft.seq.expediente).padStart(3, '0');
    const record = {
      expediente_id: `demo-exp-${suffix}`,
      expediente_codigo: `EXP-DEMO-${suffix}`,
      estado: 'en_proceso',
      cliente_id: payload.p_cliente_id,
      sucursal_id: payload.p_sucursal_id,
      material_id: payload.p_material_id,
      servicio_clase: payload.p_servicio_clase,
      fecha_operacion: payload.p_fecha_operacion,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    draft.expedientes.unshift(record);
    pushEvento(draft, record.expediente_id, 'expediente_creado', 'romanero_demo', payload.p_handoff_payload);
    return draft;
  });

  const expediente = state.expedientes.find((item) =>
    item.cliente_id === payload.p_cliente_id &&
    item.sucursal_id === payload.p_sucursal_id &&
    item.material_id === payload.p_material_id &&
    item.fecha_operacion === payload.p_fecha_operacion
  );

  return {
    ok: true,
    created: state.eventos[0]?.tipo_evento === 'expediente_creado',
    expediente_id: expediente?.expediente_id
  };
}

export async function registrarPesajeDemo(payload) {
  const state = mutateState((draft) => {
    draft.seq.pesaje += 1;
    const createdAt = nowIso();
    draft.pesajes.unshift({
      pesaje_id: `demo-pesaje-${String(draft.seq.pesaje).padStart(3, '0')}`,
      expediente_id: payload.p_expediente_id,
      cliente_id: payload.p_cliente_id,
      material_id: payload.p_material_id,
      sucursal_id: payload.p_sucursal_id,
      peso_neto_kg: payload.p_peso_neto_kg,
      precio_unitario: payload.p_precio_unitario,
      monto_total: payload.p_monto_total,
      origen_captura: payload.p_origen_captura,
      capturado_por: payload.p_capturado_por,
      observaciones: payload.p_observaciones,
      fecha_captura: createdAt,
      created_at: createdAt
    });

    const expediente = draft.expedientes.find((item) => item.expediente_id === payload.p_expediente_id);
    if (expediente) {
      expediente.estado = 'pendiente_factura';
      expediente.updated_at = createdAt;
      pushEvento(draft, expediente.expediente_id, 'pesaje_registrado', payload.p_capturado_por || 'romanero_demo', {
        peso_neto_kg: payload.p_peso_neto_kg,
        monto_total: payload.p_monto_total,
        precio_unitario: payload.p_precio_unitario
      });

      draft.seq.factura += 1;
      const cliente = clienteNombre(draft.lookups.clientes, payload.p_cliente_id);
      const sucursal = sucursalNombre(draft.lookups.sucursales, payload.p_sucursal_id);
      const facturaId = draft.seq.factura;
      draft.facturas.unshift({
        id: facturaId,
        factura_raw_id: facturaId,
        expediente_id: expediente.expediente_id,
        folio: `F-DEMO-${String(facturaId).padStart(4, '0')}`,
        proveedor_nombre: 'Proveedor Demo Primer Release',
        proveedor_rut: '76.888.111-5',
        cliente_nombre: cliente,
        sucursal_id: payload.p_sucursal_id,
        sucursal_nombre: sucursal,
        monto_total: payload.p_monto_total,
        estado_pago_release: 'pendiente_pago',
        created_at: createdAt,
        updated_at: createdAt
      });
      expediente.estado = 'pendiente_pago';
      pushEvento(draft, expediente.expediente_id, 'factura_cola_pago', 'sistema_demo', {
        factura_raw_id: facturaId,
        estado_pago_release: 'pendiente_pago'
      });
    }
    return draft;
  });

  return clone(state.pesajes[0]);
}

export async function listarPendientesPagoDemo(sucursalId, limit = 100) {
  const state = readState();
  return clone(
    state.facturas
      .filter((item) => !sucursalId || item.sucursal_id === sucursalId)
      .filter((item) => ['pendiente_pago', 'pagado_pendiente_conciliacion'].includes(item.estado_pago_release))
      .slice(0, limit)
  );
}

export async function registrarPagoManualDemo(payload) {
  const state = mutateState((draft) => {
    draft.seq.pago += 1;
    const createdAt = nowIso();
    draft.pagos.unshift({
      pago_id: `demo-pago-${String(draft.seq.pago).padStart(3, '0')}`,
      factura_raw_id: payload.p_factura_raw_id,
      expediente_id: payload.p_expediente_id,
      fecha_pago: payload.p_fecha_pago,
      monto_pagado: payload.p_monto_pagado,
      medio_pago: payload.p_medio_pago,
      estado: 'registrado',
      pagado_por_email: payload.p_pagado_por_email,
      notas: payload.p_notas,
      created_at: createdAt
    });

    const factura = draft.facturas.find((item) => String(item.factura_raw_id) === String(payload.p_factura_raw_id));
    if (factura) {
      factura.estado_pago_release = 'pagado_pendiente_conciliacion';
      factura.updated_at = createdAt;
    }

    const expediente = draft.expedientes.find((item) => item.expediente_id === payload.p_expediente_id);
    if (expediente) {
      expediente.estado = 'pagado_pendiente_conciliacion';
      expediente.updated_at = createdAt;
      pushEvento(draft, expediente.expediente_id, 'pago_registrado', payload.p_pagado_por_email || 'finanzas_demo', {
        factura_raw_id: payload.p_factura_raw_id,
        monto_pagado: payload.p_monto_pagado,
        medio_pago: payload.p_medio_pago
      });
      pushEvento(draft, expediente.expediente_id, 'retorno_operacion_comercial', 'sistema_demo', {
        estado: 'pagado_pendiente_conciliacion'
      });
    }
    return draft;
  });

  return clone(state.pagos[0]);
}

export async function adjuntarComprobanteDemo(payload) {
  const state = mutateState((draft) => {
    draft.seq.comprobante += 1;
    draft.comprobantes.unshift({
      comprobante_id: `demo-comp-${String(draft.seq.comprobante).padStart(3, '0')}`,
      pago_id: payload.p_pago_id,
      factura_raw_id: payload.p_factura_raw_id,
      storage_path: payload.p_storage_path,
      nombre_archivo: payload.p_nombre_archivo,
      mime_type: payload.p_mime_type,
      size_bytes: payload.p_size_bytes,
      metadata: payload.p_metadata || {},
      created_at: nowIso()
    });
    return draft;
  });
  return clone(state.comprobantes[0]);
}

export async function fetchExpedienteDemo(expedienteId) {
  const state = readState();
  const found = state.expedientes.find((item) => item.expediente_id === expedienteId);
  if (!found) throw new Error('No se encontro el expediente demo');
  return clone(found);
}

export async function fetchExpedienteEventosDemo(expedienteId) {
  const state = readState();
  return clone(state.eventos.filter((item) => item.expediente_id === expedienteId));
}

export async function fetchPagosByFacturaDemo(facturaRawId) {
  const state = readState();
  return clone(state.pagos.filter((item) => String(item.factura_raw_id) === String(facturaRawId)));
}

export async function fetchComprobantesByFacturaDemo(facturaRawId) {
  const state = readState();
  return clone(state.comprobantes.filter((item) => String(item.factura_raw_id) === String(facturaRawId)));
}

export async function uploadComprobanteDemo(file, pagoId) {
  const safeName = String(file.name || 'comprobante-demo')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_');
  return {
    bucket: 'impulsa-documentos',
    path: `primer-release/comprobantes/demo/${pagoId}_${safeName}`,
    fileName: safeName
  };
}

export async function listExpedientesReleaseDemo(sucursalId, limit = 150) {
  const state = readState();
  return clone(
    state.expedientes
      .filter((item) => !sucursalId || item.sucursal_id === sucursalId)
      .slice(0, limit)
  );
}

export async function fetchPesajeByExpedienteDemo(expedienteId) {
  const state = readState();
  return clone(state.pesajes.find((item) => item.expediente_id === expedienteId) || null);
}

export async function fetchFacturasByExpedienteDemo(expedienteId) {
  const state = readState();
  return clone(state.facturas.filter((item) => item.expediente_id === expedienteId));
}

export async function fetchPagosByExpedienteDemo(expedienteId) {
  const state = readState();
  return clone(state.pagos.filter((item) => item.expediente_id === expedienteId));
}

export async function fetchReleaseOverviewSnapshotDemo(sucursalId, limit = 180) {
  const state = readState();
  const expedientes = state.expedientes
    .filter((item) => !sucursalId || item.sucursal_id === sucursalId)
    .slice(0, limit);
  const expedienteIds = new Set(expedientes.map((item) => item.expediente_id));
  const facturas = state.facturas.filter((item) => expedienteIds.has(item.expediente_id));
  const facturaIds = new Set(facturas.map((item) => String(item.factura_raw_id ?? item.id)));

  return clone({
    expedientes,
    pesajes: state.pesajes.filter((item) => expedienteIds.has(item.expediente_id)),
    facturas,
    pagos: state.pagos.filter((item) => expedienteIds.has(item.expediente_id)),
    eventos: state.eventos.filter((item) => expedienteIds.has(item.expediente_id)),
    comprobantes: state.comprobantes.filter((item) => facturaIds.has(String(item.factura_raw_id)))
  });
}

export async function createSignedStorageUrlDemo(bucket, path) {
  const message = encodeURIComponent(`Demo Primer Release\nbucket=${bucket}\npath=${path}`);
  return `data:text/plain;charset=utf-8,${message}`;
}
