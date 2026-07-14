// ============================================================
// MANUAL DEL EQUIPO — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function manualBootstrap() {
  const MANUAL_URL = '/MANUAL-OPERATIVO-EQUIPO.md';
  const BYPASS_EMAILS = new Set([
    'gerencia@gestionrepchile.cl',
    'dusan.arancibia@gmail.com',
    'sistemas@gestionrepchile.cl',
    'recepcion01@gestionrepchile.cl',
    'soporte@gestionrepchile.cl',
  ]);
  let manualLoaded = false;
  let manualHtml = '';
  let manualUserNombre = '';
  let manualUserRol = '';
  let manualUserEmail = '';
  let currentFilter = 'mia';
  let mermaidInited = false;
  let commentCurrentProceso = { num: 0, nombre: '' };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getCurrentEmail() {
    try {
      const s = JSON.parse(localStorage.getItem('rf_session') || 'null');
      return (s && s.email) ? String(s.email).toLowerCase() : '';
    } catch { return ''; }
  }

  async function loadUserProfile() {
    manualUserEmail = getCurrentEmail();
    if (!manualUserEmail) { manualUserNombre = '—'; manualUserRol = '—'; return; }
    try {
      if (typeof sb === 'undefined' || !sb) return;
      const { data } = await sb.schema('panel').from('dotacion')
        .select('nombre, rol').ilike('email', manualUserEmail).maybeSingle();
      if (data) {
        manualUserNombre = data.nombre || manualUserEmail;
        manualUserRol = data.rol || '—';
      } else {
        manualUserNombre = manualUserEmail;
        manualUserRol = 'sin rol asignado';
      }
    } catch (e) { console.warn('manual user profile:', e); }
  }

  async function loadManualMd() {
    if (manualLoaded) return;
    try {
      const r = await fetch(MANUAL_URL);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const md = await r.text();
      // Esperar a que marked esté disponible (defer)
      let attempts = 0;
      while (typeof window.marked === 'undefined' && attempts < 50) {
        await new Promise((res) => setTimeout(res, 100));
        attempts++;
      }
      if (typeof window.marked === 'undefined') {
        manualHtml = '<p class="text-red-600">No pude cargar marked.js (CDN). Revisá conexión.</p><pre>' + esc(md.slice(0, 4000)) + '</pre>';
      } else {
        manualHtml = window.marked.parse(md, { breaks: false });
      }
      manualLoaded = true;
    } catch (e) {
      manualHtml = '<p class="text-red-600">Error cargando manual: ' + esc(String(e)) + '</p>';
    }
  }

  // Detectar protagonistas de un proceso: regex sobre el texto del <h3> + siguientes nodos
  function detectarProtagonistas(h3Element) {
    const block = [];
    let cur = h3Element.nextElementSibling;
    while (cur && cur.tagName !== 'H3' && cur.tagName !== 'H2') {
      block.push(cur.textContent || '');
      cur = cur.nextElementSibling;
    }
    const blob = block.join(' ').toLowerCase();
    const protagonistas = new Set();
    // Nombres reales + roles típicos
    const PROTAGONISTAS = [
      'andrea', 'cony', 'ingrid', 'dyana', 'dusan', 'pablo', 'cesar', 'jair',
      'braniff', 'cordero', 'valenzuela',
      'nicolás', 'nicolas', 'carlos iturra', 'cristian',
      'chofer', 'choferes', 'operario', 'operarios'
    ];
    for (const p of PROTAGONISTAS) {
      // Solo cuenta como protagonista si aparece en negrita o como WHO/Responsable
      if (blob.includes(p)) protagonistas.add(p);
    }
    return protagonistas;
  }

  function applyFilter() {
    const contenedor = document.getElementById('manualContenido');
    if (!contenedor) return;
    const h3s = contenedor.querySelectorAll('h3');
    h3s.forEach((h3) => {
      const protagonistas = h3._manualProtagonistas || new Set();
      let visible = false;
      let resaltar = false;
      if (currentFilter === 'todos') {
        visible = true;
      } else if (currentFilter === 'mia') {
        // "Por mí" muestra TODO el manual pero RESALTA los procesos donde
        // la persona es protagonista (más amigable que ocultar lo demás).
        visible = true;
        const nombreLower = (manualUserNombre || '').toLowerCase();
        const rolLower = (manualUserRol || '').toLowerCase();
        for (const p of protagonistas) {
          if (nombreLower.includes(p) || rolLower.includes(p)) { resaltar = true; break; }
        }
      } else if (currentFilter.startsWith('rol:')) {
        const target = currentFilter.slice(4).toLowerCase();
        for (const p of protagonistas) {
          if (p === target || p.includes(target)) { visible = true; break; }
        }
      }
      // Toggle visibility en h3 + siblings hasta el próximo h3/h2
      let cur = h3;
      while (cur && (cur === h3 || (cur.tagName !== 'H3' && cur.tagName !== 'H2'))) {
        cur.style.display = visible ? '' : 'none';
        if (cur === h3) {
          cur.classList.toggle('manual-resaltado', resaltar);
        }
        cur = cur.nextElementSibling;
      }
    });
  }

  function agregarBotonesComentar() {
    const contenedor = document.getElementById('manualContenido');
    if (!contenedor) return;
    const h3s = contenedor.querySelectorAll('h3');
    h3s.forEach((h3) => {
      // Extraer número y nombre: "### 1. COTIZAR retiros" → num=1, nombre="COTIZAR retiros"
      const match = (h3.textContent || '').match(/^\s*(\d+)\.\s*(.+)$/);
      if (!match) return;
      const num = parseInt(match[1], 10);
      const nombre = match[2].trim();
      h3._manualProtagonistas = detectarProtagonistas(h3);
      // Buscar el final del bloque (próximo h3 o h2) y agregar botón antes
      let cur = h3.nextElementSibling;
      let lastInBlock = h3;
      while (cur && cur.tagName !== 'H3' && cur.tagName !== 'H2') {
        lastInBlock = cur;
        cur = cur.nextElementSibling;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mt-2 mb-4 text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-medium';
      btn.textContent = '💬 Comentar este proceso';
      btn.addEventListener('click', () => openCommentModal(num, nombre));
      lastInBlock.parentNode.insertBefore(btn, lastInBlock.nextSibling);
    });
  }

  function openCommentModal(num, nombre) {
    commentCurrentProceso = { num, nombre };
    document.getElementById('manualCommentProceso').textContent = `Proceso #${num}: ${nombre}`;
    document.getElementById('manualCommentText').value = '';
    const r = document.querySelector('input[name="manualCommentTipo"][value="idea"]');
    if (r) r.checked = true;
    document.getElementById('manualCommentMsg').classList.add('hidden');
    document.getElementById('manualCommentModal').classList.remove('hidden');
  }

  function closeCommentModal() {
    document.getElementById('manualCommentModal').classList.add('hidden');
  }

  async function submitComment() {
    if (typeof sb === 'undefined' || !sb) return;
    const texto = (document.getElementById('manualCommentText').value || '').trim();
    if (!texto) {
      showCommentMsg('Escribí algo antes de enviar.', false);
      return;
    }
    const tipoEl = document.querySelector('input[name="manualCommentTipo"]:checked');
    const tipo = tipoEl ? tipoEl.value : 'idea';
    const email = manualUserEmail || getCurrentEmail();
    if (!email) {
      showCommentMsg('No detecté tu email. Recargá la página.', false);
      return;
    }
    const submitBtn = document.getElementById('manualCommentSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';
    try {
      const { error } = await sb.schema('panel').from('manual_feedback').insert({
        proceso_num: commentCurrentProceso.num,
        proceso_nombre: commentCurrentProceso.nombre,
        remitente_email: email,
        remitente_nombre: manualUserNombre || null,
        comentario: texto,
        tipo,
      });
      if (error) throw error;
      showCommentMsg('✓ Enviado a Dusan. ¡Gracias!', true);
      setTimeout(closeCommentModal, 1200);
    } catch (e) {
      showCommentMsg('Error: ' + (e.message || String(e)), false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar a Dusan';
    }
  }

  function showCommentMsg(txt, ok) {
    const el = document.getElementById('manualCommentMsg');
    el.textContent = txt;
    el.className = 'text-xs p-2 rounded mb-2 ' + (ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  }

  async function loadFeedbackList() {
    if (typeof sb === 'undefined' || !sb) return;
    const tbody = document.getElementById('manualFeedbackTabla');
    if (!tbody) return;
    const { data, error } = await sb.schema('panel').from('manual_feedback')
      .select('id, proceso_num, proceso_nombre, remitente_nombre, remitente_email, comentario, tipo, estado, respuesta_dusan, created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (error) {
      tbody.innerHTML = `<p class="text-sm text-red-600 p-5">Error: ${esc(error.message)}</p>`;
      return;
    }
    const rows = data || [];
    const pendCount = rows.filter((r) => r.estado === 'pendiente').length;
    const badge = document.getElementById('manualFeedbackBadge');
    if (badge) badge.textContent = String(pendCount);
    if (rows.length === 0) {
      tbody.innerHTML = '<p class="text-sm text-stone-400 p-5">Sin feedback todavía.</p>';
      return;
    }
    tbody.innerHTML = `<table class="w-full text-sm">
      <thead class="bg-stone-50 text-stone-600 text-left"><tr>
        <th class="px-3 py-2">Proceso</th><th class="px-3 py-2">De</th><th class="px-3 py-2">Tipo</th>
        <th class="px-3 py-2">Comentario</th><th class="px-3 py-2">Estado</th><th class="px-3 py-2">Acciones</th>
      </tr></thead><tbody>${rows.map((r) => `<tr class="border-t">
        <td class="px-3 py-2 font-medium">#${r.proceso_num} ${esc(r.proceso_nombre)}</td>
        <td class="px-3 py-2 text-xs">${esc(r.remitente_nombre || r.remitente_email)}</td>
        <td class="px-3 py-2"><span class="text-xs px-2 py-0.5 rounded-full ${r.tipo === 'error' ? 'bg-red-100 text-red-700' : r.tipo === 'falta' ? 'bg-amber-100 text-amber-800' : r.tipo === 'idea' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}">${esc(r.tipo)}</span></td>
        <td class="px-3 py-2 text-xs max-w-md">${esc(r.comentario)}</td>
        <td class="px-3 py-2"><span class="text-xs px-2 py-0.5 rounded ${r.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' : r.estado === 'aplicado' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}">${esc(r.estado)}</span></td>
        <td class="px-3 py-2 text-xs">
          ${r.estado === 'pendiente' ? `<button onclick="window.manualResolverFeedback('${r.id}','aplicado')" class="text-emerald-700 hover:underline">Aplicar</button> · <button onclick="window.manualResolverFeedback('${r.id}','descartado')" class="text-stone-500 hover:underline">Descartar</button>` : '—'}
        </td></tr>`).join('')}</tbody></table>`;
  }

  async function manualResolverFeedback(id, nuevoEstado) {
    if (typeof sb === 'undefined' || !sb) return;
    const { error } = await sb.schema('panel').from('manual_feedback').update({
      estado: nuevoEstado,
      resuelto_at: new Date().toISOString(),
      resuelto_por: manualUserEmail,
    }).eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadFeedbackList();
  }
  window.manualResolverFeedback = manualResolverFeedback;

  async function initManual() {
    await loadUserProfile();
    const info = document.getElementById('manualUserInfo');
    if (info) info.textContent = `Estás viendo el manual desde ${manualUserNombre} (${manualUserRol})`;

    // Mostrar sub-tab Feedback solo si bypass
    const isDusanOrBypass = BYPASS_EMAILS.has(manualUserEmail);
    const subFb = document.getElementById('manualSubFeedback');
    if (subFb) subFb.classList.toggle('hidden', !isDusanOrBypass);

    await loadManualMd();
    const cont = document.getElementById('manualContenido');
    if (cont) {
      cont.innerHTML = manualHtml;
      agregarBotonesComentar();
      applyFilter();
      // Inicializar Mermaid si está cargado
      try {
        if (window.mermaid && !mermaidInited) {
          window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
          mermaidInited = true;
        }
        if (window.mermaid) {
          await window.mermaid.run({ querySelector: '#manualContenido .language-mermaid' });
        }
      } catch (e) { console.warn('mermaid render:', e); }
    }

    if (isDusanOrBypass) loadFeedbackList();
  }
  window.initManual = initManual;

  // Wire up filtros + sub-tabs (idempotente: addEventListener una sola vez)
  document.addEventListener('DOMContentLoaded', () => {
    const btnMia = document.getElementById('manualFiltroMia');
    const btnTodos = document.getElementById('manualFiltroTodos');
    const selRol = document.getElementById('manualFiltroRol');
    const reload = document.getElementById('manualReload');
    const subManual = document.getElementById('manualSubManual');
    const subFb = document.getElementById('manualSubFeedback');
    const vManual = document.getElementById('manualVistaManual');
    const vFb = document.getElementById('manualVistaFeedback');
    const cClose = document.getElementById('manualCommentClose');
    const cCancel = document.getElementById('manualCommentCancel');
    const cSubmit = document.getElementById('manualCommentSubmit');

    function setFilterActive(which) {
      currentFilter = which;
      if (btnMia) btnMia.className = 'px-3 py-1.5 text-sm rounded-lg font-medium border ' + (which === 'mia' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600 border-stone-300');
      if (btnTodos) btnTodos.className = 'px-3 py-1.5 text-sm rounded-lg font-medium border ' + (which === 'todos' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-white text-stone-600 border-stone-300');
      if (selRol && !which.startsWith('rol:')) selRol.value = '';
      applyFilter();
    }

    if (btnMia) btnMia.addEventListener('click', () => setFilterActive('mia'));
    if (btnTodos) btnTodos.addEventListener('click', () => setFilterActive('todos'));
    if (selRol) selRol.addEventListener('change', (e) => {
      const v = e.target.value;
      if (v) setFilterActive('rol:' + v.toLowerCase()); else setFilterActive('mia');
    });
    if (reload) reload.addEventListener('click', async () => { manualLoaded = false; await initManual(); });

    if (subManual) subManual.addEventListener('click', () => {
      vManual.classList.remove('hidden'); vFb.classList.add('hidden');
      subManual.className = 'px-4 py-2 text-sm font-medium border-b-2 border-emerald-600 text-emerald-700';
      subFb.className = 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-stone-500 hover:text-stone-700' + (subFb.classList.contains('hidden') ? ' hidden' : '');
    });
    if (subFb) subFb.addEventListener('click', () => {
      vManual.classList.add('hidden'); vFb.classList.remove('hidden');
      subFb.className = 'px-4 py-2 text-sm font-medium border-b-2 border-emerald-600 text-emerald-700';
      subManual.className = 'px-4 py-2 text-sm font-medium border-b-2 border-transparent text-stone-500 hover:text-stone-700';
      loadFeedbackList();
    });

    if (cClose) cClose.addEventListener('click', closeCommentModal);
    if (cCancel) cCancel.addEventListener('click', closeCommentModal);
    if (cSubmit) cSubmit.addEventListener('click', submitComment);
  });
})();
