(function () {
  const state = {
    hydratedEmail: null,
    hydratePromise: null,
    warned: false,
  };

  function getEmail(getCurrentEmail) {
    return typeof getCurrentEmail === 'function' ? String(getCurrentEmail() || '').toLowerCase() : '';
  }

  function hasClient(sb, getCurrentEmail) {
    return !!(sb && typeof sb.schema === 'function' && getEmail(getCurrentEmail));
  }

  function warnOnce(error) {
    if (state.warned) return;
    state.warned = true;
    console.warn('[Diego Bandeja Sync] No pude hidratar casos desde vw_diego_bandeja_detalle:', error?.message || error || 'error desconocido');
  }

  function truncate(text, size) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return clean.length > size ? clean.slice(0, size - 1) + '…' : clean;
  }

  function inferType(row) {
    const text = `${row?.what || ''} ${row?.mensaje || ''}`.toLowerCase();
    if (row?.referencia_tabla === 'oportunidades') return { key: 'oportunidad', label: 'Oportunidad' };
    if (/traba|bloque|caid|inciden|error|no funciona|problema/.test(text)) return { key: 'bloqueo', label: 'Bloqueo' };
    if (/pendiente|hacer|seguimiento|llamar|coordinar/.test(text)) return { key: 'tarea', label: 'Tarea' };
    return { key: 'reclamo', label: 'Reclamo' };
  }

  function inferPriority(row) {
    if (row?.urgencia_color === 'rojo') return { key: 'alta', label: 'Alta' };
    if (row?.urgencia_color === 'ambar') return { key: 'media', label: 'Media' };
    if (row?.estado === 'resuelto') return { key: 'baja', label: 'Baja' };
    return { key: 'media', label: 'Media' };
  }

  function inferStatus(row) {
    if (row?.estado === 'resuelto') return { key: 'resuelto', label: 'Resuelto' };
    if (row?.responsable) return { key: 'en_curso', label: 'En curso' };
    if (row?.estado === 'sin_leer' || row?.estado === 'nuevo') return { key: 'abierto', label: 'Abierto' };
    return { key: 'por_confirmar', label: 'Por confirmar' };
  }

  function buildTitle(row) {
    return truncate(row?.what || row?.mensaje || 'Caso desde Bandeja Diego', 88) || 'Caso desde Bandeja Diego';
  }

  function buildTrace(row) {
    const remitente = truncate(row?.remitente || 'sin remitente', 36);
    return `Bandeja Diego #${row?.id || 's/n'} · ${remitente}`;
  }

  function buildStep(row) {
    if (row?.nota_resolucion) return truncate(row.nota_resolucion, 88);
    if (row?.estado === 'resuelto') return 'Validar cierre y registrar aprendizaje';
    if (row?.responsable) return `Seguir con ${row.responsable}`;
    return 'Asignar responsable y siguiente control';
  }

  function rowToCase(row) {
    return {
      id: `bd_${row.id}`,
      sourceKey: `bandeja::${row.id}`,
      title: buildTitle(row),
      type: inferType(row),
      priority: inferPriority(row),
      status: inferStatus(row),
      owner: row?.responsable || 'Equipo',
      trace: buildTrace(row),
      step: buildStep(row),
      createdAt: row?.creado_en || new Date().toISOString(),
      updatedAt: row?.creado_en || new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
  }

  function extractBandejaId(item) {
    const sourceKey = String(item?.sourceKey || '');
    if (!sourceKey.startsWith('bandeja::')) return null;
    const id = sourceKey.slice('bandeja::'.length).trim();
    return id || null;
  }

  function mapCaseToBandejaPatch(item) {
    const isResolved = item?.status?.key === 'resuelto';
    const step = truncate(item?.step || '', 200) || null;
    return {
      responsable: item?.owner || null,
      estado: isResolved ? 'resuelto' : 'pendiente',
      cerrado_en: isResolved ? new Date().toISOString() : null,
      nota_resolucion: step,
    };
  }

  async function hydrate(options) {
    const sb = options?.sb;
    const getCurrentEmail = options?.getCurrentEmail;
    const onHydrated = options?.onHydrated;
    if (!hasClient(sb, getCurrentEmail) || !window.DIEGO_CASE_STORE) return false;
    const email = getEmail(getCurrentEmail);
    if (state.hydratedEmail === email) return true;
    if (state.hydratePromise) return state.hydratePromise;

    state.hydratePromise = (async function () {
      const { data, error } = await sb.schema('panel')
        .from('vw_diego_bandeja_detalle')
        .select('id,mensaje,remitente,responsable,what,who,donde,cuando,why,how_,estado,urgencia_color,nota_resolucion,creado_en,referencia_tabla,referencia_id')
        .order('creado_en', { ascending: false })
        .limit(12);

      if (error) {
        warnOnce(error);
        return false;
      }

      window.DIEGO_CASE_STORE.hydrate((data || []).map(rowToCase));
      state.hydratedEmail = email;
      if (typeof onHydrated === 'function') onHydrated();
      return true;
    })().finally(function () {
      state.hydratePromise = null;
    });

    return state.hydratePromise;
  }

  async function persistCase(options) {
    const sb = options?.sb;
    const getCurrentEmail = options?.getCurrentEmail;
    const item = options?.item;
    const bandejaId = extractBandejaId(item);
    if (!bandejaId || !hasClient(sb, getCurrentEmail)) return false;

    const { error } = await sb.schema('panel')
      .from('diego_bandeja')
      .update(mapCaseToBandejaPatch(item))
      .eq('id', bandejaId);

    if (error) {
      warnOnce(error);
      return false;
    }
    return true;
  }

  window.DIEGO_BANDEJA_SYNC = {
    hydrate,
    persistCase,
  };
})();
