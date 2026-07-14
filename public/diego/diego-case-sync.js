(function () {
  const state = {
    hydratedEmail: null,
    warnedMissingTable: false,
    warnedGenericError: false,
    hydratePromise: null,
    hydrating: false,
    pushTimer: null,
    mode: 'local',
    reason: 'idle',
    lastSyncAt: null,
    lastHydratedAt: null,
    lastError: '',
  };

  function emitStatus() {
    window.dispatchEvent(new CustomEvent('diego-case-sync-status', {
      detail: getStatus(),
    }));
  }

  function setStatus(patch) {
    Object.assign(state, patch || {});
    emitStatus();
  }

  function getEmail(getCurrentEmail) {
    return typeof getCurrentEmail === 'function' ? String(getCurrentEmail() || '').toLowerCase() : '';
  }

  function hasClient(sb, getCurrentEmail) {
    return !!(sb && typeof sb.schema === 'function' && getEmail(getCurrentEmail));
  }

  function isMissingTable(error) {
    const raw = String(error?.message || error || '').toLowerCase();
    return raw.includes('diego_casos') && (raw.includes('does not exist') || raw.includes('not found') || raw.includes('42p01'));
  }

  function warnOnce(kind, error) {
    if (kind === 'missing' && state.warnedMissingTable) return;
    if (kind === 'generic' && state.warnedGenericError) return;
    if (kind === 'missing') {
      state.warnedMissingTable = true;
      console.warn('[Diego Case Sync] Tabla panel.diego_casos aun no disponible. Sigo en modo local.');
      setStatus({
        mode: 'local',
        reason: 'missing_table',
        lastError: 'Tabla panel.diego_casos aun no disponible',
      });
      return;
    }
    state.warnedGenericError = true;
    console.warn('[Diego Case Sync] No pude sincronizar casos con backend:', error?.message || error || 'error desconocido');
    setStatus({
      mode: 'local',
      reason: 'sync_error',
      lastError: error?.message || String(error || 'error desconocido'),
    });
  }

  function isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  function rowToCase(row) {
    return {
      id: row.id,
      sourceKey: row.source_key,
      title: row.titulo,
      type: { key: row.tipo, label: row.tipo_label },
      priority: { key: row.prioridad, label: row.prioridad_label },
      status: { key: row.estado, label: row.estado_label },
      owner: row.responsable,
      trace: row.traza,
      step: row.siguiente_paso,
      archived: !!row.archivado,
      ownerManual: !!row.owner_manual,
      statusManual: !!row.status_manual,
      priorityManual: !!row.priority_manual,
      stepManual: !!row.step_manual,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSeenAt: row.last_seen_at,
    };
  }

  function caseToRow(item, userEmail) {
    return {
      // El id local (dc_xxx, hash-based) no es un uuid valido para panel.diego_casos.id.
      // Solo lo mandamos si ya vino hidratado desde el backend (uuid real); si no,
      // se omite y Postgres genera uno nuevo (gen_random_uuid()) — el upsert igual
      // dedupea por source_key, que es la identidad estable real.
      ...(isUuid(item.id) ? { id: item.id } : {}),
      source_key: item.sourceKey,
      titulo: item.title,
      tipo: item.type?.key || 'reclamo',
      tipo_label: item.type?.label || 'Reclamo',
      prioridad: item.priority?.key || 'media',
      prioridad_label: item.priority?.label || 'Media',
      estado: item.status?.key || 'abierto',
      estado_label: item.status?.label || 'Abierto',
      responsable: item.owner || 'Equipo',
      traza: item.trace || 'Sin traza',
      siguiente_paso: item.step || 'Seguir',
      archivado: !!item.archived,
      owner_manual: !!item.ownerManual,
      status_manual: !!item.statusManual,
      priority_manual: !!item.priorityManual,
      step_manual: !!item.stepManual,
      created_by: userEmail || null,
      updated_by: userEmail || null,
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
      last_seen_at: item.lastSeenAt || new Date().toISOString(),
    };
  }

  async function hydrate(options) {
    const sb = options?.sb;
    const getCurrentEmail = options?.getCurrentEmail;
    const onHydrated = options?.onHydrated;
    if (!hasClient(sb, getCurrentEmail) || !window.DIEGO_CASE_STORE) {
      setStatus({
        mode: 'local',
        reason: 'client_unavailable',
      });
      return false;
    }
    const email = getEmail(getCurrentEmail);
    if (state.hydratedEmail === email) return true;
    if (state.hydratePromise) return state.hydratePromise;
    // Guard de reentrada sincrónico: setStatus() de abajo dispara
    // 'diego-case-sync-status' de forma sincrónica (antes del primer await),
    // y panel-rdo.html puede re-renderizar y volver a llamar hydrate() en el
    // mismo tick, cuando state.hydratePromise todavía no quedó asignado (la
    // asignación ocurre recién cuando esta IIFE termina de evaluarse). Sin
    // esta bandera, esa reentrada no encontraba ningún guard activo todavía
    // y volvía a entrar en bucle sincrónico → RangeError: Maximum call stack
    // size exceeded.
    if (state.hydrating) return true;
    state.hydrating = true;

    state.hydratePromise = (async function () {
      setStatus({
        mode: 'checking',
        reason: 'hydrating',
        lastError: '',
      });
      const { data, error } = await sb.schema('panel')
        .from('diego_casos')
        .select('*')
        .eq('archivado', false)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        warnOnce(isMissingTable(error) ? 'missing' : 'generic', error);
        return false;
      }

      window.DIEGO_CASE_STORE.hydrate((data || []).map(rowToCase));
      state.hydratedEmail = email;
      setStatus({
        mode: 'shared',
        reason: 'hydrated',
        lastHydratedAt: new Date().toISOString(),
        lastError: '',
      });
      if (typeof onHydrated === 'function') onHydrated();
      return true;
    })().finally(function () {
      state.hydratePromise = null;
      state.hydrating = false;
    });

    return state.hydratePromise;
  }

  async function persistCase(options) {
    const sb = options?.sb;
    const getCurrentEmail = options?.getCurrentEmail;
    const item = options?.item;
    if (!hasClient(sb, getCurrentEmail) || !item) return false;

    const email = getEmail(getCurrentEmail);
    const { error } = await sb.schema('panel')
      .from('diego_casos')
      .upsert(caseToRow(item, email), { onConflict: 'source_key' });

    if (error) {
      warnOnce(isMissingTable(error) ? 'missing' : 'generic', error);
      return false;
    }
    setStatus({
      mode: 'shared',
      reason: 'persisted',
      lastSyncAt: new Date().toISOString(),
      lastError: '',
    });
    return true;
  }

  function schedulePush(options) {
    const sb = options?.sb;
    const getCurrentEmail = options?.getCurrentEmail;
    const getCases = options?.getCases;
    if (!hasClient(sb, getCurrentEmail) || typeof getCases !== 'function') return false;

    if (state.pushTimer) window.clearTimeout(state.pushTimer);
    state.pushTimer = window.setTimeout(async function () {
      state.pushTimer = null;
      const cases = (getCases() || []).slice(0, 20);
      if (!cases.length) return;
      const email = getEmail(getCurrentEmail);
      const rows = cases.map(item => caseToRow(item, email));
      const { error } = await sb.schema('panel')
        .from('diego_casos')
        .upsert(rows, { onConflict: 'source_key' });

      if (error) warnOnce(isMissingTable(error) ? 'missing' : 'generic', error);
      else {
        setStatus({
          mode: 'shared',
          reason: 'batch_persisted',
          lastSyncAt: new Date().toISOString(),
          lastError: '',
        });
      }
    }, 500);

    return true;
  }

  function getStatus() {
    return {
      hydratedEmail: state.hydratedEmail,
      mode: state.mode,
      reason: state.reason,
      lastSyncAt: state.lastSyncAt,
      lastHydratedAt: state.lastHydratedAt,
      lastError: state.lastError,
    };
  }

  window.DIEGO_CASE_SYNC = {
    getStatus,
    hydrate,
    persistCase,
    schedulePush,
  };
})();
