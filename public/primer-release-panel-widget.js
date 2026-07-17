(function () {
  const DEMO_FLAG_KEY = 'primer-release-demo-enabled-v1';
  const DEMO_STATE_KEY = 'primer-release-demo-state-v1';
  const ACTIVE_STATES = new Set([
    'agendado',
    'recepcionado',
    'en_proceso',
    'pendiente_factura',
    'pendiente_pago',
    'pagado_pendiente_conciliacion'
  ]);

  function byId(id) {
    return document.getElementById(id);
  }

  function money(value) {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(Number(value));
  }

  function formatKg(value) {
    if (value === null || value === undefined || value === '') return '—';
    return `${new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value))} kg`;
  }

  function dayKey(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function buildOverview(snapshot) {
    const expedientes = snapshot.expedientes || [];
    const pesajes = snapshot.pesajes || [];
    const facturas = snapshot.facturas || [];
    const pagos = snapshot.pagos || [];
    const comprobantes = snapshot.comprobantes || [];
    const eventos = snapshot.eventos || [];
    const today = dayKey(new Date().toISOString());

    const pesajeByExpediente = new Map();
    const facturasByExpediente = new Map();
    const pagosByExpediente = new Map();
    const comprobantesByFactura = new Map();
    const createdEventByExpediente = new Map();

    pesajes.forEach((item) => {
      if (!pesajeByExpediente.has(item.expediente_id)) {
        pesajeByExpediente.set(item.expediente_id, item);
      }
    });
    facturas.forEach((item) => {
      const bucket = facturasByExpediente.get(item.expediente_id) || [];
      bucket.push(item);
      facturasByExpediente.set(item.expediente_id, bucket);
    });
    pagos.forEach((item) => {
      const bucket = pagosByExpediente.get(item.expediente_id) || [];
      bucket.push(item);
      pagosByExpediente.set(item.expediente_id, bucket);
    });
    comprobantes.forEach((item) => {
      const key = String(item.factura_raw_id);
      const bucket = comprobantesByFactura.get(key) || [];
      bucket.push(item);
      comprobantesByFactura.set(key, bucket);
    });
    eventos.forEach((item) => {
      if (item.tipo_evento === 'expediente_creado' && !createdEventByExpediente.has(item.expediente_id)) {
        createdEventByExpediente.set(item.expediente_id, item);
      }
    });

    let pendientePago = 0;
    let pagadoPendiente = 0;
    let montoPendiente = 0;
    let pagosSinComprobante = 0;
    let kilosHoy = 0;
    let kilosTotal = 0;
    let capturasHoy = 0;
    let expedientesSinPesaje = 0;
    let expedientesActivos = 0;
    let agendaCount = 0;
    let terrenoCount = 0;
    let sucursalCount = 0;
    let plantaCount = 0;
    let finanzasCount = 0;

    pesajes.forEach((item) => {
      const kilos = Number(item.peso_neto_kg || 0);
      kilosTotal += kilos;
      if (dayKey(item.fecha_captura || item.created_at) === today) {
        kilosHoy += kilos;
        capturasHoy += 1;
      }
    });

    expedientes.forEach((expediente) => {
      const pesaje = pesajeByExpediente.get(expediente.expediente_id) || null;
      const expFacturas = facturasByExpediente.get(expediente.expediente_id) || [];
      const expPagos = pagosByExpediente.get(expediente.expediente_id) || [];
      const createdPayload = createdEventByExpediente.get(expediente.expediente_id)?.payload || {};
      const agendaServicio = createdPayload.agenda_servicio || null;
      const facturaMonto = expFacturas.reduce((sum, item) => sum + Number(item.monto_total || 0), 0);
      const pagoMonto = expPagos.reduce((sum, item) => sum + Number(item.monto_pagado || 0), 0);
      const comprobantesExp = expFacturas.flatMap((factura) =>
        comprobantesByFactura.get(String(factura.factura_raw_id ?? factura.id)) || []
      );
      const hasAgenda = Boolean(
        expediente.estado === 'agendado' ||
        agendaServicio?.agenda_servicio_id ||
        createdPayload.oportunidad_id
      );
      const hasTerreno = Boolean(
        agendaServicio?.agenda_servicio_id ||
        createdPayload.origen_operacional === 'handoff_andrea'
      );
      const hasSucursal = Boolean(
        pesaje ||
        ['recepcionado', 'en_proceso', 'pendiente_factura', 'pendiente_pago', 'pagado_pendiente_conciliacion', 'cerrado'].includes(expediente.estado)
      );
      const hasPlanta = Boolean(
        ['recepcionado', 'en_proceso', 'pendiente_factura', 'pendiente_pago', 'pagado_pendiente_conciliacion', 'cerrado'].includes(expediente.estado)
      );
      const hasFinanzas = Boolean(
        ['pendiente_factura', 'pendiente_pago', 'pagado_pendiente_conciliacion', 'cerrado'].includes(expediente.estado)
      );

      if (ACTIVE_STATES.has(expediente.estado)) {
        expedientesActivos += 1;
      }
      if (!pesaje && ACTIVE_STATES.has(expediente.estado) && expediente.estado !== 'agendado') {
        expedientesSinPesaje += 1;
      }

      if (expediente.estado === 'pendiente_pago') {
        pendientePago += 1;
        montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
      }
      if (expediente.estado === 'pagado_pendiente_conciliacion') {
        pagadoPendiente += 1;
      }
      if (expPagos.length > 0 && comprobantesExp.length === 0) {
        pagosSinComprobante += 1;
      }
      if (hasAgenda) agendaCount += 1;
      if (hasTerreno) terrenoCount += 1;
      if (hasSucursal) sucursalCount += 1;
      if (hasPlanta) plantaCount += 1;
      if (hasFinanzas) finanzasCount += 1;
    });

    const critical = (expedientesActivos > 0 && kilosHoy <= 0) || expedientesSinPesaje >= 2;
    const warning = !critical && (expedientesSinPesaje > 0 || pendientePago > 0 || pagadoPendiente > 0);

    return {
      total: expedientes.length,
      expedientesActivos,
      expedientesSinPesaje,
      kilosHoy,
      kilosTotal,
      capturasHoy,
      agendaCount,
      terrenoCount,
      sucursalCount,
      plantaCount,
      finanzasCount,
      pendientePago,
      pagadoPendiente,
      pagosSinComprobante,
      montoPendiente,
      health: critical ? 'critical' : warning ? 'warning' : 'ok'
    };
  }

  function renderFallback(summary, detail, mode) {
    const badge = byId('primer-release-panel-badge');
    const summaryEl = byId('primer-release-panel-summary');
    const detailEl = byId('primer-release-panel-detail');
    const totalEl = byId('primer-release-panel-total');
    const queueEl = byId('primer-release-panel-queue');
    const reconEl = byId('primer-release-panel-recon');
    const versionEl = byId('primer-release-panel-version');
    const hubLink = byId('primer-release-panel-hub-link');

    if (badge) badge.textContent = mode;
    if (summaryEl) summaryEl.textContent = summary;
    if (detailEl) detailEl.textContent = detail;
    if (totalEl) totalEl.textContent = '—';
    if (queueEl) queueEl.textContent = '—';
    if (reconEl) reconEl.textContent = '—';
    if (versionEl) versionEl.textContent = 'sin snapshot';
    if (hubLink && mode === 'Demo disponible') hubLink.href = '/primer-release?demo=1';
  }

  async function fetchVersion() {
    try {
      const response = await fetch('/_version.json', { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  function readDemoSnapshot() {
    if (window.localStorage.getItem(DEMO_FLAG_KEY) !== '1') return null;
    try {
      const raw = window.localStorage.getItem(DEMO_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function waitForSb(maxTries) {
    for (let i = 0; i < maxTries; i += 1) {
      if (window.sb && typeof window.sb.schema === 'function') return window.sb;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return null;
  }

  async function fetchLiveSnapshot(sb) {
    const [expedientesRes, pesajesRes, facturasRes, pagosRes, comprobantesRes] = await Promise.all([
      sb.schema('curated')
        .from('expedientes_operacionales')
        .select('expediente_id, estado, updated_at, created_at')
        .order('fecha_operacion', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(180),
      sb.schema('curated')
        .from('pesajes')
        .select('pesaje_id, expediente_id, sucursal_id, material_id, peso_neto_kg, fecha_captura, created_at')
        .order('fecha_captura', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(220),
      sb.schema('curated')
        .from('facturacion_raw')
        .select('id, factura_raw_id, expediente_id, monto_total, estado_pago_release')
        .order('updated_at', { ascending: false })
        .limit(220),
      sb.schema('curated')
        .from('pagos_operacionales')
        .select('pago_id, expediente_id, factura_raw_id, monto_pagado')
        .order('created_at', { ascending: false })
        .limit(220),
      sb.schema('curated')
        .from('comprobantes_pago')
        .select('comprobante_id, factura_raw_id')
        .order('created_at', { ascending: false })
        .limit(220)
    ]);

    if (expedientesRes.error) throw expedientesRes.error;
    if (pesajesRes.error) throw pesajesRes.error;
    if (facturasRes.error) throw facturasRes.error;
    if (pagosRes.error) throw pagosRes.error;
    if (comprobantesRes.error) throw comprobantesRes.error;

    return {
      expedientes: expedientesRes.data || [],
      pesajes: pesajesRes.data || [],
      facturas: facturasRes.data || [],
      pagos: pagosRes.data || [],
      comprobantes: comprobantesRes.data || []
    };
  }

  function paint(overview, version, mode) {
    const badge = byId('primer-release-panel-badge');
    const summaryEl = byId('primer-release-panel-summary');
    const detailEl = byId('primer-release-panel-detail');
    const totalEl = byId('primer-release-panel-total');
    const queueEl = byId('primer-release-panel-queue');
    const reconEl = byId('primer-release-panel-recon');
    const versionEl = byId('primer-release-panel-version');
    const hubLink = byId('primer-release-panel-hub-link');

    if (badge) {
      badge.textContent = mode || (overview.health === 'critical' ? 'Riesgo operativo' : overview.health === 'warning' ? 'Vigilancia activa' : 'Release estable');
      badge.className = overview.health === 'critical'
        ? 'badge bg-red-50 text-red-700 border border-red-200'
        : overview.health === 'warning'
          ? 'badge bg-amber-50 text-amber-700 border border-amber-200'
          : 'badge bg-emerald-50 text-emerald-700 border border-emerald-200';
    }

    if (summaryEl) {
      summaryEl.textContent = `Agenda ${overview.agendaCount} · Terreno ${overview.terrenoCount} · Sucursal ${overview.sucursalCount} · Planta ${overview.plantaCount} · Finanzas ${overview.finanzasCount}`;
    }
    if (detailEl) {
      detailEl.textContent = `Pulso visible ${formatKg(overview.kilosHoy)} hoy · ${overview.capturasHoy} capturas · ${overview.pendientePago} en cola de pago por ${money(overview.montoPendiente)}.`;
    }
    if (totalEl) totalEl.textContent = String(overview.agendaCount);
    if (queueEl) queueEl.textContent = String(overview.sucursalCount);
    if (reconEl) reconEl.textContent = String(overview.plantaCount);
    if (versionEl) versionEl.textContent = version ? `${version.sha} · ${version.env}` : 'sin build';
    if (hubLink && mode === 'Demo activo') hubLink.href = '/primer-release?demo=1';
  }

  async function init() {
    if (!byId('primer-release-panel-card')) return;

    renderFallback('Cargando pulso operativo del release...', 'Leyendo estado del release desde panel y preview.', 'Cargando');
    const version = await fetchVersion();

    const demoSnapshot = readDemoSnapshot();
    if (demoSnapshot) {
      paint(buildOverview(demoSnapshot), version, 'Demo activo');
      return;
    }

    const sb = await waitForSb(14);
    if (!sb) {
      renderFallback('Sin sesión del release visible en el panel.', 'Abre el hub o usa /romanero?demo=1 para encender el flujo demo.', 'Demo disponible');
      return;
    }

    try {
      const snapshot = await fetchLiveSnapshot(sb);
      paint(buildOverview(snapshot), version, null);
    } catch (error) {
      console.error('[PrimerReleaseWidget] error:', error);
      renderFallback('No pude leer el snapshot vivo del release.', 'El hub sigue disponible y el demo puede activarse sin credenciales nuevas.', 'Lectura parcial');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
