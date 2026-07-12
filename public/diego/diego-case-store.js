(function () {
  const STORAGE_KEY = 'diego_cases_v1';
  const STATUS_ORDER = ['abierto', 'en_curso', 'por_confirmar', 'resuelto'];
  const PRIORITY_ORDER = ['alta', 'media', 'baja'];
  const TYPE_LABELS = {
    reclamo: 'Reclamo',
    oportunidad: 'Oportunidad',
    bloqueo: 'Bloqueo',
    tarea: 'Tarea',
  };
  const STATUS_LABELS = {
    abierto: 'Abierto',
    en_curso: 'En curso',
    por_confirmar: 'Por confirmar',
    resuelto: 'Resuelto',
  };
  const PRIORITY_LABELS = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  };
  const OWNER_SUGGESTIONS = {
    direccion: ['Dirección', 'Andrea / Comercial', 'Operaciones', 'Finanzas', 'Cumplimiento'],
    comercial: ['Andrea / Comercial', 'Dirección', 'Operaciones', 'Finanzas'],
    operaciones: ['Operaciones', 'Dirección', 'Andrea / Comercial', 'Cumplimiento'],
    finanzas: ['Finanzas', 'Dirección', 'Andrea / Comercial', 'Cumplimiento'],
    cumplimiento: ['Cumplimiento', 'Dirección', 'Operaciones', 'Finanzas'],
    general: ['Equipo', 'Dirección', 'Andrea / Comercial', 'Operaciones', 'Finanzas', 'Cumplimiento'],
  };

  function readState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed?.cases) ? parsed : { cases: [] };
    } catch (error) {
      console.warn('[Diego Cases] No pude leer localStorage:', error);
      return { cases: [] };
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cases: Array.isArray(state?.cases) ? state.cases : [],
      }));
    } catch (error) {
      console.warn('[Diego Cases] No pude guardar localStorage:', error);
    }
  }

  function normalizeText(value, fallback) {
    const clean = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return clean || fallback || '';
  }

  function normalizeBadge(value, labels, fallbackKey) {
    if (value && typeof value === 'object') {
      const key = normalizeText(value.key, fallbackKey).toLowerCase();
      return { key, label: normalizeText(value.label, labels[key] || labels[fallbackKey] || key) };
    }
    const key = normalizeText(value, fallbackKey).toLowerCase();
    return { key, label: labels[key] || labels[fallbackKey] || key };
  }

  function buildSourceKey(item) {
    return [
      normalizeText(item.title, 'caso'),
      normalizeText(item.trace, 'sin traza'),
      normalizeText(item.type?.key, 'reclamo'),
    ].join('::').toLowerCase();
  }

  function hashString(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function createCaseId(item) {
    return 'dc_' + hashString(buildSourceKey(item));
  }

  function normalizeCase(item) {
    const type = normalizeBadge(item?.type, TYPE_LABELS, 'reclamo');
    const priority = normalizeBadge(item?.priority, PRIORITY_LABELS, 'media');
    const status = normalizeBadge(item?.status, STATUS_LABELS, 'abierto');
    const title = normalizeText(item?.title, 'Caso Diego');
    const trace = normalizeText(item?.trace, 'Sin traza');
    const sourceKey = normalizeText(item?.sourceKey, buildSourceKey({ title, trace, type }));
    return {
      id: normalizeText(item?.id, createCaseId({ title, trace, type })),
      sourceKey,
      title,
      type,
      priority,
      status,
      owner: normalizeText(item?.owner, 'Equipo'),
      trace,
      step: normalizeText(item?.step, 'Seguir'),
      createdAt: normalizeText(item?.createdAt, new Date().toISOString()),
      updatedAt: normalizeText(item?.updatedAt, new Date().toISOString()),
      lastSeenAt: normalizeText(item?.lastSeenAt, item?.updatedAt || new Date().toISOString()),
      archived: !!item?.archived,
      ownerManual: !!item?.ownerManual,
      statusManual: !!item?.statusManual,
      priorityManual: !!item?.priorityManual,
      stepManual: !!item?.stepManual,
    };
  }

  function sortCases(items) {
    return [...items].sort((left, right) => {
      const a = Date.parse(right.updatedAt || right.lastSeenAt || 0);
      const b = Date.parse(left.updatedAt || left.lastSeenAt || 0);
      return a - b;
    });
  }

  function listCases() {
    const state = readState();
    return sortCases(state.cases.map(normalizeCase).filter(item => !item.archived));
  }

  function getCase(id) {
    return listCases().find(item => item.id === id) || null;
  }

  function upsertCase(item) {
    const incoming = normalizeCase(item);
    const state = readState();
    let found = false;
    const nextCases = state.cases.map(row => {
      const current = normalizeCase(row);
      if (current.id !== incoming.id && current.sourceKey !== incoming.sourceKey) return current;
      found = true;
      return {
        ...current,
        ...incoming,
        type: incoming.type,
        priority: incoming.priority,
        status: incoming.status,
      };
    });
    if (!found) nextCases.push(incoming);
    saveState({ cases: sortCases(nextCases.map(normalizeCase)) });
    return incoming;
  }

  function hydrate(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return listCases();
    rows.forEach(upsertCase);
    return listCases();
  }

  function syncCases(options) {
    const inferredCases = Array.isArray(options?.cases) ? options.cases.map(normalizeCase) : [];
    const state = readState();
    const now = new Date().toISOString();
    const casesByKey = new Map(state.cases.map(item => {
      const normalized = normalizeCase(item);
      return [normalized.sourceKey, normalized];
    }));
    let changed = false;

    inferredCases.forEach(incoming => {
      const current = casesByKey.get(incoming.sourceKey);
      if (!current) {
        casesByKey.set(incoming.sourceKey, {
          ...incoming,
          createdAt: now,
          updatedAt: now,
          lastSeenAt: now,
        });
        changed = true;
        return;
      }

      const next = {
        ...current,
        title: incoming.title,
        type: incoming.type,
        trace: incoming.trace,
        lastSeenAt: now,
        owner: current.ownerManual ? current.owner : incoming.owner,
        priority: current.priorityManual ? current.priority : incoming.priority,
        status: current.statusManual ? current.status : incoming.status,
        step: current.stepManual ? current.step : incoming.step,
      };
      const snapshot = JSON.stringify({
        title: current.title,
        type: current.type,
        trace: current.trace,
        owner: current.owner,
        priority: current.priority,
        status: current.status,
        step: current.step,
      });
      const nextSnapshot = JSON.stringify({
        title: next.title,
        type: next.type,
        trace: next.trace,
        owner: next.owner,
        priority: next.priority,
        status: next.status,
        step: next.step,
      });
      if (snapshot !== nextSnapshot) {
        next.updatedAt = now;
        changed = true;
      }
      casesByKey.set(incoming.sourceKey, next);
    });

    const merged = sortCases([...casesByKey.values()].map(normalizeCase));
    if (changed) saveState({ cases: merged });
    return merged.filter(item => !item.archived).slice(0, 8);
  }

  function updateCase(id, patch) {
    const state = readState();
    const now = new Date().toISOString();
    let updated = null;

    const nextCases = state.cases.map(item => {
      const current = normalizeCase(item);
      if (current.id !== id) return current;

      const next = { ...current, updatedAt: now };
      if (patch?.owner != null) {
        next.owner = normalizeText(patch.owner, current.owner);
        next.ownerManual = true;
      }
      if (patch?.step != null) {
        next.step = normalizeText(patch.step, current.step);
        next.stepManual = true;
      }
      if (patch?.status != null) {
        next.status = normalizeBadge(patch.status, STATUS_LABELS, current.status.key);
        next.statusManual = true;
      }
      if (patch?.priority != null) {
        next.priority = normalizeBadge(patch.priority, PRIORITY_LABELS, current.priority.key);
        next.priorityManual = true;
      }
      if (patch?.archived != null) next.archived = !!patch.archived;
      updated = next;
      return next;
    });

    if (updated) saveState({ cases: nextCases });
    return updated;
  }

  function cycleStatus(id) {
    const current = listCases().find(item => item.id === id);
    if (!current) return null;
    const index = STATUS_ORDER.indexOf(current.status.key);
    const nextKey = STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
    return updateCase(id, { status: { key: nextKey, label: STATUS_LABELS[nextKey] } });
  }

  function cyclePriority(id) {
    const current = listCases().find(item => item.id === id);
    if (!current) return null;
    const index = PRIORITY_ORDER.indexOf(current.priority.key);
    const nextKey = PRIORITY_ORDER[(index + 1) % PRIORITY_ORDER.length];
    return updateCase(id, { priority: { key: nextKey, label: PRIORITY_LABELS[nextKey] } });
  }

  function getOwnerSuggestions(profileKey) {
    return OWNER_SUGGESTIONS[profileKey] || OWNER_SUGGESTIONS.general;
  }

  window.DIEGO_CASE_STORE = {
    listCases,
    getCase,
    hydrate,
    upsertCase,
    syncCases,
    updateCase,
    cycleStatus,
    cyclePriority,
    getOwnerSuggestions,
  };
})();
