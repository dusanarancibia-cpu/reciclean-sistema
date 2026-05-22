// ============================================================
// public/js/e360-context-menu.js
// Menu contextual E360 — D-MISMATCH Mig 035 frontend
// Click-derecho sobre [data-entity-type][data-entity-id] dispara
// un menú flotante con los ecosistemas / capas / objetivos
// vinculados a esa entidad RDO via curated.rdo_e360_links.
// ============================================================
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__E360_MENU_LOADED__) return;
  window.__E360_MENU_LOADED__ = true;

  const CACHE = new Map();           // key: "tipo|id|nivel" -> slice JSON
  const CACHE_MAX = 200;
  let menuEl = null;
  let closeListener = null;

  function getSb() {
    return window.sb || (typeof sb !== 'undefined' ? sb : null);
  }

  function detectarNivel(target) {
    if (target.closest('[data-context-level="proceso"]')) return 'proceso';
    if (target.closest('[data-context-level="vista"]'))    return 'vista';
    return 'campo';
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cacheTrim() {
    if (CACHE.size <= CACHE_MAX) return;
    const keys = Array.from(CACHE.keys()).slice(0, CACHE.size - CACHE_MAX);
    keys.forEach(k => CACHE.delete(k));
  }

  async function fetchSlice(tipo, id, nivel) {
    const key = `${tipo}|${id}|${nivel}`;
    if (CACHE.has(key)) return CACHE.get(key);
    const sb = getSb();
    if (!sb) return { error: 'cliente Supabase no inicializado' };
    const { data, error } = await sb
      .schema('curated')
      .rpc('f_e360_slice_for_entity', { p_tipo: tipo, p_id: id, p_nivel: nivel });
    if (error) return { error: error.message };
    CACHE.set(key, data);
    cacheTrim();
    return data;
  }

  function entityHeader(tipo) {
    const map = {
      oportunidad:  ['🎯', 'Oportunidad'],
      cliente:      ['👥', 'Cliente'],
      material:     ['📦', 'Material'],
      trabajador:   ['👤', 'Trabajador'],
      sucursal:     ['📍', 'Sucursal'],
      empresa:      ['🏢', 'Empresa'],
      servicio:     ['🛠️', 'Servicio'],
      oferente:     ['💼', 'Oferente'],
      factura:      ['🧾', 'Factura'],
      cierre:       ['📅', 'Cierre'],
      compra_diesel:['⛽', 'Diesel'],
    };
    return map[tipo] || ['•', tipo];
  }

  function renderMenu(slice, x, y, fallbackTitulo) {
    closeMenu();
    if (slice?.error) {
      menuEl = document.createElement('div');
      menuEl.className = 'fixed z-[9999] bg-white shadow-xl border border-red-300 rounded-lg p-3 text-sm text-red-700';
      menuEl.style.left = x + 'px'; menuEl.style.top = y + 'px';
      menuEl.textContent = 'Error E360: ' + slice.error;
      document.body.appendChild(menuEl);
      attachCloseListener();
      return;
    }

    const entity = slice?.entity || {};
    const [emoji, label] = entityHeader(entity.tipo);
    const ecos = Array.isArray(slice?.ecosistemas_e360) ? slice.ecosistemas_e360 : [];
    const capas = Array.isArray(slice?.capas_e360) ? slice.capas_e360 : [];
    const objs = Array.isArray(slice?.objetivos_e360) ? slice.objetivos_e360 : [];
    const kpis = Array.isArray(slice?.kpis) ? slice.kpis : [];
    const decs = Array.isArray(slice?.decisiones) ? slice.decisiones : [];

    const lines = [];
    lines.push(`<div class="px-3 py-2 bg-stone-50 border-b border-stone-200 font-semibold text-stone-800">${emoji} ${esc(label)}: <span class="text-stone-600 font-normal">${esc(fallbackTitulo || entity.id || '')}</span></div>`);

    function seccion(titulo, items, renderItem, vacioMsg) {
      lines.push(`<div class="px-3 pt-2 pb-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">${esc(titulo)} <span class="text-stone-400 font-normal">(${items.length})</span></div>`);
      if (items.length === 0) {
        lines.push(`<div class="px-3 pb-2 text-xs text-stone-400 italic">${esc(vacioMsg || 'Sin vínculos')}</div>`);
        return;
      }
      lines.push('<div class="pb-1">');
      items.slice(0, 6).forEach(it => lines.push(renderItem(it)));
      if (items.length > 6) lines.push(`<div class="px-3 py-1 text-xs text-stone-400">+ ${items.length - 6} más</div>`);
      lines.push('</div>');
    }

    seccion('🌐 Ecosistemas E360', ecos, (e) => `
      <div class="px-3 py-1 hover:bg-stone-50 cursor-default flex items-center gap-2">
        <span class="text-xs text-stone-400 font-mono w-14">${esc(e.id)}</span>
        <span class="text-sm text-stone-700 flex-1">${esc(e.nombre)}</span>
        <span class="text-xs text-stone-400">${esc(e.tipo_link)}</span>
        <span class="text-xs px-1.5 py-0.5 rounded ${e.inferido ? 'bg-stone-100 text-stone-500' : 'bg-green-100 text-green-700'}">${e.inferido ? 'auto' : 'humano'} ${e.fuerza}</span>
      </div>`,
      'Sin ecosistemas vinculados');

    seccion('📂 Capas', capas, (c) => `
      <div class="px-3 py-1 hover:bg-stone-50 cursor-default flex items-center gap-2">
        <span class="text-xs text-stone-400 font-mono w-10">${esc(c.numero)}</span>
        <span class="text-sm text-stone-700 flex-1">${esc(c.nombre)} <span class="text-stone-400 text-xs">· ${esc(c.ecosistema_nombre)}</span></span>
        <span class="text-xs text-stone-400">${esc(c.fuerza)}</span>
      </div>`,
      'Sin capas (etapa A solo agrega ecosistemas — capas curadas vienen etapa B)');

    seccion('🎯 Objetivos', objs, (o) => `
      <div class="px-3 py-1 hover:bg-stone-50 cursor-default">
        <div class="text-sm text-stone-700">${esc(o.objetivo)}</div>
        <div class="text-xs text-stone-400">${esc(o.ecosistema_nombre)}${o.meta_valor ? ' · meta ' + esc(o.meta_valor) + ' ' + esc(o.meta_unidad || '') : ''}</div>
      </div>`,
      'Sin objetivos vinculados');

    if (kpis.length > 0) seccion('📊 KPIs', kpis, (k) => `<div class="px-3 py-1 text-sm text-stone-700">${esc(k.nombre || k)}</div>`, 'Sin KPIs');
    if (decs.length > 0) seccion('📋 Decisiones', decs, (d) => `<div class="px-3 py-1 text-sm text-stone-700">${esc(d.id || d)}: ${esc(d.titulo || '')}</div>`, 'Sin decisiones');

    lines.push(`<div class="px-3 py-2 border-t border-stone-100 flex justify-between text-xs text-stone-400"><span>Nivel: ${esc(entity.nivel || 'campo')}</span><span>${slice?.metadata?.count_links ?? 0} links</span></div>`);

    menuEl = document.createElement('div');
    menuEl.className = 'fixed z-[9999] bg-white shadow-xl border border-stone-200 rounded-lg overflow-hidden text-sm';
    menuEl.style.minWidth = '320px';
    menuEl.style.maxWidth = '460px';
    menuEl.style.maxHeight = '70vh';
    menuEl.style.overflowY = 'auto';
    menuEl.style.left = Math.min(x, window.innerWidth - 480) + 'px';
    menuEl.style.top  = Math.min(y, window.innerHeight - 200) + 'px';
    menuEl.innerHTML = lines.join('');
    document.body.appendChild(menuEl);
    attachCloseListener();
  }

  function attachCloseListener() {
    closeListener = (ev) => {
      if (!menuEl) return;
      if (ev.type === 'keydown' && ev.key !== 'Escape') return;
      if (ev.type === 'click' && menuEl.contains(ev.target)) return;
      closeMenu();
    };
    setTimeout(() => {
      document.addEventListener('click', closeListener, true);
      document.addEventListener('keydown', closeListener, true);
      document.addEventListener('contextmenu', closeListener, true);
    }, 0);
  }

  function closeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
    if (closeListener) {
      document.removeEventListener('click', closeListener, true);
      document.removeEventListener('keydown', closeListener, true);
      document.removeEventListener('contextmenu', closeListener, true);
      closeListener = null;
    }
  }

  document.addEventListener('contextmenu', async (e) => {
    const target = e.target.closest('[data-entity-type][data-entity-id]');
    if (!target) return;
    const tipo = target.dataset.entityType;
    const id   = target.dataset.entityId;
    if (!tipo || !id) return;
    e.preventDefault();
    const nivel = detectarNivel(target);
    const fallback = target.dataset.entityNombre || target.textContent?.trim().slice(0, 60);

    // Mostrar placeholder mientras carga
    renderMenu({ entity: { tipo, id, nivel }, ecosistemas_e360: [], capas_e360: [], objetivos_e360: [], metadata: { count_links: 0 } }, e.clientX, e.clientY, fallback);

    const slice = await fetchSlice(tipo, id, nivel);
    renderMenu(slice, e.clientX, e.clientY, fallback);
  });

  // API pública para debug
  window.e360 = {
    clearCache: () => CACHE.clear(),
    cacheSize:  () => CACHE.size,
    closeMenu,
  };

})();
