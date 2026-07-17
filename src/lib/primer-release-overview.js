const ACTIVE_STATES = new Set([
  'agendado',
  'recepcionado',
  'en_proceso',
  'pendiente_factura',
  'pendiente_pago',
  'pagado_pendiente_conciliacion'
]);

function asNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatKg(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `${new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(asNumber(value))} kg`;
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

function dayKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function deriveReleaseOverview(snapshot) {
  const expedientes = snapshot.expedientes || [];
  const pesajes = snapshot.pesajes || [];
  const facturas = snapshot.facturas || [];
  const pagos = snapshot.pagos || [];
  const eventos = snapshot.eventos || [];
  const comprobantes = snapshot.comprobantes || [];
  const today = dayKey(new Date().toISOString());

  const pesajeByExpediente = buildIndex(pesajes, 'expediente_id');
  const facturasByExpediente = buildIndex(facturas, 'expediente_id', true);
  const pagosByExpediente = buildIndex(pagos, 'expediente_id', true);
  const eventosByExpediente = buildIndex(eventos, 'expediente_id', true);
  const comprobantesByFactura = buildIndex(comprobantes, 'factura_raw_id', true);
  const expedienteById = new Map(expedientes.map((item) => [item.expediente_id, item]));

  const byState = {
    total: expedientes.length,
    recepcionado: 0,
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
  let kilosTotal = 0;
  let kilosHoy = 0;
  let capturasHoy = 0;
  let capturasTotal = pesajes.length;
  let expedientesActivos = 0;
  let expedientesConPesaje = 0;

  const operationalAlerts = [];
  const financialAlerts = [];
  const sucursalMap = new Map();
  const materialMap = new Map();
  const serviceClassMap = new Map();

  for (const pesaje of pesajes) {
    const kilos = asNumber(pesaje.peso_neto_kg);
    kilosTotal += kilos;
    if (dayKey(pesaje.fecha_captura || pesaje.created_at) === today) {
      kilosHoy += kilos;
      capturasHoy += 1;
    }
  }

  for (const expediente of expedientes) {
    if (expediente.estado in byState) {
      byState[expediente.estado] += 1;
    }

    const pesaje = pesajeByExpediente.get(expediente.expediente_id) || null;
    const expFacturas = facturasByExpediente.get(expediente.expediente_id) || [];
    const expPagos = pagosByExpediente.get(expediente.expediente_id) || [];
    const expEventos = eventosByExpediente.get(expediente.expediente_id) || [];
    const facturaMonto = expFacturas.reduce((sum, item) => sum + asNumber(item.monto_total), 0);
    const pagoMonto = expPagos.reduce((sum, item) => sum + asNumber(item.monto_pagado), 0);
    const kilos = asNumber(pesaje?.peso_neto_kg);
    const captureDay = dayKey(pesaje?.fecha_captura || pesaje?.created_at);
    const materialId = pesaje?.material_id || expediente.material_id || 'sin_material';
    const serviceClass = expediente.servicio_clase || 'sin_servicio';

    montoPagado += pagoMonto;
    if (expediente.estado === 'pendiente_pago') {
      montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
      const pendingAge = hoursSince(expediente.updated_at || expediente.created_at || expediente.fecha_operacion);
      oldestPendingHours = Math.max(oldestPendingHours, pendingAge || 0);
    }

    if (ACTIVE_STATES.has(expediente.estado)) {
      expedientesActivos += 1;
    }
    if (pesaje) {
      expedientesConPesaje += 1;
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
      activos: 0,
      capturas: 0,
      kilosTotal: 0,
      kilosHoy: 0,
      expedientesSinPesaje: 0,
      staleActive: 0,
      recepcionado: 0,
      enProceso: 0,
      pendiente_pago: 0,
      pagado_pendiente_conciliacion: 0,
      montoPendiente: 0
    };
    sucursal.total += 1;
    if (ACTIVE_STATES.has(expediente.estado)) {
      sucursal.activos += 1;
    }
    if (pesaje) {
      sucursal.capturas += 1;
      sucursal.kilosTotal += kilos;
      if (captureDay === today) {
        sucursal.kilosHoy += kilos;
      }
    }
    if (!pesaje && ACTIVE_STATES.has(expediente.estado) && expediente.estado !== 'agendado') {
      sucursal.expedientesSinPesaje += 1;
    }
    if (expediente.estado === 'recepcionado') {
      sucursal.recepcionado += 1;
    }
    if (expediente.estado === 'en_proceso') {
      sucursal.enProceso += 1;
    }
    if (expediente.estado === 'pendiente_pago') {
      sucursal.pendiente_pago += 1;
      sucursal.montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
    }
    if (expediente.estado === 'pagado_pendiente_conciliacion') {
      sucursal.pagado_pendiente_conciliacion += 1;
    }
    if (ACTIVE_STATES.has(expediente.estado) && staleHours !== null && staleHours >= 48) {
      sucursal.staleActive += 1;
    }
    sucursalMap.set(sucursal.sucursal_id, sucursal);

    const material = materialMap.get(materialId) || {
      material_id: materialId,
      capturas: 0,
      expedientes: 0,
      kilosTotal: 0,
      kilosHoy: 0,
      sucursales: new Set()
    };
    material.expedientes += 1;
    if (pesaje) {
      material.capturas += 1;
      material.kilosTotal += kilos;
      if (captureDay === today) {
        material.kilosHoy += kilos;
      }
      if (expediente.sucursal_id) {
        material.sucursales.add(expediente.sucursal_id);
      }
    }
    materialMap.set(materialId, material);

    const service = serviceClassMap.get(serviceClass) || {
      servicio_clase: serviceClass,
      expedientes: 0,
      capturas: 0,
      kilosTotal: 0,
      kilosHoy: 0
    };
    service.expedientes += 1;
    if (pesaje) {
      service.capturas += 1;
      service.kilosTotal += kilos;
      if (captureDay === today) {
        service.kilosHoy += kilos;
      }
    }
    serviceClassMap.set(serviceClass, service);
  }

  const coberturaPesajePct = expedientesActivos ? Math.round((expedientesConPesaje / expedientesActivos) * 100) : 100;
  const kilosPromedioCaptura = capturasTotal ? kilosTotal / capturasTotal : 0;
  const ultimaCapturaAt = pesajes
    .map((item) => item.fecha_captura || item.created_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  if (expedientesActivos > 0 && kilosHoy <= 0) {
    operationalAlerts.push({
      severity: 'critical',
      title: 'Sin kilos capturados hoy',
      detail: `${expedientesActivos} expedientes activos sin captura visible en la jornada.`,
      state: ''
    });
  }

  if (byState.pendiente_pago > 0) {
    financialAlerts.push({
      severity: oldestPendingHours >= 48 ? 'critical' : 'warning',
      title: `${byState.pendiente_pago} expedientes en cola de pago`,
      detail: `Monto expuesto ${formatMoney(montoPendiente)} · más antiguo ${pendingOldestLabel(oldestPendingHours)}`,
      state: 'pendiente_pago'
    });
  }

  if (byState.pagado_pendiente_conciliacion > 0) {
    financialAlerts.push({
      severity: 'warning',
      title: `${byState.pagado_pendiente_conciliacion} pagos pendientes de conciliación`,
      detail: 'Conviene cerrar conciliación y validar documentación asociada.',
      state: 'pagado_pendiente_conciliacion'
    });
  }

  if (pagosSinComprobante > 0) {
    financialAlerts.push({
      severity: pagosSinComprobante >= 2 ? 'critical' : 'warning',
      title: `${pagosSinComprobante} expedientes con pago sin comprobante`,
      detail: 'Hay pagos registrados que todavía no tienen respaldo documental en el release.',
      state: ''
    });
  }

  if (expedientesSinPesaje > 0) {
    operationalAlerts.push({
      severity: expedientesSinPesaje >= 2 ? 'critical' : 'warning',
      title: `${expedientesSinPesaje} expedientes activos sin pesaje visible`,
      detail: 'La compra quedó abierta sin captura firme de kilos en el flujo operativo.',
      state: ''
    });
  }

  if (staleActive > 0) {
    operationalAlerts.push({
      severity: staleActive >= 3 ? 'critical' : 'warning',
      title: `${staleActive} expedientes activos sin movimiento reciente`,
      detail: 'No muestran continuidad operativa relevante en las últimas 48 horas.',
      state: ''
    });
  }

  if (coberturaPesajePct < 80 && expedientesActivos >= 3) {
    operationalAlerts.push({
      severity: coberturaPesajePct < 60 ? 'critical' : 'warning',
      title: `Cobertura de pesaje en ${coberturaPesajePct}%`,
      detail: 'La captura visible no acompaña el volumen de expedientes activos.',
      state: ''
    });
  }

  const sucursalMasFragil = Array.from(sucursalMap.values())
    .sort((a, b) => (b.expedientesSinPesaje - a.expedientesSinPesaje) || (b.activos - a.activos))[0] || null;
  if (sucursalMasFragil && sucursalMasFragil.expedientesSinPesaje > 0) {
    operationalAlerts.push({
      severity: sucursalMasFragil.expedientesSinPesaje >= 2 ? 'critical' : 'warning',
      title: `${sucursalMasFragil.sucursal_id} concentra la mayor brecha de captura`,
      detail: `${sucursalMasFragil.expedientesSinPesaje} expedientes sin pesaje visible y ${formatKg(sucursalMasFragil.kilosHoy)} capturados hoy.`,
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

  const recentCaptures = pesajes
    .slice()
    .sort((a, b) => new Date(b.fecha_captura || b.created_at).getTime() - new Date(a.fecha_captura || a.created_at).getTime())
    .slice(0, 10)
    .map((pesaje) => ({
      ...pesaje,
      expediente_codigo: expedienteById.get(pesaje.expediente_id)?.expediente_codigo || pesaje.expediente_id
    }));

  const sucursales = Array.from(sucursalMap.values())
    .map((item) => ({
      ...item,
      coberturaPesajePct: item.activos ? Math.round(((item.activos - item.expedientesSinPesaje) / item.activos) * 100) : 100,
      backlogLocal: item.expedientesSinPesaje + item.staleActive,
      intensidadRecepcion: item.capturas ? Math.round(item.kilosTotal / item.capturas) : 0
    }))
    .sort((a, b) => (b.kilosHoy - a.kilosHoy) || (b.kilosTotal - a.kilosTotal) || (b.expedientesSinPesaje - a.expedientesSinPesaje))
    .slice(0, 6);

  const materialesRaw = Array.from(materialMap.values());
  const servicios = Array.from(serviceClassMap.values())
    .sort((a, b) => (b.kilosHoy - a.kilosHoy) || (b.kilosTotal - a.kilosTotal) || (b.expedientes - a.expedientes))
    .slice(0, 6);
  const materiales = materialesRaw
    .map((item) => ({
      ...item,
      sucursalesCount: item.sucursales.size
    }))
    .sort((a, b) => (b.kilosHoy - a.kilosHoy) || (b.kilosTotal - a.kilosTotal) || (b.capturas - a.capturas))
    .slice(0, 6);

  const alerts = [...operationalAlerts, ...financialAlerts]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  const alertCounts = {
    critical: alerts.filter((item) => item.severity === 'critical').length,
    warning: alerts.filter((item) => item.severity === 'warning').length
  };

  const bottleneckSucursal = sucursales
    .slice()
    .sort((a, b) => (b.backlogLocal - a.backlogLocal) || (a.coberturaPesajePct - b.coberturaPesajePct) || (b.activos - a.activos))[0] || null;

  const plantPulse = {
    sucursalesActivas: sucursales.filter((item) => item.activos > 0).length,
    recepcionados: byState.recepcionado || 0,
    enProceso: byState.en_proceso,
    backlogVisible: expedientesSinPesaje + staleActive,
    cuelloPrincipal: bottleneckSucursal,
    telemetriaDisponible: [
      kilosHoy > 0 ? 'kilos capturados' : null,
      capturasHoy > 0 ? 'capturas del día' : null,
      expedientes.length > 0 ? 'continuidad por expediente' : null,
      pagos.length > 0 ? 'cierre financiero secundario' : null
    ].filter(Boolean)
  };

  return {
    byState,
    kilosTotal,
    kilosHoy,
    capturasHoy,
    capturasTotal,
    kilosPromedioCaptura,
    expedientesActivos,
    expedientesConPesaje,
    coberturaPesajePct,
    ultimaCapturaAt,
    sucursalesConCaptura: Array.from(sucursalMap.values()).filter((item) => item.capturas > 0).length,
    materialesConCaptura: materialesRaw.filter((item) => item.capturas > 0).length,
    montoPendiente,
    montoPagado,
    pagosSinComprobante,
    expedientesSinPesaje,
    staleActive,
    oldestPendingHours,
    operationalAlerts: operationalAlerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    financialAlerts: financialAlerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    alerts,
    alertCounts,
    recentActivity,
    recentCaptures,
    sucursales,
    materiales,
    servicios,
    plantPulse
  };
}
