// ============================================================
// MI MEMORIA — consentimiento IA + historial de memoria — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function legalIaBootstrap() {
  let _currentEmail = '';
  let _userRow = null;
  let _declaracion = null;

  function getEmail() {
    try {
      const s = JSON.parse(localStorage.getItem('rf_session') || 'null');
      return (s && s.email) ? String(s.email).toLowerCase() : '';
    } catch { return ''; }
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function showOverlay() { document.getElementById('iaConsentOverlay').classList.add('open'); }
  function hideOverlay() { document.getElementById('iaConsentOverlay').classList.remove('open'); }

  function hideFabDiego() {
    const fab = document.getElementById('diegoFab');
    if (fab) fab.style.display = 'none';
    const chat = document.getElementById('diegoChat');
    if (chat) chat.classList.remove('open');
  }

  function showFabDiego() {
    const fab = document.getElementById('diegoFab');
    if (fab) fab.style.display = '';
  }

  async function fetchUserRow(email) {
    if (typeof sb === 'undefined' || !sb) return null;
    const { data } = await sb.schema('panel').from('usuarios_autorizados')
      .select('email, nombre, perfil, sucursal, ultimo_login, aviso_ia_consentimiento, aviso_ia_aceptado_at')
      .ilike('email', email).maybeSingle();
    return data;
  }

  async function checkConsentimientoIA(email) {
    _currentEmail = (email || getEmail()).toLowerCase();
    if (!_currentEmail) return;
    _userRow = await fetchUserRow(_currentEmail);
    if (!_userRow) return;  // user no autorizado: el panel ya rechazará el login

    if (_userRow.aviso_ia_consentimiento === true) {
      showFabDiego();
      return;
    }
    if (_userRow.aviso_ia_consentimiento === false) {
      hideFabDiego();
      return;
    }
    // NULL → primera vez. Mostrar banner.
    showOverlay();
  }
  window.checkConsentimientoIA = checkConsentimientoIA;

  async function aceptarIA() {
    if (!_currentEmail) return;
    const btn = document.getElementById('iaConsentAccept');
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const { error } = await sb.schema('panel').from('usuarios_autorizados')
        .update({ aviso_ia_consentimiento: true, aviso_ia_aceptado_at: new Date().toISOString() })
        .ilike('email', _currentEmail);
      if (error) throw error;
      _userRow = { ..._userRow, aviso_ia_consentimiento: true, aviso_ia_aceptado_at: new Date().toISOString() };
      hideOverlay();
      showFabDiego();
    } catch (e) {
      const msg = document.getElementById('iaConsentMsg');
      msg.textContent = 'Error: ' + (e.message || String(e)) + '. Refrescá la página e intentá de nuevo.';
      msg.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Acepto';
    }
  }

  async function rechazarIA() {
    if (!_currentEmail) return;
    const btn = document.getElementById('iaConsentReject');
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const { error } = await sb.schema('panel').from('usuarios_autorizados')
        .update({ aviso_ia_consentimiento: false, aviso_ia_aceptado_at: new Date().toISOString() })
        .ilike('email', _currentEmail);
      if (error) throw error;
      _userRow = { ..._userRow, aviso_ia_consentimiento: false };
      hideOverlay();
      hideFabDiego();
    } catch (e) {
      const msg = document.getElementById('iaConsentMsg');
      msg.textContent = 'Error: ' + (e.message || String(e));
      msg.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'No acepto — usar el panel sin Diego';
    }
  }

  // ============= TAB MI MEMORIA =============

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  }

  async function loadHistorial() {
    if (typeof sb === 'undefined' || !sb || !_currentEmail) return;
    const { data, error } = await sb.schema('panel').from('diego_bandeja')
      .select('id, mensaje, what, estado, creado_en, nota_resolucion')
      .ilike('remitente', _currentEmail)
      .order('creado_en', { ascending: false }).limit(100);
    const lista = document.getElementById('mmHistorialLista');
    const resumen = document.getElementById('mmHistorialResumen');
    if (error) {
      lista.innerHTML = `<p class="text-xs text-red-600">Error: ${esc(error.message)}</p>`;
      return;
    }
    const rows = data || [];
    resumen.textContent = rows.length === 0
      ? 'Aún no tenés conversaciones con Diego.'
      : `${rows.length} interacciones guardadas. La más reciente: ${fmtDate(rows[0].creado_en)}.`;
    if (rows.length === 0) {
      lista.innerHTML = '<p class="text-xs text-stone-400">Sin entradas.</p>';
      return;
    }
    lista.innerHTML = rows.map((r) => `<div class="border border-stone-200 rounded p-3 text-xs flex justify-between items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="text-stone-700">${esc(r.mensaje || '(sin mensaje)').slice(0, 200)}</div>
        <div class="text-stone-400 mt-1">${esc(r.what || '')} · ${fmtDate(r.creado_en)} · estado: ${esc(r.estado || '—')}</div>
      </div>
      <button onclick="window.mmBorrarEntrada('${r.id}')" class="text-stone-400 hover:text-red-600 text-xs" title="Borrar esta entrada">🗑️</button>
    </div>`).join('');
  }

  async function loadMemoriaSesion() {
    if (typeof sb === 'undefined' || !sb || !_currentEmail) return;
    const { data } = await sb.rpc('diego_memoria_sesion_get', { p_usuario_email: _currentEmail, p_max_horas: 168 });
    const el = document.getElementById('mmMemoriaSesion');
    const mem = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!mem || !mem.resumen) {
      el.textContent = 'Sin memoria de sesión aún. La próxima vez que chatées con Diego, esta caja va a llenarse con un resumen.';
    } else {
      el.textContent = mem.resumen;
    }
  }

  async function initMiMemoria() {
    // Preservar _currentEmail si ya fue seteado por checkConsentimientoIA al login.
    // Fallback 1: variable global `currentUser` del panel.
    // Fallback 2: rf_session de localStorage (sistema viejo).
    // Fallback 3: sb.auth.getSession() de Supabase Auth.
    if (!_currentEmail) {
      if (typeof currentUser === 'string' && currentUser.includes('@')) _currentEmail = currentUser.toLowerCase();
      else if (typeof currentUser === 'object' && currentUser && currentUser.email) _currentEmail = String(currentUser.email).toLowerCase();
      else _currentEmail = getEmail();
    }
    if (!_currentEmail && typeof sb !== 'undefined' && sb && sb.auth) {
      try {
        const { data } = await sb.auth.getSession();
        if (data?.session?.user?.email) _currentEmail = String(data.session.user.email).toLowerCase();
      } catch {}
    }
    if (!_currentEmail) {
      document.getElementById('mmEmail').textContent = '(no detectado — recargá la página)';
      return;
    }
    if (!_userRow) _userRow = await fetchUserRow(_currentEmail);
    if (_userRow) {
      document.getElementById('mmEmail').textContent     = _userRow.email || _currentEmail;
      document.getElementById('mmNombre').textContent    = _userRow.nombre || '—';
      document.getElementById('mmRol').textContent       = _userRow.perfil || '—';
      document.getElementById('mmSucursal').textContent  = _userRow.sucursal || '—';
      document.getElementById('mmUltimoLogin').textContent = fmtDate(_userRow.ultimo_login);
      const cons = _userRow.aviso_ia_consentimiento;
      const consEl = document.getElementById('mmConsentimiento');
      if (cons === true) consEl.innerHTML = `<span class="text-green-700 font-medium">Aceptado</span> · ${fmtDate(_userRow.aviso_ia_aceptado_at)}`;
      else if (cons === false) consEl.innerHTML = `<span class="text-red-700 font-medium">Rechazado</span> · ${fmtDate(_userRow.aviso_ia_aceptado_at)}`;
      else consEl.innerHTML = `<span class="text-amber-700 font-medium">Pendiente</span>`;
    }
    await loadHistorial();
    await loadMemoriaSesion();
  }
  window.initMiMemoria = initMiMemoria;

  async function mmBorrarEntrada(id) {
    if (!confirm('¿Borrar esta entrada de tu historial? Es irreversible.')) return;
    if (typeof sb === 'undefined' || !sb) return;
    const { error } = await sb.schema('panel').from('diego_bandeja').delete().eq('id', id);
    if (error) { mmMsg('Error: ' + error.message, false); return; }
    mmMsg('✓ Entrada borrada.', true);
    loadHistorial();
  }
  window.mmBorrarEntrada = mmBorrarEntrada;

  function mmMsg(txt, ok) {
    const el = document.getElementById('mmMsg');
    el.textContent = txt;
    el.className = 'text-xs p-2 rounded mt-3 ' + (ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  }

  // Sub-PR A.2 D-DIEGO-50X-V4 Ola A · Mi memoria V2 derecho rectificación.
  // Los 4 handlers ahora llaman RPCs SECURITY DEFINER (mig 191) que borran TODA
  // la PII en 6 tablas + auditan en panel.diego_borrados_auditoria (Ley 21.719).
  async function mmBorrarHistorial() {
    if (!confirm('⚠️ ¿Borrar TODO tu historial con Diego? Es irreversible y Diego empieza de cero la próxima vez que chatées.')) return;
    if (typeof sb === 'undefined' || !sb) return;
    const { data, error } = await sb.rpc('mi_memoria_borrar_historial', { p_email: _currentEmail });
    if (error) { mmMsg('Error: ' + error.message, false); return; }
    const total = data?.total ?? 0;
    mmMsg('✓ Historial borrado completamente (' + total + ' registros en 6 tablas · audit Ley 21.719).', true);
    loadHistorial();
    loadMemoriaSesion();
  }

  async function mmBorrarMemoriaSesion() {
    if (!confirm('¿Limpiar el resumen que Diego mantiene de vos? Las conversaciones individuales no se borran, solo el resumen.')) return;
    if (typeof sb === 'undefined' || !sb) return;
    const { data, error } = await sb.rpc('mi_memoria_borrar_memoria_sesion', { p_email: _currentEmail });
    if (error) { mmMsg('Error: ' + error.message, false); return; }
    mmMsg('✓ Resumen de sesión limpiado (' + (data?.borrados ?? 0) + ' filas). Diego empieza la próxima conversación de cero.', true);
    loadMemoriaSesion();
  }

  async function mmRetirarConsentimiento() {
    if (!confirm('⚠️ Esto desactiva Diego para vos. No vas a ver el botón verde del chat y no puede ayudarte hasta que vuelvas a dar consentimiento. ¿Confirmás?')) return;
    if (typeof sb === 'undefined' || !sb) return;
    const { data, error } = await sb.rpc('mi_memoria_retirar_consentimiento', { p_email: _currentEmail });
    if (error) { mmMsg('Error: ' + error.message, false); return; }
    _userRow = { ..._userRow, aviso_ia_consentimiento: false };
    hideFabDiego();
    mmMsg('✓ Consentimiento retirado (' + (data?.actualizado ?? 0) + ' fila · audit Ley 21.719). Recargá si querés volver a verlo.', true);
    initMiMemoria();
  }

  // Wire up
  document.addEventListener('DOMContentLoaded', () => {
    const accept = document.getElementById('iaConsentAccept');
    const reject = document.getElementById('iaConsentReject');
    if (accept) accept.addEventListener('click', aceptarIA);
    if (reject) reject.addEventListener('click', rechazarIA);

    const btnH  = document.getElementById('mmBorrarHistorial');
    const btnMS = document.getElementById('mmBorrarMemoriaSesion');
    const btnR  = document.getElementById('mmRetirarConsentimiento');
    const btnEx = document.getElementById('mmExportarJson');
    if (btnH)  btnH.addEventListener('click', mmBorrarHistorial);
    if (btnMS) btnMS.addEventListener('click', mmBorrarMemoriaSesion);
    if (btnR)  btnR.addEventListener('click', mmRetirarConsentimiento);
    // D-DIEGO-MEJORA-CONTINUA-001 CL-010 · export JSON Ley 21719 portabilidad
    if (btnEx) btnEx.addEventListener('click', async () => {
      try {
        const email = (JSON.parse(localStorage.getItem('rf_session') || '{}').email) || (await sb.auth.getSession())?.data?.session?.user?.email;
        if (!email) { alert('No hay sesión activa.'); return; }
        // Sub-PR A.2: usa RPC SECURITY DEFINER (mig 191) que devuelve TODO + audita
        // (más completo que las 3 SELECT directas anteriores: incluye inbox, metrics
        // y auditoría histórica del titular).
        const { data: bundle, error: expErr } = await sb.rpc('mi_memoria_exportar', { p_email: email });
        if (expErr) throw expErr;
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `mi-memoria-diego-${email.replace(/[@.]/g,'_')}-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } catch (e) { alert('No se pudo exportar: ' + (e?.message || e)); }
    });
  });
})();
