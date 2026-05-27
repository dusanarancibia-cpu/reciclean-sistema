/* ═══════════════════════════════════════════════════════════
   Panel RDO · Navegación con vuelta a Portada
   Branch: claude/panel-amor-verde-26may
   Propósito: barra sticky con "← Volver / 🏠 Portada / acciones del tab"
              para que el usuario NUNCA quede atrapado en una isla.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let historial = ['portada'];
  const MAX_HIST = 10;

  // Nombre amigable por tab
  const NOMBRES = {
    portada: '🏠 Portada',
    pesaje: '⚖️ Pesaje',
    facturacion: '🧾 Facturación',
    dieguito: '📎 Dieguito',
    comunicados: '🎧 Comunicados',
    manual: '📖 Manual',
    mi_memoria: '🧠 Mi memoria',
    rdo: '📈 RDO Resumen',
    negocios: '💼 Negocios',
    cotizador: '📋 Cotizador',
    cierres: '📅 Cierres',
    precios: '💲 Precios',
    bandeja_precios: '📨 Bandeja Precios',
    operativos: '📑 Operativos',
    reconciliacion: '🔗 Reconciliación',
    cartera: '👥 Cartera',
    oportunidades: '🎯 Oportunidades',
    entregables: '📤 Entregables',
    bandeja_dieg: '📥 Bandeja Diego',
    ops_diarias: '🌅 Operaciones Día',
    comercial: '💼 Comercial',
    admin: '⚙️ Admin'
  };

  function crearBarra() {
    if (document.getElementById('navVueltaBar')) return;
    const bar = document.createElement('div');
    bar.id = 'navVueltaBar';
    bar.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 45;
      background: white; border-bottom: 2px solid var(--amor-verde-medio);
      padding: 8px 14px; display: flex; align-items: center; gap: 10px;
      flex-wrap: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    `;
    bar.innerHTML = `
      <button id="navBtnVolver" type="button" title="Volver al tab anterior" aria-label="Volver"
              style="padding:8px 12px; font-size:13px; font-weight:600; color:#374151; background:#f3f4f6; border:none; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; min-height:38px;">
        <span style="font-size:16px;">←</span>
        <span class="nav-txt-volver">Volver</span>
      </button>
      <button id="navBtnHome" type="button" title="Ir a portada" aria-label="Portada"
              style="padding:8px 12px; font-size:13px; font-weight:700; color:white; background:var(--amor-verde-medio); border:none; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; min-height:38px;">
        <span style="font-size:16px;">🏠</span>
        <span class="nav-txt-portada">Portada</span>
      </button>
      <div id="navBreadcrumb" style="flex:1; min-width: 0; font-size:12px; color:#6b7280; padding:0 8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">—</div>
      <div id="navAcciones" style="display:flex; gap:6px; flex-shrink:0;"></div>
    `;
    // Estilos responsive inyectados (ocultar texto en mobile)
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 540px) {
        #navVueltaBar { padding: 6px 10px; gap: 6px; }
        #navVueltaBar .nav-txt-volver, #navVueltaBar .nav-txt-portada { display: none; }
        #navBreadcrumb { font-size: 11px; }
      }
    `;
    document.head.appendChild(style);
    // Fixed arriba de todo · al body
    document.body.appendChild(bar);
    // Empujar el contenido principal hacia abajo para no taparlo
    setTimeout(() => {
      const h = bar.getBoundingClientRect().height || 50;
      document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + h + 'px';
      // Como alternativa más segura, agregar margen al main
      const main = document.querySelector('main, #mainContent');
      if (main) main.style.scrollMarginTop = h + 'px';
    }, 50);

    document.getElementById('navBtnVolver').addEventListener('click', volverAtras);
    document.getElementById('navBtnHome').addEventListener('click', irPortada);
  }

  function tabActiva() {
    const btn = document.querySelector('button.tab-btn.active');
    return btn?.dataset.tab || 'portada';
  }

  function volverAtras() {
    if (historial.length < 2) {
      irPortada();
      return;
    }
    historial.pop(); // saco la actual
    const previo = historial.pop(); // saco la previa para re-empujar luego
    irA(previo);
  }

  function irPortada() {
    irA('portada');
  }

  function irA(tabId) {
    const btn = document.querySelector(`button.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }

  function refrescarBarra() {
    const actual = tabActiva();
    if (historial[historial.length - 1] !== actual) {
      historial.push(actual);
      historial = historial.slice(-MAX_HIST);
    }

    // Breadcrumb
    const breadcrumb = document.getElementById('navBreadcrumb');
    if (breadcrumb) {
      const ruta = historial.slice(-3).map(t => NOMBRES[t] || t).join('  ›  ');
      breadcrumb.innerHTML = `<span style="opacity:0.6;">Estás en:</span> <strong style="color:#0a4f3a;">${NOMBRES[actual] || actual}</strong> <span style="opacity:0.5; margin-left:14px;">${ruta}</span>`;
    }

    // Botón volver habilitado si hay historia
    const btnVolver = document.getElementById('navBtnVolver');
    if (btnVolver) {
      const hay = historial.length >= 2;
      btnVolver.disabled = !hay;
      btnVolver.style.opacity = hay ? '1' : '0.5';
      btnVolver.style.cursor = hay ? 'pointer' : 'not-allowed';
    }

    // Acciones por tab
    const accionesDiv = document.getElementById('navAcciones');
    if (accionesDiv) accionesDiv.innerHTML = accionesPorTab(actual);
  }

  function accionesPorTab(tabId) {
    const acciones = [];
    // Acciones comunes que pueden aplicarse según contexto
    if (['rdo','cartera','oportunidades','cierres','facturacion','reconciliacion','precios','bandeja_dieg','bandeja_precios','operativos','comercial'].includes(tabId)) {
      acciones.push(btnAccion('📥', 'Descargar CSV', 'descargarCsv'));
    }
    if (['manual','rdo','cierres','operativos','entregables'].includes(tabId)) {
      acciones.push(btnAccion('📄', 'Imprimir / PDF', 'imprimir'));
    }
    if (['portada','rdo','bandeja_dieg','bandeja_precios','operativos','oportunidades'].includes(tabId)) {
      acciones.push(btnAccion('↻', 'Refrescar datos', 'refrescar'));
    }
    return acciones.join('');
  }

  function btnAccion(icono, titulo, accion) {
    return `<button type="button" onclick="window.navVuelta.accion('${accion}')" title="${titulo}"
              style="padding:6px 10px; font-size:13px; color:#374151; background:#f3f4f6; border:none; border-radius:8px; cursor:pointer;">${icono}</button>`;
  }

  function manejarAccion(accion) {
    const tab = tabActiva();
    switch (accion) {
      case 'imprimir':
        if (window.amorDivorcio) window.amorDivorcio.mover(+1, 'imprime ' + tab, tab);
        window.print();
        break;
      case 'descargarCsv':
        descargarCsvDelTab(tab);
        break;
      case 'refrescar':
        refrescarDatos(tab);
        break;
    }
  }

  function descargarCsvDelTab(tab) {
    const seccion = document.getElementById('tab' + tab.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(''));
    if (!seccion) return alert('No encontré la tabla de este tab');
    const tabla = seccion.querySelector('table');
    if (!tabla) return alert('Este tab no tiene una tabla para descargar.');
    const rows = Array.from(tabla.querySelectorAll('tr')).map(tr => {
      return Array.from(tr.querySelectorAll('th, td')).map(c => {
        const txt = (c.textContent || '').trim().replace(/"/g, '""');
        return /[,\n"]/.test(txt) ? `"${txt}"` : txt;
      }).join(',');
    });
    const csv = rows.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reciclean-${tab}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.amorDivorcio) window.amorDivorcio.mover(+2, 'descargó CSV ' + tab, tab);
  }

  function refrescarDatos(tab) {
    // Heurísticas comunes
    const candidatos = ['loadBandejaDiego', 'loadBandejaPrecios', 'reload' + tab];
    let llamado = false;
    candidatos.forEach(fn => {
      if (typeof window[fn] === 'function') { window[fn](); llamado = true; }
    });
    // Botones de refrescar en el tab
    const seccion = document.querySelector('section.tab-content:not(.hidden)');
    if (seccion) {
      const btn = seccion.querySelector('button[onclick*="load"], button[id*="Reload"], button[id*="reload"]');
      if (btn) { btn.click(); llamado = true; }
    }
    if (!llamado) alert('Este tab no tiene un refresco automático conocido. Cargá la página de nuevo.');
    if (window.amorDivorcio) window.amorDivorcio.mover(+1, 'refresca ' + tab, tab);
  }

  window.navVuelta = { accion: manejarAccion, refrescar: refrescarBarra, irA };

  // Hook a los botones de tab para refrescar la barra cuando cambia
  function bindTabs() {
    document.querySelectorAll('button.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(refrescarBarra, 100));
    });
  }

  function init() {
    crearBarra();
    bindTabs();
    refrescarBarra();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 400);
  }
  console.log('🧭 Navegación con vuelta activada');
})();
