/* ═══════════════════════════════════════════════════════════
   Panel RDO · Manual con filtros por silo
   Branch: claude/panel-amor-verde-26may
   Propósito: 6 botones de silos en landing 6W filtran procesos
              en el div #manualContenido por keywords del silo.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const SILOS = {
    comercial: {
      label: '💼 Comercial',
      keywords: ['cotizacion', 'negocio-expedicionario', 'factura-venta', 'pago-cobranza', 'inteligencia-competitiva'],
      mensaje: 'Procesos comerciales · Andrea ejecuta · Dusan firma sobre 100 UF.'
    },
    operaciones: {
      label: '⚙️ Operaciones',
      keywords: ['planificacion-viaje', 'pesaje', 'guia-despacho', 'recepcion-material-v2', 'planificacion-viaje-v2', 'rechazo-devolucion-v2', 'cierre-viaje-v2'],
      mensaje: 'Procesos operativos · Ingrid Talca · Cony Maipú/Cerrillos · choferes T08-T10.'
    },
    finanzas: {
      label: '💰 Finanzas',
      keywords: ['factura-compra', 'factura-venta', 'nota-credito', 'pago-cobranza', 'rendicion-dinero', 'costos', 'cierre-mes', 'prefactura-v2', 'pago-proveedor-v2'],
      mensaje: 'Procesos financieros · Dyana ejecuta · Dusan firma cierres y notas crédito.'
    },
    rrhh: {
      label: '🤝 RRHH',
      keywords: ['liquidacion-sueldo', 'asistencia'],
      mensaje: 'Procesos de personas · Cony (RRHH interno) · Dyana (SERCOT liquidación).'
    },
    cumplimiento: {
      label: '⚖️ Cumplimiento',
      keywords: ['cumplimiento-legal', 'rdo-diario'],
      mensaje: 'Procesos legales · R-AUD-029 5 leyes · MMA Ley REP diaria.'
    },
    tecnico: {
      label: '🛠️ Técnico',
      keywords: [],
      mensaje: 'Procesos técnicos · Pablo Tech Lead · Cesar soporte. Mantenimiento panel + EFs + Supabase.'
    }
  };

  let siloActivo = null;

  function aplicarFiltro(siloId) {
    const contenedor = document.getElementById('manualContenido');
    if (!contenedor) return;
    siloActivo = (siloActivo === siloId) ? null : siloId;
    const silo = SILOS[siloId];
    if (!silo) return;

    if (siloActivo === null) {
      contenedor.querySelectorAll('h3, p, table, ul, ol, pre, blockquote, div').forEach(el => el.style.display = '');
      removerBanner();
      actualizarBotones();
      if (window.amorDivorcio) window.amorDivorcio.mover(+1, 'limpia filtro manual', 'tabManual');
      return;
    }

    const procesoEls = contenedor.querySelectorAll('h3');
    let firstMatch = null;
    procesoEls.forEach(h3 => {
      const txt = (h3.textContent || '').toLowerCase();
      const matches = silo.keywords.some(kw => txt.includes(kw.replace(/-/g, ' ')) || nearAnchor(h3, kw));
      const oculto = silo.keywords.length > 0 && !matches;
      h3.style.display = oculto ? 'none' : '';
      let next = h3.nextElementSibling;
      while (next && next.tagName !== 'H3') {
        next.style.display = oculto ? 'none' : '';
        next = next.nextElementSibling;
      }
      if (matches && !firstMatch) firstMatch = h3;
    });

    mostrarBanner(silo);
    actualizarBotones();

    if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.amorDivorcio) window.amorDivorcio.mover(+2, `filtra manual a ${siloId}`, 'tabManual');
  }

  function nearAnchor(h3, slug) {
    let prev = h3.previousElementSibling;
    let safety = 0;
    while (prev && safety++ < 3) {
      if (prev.tagName === 'A' && prev.id === 'proceso-' + slug) return true;
      if (prev.tagName === 'H3') break;
      prev = prev.previousElementSibling;
    }
    return false;
  }

  function mostrarBanner(silo) {
    removerBanner();
    const cont = document.getElementById('manualContenido');
    if (!cont) return;
    const banner = document.createElement('div');
    banner.id = 'manualBannerSilo';
    banner.style.cssText = `
      background: var(--amor-verde-claro); border-left: 4px solid var(--amor-verde-medio);
      padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;
    `;
    banner.innerHTML = `
      <div style="font-weight:700; color:var(--amor-verde-profundo);">${silo.label} · vista filtrada</div>
      <div style="color:#4b5563; margin-top:3px;">${silo.mensaje}</div>
      <button onclick="window.manualSilos.limpiar()" style="margin-top:6px; font-size:11px; color:var(--amor-verde-medio); text-decoration:underline; cursor:pointer; background:none; border:none;">Quitar filtro · ver todo</button>
    `;
    cont.parentNode.insertBefore(banner, cont);
  }

  function removerBanner() {
    const b = document.getElementById('manualBannerSilo');
    if (b) b.remove();
  }

  function actualizarBotones() {
    document.querySelectorAll('.manual-silo').forEach(btn => {
      if (btn.dataset.silo === siloActivo) {
        btn.style.boxShadow = '0 0 0 3px white, 0 0 0 5px var(--amor-verde-profundo)';
      } else {
        btn.style.boxShadow = '';
      }
    });
  }

  function init() {
    document.querySelectorAll('.manual-silo').forEach(btn => {
      btn.addEventListener('click', () => aplicarFiltro(btn.dataset.silo));
    });
  }

  window.manualSilos = {
    aplicar: aplicarFiltro,
    limpiar: () => {
      siloActivo = null;
      const cont = document.getElementById('manualContenido');
      if (cont) cont.querySelectorAll('h3, p, table, ul, ol, pre, blockquote, div').forEach(el => el.style.display = '');
      removerBanner();
      actualizarBotones();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 800);
  }
  console.log('📖 Manual silos · 6 filtros listos');
})();
