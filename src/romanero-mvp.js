import {
  signInRomanero,
  signOutRomanero,
  getRomaneroSession,
  loadRomaneroLookups,
  consultarPrecioVigente,
  createOrRecoverExpediente,
  fetchClienteDespachos,
  fetchClienteOportunidades,
  registrarPesaje,
  fetchExpediente,
  fetchExpedienteEventos,
  enablePrimerReleaseDemo,
  isPrimerReleaseDemoEnabled,
  resetPrimerReleaseDemo
} from './lib/primer-release-api.js';

const app = document.querySelector('#app');

const state = {
  session: null,
  loading: true,
  busy: false,
  demo: false,
  error: '',
  notice: '',
  lookups: {
    clientes: [],
    materiales: [],
    sucursales: []
  },
  filters: {
    cliente: '',
    material: ''
  },
  form: {
    cliente_id: '',
    sucursal_id: 'cerrillos',
    material_id: '',
    servicio_clase: 'compra_material',
    origen_handoff: 'romanero_directo',
    agenda_servicio_id: '',
    oportunidad_id: '',
    referencia_legado: '',
    retorno_comercial: '',
    fecha_operacion: new Date().toISOString().slice(0, 10),
    peso_neto_kg: '',
    observaciones: ''
  },
  precio: null,
  expediente: null,
  eventos: [],
  lastPesaje: null,
  despachos: [],
  despachosLoading: false,
  oportunidades: [],
  oportunidadesLoading: false
};

function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value));
}

function uf(value) {
  if (value === null || value === undefined || value === '') return '—';
  return `${new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value))} UF`;
}

function dateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setNotice(message) {
  state.notice = message;
  state.error = '';
}

function setError(message) {
  state.error = message;
  state.notice = '';
}

function clearFlash() {
  state.error = '';
  state.notice = '';
}

function selectedCliente() {
  return state.lookups.clientes.find((item) => item.cliente_id === state.form.cliente_id) || null;
}

function selectedMaterial() {
  return state.lookups.materiales.find((item) => item.material_id === state.form.material_id) || null;
}

function estimatedMonto() {
  const peso = Number(state.form.peso_neto_kg || 0);
  const precio = Number(state.precio?.precio_compra_clp || 0);
  if (peso <= 0 || precio <= 0) return null;
  return peso * precio;
}

function filteredClientes() {
  const needle = state.filters.cliente.trim().toLowerCase();
  if (!needle) return state.lookups.clientes;
  return state.lookups.clientes.filter((item) =>
    [item.razon_social, item.rut, item.cliente_id]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(needle))
  );
}

function filteredMateriales() {
  const needle = state.filters.material.trim().toLowerCase();
  if (!needle) return state.lookups.materiales;
  return state.lookups.materiales.filter((item) =>
    [item.nombre, item.material_id]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(needle))
  );
}

function handoffOriginLabel(value) {
  if (value === 'handoff_andrea') return 'Handoff Andrea -> operación';
  if (value === 'contingencia_pesaje') return 'Contingencia sobre pesaje existente';
  return 'Captura directa en sucursal';
}

function creationEventPayload() {
  return state.eventos.find((item) => item.tipo_evento === 'expediente_creado')?.payload || null;
}

function returnEventPayload() {
  return state.eventos.find((item) => item.tipo_evento === 'retorno_operacion_comercial')?.payload || null;
}

function currentHandoffContext() {
  const createdPayload = creationEventPayload() || {};
  const returnPayload = returnEventPayload() || {};
  const agendaPayload = createdPayload.agenda_servicio || null;
  return {
    origen: createdPayload.origen_operacional || state.form.origen_handoff,
    agendaServicioId: agendaPayload?.agenda_servicio_id || state.form.agenda_servicio_id || null,
    oportunidadId: state.expediente?.oportunidad_id || state.form.oportunidad_id || createdPayload.oportunidad_id || null,
    referenciaLegado: createdPayload.referencia_legado || state.form.referencia_legado || null,
    retornoComercial: createdPayload.retorno_comercial || state.form.retorno_comercial || returnPayload.estado || null,
    agendaDestino: agendaPayload?.destino || null,
    agendaFecha: agendaPayload?.fecha_programada || null,
    agendaDocumentos: agendaPayload?.documentos_esperados || []
  };
}

function linkedScheduledService() {
  if (!state.form.agenda_servicio_id) return null;
  return state.despachos.find((item) => String(item.id) === String(state.form.agenda_servicio_id)) || null;
}

function linkedOpportunity() {
  if (!state.form.oportunidad_id) return null;
  return state.oportunidades.find((item) => String(item.oportunidad_id) === String(state.form.oportunidad_id)) || null;
}

function opportunityTitle(opportunity) {
  return opportunity?.titulo || opportunity?.nombre || opportunity?.asunto || opportunity?.codigo || opportunity?.oportunidad_id || 'Oportunidad';
}

function opportunityStage(opportunity) {
  return opportunity?.etapa || opportunity?.estado || opportunity?.fase || 'sin etapa';
}

function opportunityOwner(opportunity) {
  return opportunity?.owner || opportunity?.responsable || opportunity?.owner_email || opportunity?.asignado_a || 'sin owner';
}

function buildCommercialReturn(opportunity) {
  if (!opportunity) return '';
  const parts = [
    `Oportunidad ${opportunityStage(opportunity)}`,
    opportunityTitle(opportunity)
  ];
  if (opportunity.valor_estimado_uf !== null && opportunity.valor_estimado_uf !== undefined) {
    parts.push(uf(opportunity.valor_estimado_uf));
  }
  if (opportunity.fecha_ult_interaccion) {
    parts.push(`último contacto ${new Date(opportunity.fecha_ult_interaccion).toLocaleDateString('es-CL')}`);
  }
  return parts.filter(Boolean).join(' · ');
}

function serviceTitle(service) {
  return service?.material_nombre || service?.titulo || service?.id || 'Servicio';
}

function serviceTransport(service) {
  return service?.transporte_tipo ? String(service.transporte_tipo).replaceAll('_', ' ') : 'sin transporte';
}

function serviceDocuments(service) {
  if (Array.isArray(service?.documentos_esperados) && service.documentos_esperados.length) {
    return service.documentos_esperados.map((item) => String(item).replaceAll('_', ' '));
  }
  return ['no informados en despacho_coord'];
}

async function refreshClienteDespachos() {
  const cliente = selectedCliente();
  if (!state.session || !cliente) {
    state.despachos = [];
    state.despachosLoading = false;
    return;
  }
  state.despachosLoading = true;
  render();
  try {
    state.despachos = await fetchClienteDespachos(cliente.cliente_id, cliente.razon_social, 6);
  } catch (error) {
    state.despachos = [];
    setError(error.message);
  } finally {
    state.despachosLoading = false;
    render();
  }
}

async function refreshClienteOportunidades() {
  if (!state.session || !state.form.cliente_id) {
    state.oportunidades = [];
    state.oportunidadesLoading = false;
    return;
  }
  state.oportunidadesLoading = true;
  render();
  try {
    state.oportunidades = await fetchClienteOportunidades(state.form.cliente_id, 6);
  } catch (error) {
    state.oportunidades = [];
    setError(error.message);
  } finally {
    state.oportunidadesLoading = false;
    render();
  }
}

function applyScheduledService(serviceId) {
  const service = state.despachos.find((item) => String(item.id) === String(serviceId));
  if (!service) {
    throw new Error('No se encontró el servicio agendado seleccionado');
  }
  state.form.agenda_servicio_id = String(service.id || '');
  state.form.origen_handoff = 'handoff_andrea';
  state.form.fecha_operacion = service.fecha_programada || state.form.fecha_operacion;
  if (service.sucursal_codigo && state.lookups.sucursales.some((item) => item.sucursal_id === service.sucursal_codigo)) {
    state.form.sucursal_id = service.sucursal_codigo;
  }
  if (service.material_id && state.lookups.materiales.some((item) => item.material_id === service.material_id)) {
    state.form.material_id = service.material_id;
  }
  if (!state.form.referencia_legado) {
    state.form.referencia_legado = `despacho_coord:${service.id}`;
  }
  if (!state.form.retorno_comercial) {
    state.form.retorno_comercial = `Servicio ${service.estado || 'programado'} · ${serviceTitle(service)} · ${service.fecha_programada || 'sin fecha'} · ${service.destino || 'sin destino'}`;
  }
  if (!state.form.observaciones && service.notas) {
    state.form.observaciones = service.notas;
  }
  if (state.form.servicio_clase === 'compra_material' && service.transporte_tipo && service.transporte_tipo !== 'cliente') {
    state.form.servicio_clase = 'servicio_operativo';
  }
  state.expediente = null;
  state.eventos = [];
  state.lastPesaje = null;
  setNotice('Servicio agendado cargado como puerta de entrada al expediente operacional');
  render();
}

function applyOpportunityHandoff(opportunityId) {
  const opportunity = state.oportunidades.find((item) => String(item.oportunidad_id) === String(opportunityId));
  if (!opportunity) {
    throw new Error('No se encontró la oportunidad seleccionada');
  }
  state.form.origen_handoff = 'handoff_andrea';
  state.form.oportunidad_id = String(opportunity.oportunidad_id || '');
  if (!state.form.referencia_legado) {
    state.form.referencia_legado = opportunity.codigo || opportunity.fuente || 'curated.oportunidades';
  }
  if (!state.form.retorno_comercial) {
    state.form.retorno_comercial = buildCommercialReturn(opportunity);
  }
  if (!state.form.material_id && opportunity.material_id && state.lookups.materiales.some((item) => item.material_id === opportunity.material_id)) {
    state.form.material_id = opportunity.material_id;
  }
  if (opportunity.sucursal_id && state.lookups.sucursales.some((item) => item.sucursal_id === opportunity.sucursal_id)) {
    state.form.sucursal_id = opportunity.sucursal_id;
  }
  state.expediente = null;
  state.eventos = [];
  state.lastPesaje = null;
  setNotice('Handoff cargado desde oportunidad comercial existente');
  render();
}

function renderLogin() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card auth-card">
        <div class="eyebrow">Primer Release · TT-04</div>
        <h1>Romanero MVP</h1>
        <p class="subtle">Ingreso con Supabase Auth para operar el expediente, consultar precio canonico y registrar pesaje unico sin abrir doble captura. Si no tienes claves todavia, puedes abrir el flujo en modo demo.</p>
        <form id="login-form" class="stack">
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="romanero@reciclean.cl" required />
          </label>
          <label class="field">
            <span>Contrasena</span>
            <input type="password" name="password" placeholder="Tu clave" required />
          </label>
          <button class="btn btn-primary" type="submit"${state.busy ? ' disabled' : ''}>
            ${state.busy ? 'Ingresando...' : 'Entrar'}
          </button>
          <button class="btn" type="button" data-action="demo"${state.busy ? ' disabled' : ''}>
            Ver demo operativa
          </button>
        </form>
        ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}
      </div>
    </section>
  `;
}

function renderApp() {
  const cliente = selectedCliente();
  const material = selectedMaterial();
  const clientes = filteredClientes();
  const materiales = filteredMateriales();
  const handoff = currentHandoffContext();
  const captureMode = state.form.origen_handoff === 'contingencia_pesaje' ? 'Contingencia' : state.form.origen_handoff === 'handoff_andrea' ? 'Con handoff' : 'Directo';
  const scheduledService = linkedScheduledService();
  const opportunity = linkedOpportunity();

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Romanero</div>
          <h1>Romanero MVP</h1>
          <p class="subtle">Adaptador operativo del release: crea o recupera expediente, consulta precio canonico y registra un solo pesaje sin competir con la plataforma de pesaje existente.</p>
        </div>
        <div class="topbar-actions">
          ${state.demo ? '<div class="session-pill">Modo demo</div>' : ''}
          <div class="session-pill">${escapeHtml(captureMode)}</div>
          <div class="session-pill">${escapeHtml(state.session?.user?.email || 'sesion activa')}</div>
          ${state.demo ? '<button class="btn" data-action="reset-demo">Reiniciar demo</button>' : ''}
          <button class="btn" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
        </div>
      </header>

      ${state.demo ? '<div class="flash flash-ok">Modo demo activo. Este flujo usa datos locales persistidos en tu navegador para revisar expediente, handoff y pesaje sin credenciales reales.</div>' : ''}
      <div class="flash flash-ok">Regla madre del arranque: la misma verdad no se captura dos veces. Si el caso ya vive en la plataforma de pesaje actual, Romanero se usa como adaptador o contingencia, no como reemplazo paralelo.</div>
      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <div class="layout">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Captura</h2>
              <p class="subtle">TT-04-02, TT-04-03 y TT-04-04 sobre los RPCs validados.</p>
            </div>
            <span class="status">${state.busy ? 'Procesando' : 'Listo'}</span>
          </div>

          <div class="grid">
            <label class="field field-span-2">
              <span>Buscar cliente</span>
              <input type="search" name="filter_cliente" value="${escapeHtml(state.filters.cliente)}" placeholder="Razon social, RUT o cliente_id" />
            </label>
            <label class="field field-span-2">
              <span>Cliente</span>
              <select name="cliente_id">
                <option value="">Selecciona cliente</option>
                ${clientes.map((item) => `
                  <option value="${escapeHtml(item.cliente_id)}"${item.cliente_id === state.form.cliente_id ? ' selected' : ''}>
                    ${escapeHtml(item.razon_social)} · ${escapeHtml(item.rut || item.cliente_id)}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="field">
              <span>Sucursal</span>
              <select name="sucursal_id">
                ${state.lookups.sucursales.map((item) => `
                  <option value="${escapeHtml(item.sucursal_id)}"${item.sucursal_id === state.form.sucursal_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)}
                  </option>
                `).join('')}
              </select>
            </label>
            <label class="field">
              <span>Fecha operacion</span>
              <input type="date" name="fecha_operacion" value="${escapeHtml(state.form.fecha_operacion)}" />
            </label>

            <label class="field field-span-2">
              <span>Origen del caso</span>
              <select name="origen_handoff">
                <option value="romanero_directo"${state.form.origen_handoff === 'romanero_directo' ? ' selected' : ''}>Captura directa en sucursal</option>
                <option value="handoff_andrea"${state.form.origen_handoff === 'handoff_andrea' ? ' selected' : ''}>Handoff Andrea -> operación</option>
                <option value="contingencia_pesaje"${state.form.origen_handoff === 'contingencia_pesaje' ? ' selected' : ''}>Contingencia sobre pesaje existente</option>
              </select>
            </label>

            <label class="field">
              <span>Servicio agendado ID</span>
              <input type="text" name="agenda_servicio_id" value="${escapeHtml(state.form.agenda_servicio_id)}" placeholder="despacho_coord-123 / servicio agendado" />
            </label>
            <label class="field field-span-2">
              <span>Oportunidad / handoff ID</span>
              <input type="text" name="oportunidad_id" value="${escapeHtml(state.form.oportunidad_id)}" placeholder="op-123 / cotizacion / negocio" />
            </label>
            <label class="field">
              <span>Referencia legado</span>
              <input type="text" name="referencia_legado" value="${escapeHtml(state.form.referencia_legado)}" placeholder="folio, planilla o referencia externa" />
            </label>

            <label class="field field-span-2">
              <span>Buscar material</span>
              <input type="search" name="filter_material" value="${escapeHtml(state.filters.material)}" placeholder="Nombre o material_id" />
            </label>
            <label class="field field-span-2">
              <span>Material</span>
              <select name="material_id">
                <option value="">Selecciona material</option>
                ${materiales.map((item) => `
                  <option value="${escapeHtml(item.material_id)}"${item.material_id === state.form.material_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)} · ${escapeHtml(item.material_id)}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="field">
              <span>Servicio</span>
              <select name="servicio_clase">
                <option value="compra_material"${state.form.servicio_clase === 'compra_material' ? ' selected' : ''}>Compra material</option>
                <option value="servicio_operativo"${state.form.servicio_clase === 'servicio_operativo' ? ' selected' : ''}>Servicio operativo</option>
                <option value="mantencion"${state.form.servicio_clase === 'mantencion' ? ' selected' : ''}>Mantencion</option>
                <option value="reparacion"${state.form.servicio_clase === 'reparacion' ? ' selected' : ''}>Reparacion</option>
                <option value="otro"${state.form.servicio_clase === 'otro' ? ' selected' : ''}>Otro</option>
              </select>
            </label>
            <label class="field">
              <span>Peso neto kg</span>
              <input type="number" min="0" step="0.01" name="peso_neto_kg" value="${escapeHtml(state.form.peso_neto_kg)}" placeholder="1240.50" />
            </label>

            <label class="field field-span-2">
              <span>Retorno para comercial</span>
              <textarea name="retorno_comercial" rows="2" placeholder="Que debe volver a Andrea o comercial como resumen minimo">${escapeHtml(state.form.retorno_comercial)}</textarea>
            </label>

            <label class="field field-span-2">
              <span>Observaciones</span>
              <textarea name="observaciones" rows="3" placeholder="Notas de recepcion, calidad o contexto operativo">${escapeHtml(state.form.observaciones)}</textarea>
            </label>
          </div>

          <div class="toolbar">
            <button class="btn" data-action="precio"${state.busy ? ' disabled' : ''}>Consultar precio vigente</button>
            <button class="btn" data-action="expediente"${state.busy ? ' disabled' : ''}>Crear o recuperar expediente</button>
            <button class="btn btn-primary" data-action="pesaje"${state.busy ? ' disabled' : ''}>Registrar pesaje</button>
          </div>
        </article>

        <aside class="stack">
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Precio vigente</h2>
                <p class="subtle">Fuente canonica del release.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>Material</span>
                <strong>${escapeHtml(material?.nombre || '—')}</strong>
              </div>
              <div class="metric">
                <span>Compra</span>
                <strong>${money(state.precio?.precio_compra_clp)}</strong>
              </div>
              <div class="metric">
                <span>Venta</span>
                <strong>${money(state.precio?.precio_venta_clp)}</strong>
              </div>
              <div class="metric">
                <span>Vigencia</span>
                <strong>${escapeHtml(state.precio?.vigencia_desde || '—')}</strong>
              </div>
              <div class="metric">
                <span>Estimado</span>
                <strong>${money(estimatedMonto())}</strong>
              </div>
              <div class="metric">
                <span>Fuente de verdad</span>
                <strong>Precio canónico</strong>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Servicio agendado</h2>
                <p class="subtle">Puerta de entrada 1: Andrea agenda servicio, define fecha, destino y contexto antes de sucursal.</p>
              </div>
              <span class="status">${state.despachosLoading ? 'Cargando' : `${state.despachos.length} visibles`}</span>
            </div>
            ${!state.form.cliente_id ? '<div class="empty">Selecciona un cliente para revisar si ya existe servicio agendado.</div>' : state.despachosLoading ? '<div class="empty">Cargando servicios agendados del cliente...</div>' : state.despachos.length ? `
              <div class="timeline">
                ${state.despachos.map((item) => `
                  <article class="timeline-item">
                    <div class="timeline-meta">
                      <strong>${escapeHtml(serviceTitle(item))}</strong>
                      <span>${escapeHtml(item.estado || 'sin estado')}</span>
                    </div>
                    <div class="timeline-date">${escapeHtml(item.fecha_programada ? dateTime(item.fecha_programada) : 'sin fecha programada')}</div>
                    <div class="metric-grid">
                      <div class="metric">
                        <span>Servicio</span>
                        <strong>${escapeHtml(item.id || '—')}</strong>
                      </div>
                      <div class="metric">
                        <span>Destino</span>
                        <strong>${escapeHtml(item.destino || '—')}</strong>
                      </div>
                      <div class="metric">
                        <span>Transporte</span>
                        <strong>${escapeHtml(serviceTransport(item))}</strong>
                      </div>
                      <div class="metric">
                        <span>Kg estimado</span>
                        <strong>${escapeHtml(item.kg_estimado || '—')}</strong>
                      </div>
                      <div class="metric field-span-2">
                        <span>Documentos esperados</span>
                        <strong>${escapeHtml(serviceDocuments(item).join(' · '))}</strong>
                      </div>
                    </div>
                    ${item.notas ? `<div class="flash flash-ok">${escapeHtml(item.notas)}</div>` : ''}
                    <div class="toolbar">
                      <button class="btn" data-action="use-scheduled-service" data-service-id="${escapeHtml(item.id || '')}">Usar servicio agendado</button>
                    </div>
                  </article>
                `).join('')}
              </div>
            ` : '<div class="empty">No hay servicios agendados visibles para este cliente en despacho_coord.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Handoff comercial</h2>
                <p class="subtle">Lectura mínima de oportunidades reales del cliente para converger al mismo expediente.</p>
              </div>
              <span class="status">${state.oportunidadesLoading ? 'Cargando' : `${state.oportunidades.length} visibles`}</span>
            </div>
            ${!state.form.cliente_id ? '<div class="empty">Selecciona un cliente para revisar sus oportunidades comerciales visibles.</div>' : state.oportunidadesLoading ? '<div class="empty">Cargando oportunidades del cliente...</div>' : state.oportunidades.length ? `
              <div class="timeline">
                ${state.oportunidades.map((item) => `
                  <article class="timeline-item">
                    <div class="timeline-meta">
                      <strong>${escapeHtml(opportunityTitle(item))}</strong>
                      <span>${escapeHtml(opportunityStage(item))}</span>
                    </div>
                    <div class="timeline-date">${escapeHtml(item.fecha_recepcion ? dateTime(item.fecha_recepcion) : 'sin fecha recepción')}</div>
                    <div class="metric-grid">
                      <div class="metric">
                        <span>Oportunidad</span>
                        <strong>${escapeHtml(item.oportunidad_id || '—')}</strong>
                      </div>
                      <div class="metric">
                        <span>Owner</span>
                        <strong>${escapeHtml(opportunityOwner(item))}</strong>
                      </div>
                      <div class="metric">
                        <span>Valor estimado</span>
                        <strong>${uf(item.valor_estimado_uf)}</strong>
                      </div>
                      <div class="metric">
                        <span>Último contacto</span>
                        <strong>${escapeHtml(item.fecha_ult_interaccion ? dateTime(item.fecha_ult_interaccion) : '—')}</strong>
                      </div>
                    </div>
                    <div class="toolbar">
                      <button class="btn" data-action="use-opportunity" data-opportunity-id="${escapeHtml(item.oportunidad_id || '')}">Usar como handoff</button>
                    </div>
                  </article>
                `).join('')}
              </div>
            ` : '<div class="empty">No hay oportunidades visibles para este cliente en la fuente comercial actual.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Expediente</h2>
                <p class="subtle">TT-04-05 visible para Romanero.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>Codigo</span>
                <strong>${escapeHtml(state.expediente?.expediente_codigo || '—')}</strong>
              </div>
              <div class="metric">
                <span>Estado</span>
                <strong>${escapeHtml(state.expediente?.estado || '—')}</strong>
              </div>
              <div class="metric">
                <span>Cliente</span>
                <strong>${escapeHtml(cliente?.razon_social || state.expediente?.cliente_id || '—')}</strong>
              </div>
              <div class="metric">
                <span>Ultimo pesaje</span>
                <strong>${state.lastPesaje ? `${money(state.lastPesaje.monto_total)} · ${Number(state.lastPesaje.precio_unitario).toFixed(2)}` : '—'}</strong>
              </div>
              <div class="metric">
                <span>Origen del caso</span>
                <strong>${escapeHtml(handoffOriginLabel(handoff.origen))}</strong>
              </div>
              <div class="metric">
                <span>Servicio agendado</span>
                <strong>${escapeHtml(handoff.agendaServicioId || '—')}</strong>
              </div>
              <div class="metric">
                <span>Handoff ID</span>
                <strong>${escapeHtml(handoff.oportunidadId || '—')}</strong>
              </div>
              <div class="metric">
                <span>Referencia legado</span>
                <strong>${escapeHtml(handoff.referenciaLegado || '—')}</strong>
              </div>
              <div class="metric">
                <span>Retorno comercial</span>
                <strong>${escapeHtml(handoff.retornoComercial || '—')}</strong>
              </div>
              <div class="metric">
                <span>Fecha agenda</span>
                <strong>${escapeHtml(handoff.agendaFecha || '—')}</strong>
              </div>
              <div class="metric">
                <span>Destino agenda</span>
                <strong>${escapeHtml(handoff.agendaDestino || '—')}</strong>
              </div>
            </div>
            ${scheduledService ? `
              <div class="flash flash-ok">
                Servicio agendado vinculado: <strong>${escapeHtml(serviceTitle(scheduledService))}</strong> · ${escapeHtml(scheduledService.fecha_programada || 'sin fecha')} · ${escapeHtml(serviceTransport(scheduledService))}.
              </div>
              <div class="flash flash-ok">
                Documentos esperados: ${escapeHtml(serviceDocuments(scheduledService).join(' · '))}
              </div>
            ` : ''}
            ${opportunity ? `
              <div class="flash flash-ok">
                Handoff vinculado a <strong>${escapeHtml(opportunityTitle(opportunity))}</strong> · ${escapeHtml(opportunityStage(opportunity))} · ${escapeHtml(opportunityOwner(opportunity))}.
              </div>
            ` : ''}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Reglas del arranque</h2>
                <p class="subtle">Aterrizan TT-08 y el arranque del release directamente en la operación.</p>
              </div>
            </div>
            <div class="stack">
              <div class="metric">
                <span>Donde sí registra Romanero</span>
                <strong>Expediente operacional y pesaje único del release</strong>
              </div>
              <div class="metric">
                <span>Donde no debe duplicar</span>
                <strong>Planillas, módulo viejo o una segunda captura del mismo pesaje</strong>
              </div>
              <div class="metric">
                <span>Qué queda como referencia</span>
                <strong>Pesaje existente, panel.expedientes y folios externos solo como apoyo</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Trazabilidad</h2>
            <p class="subtle">Eventos del expediente operacional del release.</p>
          </div>
        </div>
        ${state.eventos.length ? `
          <div class="timeline">
            ${state.eventos.map((evento) => `
              <article class="timeline-item">
                <div class="timeline-meta">
                  <strong>${escapeHtml(evento.tipo_evento)}</strong>
                  <span>${escapeHtml(evento.actor || 'sistema')}</span>
                </div>
                <div class="timeline-date">${escapeHtml(dateTime(evento.created_at))}</div>
                <pre>${escapeHtml(JSON.stringify(evento.payload || {}, null, 2))}</pre>
              </article>
            `).join('')}
          </div>
        ` : '<div class="empty">Todavia no hay eventos para este expediente.</div>'}
      </section>
    </section>
  `;
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <section class="shell shell-center">
        <div class="card loading-card">
          <div class="loader"></div>
          <p>Cargando Romanero MVP...</p>
        </div>
      </section>
    `;
    return;
  }

  if (!state.session) {
    renderLogin();
    return;
  }

  renderApp();
}

async function refreshExpediente(expedienteId) {
  const [expediente, eventos] = await Promise.all([
    fetchExpediente(expedienteId),
    fetchExpedienteEventos(expedienteId)
  ]);
  state.expediente = expediente;
  state.eventos = eventos;
}

function currentPayload() {
  const scheduledService = linkedScheduledService();
  const oportunidadId = state.form.oportunidad_id.trim();
  const agendaServicioId = state.form.agenda_servicio_id.trim();
  const referenciaLegado = state.form.referencia_legado.trim();
  const retornoComercial = state.form.retorno_comercial.trim();
  const origenMap = {
    romanero_directo: 'romanero',
    handoff_andrea: 'andrea_handoff',
    contingencia_pesaje: 'romanero_contingencia'
  };

  return {
    p_canal_origen: origenMap[state.form.origen_handoff] || 'romanero',
    p_cliente_id: state.form.cliente_id,
    p_sucursal_id: state.form.sucursal_id,
    p_servicio_clase: state.form.servicio_clase,
    p_fecha_operacion: state.form.fecha_operacion,
    p_material_id: state.form.material_id || null,
    p_oportunidad_id: oportunidadId || null,
    p_handoff_payload: {
      origen_ui: 'romanero_mvp',
      origen_operacional: state.form.origen_handoff,
      agenda_servicio: agendaServicioId ? {
        agenda_servicio_id: agendaServicioId,
        fecha_programada: scheduledService?.fecha_programada || state.form.fecha_operacion,
        destino: scheduledService?.destino || null,
        transporte_tipo: scheduledService?.transporte_tipo || null,
        documentos_esperados: serviceDocuments(scheduledService)
      } : null,
      oportunidad_id: oportunidadId || null,
      referencia_legado: referenciaLegado || null,
      retorno_comercial: retornoComercial || null,
      observaciones: state.form.observaciones || null
    }
  };
}

function validateBaseForm() {
  if (!state.form.cliente_id) {
    throw new Error('Selecciona un cliente antes de continuar');
  }
  if (!state.form.sucursal_id) {
    throw new Error('Selecciona una sucursal');
  }
  if (!state.form.material_id) {
    throw new Error('Selecciona un material');
  }
  if (!state.form.fecha_operacion) {
    throw new Error('Ingresa la fecha de operacion');
  }
}

async function handleConsultarPrecio() {
  validateBaseForm();
  state.busy = true;
  clearFlash();
  render();
  try {
    state.precio = await consultarPrecioVigente(state.form.material_id, state.form.sucursal_id);
    setNotice('Precio vigente consultado desde la fuente canonica');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleCreateOrRecover() {
  validateBaseForm();
  state.busy = true;
  clearFlash();
  render();
  try {
    const result = await createOrRecoverExpediente(currentPayload());
    await refreshExpediente(result.expediente_id);
    setNotice(result.created ? 'Expediente creado correctamente' : 'Se recupero un expediente ya abierto');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function ensureExpediente() {
  if (state.expediente?.expediente_id) return state.expediente.expediente_id;
  const result = await createOrRecoverExpediente(currentPayload());
  await refreshExpediente(result.expediente_id);
  return result.expediente_id;
}

async function handleRegistrarPesaje() {
  validateBaseForm();
  if (!state.form.peso_neto_kg || Number(state.form.peso_neto_kg) <= 0) {
    throw new Error('Ingresa un peso neto valido');
  }

  state.busy = true;
  clearFlash();
  render();
  try {
    if (!state.precio) {
      state.precio = await consultarPrecioVigente(state.form.material_id, state.form.sucursal_id);
    }
    const expedienteId = await ensureExpediente();
    state.lastPesaje = await registrarPesaje({
      p_expediente_id: expedienteId,
      p_cliente_id: state.form.cliente_id,
      p_material_id: state.form.material_id,
      p_sucursal_id: state.form.sucursal_id,
      p_peso_neto_kg: Number(state.form.peso_neto_kg),
      p_origen_captura: state.form.origen_handoff === 'contingencia_pesaje' ? 'romanero_contingencia' : 'romanero_manual',
      p_capturado_por: state.session?.user?.email || null,
      p_precio_unitario: state.precio?.precio_compra_clp || null,
      p_monto_total: estimatedMonto(),
      p_folio: null,
      p_observaciones: state.form.observaciones || null
    });
    await refreshExpediente(expedienteId);
    setNotice('Pesaje registrado y anclado al expediente operacional sin abrir una segunda captura paralela');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.busy = true;
  clearFlash();
  render();
  try {
    await signInRomanero(form.get('email'), form.get('password'));
    await boot();
    setNotice('Sesion iniciada');
    render();
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
    render();
  }
}

async function handleLogout() {
  state.busy = true;
  clearFlash();
  render();
  try {
    await signOutRomanero();
    state.session = null;
    state.demo = false;
    state.expediente = null;
    state.eventos = [];
    state.lastPesaje = null;
    state.despachos = [];
    state.despachosLoading = false;
    state.oportunidades = [];
    state.oportunidadesLoading = false;
    setNotice('Sesion cerrada');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleDemoMode() {
  state.busy = true;
  clearFlash();
  render();
  try {
    enablePrimerReleaseDemo();
    await boot();
    setNotice('Modo demo activado');
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleResetDemo() {
  state.busy = true;
  clearFlash();
  render();
  try {
    resetPrimerReleaseDemo();
    await boot();
    setNotice('Demo reiniciada con datos base');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function boot() {
  state.loading = true;
  render();
  try {
    state.demo = isPrimerReleaseDemoEnabled();
    state.session = await getRomaneroSession();
    if (state.session) {
      state.lookups = await loadRomaneroLookups();
      await Promise.all([
        refreshClienteDespachos(),
        refreshClienteOportunidades()
      ]);
    }
    state.loading = false;
    state.busy = false;
    render();
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
    render();
  }
}

app.addEventListener('submit', async (event) => {
  if (event.target.id === 'login-form') {
    await handleLogin(event);
  }
});

app.addEventListener('input', (event) => {
  const { name, value } = event.target;
  if (name === 'filter_cliente') {
    state.filters.cliente = value;
    render();
    return;
  }
  if (name === 'filter_material') {
    state.filters.material = value;
    render();
    return;
  }
  if (name in state.form) {
    state.form[name] = value;
  }
});

app.addEventListener('change', async (event) => {
  const { name, value } = event.target;
  if (name in state.form) {
    state.form[name] = value;
    if (name === 'cliente_id' || name === 'material_id' || name === 'sucursal_id') {
      if (name === 'cliente_id') {
        const cliente = selectedCliente();
        const suggestedSucursal = cliente?.sucursal_principal;
        if (suggestedSucursal && state.lookups.sucursales.some((item) => item.sucursal_id === suggestedSucursal)) {
          state.form.sucursal_id = suggestedSucursal;
        }
        state.form.agenda_servicio_id = '';
        state.form.oportunidad_id = '';
        state.form.referencia_legado = '';
        state.form.retorno_comercial = '';
        state.despachos = [];
        state.oportunidades = [];
      }
      state.expediente = null;
      state.eventos = [];
      state.lastPesaje = null;
      if (name === 'material_id' || name === 'sucursal_id') {
        state.precio = null;
      }
    }
    render();
    if (name === 'cliente_id') {
      await Promise.all([
        refreshClienteDespachos(),
        refreshClienteOportunidades()
      ]);
    }
  }
});

app.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  const action = target?.dataset.action;
  if (!action || state.busy) return;

  try {
    if (action === 'demo') await handleDemoMode();
    if (action === 'reset-demo') await handleResetDemo();
    if (action === 'logout') await handleLogout();
    if (action === 'precio') await handleConsultarPrecio();
    if (action === 'expediente') await handleCreateOrRecover();
    if (action === 'pesaje') await handleRegistrarPesaje();
    if (action === 'use-scheduled-service') applyScheduledService(target.dataset.serviceId);
    if (action === 'use-opportunity') applyOpportunityHandoff(target.dataset.opportunityId);
  } catch (error) {
    state.busy = false;
    setError(error.message);
    render();
  }
});

boot();
