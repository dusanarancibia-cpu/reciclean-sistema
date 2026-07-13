// ============================================================
// OPERACIONES DÍA — extraído de panel-rdo.html (antifragilidad panel, bloque 7)
// Consolidado transversal (D-OP-16): 4 sub-bloques bajo un mismo tab-group.
//   1. Ops Diarias        — resumen operativo del día (fecha seleccionable)
//   2. Panorama Sucursales — D-PANORAMA-JUAN, balance mensual por sucursal
//   3. Inventario         — Fase 1, feature-flag server-side (f_stock_vivo_visible)
//   4. Flota Grupo        — D-PANORAMA-JUAN, vehículos/máquinas + trámites
//
// Sin IIFE (mismo patrón que los 6 bloques anteriores): el HTML de estos tabs
// (que se queda en panel-rdo.html) genera onclick inline por nombre suelto.
//
// Dependencias externas (documentadas, no ocultas):
// - Entrante: dispatcher central de tabs en panel-rdo.html llama a
//   initOpsDiarias()/initPanorama()/initInventario()/initFlota() al cambiar de tab.
// - Entrante: bootstrap post-login en panel-rdo.html llama a
//   aplicarFeatureFlagInventario() con guard typeof (oculta/muestra nav Inventario).
// - Saliente: ninguna. Cero referencias a Diego LLM, a la zona núcleo
//   (v4Sync*/loadDiegoHealth/initV4Hero/_v4Top*) ni a otros módulos ya extraídos.
//
// Seguridad: el feature flag de Inventario es server-side (RPC f_stock_vivo_visible),
// no un guard de cliente — la extracción no debilita el control de acceso.
// ============================================================

// TAB OPERACIONES DÍA (D-OP-16) — consolidado transversal
// ============================================================
function initOpsDiarias() {
  const inp = document.getElementById('opsFecha');
  if (!inp.value) {
    const d = new Date(); d.setDate(d.getDate() - 1); // default: ayer
    inp.value = d.toISOString().slice(0, 10);
  }
  loadOpsDiarias();
}

window.opsFechaAyer = function() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  document.getElementById('opsFecha').value = d.toISOString().slice(0, 10);
  loadOpsDiarias();
};
window.opsFechaHoy = function() {
  document.getElementById('opsFecha').value = new Date().toISOString().slice(0, 10);
  loadOpsDiarias();
};

async function loadOpsDiarias() {
  const fecha = document.getElementById('opsFecha').value;
  if (!fecha) return;

  // PR#3 · fix problema #6 · badge dinámico "fecha != hoy" para evitar confusión temporal.
  // Sin esto, el header topbar dice "jue 2 de jul" mientras el usuario mira datos del 23-jun.
  const hoyIso = new Date().toISOString().slice(0, 10);
  const badge = document.getElementById('opsFechaBadge');
  if (badge) {
    if (fecha !== hoyIso) {
      const hoyD = new Date(hoyIso + 'T00:00:00');
      const filD = new Date(fecha + 'T00:00:00');
      const dias = Math.round((hoyD - filD) / 86400000);
      const fechaEs = filD.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
      let suffix;
      if (dias === 0)      suffix = 'hoy';
      else if (dias === 1) suffix = '1 día atrás';
      else if (dias > 0)   suffix = `hace ${dias} días`;
      else if (dias === -1) suffix = 'mañana';
      else                 suffix = `dentro de ${Math.abs(dias)} días`;
      badge.textContent = `📅 Mirando ${fechaEs} (${suffix})`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // PR#3 · fix problema #5 · nota informativa "Área no filtra este tab".
  // Se muestra siempre que el tab está activo (el selector Área existe en el topbar global).
  const nota = document.getElementById('opsAreaNota');
  if (nota) nota.classList.remove('hidden');

  ['opsKpiTickets','opsKpiTon','opsKpiMonto','opsKpiAlertas','opsKpiTicketsDelta','opsKpiTonDelta'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '…'; });
  document.getElementById('opsPesajesPorSuc').textContent = 'Cargando…';
  document.getElementById('opsCierres').textContent = 'Cargando…';
  document.getElementById('opsAlertas').textContent = 'Cargando…';

  // PR#1/PR#2 · switch a v2 canary de f_operaciones_dia (fix 7 anomalías 2026-07-02).
  // v2 devuelve: alertas.del_dia vs catalogo_persistente, por_sucursal con (sin asignar)
  // + sin_kg, comparativa.promedio_7d_previos (generate_series honesto) +
  // mismo_dia_semana_4wk_avg. Backwards compat: si algún campo v2 falta, cae al viejo.
  const { data, error } = await sb.rpc('f_operaciones_dia', { p_fecha: fecha, p_version: 'v2' });
  if (error) {
    document.getElementById('opsPesajesPorSuc').innerHTML = `<span class="text-red-600">Error: ${escapeHtml(error.message)}</span>`;
    return;
  }
  const p = data?.pesajes || {};
  const cmp = data?.comparativa || {};
  const al = data?.alertas || {};
  const ci = data?.cierres || [];

  const fmtCLP = n => '$' + Math.round(Number(n || 0)).toLocaleString('es-CL');
  const delta = (a, b) => {
    const dx = (Number(a || 0) - Number(b || 0));
    if (Number(b || 0) === 0) return dx > 0 ? '↑ nuevo' : 'sin datos';
    const pct = (dx / Number(b)) * 100;
    return (dx >= 0 ? '↑ ' : '↓ ') + Math.abs(pct).toFixed(0) + '%';
  };

  // Fix problema #2 · comparativa honesta (prom 7d con días vacíos + 4wk avg mismo día semana).
  // Fallback: si v1 (sin promedio_7d) usa cmp.tickets_dia_anterior.
  const basePromTickets = cmp?.promedio_7d_previos?.tickets_promedio ?? cmp.tickets_dia_anterior;
  const basePromTon     = cmp?.promedio_7d_previos?.toneladas_promedio ?? cmp.toneladas_dia_anterior;
  const labelComp = cmp?.promedio_7d_previos ? 'vs prom 7d' : 'vs ayer';

  document.getElementById('opsKpiTickets').textContent = (p.tickets_total || 0).toLocaleString('es-CL');
  document.getElementById('opsKpiTicketsDelta').textContent = labelComp + ': ' + delta(p.tickets_total, basePromTickets);
  document.getElementById('opsKpiTicketsDelta').title =
    `vs ayer: ${cmp.tickets_dia_anterior ?? '—'} · ` +
    `prom 7d: ${cmp?.promedio_7d_previos?.tickets_promedio ?? '—'} · ` +
    `mismo día 4wk avg: ${cmp?.mismo_dia_semana_4wk_avg?.tickets_promedio ?? '—'}`;
  document.getElementById('opsKpiTon').textContent = (Number(p.toneladas || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })) + ' t';
  document.getElementById('opsKpiTonDelta').textContent = labelComp + ': ' + delta(p.toneladas, basePromTon);
  document.getElementById('opsKpiTonDelta').title =
    `vs ayer: ${cmp.toneladas_dia_anterior ?? '—'} t · ` +
    `prom 7d: ${cmp?.promedio_7d_previos?.toneladas_promedio ?? '—'} t · ` +
    `mismo día 4wk avg: ${cmp?.mismo_dia_semana_4wk_avg?.toneladas_promedio ?? '—'} t`;
  document.getElementById('opsKpiMonto').textContent = fmtCLP(p.monto_total);

  // Fix problema #1 · KPI grande SOLO alertas del día · deuda catálogo se muestra abajo.
  const alDelDia = al?.del_dia?.precio_tarifa_rojo ?? Number(al.precio_tarifa_rojo || 0);
  document.getElementById('opsKpiAlertas').textContent = alDelDia.toLocaleString('es-CL');

  // Pesajes por sucursal · v2 incluye (sin asignar) + sin_kg + pct_sin_kg
  const sucs = Array.isArray(p.por_sucursal) ? p.por_sucursal : [];
  const totalSinKg = p.tickets_sin_kg ?? sucs.reduce((acc, s) => acc + (Number(s.sin_kg) || 0), 0);
  if (sucs.length === 0) {
    document.getElementById('opsPesajesPorSuc').innerHTML = '<span class="text-stone-400 italic">Sin pesajes ese día.</span>';
  } else {
    document.getElementById('opsPesajesPorSuc').innerHTML = `
      <div class="table-responsive">
      <table class="w-full text-sm"><thead class="text-xs text-stone-500"><tr>
        <th class="text-left py-1">Sucursal</th>
        <th class="text-right py-1">Tickets</th>
        <th class="text-right py-1">Toneladas</th>
        <th class="text-right py-1" title="Tickets con kg cero o nulo (fletes/servicios/anulaciones)">Sin kg</th>
      </tr></thead><tbody>${sucs.map(s => {
        const pct = Number(s.pct_sin_kg ?? 0);
        const pctColor = pct > 75 ? 'text-red-700' : pct > 50 ? 'text-amber-700' : 'text-stone-500';
        const rowClass = String(s.sucursal || '').includes('(sin asignar)')
          ? 'border-t border-amber-100 bg-amber-50' : 'border-t border-stone-100';
        return `<tr class="${rowClass}">
          <td class="py-1">${escapeHtml(String(s.sucursal || '—'))}</td>
          <td class="text-right py-1">${s.n}</td>
          <td class="text-right py-1">${Number(s.t || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} t</td>
          <td class="text-right py-1 ${pctColor}">${s.sin_kg ?? 0}${s.pct_sin_kg != null ? ` (${s.pct_sin_kg}%)` : ''}</td>
        </tr>`;
      }).join('')}
      </tbody>
      ${totalSinKg > 0 ? `<tfoot><tr class="border-t-2 border-stone-200 text-xs text-stone-500"><td colspan="4" class="py-1 italic">Total ${totalSinKg} de ${p.tickets_total} tickets con kg cero/nulo (fletes, servicios, anulaciones)</td></tr></tfoot>` : ''}
      </table>
      </div>`;
  }

  // Cierres
  if (!ci || ci.length === 0) {
    document.getElementById('opsCierres').innerHTML = '<span class="text-stone-400 italic">Sin cierres ese día.</span>';
  } else {
    document.getElementById('opsCierres').innerHTML = ci.map(c => `
      <div class="border-l-4 border-blue-400 pl-3 py-1 mb-2">
        <div class="font-medium text-stone-800">${escapeHtml(c.empresa_id || '')} ${c.sucursal_id ? '· ' + escapeHtml(c.sucursal_id) : ''}</div>
        <div class="text-xs text-stone-600">
          Saldo total: ${fmtCLP(c.saldo_total_clp)} ·
          Flujo neto: <span class="${Number(c.flujo_neto_clp || 0) >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtCLP(c.flujo_neto_clp)}</span> ·
          Facturado: ${fmtCLP(c.facturado_neto_clp)} ·
          Estado: ${escapeHtml(c.estado || '—')}
        </div>
      </div>`).join('');
  }

  // Alertas · fix problema #1 separación visual del día vs catálogo persistente
  const alDia = al?.del_dia?.precio_tarifa_rojo ?? Number(al.precio_tarifa_rojo || 0);
  const alCat = al?.catalogo_persistente?.contraparte_discrepancia ?? Number(al.contraparte || 0);
  document.getElementById('opsAlertas').innerHTML = `
    <div class="mb-2">
      <span class="${alDia > 0 ? 'text-red-700 font-semibold' : 'text-stone-600'}">
        🔴 ${alDia} alerta${alDia === 1 ? '' : 's'} de precios del día
      </span>
      ${alDia > 0 ? '<span class="text-xs text-stone-500">· revisar por qué se pactó fuera de tarifa</span>' : ''}
    </div>
    <div class="text-xs text-stone-500 italic">
      <span class="${alCat > 0 ? 'text-amber-700' : ''}">📚 ${alCat} misclasificación${alCat === 1 ? '' : 'es'} en catálogo contrapartes</span>
      · persistente global, no del día · resolver en tab Andrea → Duplicados
    </div>`;
}

// ============================================================
// PANORAMA SUCURSALES · D-PANORAMA-JUAN 2026-07-02
// Fuente: public.f_panorama_sucursal(sucursal, year, month, version)
// Firma anti-maquillaje: balance negativo se muestra tal cual con ⚠️ + tooltip.
// ============================================================
let pnrEstado = { sucursal: 'maipu', year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
const PNR_MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function initPanorama() {
  pnrCambiarSuc(pnrEstado.sucursal);
}

window.pnrCambiarSuc = function(suc) {
  pnrEstado.sucursal = suc;
  document.querySelectorAll('.pnr-suc-btn').forEach(b => {
    if (b.dataset.pnrSuc === suc) {
      b.classList.add('border-green-700','text-green-700','font-semibold');
    } else {
      b.classList.remove('border-green-700','text-green-700','font-semibold');
    }
  });
  loadPanorama();
};

window.pnrMesPrev = function() {
  pnrEstado.month--;
  if (pnrEstado.month < 1) { pnrEstado.month = 12; pnrEstado.year--; }
  loadPanorama();
};
window.pnrMesNext = function() {
  pnrEstado.month++;
  if (pnrEstado.month > 12) { pnrEstado.month = 1; pnrEstado.year++; }
  loadPanorama();
};

async function loadPanorama() {
  document.getElementById('pnrMesLabel').textContent =
    `${PNR_MESES[pnrEstado.month - 1]} ${pnrEstado.year}`;

  ['pnrKpiCompras','pnrKpiVentas','pnrKpiDon','pnrKpiBalance','pnrKpiAlertas',
   'pnrKpiComprasDelta','pnrKpiVentasDelta'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '…';
  });
  document.getElementById('pnrHeader').textContent = 'Cargando…';
  document.getElementById('pnrMateriales').textContent = 'Cargando…';
  document.getElementById('pnrBugs').textContent = 'Cargando…';
  document.getElementById('pnrPlaceholder').classList.add('hidden');

  const { data, error } = await sb.rpc('f_panorama_sucursal', {
    p_sucursal: pnrEstado.sucursal, p_year: pnrEstado.year, p_month: pnrEstado.month, p_version: 'v1'
  });

  if (error) {
    document.getElementById('pnrMateriales').innerHTML =
      `<span class="text-red-600">Error: ${escapeHtml(error.message)}</span>`;
    return;
  }

  // Estado de datos (punto 3 review DeepSeek)
  const est = data?._estado_datos;
  const ph = document.getElementById('pnrPlaceholder');
  if (est === 'sucursal_sin_operacion' || est === 'operativo_sin_registros_mes') {
    ph.textContent = data._placeholder_mensaje || 'Sin datos para este mes.';
    ph.classList.remove('hidden');
    if (est === 'sucursal_sin_operacion') {
      // Ocultar KPI wrappers en sucursal sin operación
      document.getElementById('pnrKpiWrapper').classList.add('opacity-40');
    }
  } else {
    document.getElementById('pnrKpiWrapper').classList.remove('opacity-40');
  }

  const fmtCLP = n => '$' + Math.round(Number(n || 0)).toLocaleString('es-CL');
  const fmtT = n => Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' t';

  const kpi = data?.kpi || {};
  const compras = kpi.compras || { tickets:0, toneladas:0, monto:0 };
  const ventas = kpi.ventas || { tickets:0, toneladas:0, monto:0 };
  const donaciones = kpi.donaciones || { tickets:0, toneladas:0 };
  const balance = Number(kpi.balance_kg || 0);
  const alertas = Number(kpi.alertas_del_mes || 0);

  document.getElementById('pnrKpiCompras').innerHTML =
    `<span class="text-lg">${compras.tickets}</span> tickets<br><span class="text-xs">${fmtT(compras.toneladas)} · ${fmtCLP(compras.monto)}</span>`;
  document.getElementById('pnrKpiVentas').innerHTML =
    `<span class="text-lg">${ventas.tickets}</span> tickets<br><span class="text-xs">${fmtT(ventas.toneladas)} · ${fmtCLP(ventas.monto)}</span>`;
  document.getElementById('pnrKpiDon').innerHTML =
    `<span class="text-lg">${donaciones.tickets}</span> tickets<br><span class="text-xs">${fmtT(donaciones.toneladas)}</span>`;

  // Balance con anti-maquillaje (contrapropuesta punto 7 DeepSeek)
  const balanceT = (balance / 1000).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  if (balance < 0) {
    document.getElementById('pnrKpiBalance').innerHTML =
      `<span class="text-red-700">⚠️ ${balanceT} t</span>`;
  } else {
    document.getElementById('pnrKpiBalance').innerHTML =
      `<span class="text-stone-800">+${balanceT} t</span>`;
  }

  document.getElementById('pnrKpiAlertas').textContent = alertas;

  // Supervisor firmante header
  const sup = data?.supervisor || {};
  const pct = sup.tickets_totales > 0 ? Math.round((sup.tickets_firmados / sup.tickets_totales) * 100) : 0;
  const supColor = pct >= 70 ? 'text-green-700' : pct >= 30 ? 'text-amber-700' : 'text-red-700';
  document.getElementById('pnrHeader').innerHTML =
    `<strong>${escapeHtml(data?.sucursal_nombre || '—')} · ${PNR_MESES[pnrEstado.month-1]} ${pnrEstado.year}</strong><br>` +
    `Supervisor firmante: <strong>${escapeHtml(sup.nombre_firmante || '—')}</strong> · ` +
    `<span class="${supColor}">${sup.tickets_firmados}/${sup.tickets_totales} tickets (${pct}%) ${pct >= 70 ? '🟢' : pct >= 30 ? '🟡' : '🔴'}</span>`;

  // Tabla materiales
  const mats = Array.isArray(data?.materiales) ? data.materiales : [];
  if (mats.length === 0) {
    document.getElementById('pnrMateriales').innerHTML = '<span class="text-stone-400 italic">Sin materiales en este mes.</span>';
  } else {
    document.getElementById('pnrMateriales').innerHTML = `
      <table class="w-full text-sm"><thead class="text-xs text-stone-500"><tr>
        <th class="text-left py-1">Material</th>
        <th class="text-right py-1">kg Compra</th>
        <th class="text-right py-1">kg Venta</th>
        <th class="text-right py-1">Balance</th>
        <th class="text-right py-1">$/kg</th>
        <th class="text-right py-1">Estado</th>
      </tr></thead><tbody>${mats.map(m => {
        const estadoTag = m.estado === 'descuadre' ? '<span class="text-red-700">🔴 descuadre</span>' :
                          m.estado === 'acumulando' ? '<span class="text-amber-700">🟡 acumulando</span>' :
                          '<span class="text-green-700">🟢 normal</span>';
        return `<tr class="border-t border-stone-100">
          <td class="py-1"><strong>${escapeHtml(m.descripcion || m.material_codigo)}</strong> <span class="text-xs text-stone-400">${escapeHtml(m.material_codigo)}</span></td>
          <td class="text-right py-1">${Number(m.kg_compra).toLocaleString('es-CL')}</td>
          <td class="text-right py-1">${Number(m.kg_venta).toLocaleString('es-CL')}</td>
          <td class="text-right py-1 ${Number(m.balance_kg) < 0 ? 'text-red-700' : ''}">${Number(m.balance_kg).toLocaleString('es-CL')}</td>
          <td class="text-right py-1">${m.precio_prom !== null ? '$' + Number(m.precio_prom).toLocaleString('es-CL') : '—'}</td>
          <td class="text-right py-1">${estadoTag}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
  }

  // Bugs cazados
  const bugs = data?.bugs || {};
  const huerf = Array.isArray(bugs.detalle_huerfanos_mes) ? bugs.detalle_huerfanos_mes : [];
  document.getElementById('pnrBugs').innerHTML = `
    <div class="mb-2">
      <span class="${bugs.tickets_sin_sucursal > 0 ? 'text-amber-700 font-semibold' : 'text-stone-600'}">
        ⚠️ ${bugs.tickets_sin_sucursal || 0} tickets sin sucursal asignada</span>
      ${huerf.length > 0 ? `<details class="mt-1 text-xs"><summary class="cursor-pointer text-stone-500">Detalle huérfanos rescatados</summary>
        <ul class="mt-1 ml-4 list-disc">${huerf.map(h => `<li>Folio ${h.folio} · ${h.fecha} · ${escapeHtml(h.chofer || '—')} · patente ${escapeHtml(h.patente || '—')} → <strong>${escapeHtml(h.inferido_hacia)}</strong> <span class="text-stone-400">(${h.backfill_metodo})</span></li>`).join('')}</ul></details>` : ''}
    </div>
    <div class="mb-1"><span class="${bugs.materiales_sin_precio > 0 ? 'text-amber-700' : 'text-stone-600'}">⚠️ ${bugs.materiales_sin_precio || 0} materiales sin precio vigente</span></div>
    <div><span class="${bugs.tickets_con_kg_cero > 0 ? 'text-amber-700' : 'text-stone-600'}">⚠️ ${bugs.tickets_con_kg_cero || 0} tickets con kg=0 (fletes/servicios/anulaciones)</span></div>`;

}

// ============================================================
// FASE 1 · MÓDULO INVENTARIO · sección propia en sidebar bajo Operaciones Día
// Feature flag: sidebar+tab horizontal ocultos si perfil no es ceo/gerente
// ============================================================
let invEstado = { sucursal: 'maipu' };

// Defensa en profundidad (DeepSeek Va condicional PR #602 punto 1):
// initInventario re-verifica el feature flag antes de renderizar, aunque el sidebar+tab
// ya están hidden por default y solo se muestran si el flag pasó. Cubre caso borde de
// que alguien fuerce click via dev tools o el DOM se modifique externamente.
async function initInventario() {
  const noAuth   = document.getElementById('invNoAutorizado');
  const wrap     = document.getElementById('pnrStockVivoWrap');
  const movsWrap = document.getElementById('invMovsWrap');
  try {
    const { data: flag, error } = await sb.rpc('f_stock_vivo_visible');
    if (error || !flag || flag.visible !== true) {
      noAuth?.classList.remove('hidden');
      wrap?.classList.add('hidden');
      movsWrap?.classList.add('hidden');
      return;
    }
    noAuth?.classList.add('hidden');
    movsWrap?.classList.remove('hidden');
  } catch(e) {
    noAuth?.classList.remove('hidden');
    wrap?.classList.add('hidden');
    movsWrap?.classList.add('hidden');
    return;
  }
  invCambiarSuc(invEstado.sucursal);
}

window.invCambiarSuc = function(suc) {
  invEstado.sucursal = suc;
  document.querySelectorAll('.inv-suc-btn').forEach(b => {
    if (b.dataset.invSuc === suc) {
      b.classList.add('border-green-700','text-green-700','font-semibold');
    } else {
      b.classList.remove('border-green-700','text-green-700','font-semibold');
    }
  });
  document.getElementById('invMovsSuc').textContent = suc;
  renderStockVivo(suc).catch(err => console.warn('stock_vivo:', err));
  invCargarManualesRecientes(suc).catch(err => console.warn('manuales:', err));
};

// ============================================================
// CAMINO 2 · Modal + RPCs de movimientos manuales
// Backend: crear_traslado / crear_movimiento_salida (muestra_lab / devolucion_prov / baja_dano / merma_proceso)
// ============================================================
const INV_TIPOS = {
  traslado_out: {
    titulo: '🔄 Traslado a otra sucursal',
    instruccion: 'Registrá el material que sale de esta sucursal hacia otra del grupo.',
    rpc: 'crear_traslado',
    destino: true,
    contraparte_label: 'Patente / conductor (opcional)',
    foto_obligatoria: false
  },
  muestra_lab: {
    titulo: '🧪 Muestra a laboratorio',
    instruccion: 'Material que sale como muestra para análisis del cliente.',
    rpc: 'crear_movimiento_salida',
    contraparte_label: 'Laboratorio / cliente destinatario',
    foto_obligatoria: false
  },
  devolucion_prov: {
    titulo: '↩ Devolución al proveedor',
    instruccion: 'Material que vino mal y se devuelve al proveedor.',
    rpc: 'crear_movimiento_salida',
    contraparte_label: 'Proveedor destinatario',
    foto_obligatoria: false
  },
  baja_dano: {
    titulo: '💥 Baja por daño / robo / humedad',
    instruccion: 'Material que perdimos y sale del patio. FOTO OBLIGATORIA.',
    rpc: 'crear_movimiento_salida',
    contraparte_label: 'Motivo (humedad, robo, daño)',
    foto_obligatoria: true
  },
  merma_proceso: {
    titulo: '⚙ Merma de proceso',
    instruccion: 'Merma post-prensa al cierre de turno (humedad, impurezas eliminadas).',
    rpc: 'crear_movimiento_salida',
    contraparte_label: 'Detalle proceso',
    foto_obligatoria: false
  }
};

window.invAbrirModal = async function(tipo) {
  const cfg = INV_TIPOS[tipo];
  if (!cfg) return;
  document.getElementById('invModalTipo').value = tipo;
  document.getElementById('invModalTitulo').textContent = cfg.titulo;
  document.getElementById('invModalInstruccion').textContent = cfg.instruccion;
  document.getElementById('invModalContraparteText').textContent = cfg.contraparte_label;
  document.getElementById('invModalContraparteLabel').classList.remove('hidden');
  document.getElementById('invModalDestinoLabel').classList.toggle('hidden', !cfg.destino);
  document.getElementById('invModalFotoReq').classList.toggle('hidden', !cfg.foto_obligatoria);

  // Sucursales del selector origen (según usuario logueado · Andrea Santiago / Ingrid Talca / Juan todas)
  const sucOrigen = document.getElementById('invModalSucursal');
  sucOrigen.innerHTML = ['cerrillos','maipu','talca','puerto_montt']
    .map(s => `<option value="${s}"${s===invEstado.sucursal?' selected':''}>${s}</option>`).join('');

  // Materiales · cargar del catálogo activo
  try {
    const { data: mats, error } = await sb.rpc('f_stock_vivo_visible'); // dummy; usar rpc real
  } catch(e){}
  const selMat = document.getElementById('invModalMaterial');
  selMat.innerHTML = '<option value="">Cargando…</option>';
  try {
    const { data: mats, error } = await sb.rpc('f_materiales_activos');
    if (error) throw error;
    if (Array.isArray(mats) && mats.length > 0) {
      selMat.innerHTML = mats.map(m => `<option value="${m.material_id}">${escapeHtml(m.nombre)}</option>`).join('');
    } else {
      selMat.innerHTML = '<option value="">No hay materiales cargados</option>';
    }
  } catch(e) {
    selMat.innerHTML = '<option value="">Error cargando materiales</option>';
  }

  // Reset campos
  document.getElementById('invModalKg').value = '';
  document.getElementById('invModalContraparte').value = '';
  document.getElementById('invModalFoto').value = '';
  document.getElementById('invModalNotas').value = '';
  document.getElementById('invModalMsg').classList.add('hidden');

  const modal = document.getElementById('invModalWrap');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.invCerrarModal = function() {
  const modal = document.getElementById('invModalWrap');
  modal.classList.remove('flex');
  modal.classList.add('hidden');
};

window.invGuardarMovimiento = async function() {
  const tipo = document.getElementById('invModalTipo').value;
  const cfg = INV_TIPOS[tipo];
  if (!cfg) return;

  const suc = document.getElementById('invModalSucursal').value;
  const destino = document.getElementById('invModalDestino').value;
  const mat = document.getElementById('invModalMaterial').value;
  const kg = Number(document.getElementById('invModalKg').value);
  const contraparte = document.getElementById('invModalContraparte').value.trim() || null;
  const foto = document.getElementById('invModalFoto').value.trim() || null;
  const notas = document.getElementById('invModalNotas').value.trim() || null;

  const msg = document.getElementById('invModalMsg');
  const btn = document.getElementById('invModalGuardar');

  // Validaciones cliente (backend re-valida)
  if (!mat)   return invMostrarMsg(msg, 'error', 'Elegí material');
  if (!kg || kg <= 0) return invMostrarMsg(msg, 'error', 'Kilos debe ser mayor a 0');
  if (cfg.foto_obligatoria && !foto) return invMostrarMsg(msg, 'error', 'Foto obligatoria para baja por daño');
  if (cfg.destino && suc === destino) return invMostrarMsg(msg, 'error', 'Origen y destino iguales');

  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    let res;
    if (cfg.rpc === 'crear_traslado') {
      res = await sb.rpc('crear_traslado', {
        p_origen: suc, p_destino: destino, p_material_id: mat, p_kg: kg,
        p_patente: null, p_conductor: contraparte, p_foto_url: foto, p_notas: notas
      });
    } else {
      res = await sb.rpc('crear_movimiento_salida', {
        p_sucursal_id: suc, p_material_id: mat, p_kg: kg, p_tipo_evento: tipo,
        p_contraparte: contraparte, p_foto_url: foto, p_notas: notas
      });
    }
    if (res.error) throw new Error(res.error.message);
    invMostrarMsg(msg, 'ok', '✅ Registrado. Refrescando…');
    setTimeout(() => {
      invCerrarModal();
      invCambiarSuc(invEstado.sucursal);
    }, 900);
  } catch(e) {
    invMostrarMsg(msg, 'error', 'Error: ' + (e?.message || e));
  } finally {
    btn.disabled = false; btn.textContent = 'Registrar';
  }
};

function invMostrarMsg(el, tipo, txt) {
  el.className = 'mb-2 p-2 rounded text-sm ' +
    (tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800');
  el.textContent = txt;
  el.classList.remove('hidden');
}

async function invCargarManualesRecientes(sucursal) {
  const wrap = document.getElementById('invMovsManuales');
  if (!wrap) return;
  wrap.textContent = 'Cargando…';
  try {
    const { data, error } = await sb.rpc('f_movimientos_manuales_recientes',
      { p_sucursal_id: sucursal, p_limit: 10 });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      wrap.innerHTML = '<span class="text-stone-400 italic">Sin movimientos manuales aún.</span>';
      return;
    }
    const label = t => ({
      traslado_out: '🔄 Traslado salida', traslado_in: '← Traslado entrada',
      muestra_lab: '🧪 Muestra', devolucion_prov: '↩ Devolución',
      baja_dano: '💥 Baja', merma_proceso: '⚙ Merma',
      venta_expresa: '💰 Venta expresa', ajuste_correccion: '🔧 Corrección',
      ajuste_fisico: '📋 Cierre físico', ajuste_apertura: '🎬 Apertura'
    })[t] || t;
    const fmtCLPSm = n => n === null || n === undefined ? ''
      : '· <span class="text-emerald-700 font-semibold">$' + Math.round(Number(n)).toLocaleString('es-CL') + '</span>';
    wrap.innerHTML = rows.map(m => `
      <div class="border-b border-stone-100 py-1">
        <span class="text-stone-500">${new Date(m.hora).toLocaleString('es-CL',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
        · <strong>${label(m.tipo_evento)}</strong>
        · ${escapeHtml(m.material_id||'')}
        · <span class="${Number(m.kg_delta)<0?'text-red-700':'text-green-700'}">${Number(m.kg_delta).toLocaleString('es-CL')} kg</span>
        ${m.contraparte ? '· ' + escapeHtml(m.contraparte) : ''}
        ${m.responsable ? '<span class="text-stone-400"> · ' + escapeHtml(String(m.responsable).split('@')[0]) + '</span>' : ''}
        ${fmtCLPSm(m.monto_clp)}
      </div>`).join('');
  } catch(e) {
    wrap.innerHTML = '<span class="text-red-600">Error: ' + escapeHtml(e.message||'') + '</span>';
  }
}

// Feature flag: verifica perfil y muestra/oculta entrada del sidebar + tab horizontal
async function aplicarFeatureFlagInventario() {
  try {
    const { data: flag, error } = await sb.rpc('f_stock_vivo_visible');
    const navSidebar = document.getElementById('navInventario');
    const btnTab = document.getElementById('btnTabInventario');
    const visible = !error && flag && flag.visible === true;
    if (navSidebar) navSidebar.classList.toggle('hidden', !visible);
    if (btnTab)     btnTab.classList.toggle('hidden', !visible);
  } catch(e) { console.warn('feature_flag_inventario:', e); }
}

// ============================================================
// FASE 1 · Stock Vivo · función que consume public.f_stock_sucursal(sucursal_id)
// Regla oro plata: monto_clp solo si perfil = ceo (backend enforced)
// ============================================================
async function renderStockVivo(sucursalId) {
  const wrap = document.getElementById('pnrStockVivoWrap');
  if (!wrap) return;

  // Feature flag · RPC dedicada (panel.usuarios_perfiles no está expuesta al REST · PGRST205)
  // Fix del bug del PR #599: .from('usuarios_perfiles') resolvía a public.usuarios_perfiles (inexistente)
  const { data: flag, error: flagErr } = await sb.rpc('f_stock_vivo_visible');
  if (flagErr || !flag || flag.visible !== true) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  document.getElementById('pnrStockVivoSuc').textContent = sucursalId;
  document.getElementById('pnrStockVivoMats').textContent = 'Cargando…';
  document.getElementById('pnrStockVivoMovs').textContent = 'Cargando…';

  const { data, error } = await sb.rpc('f_stock_sucursal', { p_sucursal_id: sucursalId });
  if (error) {
    document.getElementById('pnrStockVivoMats').innerHTML =
      `<span class="text-red-600">Error: ${escapeHtml(error.message)}</span>`;
    return;
  }

  const activo = data?.activo_desde;
  const nota = document.getElementById('pnrStockVivoNota');
  if (data?.placeholder) {
    nota.textContent = data.placeholder;
    nota.classList.remove('hidden');
  } else {
    nota.textContent = data?.nota_arranque || '';
    nota.classList.remove('hidden');
  }

  const lastRefresh = data?.ultimo_refresh
    ? new Date(data.ultimo_refresh).toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})
    : '—';
  document.getElementById('pnrStockVivoRefresh').textContent = `refresh ${lastRefresh}`;

  const fmtKg = n => Number(n || 0).toLocaleString('es-CL', {maximumFractionDigits: 0}) + ' kg';
  const fmtCLPStock = n => (n === null || n === undefined) ? '<span class="text-stone-300">—</span>'
                        : '$' + Math.round(Number(n)).toLocaleString('es-CL');

  const mats = Array.isArray(data?.materiales) ? data.materiales : [];
  if (mats.length === 0) {
    document.getElementById('pnrStockVivoMats').innerHTML =
      '<span class="text-stone-400 italic">Sin saldo acumulado todavía (Opción C arranque en cero).</span>';
  } else {
    const trend = t => t === 'up' ? '↑' : t === 'down' ? '↓' : t === 'flat' ? '→' : '·';
    const trendClass = t => t === 'up' ? 'text-green-700'
                          : t === 'down' ? 'text-red-700'
                          : t === 'flat' ? 'text-stone-500' : 'text-stone-400';
    document.getElementById('pnrStockVivoMats').innerHTML = `
      <table class="w-full text-sm"><thead class="text-xs text-stone-500"><tr>
        <th class="text-left py-1">Material</th>
        <th class="text-right py-1">Saldo</th>
        <th class="text-right py-1">Flujo mes</th>
        <th class="text-right py-1">Tendencia</th>
        <th class="text-right py-1">Últ. mov.</th>
      </tr></thead><tbody>${mats.map(m => `
        <tr class="border-t border-stone-100">
          <td class="py-1"><strong>${escapeHtml(m.nombre || m.material_id)}</strong>
            <span class="text-xs text-stone-400">${escapeHtml(m.material_id)}</span></td>
          <td class="text-right py-1 ${Number(m.kg_saldo) < 0 ? 'text-red-700' : 'text-stone-800'}">${fmtKg(m.kg_saldo)}</td>
          <td class="text-right py-1 text-xs">${fmtKg(m.kg_flujo_mes)}</td>
          <td class="text-right py-1 ${trendClass(m.tendencia)}">${trend(m.tendencia)} <span class="text-xs">${m.tendencia || ''}</span></td>
          <td class="text-right py-1 text-xs text-stone-500">${m.ultimo_movimiento || '—'}</td>
        </tr>`).join('')}</tbody></table>`;
  }

  const movs = Array.isArray(data?.ultimos_movimientos) ? data.ultimos_movimientos : [];
  const cePlata = data?.ceo_ve_plata === true;
  if (movs.length === 0) {
    document.getElementById('pnrStockVivoMovs').innerHTML =
      '<span class="text-stone-400 italic">Sin movimientos aún.</span>';
  } else {
    const tipoLabel = t => ({
      compra: '↓ Compra', venta: '↑ Venta', servicio_talca: '↔ Servicio Talca',
      venta_expresa: '↑ Venta expresa', traslado_out: '→ Traslado salida',
      traslado_in: '← Traslado entrada', muestra_lab: '📦 Muestra lab',
      devolucion_prov: '↩ Devolución', baja_dano: '💥 Baja daño',
      merma_proceso: '⚙ Merma proceso', ajuste_fisico: '📋 Ajuste físico',
      ajuste_apertura: '🎬 Apertura', ajuste_correccion: '🔧 Corrección'
    })[t] || t;
    document.getElementById('pnrStockVivoMovs').innerHTML = movs.map(m => `
      <div class="border-b border-stone-100 py-1">
        <span class="text-stone-500">${m.hora ? new Date(m.hora).toLocaleString('es-CL', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : m.fecha}</span>
        · <strong>${tipoLabel(m.tipo_evento)}</strong>
        · ${escapeHtml(m.material_id || '')}
        · <span class="${Number(m.kg_delta) < 0 ? 'text-red-700' : 'text-green-700'}">${fmtKg(m.kg_delta)}</span>
        ${m.contraparte ? '· ' + escapeHtml(m.contraparte) : ''}
        ${cePlata && m.monto_clp !== null ? '· <span class="text-emerald-700 font-semibold">'+fmtCLPStock(m.monto_clp)+'</span>' : ''}
        ${m.foto ? '· 📷' : ''}
      </div>`).join('');
  }
}

// ============================================================
// FLOTA GRUPO · D-PANORAMA-JUAN
// Fuente: public.f_flota_grupo() usando auth.jwt() del backend
// ============================================================
let fltEstado = { tipo: 'vehiculos', data: null };

function initFlota() {
  fltCambiar(fltEstado.tipo);
  cargarFlota();
}

window.fltCambiar = function(tipo) {
  fltEstado.tipo = tipo;
  document.querySelectorAll('.flt-tipo-btn').forEach(b => {
    if (b.dataset.fltTipo === tipo) {
      b.classList.add('border-green-700','text-green-700','font-semibold');
    } else {
      b.classList.remove('border-green-700','text-green-700','font-semibold');
    }
  });
  renderFlota();
};

async function cargarFlota() {
  document.getElementById('fltContenido').textContent = 'Cargando…';
  const { data, error } = await sb.rpc('f_flota_grupo', { p_email: null, p_version: 'v1' });
  if (error) {
    document.getElementById('fltContenido').innerHTML =
      `<span class="text-red-600">Error: ${escapeHtml(error.message)}</span>`;
    return;
  }
  fltEstado.data = data;
  renderFlota();
}

function renderFlota() {
  if (!fltEstado.data) return;
  const sucs = fltEstado.data.sucursales || {};
  const sucOrder = ['cerrillos','maipu','talca','puerto_montt'];
  const html = sucOrder.map(sid => {
    const s = sucs[sid]; if (!s) return '';
    const activos = fltEstado.tipo === 'vehiculos' ? (s.vehiculos || []) : (s.maquinas || []);
    return `<div class="bg-white p-4 rounded shadow-sm mb-4">
      <h3 class="font-semibold text-stone-700 mb-2">🏢 ${escapeHtml(s.nombre)} <span class="text-xs text-stone-400">(${activos.length})</span></h3>
      ${activos.length === 0 ? '<div class="text-xs text-stone-400 italic">Sin ' + fltEstado.tipo + ' catalogados.</div>' :
        `<table class="w-full text-sm"><thead class="text-xs text-stone-500"><tr>
          ${fltEstado.tipo === 'vehiculos' ? '<th class="text-left py-1">Patente</th>' : '<th class="text-left py-1">ID</th>'}
          <th class="text-left py-1">Tipo</th>
          <th class="text-left py-1">Responsable</th>
          <th class="text-left py-1">Estado</th>
          <th class="text-left py-1">Notas</th>
          <th class="text-right py-1">Acción</th>
        </tr></thead><tbody>${activos.map(a => {
          const estColor = a.estado_operativo === 'operativo' ? 'text-green-700' :
                           a.estado_operativo === 'dudoso' ? 'text-amber-700' :
                           a.estado_operativo === 'reparacion_pendiente' ? 'text-red-700' :
                           a.estado_operativo === 'pana_profunda' ? 'text-red-700' : 'text-stone-600';
          const estIcon = a.estado_operativo === 'operativo' ? '🟢' :
                          a.estado_operativo === 'dudoso' ? '🟡' :
                          a.estado_operativo === 'reparacion_pendiente' || a.estado_operativo === 'pana_profunda' ? '🔴' : '⚪';
          const idOrPat = fltEstado.tipo === 'vehiculos' ? (a.patente || '—') : a.vehiculo_id;
          const tramites = Array.isArray(a.tramites) ? a.tramites : [];
          const tramLine = tramites.length === 0 ? '<span class="text-stone-400 italic text-xs">Sin trámites cargados</span>' :
            tramites.map(t => {
              const dias = t.fecha_vencimiento ? Math.ceil((new Date(t.fecha_vencimiento) - new Date()) / 86400000) : null;
              const semaforo = dias === null ? '⚪' : dias < 15 ? '🔴' : dias < 60 ? '🟡' : '🟢';
              return `<span class="text-xs mr-2">${semaforo} ${escapeHtml(t.tramite)} ${t.fecha_vencimiento || 'sin fecha'}</span>`;
            }).join('');
          return `<tr class="border-t border-stone-100">
            <td class="py-1 font-mono text-xs">${escapeHtml(idOrPat)}</td>
            <td class="py-1">${escapeHtml(a.tipo || '—')}</td>
            <td class="py-1 text-xs">${escapeHtml(a.responsable || '—')}</td>
            <td class="py-1 text-xs"><span class="${estColor}">${estIcon} ${escapeHtml(a.estado_operativo || '—')}</span></td>
            <td class="py-1 text-xs text-stone-500">${escapeHtml(a.notas || '')}</td>
            <td class="py-1 text-right">
              <button onclick="abrirTramiteModal('${escapeHtml(a.vehiculo_id)}')" class="text-xs bg-green-700 hover:bg-green-800 text-white px-2 py-0.5 rounded">+ Trámite</button>
            </td>
          </tr>
          <tr class="border-t border-stone-100 border-t-0"><td colspan="6" class="pb-2 pl-2">${tramLine}</td></tr>`;
        }).join('')}</tbody></table>`}
    </div>`;
  }).join('');
  document.getElementById('fltContenido').innerHTML = html;
}

window.abrirTramiteModal = function(activoId) {
  document.getElementById('tramiteActivoId').textContent = activoId;
  document.getElementById('tramiteFecha').value = '';
  document.getElementById('tramiteEvidencia').value = '';
  document.getElementById('tramiteNotas').value = '';
  const m = document.getElementById('tramiteModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
};

window.cerrarTramiteModal = function() {
  const m = document.getElementById('tramiteModal');
  m.classList.add('hidden');
  m.classList.remove('flex');
};

window.guardarTramite = async function() {
  const activo = document.getElementById('tramiteActivoId').textContent;
  const tramite = document.getElementById('tramiteTipo').value;
  const fecha = document.getElementById('tramiteFecha').value;
  const evidencia = document.getElementById('tramiteEvidencia').value.trim() || null;
  const notas = document.getElementById('tramiteNotas').value.trim() || null;

  if (!fecha) { alert('Fecha de vencimiento requerida'); return; }

  const sucBase = (fltEstado.data?.sucursales && Object.entries(fltEstado.data.sucursales).find(([sid,s]) =>
    [...(s.vehiculos||[]), ...(s.maquinas||[])].some(a => a.vehiculo_id === activo))) || [];
  const sucursalCode = sucBase[0] || null;

  // Estado semántico: si la fecha_vencimiento está en el futuro → 'aprobado' (doc al día)
  // Si ya venció (fecha < hoy) → 'vencido' (dato honesto).
  // CHECK constraint acepta: pendiente, en_proceso, aprobado, rechazado, vencido, renovado.
  const hoyIso = new Date().toISOString().slice(0, 10);
  const estadoInferido = fecha < hoyIso ? 'vencido' : 'aprobado';

  const { error } = await sb.schema('panel').from('tramites_sucursal').insert({
    sucursal_codigo: sucursalCode,
    activo_id: activo,
    tramite: tramite,
    estado: estadoInferido,
    fecha_vencimiento: fecha,
    evidencia_url: evidencia,
    notas: notas,
    created_by: (typeof window.currentUser === 'object' && window.currentUser?.email) || 'panel'
  });

  if (error) { alert('Error: ' + error.message); return; }
  cerrarTramiteModal();
  await cargarFlota();
};
