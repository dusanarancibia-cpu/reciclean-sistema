const ACTIVE_STATES = new Set([
  'agendado',
  'recepcionado',
  'en_proceso',
  'pendiente_factura',
  'pendiente_pago',
  'pagado_pendiente_conciliacion'
]);

export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function hoursSince(value) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, diff / 36e5);
}

export function relativeAge(value) {
  const hours = hoursSince(value);
  if (hours === null) return 'sin dato';
  if (hours < 1) return '< 1 h';
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

export function pendingOldestLabel(hours) {
  if (!hours) return 'sin cola';
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

export function severityRank(severity) {
  return severity === 'critical' ? 3 : severity === 'warning' ? 2 : 1;
}

export function severityLabel(severity) {
  if (severity === 'critical') return 'Crítica';
  if (severity === 'warning') return 'Atención';
  return 'Info';
}

export function healthTone(overview) {
  if (!overview) return 'ok';
  if (overview.alertCounts.critical > 0) return 'critical';
  if (overview.alertCounts.warning > 0) return 'warning';
  return 'ok';
}

export function healthLabel(overview) {
  const tone = healthTone(overview);
  if (tone === 'critical') return 'Riesgo operativo';
  if (tone === 'warning') return 'Vigilancia activa';
  return 'Release estable';
}

function buildIndex(items, key, multiple = false) {
  const map = new Map();
  for (const item of items || []) {
    const mapKey = item?.[key];
    if (!mapKey) continue;
    if (multiple) {
      const bucket = map.get(mapKey) || [];
      bucket.push(item);
      map.set(mapKey, bucket);
    } else if (!map.has(mapKey)) {
      map.set(mapKey, item);
    }
  }
  return map;
}

function maxDate(...values) {
  const valid = values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!valid.length) return null;
  return new Date(Math.max(...valid)).toISOString();
}

export function deriveReleaseOverview(snapshot) {
  const expedientes = snapshot.expedientes || [];
  const pesajes = snapshot.pesajes || [];
  const facturas = snapshot.facturas || [];
  const pagos = snapshot.pagos || [];
  const eventos = snapshot.eventos || [];
  const comprobantes = snapshot.comprobantes || [];

  const pesajeByExpediente = buildIndex(pesajes, 'expediente_id');
  const facturasByExpediente = buildIndex(facturas, 'expediente_id', true);
  const pagosByExpediente = buildIndex(pagos, 'expediente_id', true);
  const eventosByExpediente = buildIndex(eventos, 'expediente_id', true);
  const comprobantesByFactura = buildIndex(comprobantes, 'factura_raw_id', true);
  const expedienteById = new Map(expedientes.map((item) => [item.expediente_id, item]));

  const byState = {
    total: expedientes.length,
    en_proceso: 0,
    pendiente_factura: 0,
    pendiente_pago: 0,
    pagado_pendiente_conciliacion: 0,
    cerrado: 0
  };

  let montoPendiente = 0;
  let montoPagado = 0;
  let pagosSinComprobante = 0;
  let expedientesSinPesaje = 0;
  let staleActive = 0;
  let oldestPendingHours = 0;

  const alerts = [];
  const sucursalMap = new Map();

  for (const expediente of expedientes) {
    if (expediente.estado in byState) {
      byState[expediente.estado] += 1;
    }

    const pesaje = pesajeByExpediente.get(expediente.expediente_id) || null;
    const expFacturas = facturasByExpediente.get(expediente.expediente_id) || [];
    const expPagos = pagosByExpediente.get(expediente.expediente_id) || [];
    const expEventos = eventosByExpediente.get(expediente.expediente_id) || [];
    const facturaMonto = expFacturas.reduce((sum, item) => sum + Number(item.monto_total || 0), 0);
    const pagoMonto = expPagos.reduce((sum, item) => sum + Number(item.monto_pagado || 0), 0);

    montoPagado += pagoMonto;
    if (expediente.estado === 'pendiente_pago') {
      montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
      const pendingAge = hoursSince(expediente.updated_at || expediente.created_at || expediente.fecha_operacion);
      oldestPendingHours = Math.max(oldestPendingHours, pendingAge || 0);
    }

    if (!pesaje && ACTIVE_STATES.has(expediente.estado) && expediente.estado !== 'agendado') {
      expedientesSinPesaje += 1;
    }

    const lastEventAt = expEventos[0]?.created_at || null;
    const lastFacturaAt = expFacturas[0]?.updated_at || expFacturas[0]?.created_at || null;
    const lastPagoAt = expPagos[0]?.created_at || null;
    const lastActivityAt = maxDate(
      expediente.updated_at,
      expediente.created_at,
      lastEventAt,
      lastFacturaAt,
      lastPagoAt,
      pesaje?.fecha_captura,
      pesaje?.created_at
    );
    const staleHours = hoursSince(lastActivityAt);
    if (ACTIVE_STATES.has(expediente.estado) && staleHours !== null && staleHours >= 48) {
      staleActive += 1;
    }

    const comprobantesExp = expFacturas.flatMap((factura) =>
      comprobantesByFactura.get(factura.factura_raw_id ?? factura.id) || []
    );
    if (expPagos.length > 0 && comprobantesExp.length === 0) {
      pagosSinComprobante += 1;
    }

    const sucursal = sucursalMap.get(expediente.sucursal_id || 'sin_sucursal') || {
      sucursal_id: expediente.sucursal_id || 'sin_sucursal',
      total: 0,
      pendiente_pago: 0,
      pagado_pendiente_conciliacion: 0,
      montoPendiente: 0
    };
    sucursal.total += 1;
    if (expediente.estado === 'pendiente_pago') {
      sucursal.pendiente_pago += 1;
      sucursal.montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
    }
    if (expediente.estado === 'pagado_pendiente_conciliacion') {
      sucursal.pagado_pendiente_conciliacion += 1;
    }
    sucursalMap.set(sucursal.sucursal_id, sucursal);
  }

  if (byState.pendiente_pago > 0) {
    alerts.push({
      severity: oldestPendingHours >= 48 ? 'critical' : 'warning',
      title: `${byState.pendiente_pago} expedientes en cola de pago`,
      detail: `Monto expuesto ${formatMoney(montoPendiente)} · más antiguo ${pendingOldestLabel(oldestPendingHours)}`,
      state: 'pendiente_pago'
    });
  }

  if (byState.pagado_pendiente_conciliacion > 0) {
    alerts.push({
      severity: 'warning',
      title: `${byState.pagado_pendiente_conciliacion} pagos pendientes de conciliación`,
      detail: 'Conviene cerrar conciliación y validar documentación asociada.',
      state: 'pagado_pendiente_conciliacion'
    });
  }

  if (pagosSinComprobante > 0) {
    alerts.push({
      severity: pagosSinComprobante >= 2 ? 'critical' : 'warning',
      title: `${pagosSinComprobante} expedientes con pago sin comprobante`,
      detail: 'Hay pagos registrados que todavía no tienen respaldo documental en el release.',
      state: ''
    });
  }

  if (expedientesSinPesaje > 0) {
    alerts.push({
      severity: 'warning',
      title: `${expedientesSinPesaje} expedientes activos sin pesaje visible`,
      detail: 'Revisar consistencia entre captura operativa y expediente.',
      state: ''
    });
  }

  if (staleActive > 0) {
    alerts.push({
      severity: staleActive >= 3 ? 'critical' : 'warning',
      title: `${staleActive} expedientes activos sin movimiento reciente`,
      detail: 'No muestran actividad relevante en las últimas 48 horas.',
      state: ''
    });
  }

  const recentActivity = eventos
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((evento) => ({
      ...evento,
      expediente_codigo: expedienteById.get(evento.expediente_id)?.expediente_codigo || evento.expediente_id
    }));

  const sucursales = Array.from(sucursalMap.values())
    .sort((a, b) => (b.pendiente_pago - a.pendiente_pago) || (b.total - a.total))
    .slice(0, 6);

  const alertCounts = {
    critical: alerts.filter((item) => item.severity === 'critical').length,
    warning: alerts.filter((item) => item.severity === 'warning').length
  };

  return {
    byState,
    montoPendiente,
    montoPagado,
    pagosSinComprobante,
    expedientesSinPesaje,
    staleActive,
    oldestPendingHours,
    alerts: alerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    alertCounts,
    recentActivity,
    sucursales
  };
}
