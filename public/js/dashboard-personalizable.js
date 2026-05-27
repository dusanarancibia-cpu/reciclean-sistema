/* ═══════════════════════════════════════════════════════════
   Panel RDO · Dashboard personalizable (widgets a la carta)
   Branch: claude/panel-amor-verde-26may
   Propósito: cada usuario ve la portada con SUS widgets visibles.
              Botón ⚙️ "Personalizar" abre modal con toggles.
   Persistencia: localStorage por usuario.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'amor_dashboard_widgets_v1';

  // Widgets a detectar dentro de #tabPortada (y mostrar como toggles)
  // Si el selector existe en DOM, lo trato como widget.
  const WIDGETS = [
    { id: 'diegoSugiereWidget',   nombre: '💡 Diego sugiere hoy',     selector: '#diegoSugiereWidget',   defVisible: true },
    { id: 'v4-diego-health',      nombre: '🤖 Salud de Diego',        selector: '#v4-diego-health',      defVisible: true },
    { id: 'atencion-hoy',         nombre: '🔥 Esto necesita atención hoy', selector: '[aria-label="Pendientes de hoy"]', defVisible: true },
    { id: 'v4-diego-agenda',      nombre: '📅 Agenda con Diego',      selector: '#v4-diego-agenda',      defVisible: true },
    { id: 'kpis-sparkline',       nombre: '📈 KPIs (sparklines)',     selector: '[aria-label*="KPI" i]', defVisible: true },
    { id: 'acciones-rapidas',     nombre: '⚡ Acciones rápidas',      selector: '[aria-label*="Acciones" i]', defVisible: true },
    { id: 'comunicados-portada',  nombre: '🎧 Comunicados destacados', selector: '#portadaAudioPlayer', defVisible: true }
  ];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved;
    } catch (e) {
      return {};
    }
  }
  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
  }

  function getVisibility(id) {
    const state = loadState();
    if (id in state) return state[id];
    const widget = WIDGETS.find(w => w.id === id);
    return widget ? widget.defVisible : true;
  }
  function setVisibility(id, visible) {
    const state = loadState();
    state[id] = visible;
    saveState(state);
    aplicarTodos();
  }

  function aplicarTodos() {
    WIDGETS.forEach(w => {
      const el = document.querySelector(w.selector);
      if (!el) return;
      const visible = getVisibility(w.id);
      el.style.display = visible ? '' : 'none';
    });
  }

  function inyectarBotonPersonalizar() {
    if (document.getElementById('btnPersonalizarDashboard')) return;
    const portada = document.getElementById('tabPortada');
    if (!portada) return;

    const btn = document.createElement('button');
    btn.id = 'btnPersonalizarDashboard';
    btn.type = 'button';
    btn.innerHTML = '⚙️ Personalizar dashboard';
    btn.style.cssText = `
      position: absolute; top: 14px; right: 14px;
      padding: 8px 14px; font-size: 12px; font-weight: 700;
      background: white; border: 2px solid var(--amor-verde-medio);
      color: var(--amor-verde-profundo); border-radius: 999px;
      cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      z-index: 5; transition: all 0.2s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = 'var(--amor-verde-claro)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'white');
    btn.addEventListener('click', abrirModal);

    // Insertar como primer hijo de tabPortada con position relative
    portada.style.position = 'relative';
    portada.insertBefore(btn, portada.firstChild);
  }

  function abrirModal() {
    if (document.getElementById('dashboardPersonalizarModal')) return;
    const modal = document.createElement('div');
    modal.id = 'dashboardPersonalizarModal';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px); z-index: 100;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; animation: amor-fadein 0.25s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: white; border-radius: 18px;
      max-width: 500px; width: 100%; max-height: 85vh; overflow-y: auto;
      padding: 28px 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: amor-slideup 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Header
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:14px;">
        <div>
          <div style="font-size:11px; color:var(--amor-verde-medio); font-weight:700; letter-spacing:1px; text-transform:uppercase;">Tu dashboard · a la carta</div>
          <h2 style="font-size:24px; font-weight:800; color:var(--amor-verde-profundo); margin-top:4px; line-height:1.1;">¿Qué bloques querés ver en tu portada?</h2>
        </div>
        <button onclick="document.getElementById('dashboardPersonalizarModal').remove()" style="background:none; border:none; font-size:28px; color:#9ca3af; cursor:pointer; line-height:1;">×</button>
      </div>
      <p style="font-size:13px; color:#4b5568; margin-bottom:16px;">
        Tildeá lo que querés que aparezca cuando abras la portada. La preferencia queda guardada en este navegador.
      </p>
      <div id="dashWidgetsList" style="display:flex; flex-direction:column; gap:8px;">
    `;

    WIDGETS.forEach(w => {
      const existe = !!document.querySelector(w.selector);
      const visible = getVisibility(w.id);
      const disabled = !existe ? 'disabled' : '';
      const opacity = !existe ? '0.4' : '1';
      const hint = !existe ? '<span style="font-size:10px; color:#9ca3af; margin-left:6px;">(no encontrado en tu vista)</span>' : '';
      html += `
        <label style="display:flex; align-items:center; gap:12px; padding:12px 14px; border:2px solid ${visible ? 'var(--amor-verde-medio)' : '#e5e7eb'}; border-radius:12px; cursor:${existe ? 'pointer' : 'not-allowed'}; opacity:${opacity}; transition:all 0.2s;">
          <input type="checkbox" ${visible ? 'checked' : ''} ${disabled} data-widget-id="${w.id}" style="width:20px; height:20px; accent-color:var(--amor-verde-medio); cursor:${existe ? 'pointer' : 'not-allowed'};">
          <span style="flex:1; font-size:14px; font-weight:600; color:#1f2937;">${w.nombre}${hint}</span>
        </label>
      `;
    });

    html += `
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
        <button id="dashRestaurar" style="padding:10px 18px; font-size:13px; font-weight:600; color:#6b7280; background:#f3f4f6; border:none; border-radius:999px; cursor:pointer;">Restaurar todo</button>
        <button id="dashGuardar" style="padding:10px 20px; font-size:13px; font-weight:700; color:white; background:var(--amor-verde-medio); border:none; border-radius:999px; cursor:pointer; box-shadow:0 4px 12px rgba(26,147,111,0.3);">Listo · guardar</button>
      </div>
    `;

    card.innerHTML = html;
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Cerrar al clic en overlay
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) modal.remove();
    });

    // Cambios en checkboxes
    card.querySelectorAll('input[data-widget-id]').forEach(chk => {
      chk.addEventListener('change', () => {
        setVisibility(chk.dataset.widgetId, chk.checked);
        // Pintar bordes de label
        const label = chk.closest('label');
        if (label) label.style.borderColor = chk.checked ? 'var(--amor-verde-medio)' : '#e5e7eb';
        if (window.amorDivorcio) window.amorDivorcio.mover(+1, `${chk.checked ? 'muestra' : 'oculta'} widget ${chk.dataset.widgetId}`, 'portada');
      });
    });

    // Restaurar default
    card.querySelector('#dashRestaurar').addEventListener('click', () => {
      saveState({});
      modal.remove();
      aplicarTodos();
      abrirModal(); // refresca
    });

    // Cerrar guardando
    card.querySelector('#dashGuardar').addEventListener('click', () => {
      modal.remove();
      if (window.amorDivorcio) window.amorDivorcio.mover(+2, 'personalizó dashboard', 'portada');
    });
  }

  function init() {
    inyectarBotonPersonalizar();
    aplicarTodos();
    // Re-aplicar cuando se entra a portada
    document.querySelectorAll('button.tab-btn[data-tab="portada"]').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(aplicarTodos, 200));
    });
  }

  window.dashboardPersonalizable = {
    abrir: abrirModal,
    aplicar: aplicarTodos,
    reset: () => { saveState({}); aplicarTodos(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 700);
  }
  console.log('🎛️ Dashboard personalizable activado · ' + WIDGETS.length + ' widgets posibles');
})();
