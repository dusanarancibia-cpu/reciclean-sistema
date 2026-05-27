// D-PANEL-AUTH-001 F1c · UI enrollment TOTP voluntario para 2FA Supabase Auth.
// Voluntario hoy: muestra estado actual + permite enrollar/revokar factores TOTP.
// El gate de bloqueo (forzar 2FA cuando perfil tiene requires_2fa=true) queda
// para sub-tarea posterior — esta versión NO bloquea acceso, solo habilita.

(function () {
  'use strict';

  // Helper: obtener sb client global (definido en panel-rdo.html)
  function getSb() {
    return window.sb || null;
  }

  // Pintar estado en la sub-sección "Seguridad" del tab Admin.
  window.loadMfaStatus = async function () {
    const sb = getSb();
    const cont = document.getElementById('mfaStatusContent');
    if (!cont) return;
    if (!sb) {
      cont.innerHTML = '<p class="text-sm text-stone-500">Supabase no inicializado.</p>';
      return;
    }

    cont.innerHTML = '<p class="text-sm text-stone-500">Cargando estado 2FA…</p>';

    try {
      const { data: factorsData, error: factorsErr } = await sb.auth.mfa.listFactors();
      if (factorsErr) throw factorsErr;

      const totpFactors = (factorsData?.totp || []).filter(f => f.status === 'verified');
      const totpPending = (factorsData?.totp || []).filter(f => f.status === 'unverified');

      // Detectar si el perfil del usuario requiere 2FA (consulta panel.usuarios_autorizados → perfil → permisos)
      const { data: userData } = await sb.auth.getUser();
      const email = userData?.user?.email?.toLowerCase() ?? null;
      let requires2fa = false;
      if (email) {
        try {
          const { data: perfilRow } = await sb
            .schema('panel')
            .from('usuarios_autorizados')
            .select('perfil')
            .ilike('email', email)
            .maybeSingle();
          if (perfilRow?.perfil) {
            const { data: permRow } = await sb
              .schema('panel')
              .from('perfiles')
              .select('permisos_jsonb')
              .eq('perfil_id', perfilRow.perfil)
              .maybeSingle();
            requires2fa = permRow?.permisos_jsonb?.requires_2fa === true;
          }
        } catch (e) {
          console.warn('[MFA] no pude leer perfil para detectar requires_2fa:', e);
        }
      }

      const tieneAlgun = totpFactors.length > 0;
      const aviso2faObligatorio = requires2fa && !tieneAlgun
        ? `<div class="bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded text-xs mb-3">
             ⚠️ <strong>Tu perfil requiere 2FA.</strong> Pronto será obligatorio activarlo para entrar al panel.
             Te recomendamos activarlo ahora para no quedar bloqueado en el cutover.
           </div>`
        : '';

      const estadoBadge = tieneAlgun
        ? `<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800 font-semibold">
             ✓ 2FA activo (${totpFactors.length} factor${totpFactors.length > 1 ? 'es' : ''})
           </span>`
        : `<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 font-semibold">
             ○ 2FA inactivo
           </span>`;

      const listaFactores = tieneAlgun
        ? `<ul class="text-sm text-stone-700 space-y-2 mb-3">
             ${totpFactors.map(f => `
               <li class="flex items-center justify-between bg-stone-50 px-3 py-2 rounded">
                 <span><strong>${escapeHtml(f.friendly_name || 'TOTP')}</strong>
                   <span class="text-xs text-stone-500 ml-2">enrollado ${new Date(f.created_at).toLocaleDateString('es-CL')}</span>
                 </span>
                 <button onclick="window.mfaUnenroll('${f.id}')"
                         class="text-xs text-red-600 hover:underline">Revocar</button>
               </li>
             `).join('')}
           </ul>`
        : '';

      const pendientesAviso = totpPending.length > 0
        ? `<div class="text-xs text-stone-500 mb-2">${totpPending.length} factor(es) pendiente(s) de verificación — completá el enrollment o cancelalo.</div>`
        : '';

      const botonEnrollar = `<button onclick="window.mfaStartEnrollment()"
                                     class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold">
                              ${tieneAlgun ? '+ Agregar otro factor 2FA' : 'Activar 2FA (recomendado)'}
                            </button>`;

      cont.innerHTML = `
        ${aviso2faObligatorio}
        <div class="flex items-center justify-between mb-3">
          <div>${estadoBadge}</div>
          <div class="text-xs text-stone-500">D-PANEL-AUTH-001 F1c · TOTP</div>
        </div>
        ${listaFactores}
        ${pendientesAviso}
        ${botonEnrollar}
      `;
    } catch (e) {
      console.error('[MFA] loadMfaStatus error:', e);
      cont.innerHTML = `<p class="text-sm text-red-600">Error cargando estado 2FA: ${escapeHtml(e.message || String(e))}</p>`;
    }
  };

  // Inicia el enrollment: pide nuevo factor → muestra QR + input verify.
  window.mfaStartEnrollment = async function () {
    const sb = getSb();
    if (!sb) return alert('Supabase no inicializado.');
    const modal = document.getElementById('mfaEnrollModal');
    const content = document.getElementById('mfaEnrollContent');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    content.innerHTML = '<p class="text-sm text-stone-500">Generando QR…</p>';

    try {
      // Limpiar factores unverified previos para evitar acumulación
      const { data: existing } = await sb.auth.mfa.listFactors();
      const stalePending = (existing?.totp || []).filter(f => f.status === 'unverified');
      for (const f of stalePending) {
        try { await sb.auth.mfa.unenroll({ factorId: f.id }); } catch (_) {}
      }

      const friendly = `Panel RDO ${new Date().toLocaleDateString('es-CL')}`;
      const { data, error } = await sb.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendly,
      });
      if (error) throw error;

      const factorId = data.id;
      const qrSvg = data.totp.qr_code; // SVG inline
      const secret = data.totp.secret;
      const uri = data.totp.uri;

      content.innerHTML = `
        <h3 class="font-bold text-lg mb-2">Activar 2FA — escaneá con tu app</h3>
        <p class="text-sm text-stone-600 mb-3">
          Usá Google Authenticator, Microsoft Authenticator, Authy o 1Password.
          Escaneá este código QR o pegá la clave manual abajo.
        </p>
        <div class="flex flex-col md:flex-row gap-4 items-start">
          <div class="bg-white p-3 border border-stone-200 rounded">${qrSvg}</div>
          <div class="flex-1 min-w-0">
            <label class="block text-xs text-stone-500 mb-1">Clave manual (si no podés escanear)</label>
            <input type="text" readonly value="${escapeAttr(secret)}"
                   onclick="this.select()"
                   class="w-full text-xs font-mono p-2 border border-stone-300 rounded bg-stone-50 mb-3">
            <label class="block text-xs text-stone-500 mb-1">Código de 6 dígitos de tu app</label>
            <input type="text" id="mfaVerifyCode" inputmode="numeric" maxlength="6"
                   placeholder="000000"
                   class="w-full text-lg text-center font-mono tracking-widest p-2 border border-stone-300 rounded mb-3">
            <button onclick="window.mfaVerifyEnrollment('${factorId}')"
                    id="mfaVerifyBtn"
                    class="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold">
              Verificar y activar
            </button>
            <button onclick="window.mfaCancelEnrollment('${factorId}')"
                    class="w-full mt-2 text-xs text-stone-500 hover:text-stone-700">
              Cancelar
            </button>
            <div id="mfaVerifyMsg" class="hidden mt-2 text-sm p-2 rounded"></div>
          </div>
        </div>
      `;

      // Auto-focus input
      setTimeout(() => {
        const inp = document.getElementById('mfaVerifyCode');
        if (inp) inp.focus();
      }, 100);
    } catch (e) {
      console.error('[MFA] enroll error:', e);
      content.innerHTML = `<p class="text-sm text-red-600">Error: ${escapeHtml(e.message || String(e))}</p>
                           <button onclick="window.mfaCloseModal()" class="mt-3 text-xs text-stone-500">Cerrar</button>`;
    }
  };

  // Verifica el código TOTP que el user pegó → confirma factor.
  window.mfaVerifyEnrollment = async function (factorId) {
    const sb = getSb();
    if (!sb) return;
    const code = (document.getElementById('mfaVerifyCode')?.value || '').trim();
    const msg = document.getElementById('mfaVerifyMsg');
    const btn = document.getElementById('mfaVerifyBtn');
    if (!/^\d{6}$/.test(code)) {
      if (msg) {
        msg.textContent = 'Ingresá los 6 dígitos del código.';
        msg.className = 'mt-2 text-sm p-2 rounded bg-red-50 text-red-700';
        msg.classList.remove('hidden');
      }
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando…'; }
    try {
      const { data: challenge, error: chErr } = await sb.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: verErr } = await sb.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verErr) throw verErr;

      // Listo
      if (msg) {
        msg.textContent = '✓ 2FA activado correctamente. Próximo login te pedirá el código.';
        msg.className = 'mt-2 text-sm p-2 rounded bg-green-50 text-green-800';
        msg.classList.remove('hidden');
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Activado'; }
      setTimeout(() => {
        window.mfaCloseModal();
        window.loadMfaStatus();
      }, 1500);
    } catch (e) {
      console.error('[MFA] verify error:', e);
      if (msg) {
        msg.textContent = 'Código incorrecto o expirado. Probá de nuevo con el siguiente código de tu app.';
        msg.className = 'mt-2 text-sm p-2 rounded bg-red-50 text-red-700';
        msg.classList.remove('hidden');
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Verificar y activar'; }
    }
  };

  window.mfaCancelEnrollment = async function (factorId) {
    const sb = getSb();
    if (sb && factorId) {
      try { await sb.auth.mfa.unenroll({ factorId }); } catch (_) {}
    }
    window.mfaCloseModal();
  };

  window.mfaCloseModal = function () {
    const modal = document.getElementById('mfaEnrollModal');
    if (modal) modal.classList.add('hidden');
  };

  window.mfaUnenroll = async function (factorId) {
    const sb = getSb();
    if (!sb || !factorId) return;
    if (!confirm('¿Seguro que querés revocar este factor 2FA? Perdés la protección extra.')) return;
    try {
      const { error } = await sb.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      await window.loadMfaStatus();
    } catch (e) {
      console.error('[MFA] unenroll error:', e);
      alert('Error revocando factor: ' + (e.message || String(e)));
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }
})();
