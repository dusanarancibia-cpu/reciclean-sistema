(function () {
  const STORAGE_PREFIX = 'diego_memory_v1';
  const MAX_HISTORY_ITEMS = 24;
  const MAX_CASE_ITEMS = 24;

  function normalizeEmail(email) {
    return String(email || 'anon').trim().toLowerCase() || 'anon';
  }

  function storageKey(email) {
    return `${STORAGE_PREFIX}::${normalizeEmail(email)}`;
  }

  function cleanText(value, fallback) {
    const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return text || fallback || '';
  }

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('[Diego Memory] No pude parsear memoria:', error);
      return fallback;
    }
  }

  function readState(email) {
    try {
      const parsed = safeJsonParse(window.localStorage.getItem(storageKey(email)), null);
      if (!parsed || typeof parsed !== 'object') {
        return { history: [], cases: [], updatedAt: null };
      }
      return {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        cases: Array.isArray(parsed.cases) ? parsed.cases : [],
        updatedAt: parsed.updatedAt || null,
      };
    } catch (error) {
      console.warn('[Diego Memory] No pude leer memoria:', error);
      return { history: [], cases: [], updatedAt: null };
    }
  }

  function saveState(email, state) {
    try {
      window.localStorage.setItem(storageKey(email), JSON.stringify({
        history: Array.isArray(state?.history) ? state.history : [],
        cases: Array.isArray(state?.cases) ? state.cases : [],
        updatedAt: state?.updatedAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('[Diego Memory] No pude guardar memoria:', error);
    }
  }

  function normalizeAction(value) {
    if (!value) return '';
    if (typeof value === 'string') return cleanText(value);
    return cleanText(value.tool || value.action || value.label || '');
  }

  function normalizeSuggestion(value) {
    if (!value) return null;
    if (typeof value === 'string') {
      const clean = cleanText(value);
      return clean ? { label: clean, action: clean } : null;
    }
    const label = cleanText(value.label || value.action || '');
    const action = cleanText(value.action || value.label || '');
    if (!label && !action) return null;
    return { label: label || action, action: action || label };
  }

  function sanitizeHistoryEntry(entry) {
    const role = entry?.role === 'user' ? 'user' : (entry?.role === 'diego' ? 'diego' : '');
    if (!role) return null;
    const suggestions = (Array.isArray(entry?.suggestions) ? entry.suggestions : [])
      .map(normalizeSuggestion)
      .filter(Boolean)
      .slice(0, 4);
    return {
      role,
      mensaje: cleanText(entry?.mensaje, role === 'user' ? '(sin mensaje)' : '(sin respuesta)'),
      ts: Number.isFinite(Number(entry?.ts)) ? Number(entry.ts) : Date.now(),
      attach: cleanText(entry?.attach, ''),
      kind: cleanText(entry?.kind, ''),
      actions: (Array.isArray(entry?.actions) ? entry.actions : []).map(normalizeAction).filter(Boolean).slice(0, 4),
      suggestions,
      six_w: {
        what: cleanText(entry?.six_w?.what, ''),
        when: cleanText(entry?.six_w?.when, ''),
        who: cleanText(entry?.six_w?.who, ''),
      },
      cola_id: cleanText(entry?.cola_id, ''),
      tokens: Number.isFinite(Number(entry?.tokens)) ? Number(entry.tokens) : null,
    };
  }

  function trimHistory(history) {
    return (Array.isArray(history) ? history : [])
      .map(sanitizeHistoryEntry)
      .filter(Boolean)
      .slice(-MAX_HISTORY_ITEMS);
  }

  function normalizeCaseMemory(item, fallbackMessage) {
    const statusLabel = cleanText(item?.status?.label || item?.status, 'Abierto');
    const priorityLabel = cleanText(item?.priority?.label || item?.priority, 'Media');
    const updatedAt = cleanText(item?.updatedAt || item?.lastSeenAt, new Date().toISOString());
    return {
      id: cleanText(item?.id, ''),
      sourceKey: cleanText(item?.sourceKey || item?.id, ''),
      title: cleanText(item?.title, 'Caso Diego'),
      owner: cleanText(item?.owner, 'Equipo'),
      status: statusLabel,
      priority: priorityLabel,
      trace: cleanText(item?.trace, 'Sin traza'),
      step: cleanText(item?.step, 'Seguir'),
      updatedAt,
      lastMessage: cleanText(item?.lastMessage, fallbackMessage || ''),
    };
  }

  function sortByUpdated(items) {
    return [...items].sort((left, right) => {
      const a = Date.parse(right?.updatedAt || 0);
      const b = Date.parse(left?.updatedAt || 0);
      return a - b;
    });
  }

  function hydrateTurn(options) {
    const email = normalizeEmail(options?.email);
    return trimHistory(readState(email).history);
  }

  function persistTurn(options) {
    const email = normalizeEmail(options?.email);
    const state = readState(email);
    const nextHistory = trimHistory(options?.history);
    saveState(email, {
      ...state,
      history: nextHistory,
      updatedAt: new Date().toISOString(),
    });
    return nextHistory;
  }

  function syncCases(options) {
    const email = normalizeEmail(options?.email);
    const cases = Array.isArray(options?.cases) ? options.cases : [];
    const history = trimHistory(options?.history);
    const lastDiego = [...history].reverse().find(item => item.role === 'diego');
    const state = readState(email);
    const memoryByKey = new Map((Array.isArray(state.cases) ? state.cases : []).map(item => {
      const normalized = normalizeCaseMemory(item);
      return [normalized.sourceKey || normalized.id, normalized];
    }));

    cases.forEach(item => {
      const normalized = normalizeCaseMemory(item, lastDiego?.mensaje || '');
      const key = normalized.sourceKey || normalized.id;
      if (!key) return;
      const current = memoryByKey.get(key);
      memoryByKey.set(key, {
        ...current,
        ...normalized,
        lastMessage: normalized.lastMessage || current?.lastMessage || '',
      });
    });

    const nextCases = sortByUpdated([...memoryByKey.values()]).slice(0, MAX_CASE_ITEMS);
    saveState(email, {
      history,
      cases: nextCases,
      updatedAt: new Date().toISOString(),
    });
    return nextCases;
  }

  function rememberCase(options) {
    const email = normalizeEmail(options?.email);
    const item = options?.item;
    if (!item) return null;
    const state = readState(email);
    const nextCases = syncCases({
      email,
      history: state.history,
      cases: [
        ...state.cases,
        normalizeCaseMemory(item, cleanText(options?.lastMessage, '')),
      ],
    });
    return nextCases.find(row => row.sourceKey === item.sourceKey || row.id === item.id) || null;
  }

  function listCaseMemory(options) {
    const email = normalizeEmail(options?.email);
    const limit = Math.max(1, Math.min(12, Number(options?.limit) || 4));
    return sortByUpdated(readState(email).cases.map(item => normalizeCaseMemory(item))).slice(0, limit);
  }

  function buildTurnSnapshot(options) {
    const history = trimHistory(options?.history);
    const profile = options?.profile || {};
    const lastUser = [...history].reverse().find(item => item.role === 'user');
    const lastDiego = [...history].reverse().find(item => item.role === 'diego');
    return {
      total: history.length,
      lastUser: lastUser?.mensaje || '',
      lastDiego: lastDiego?.mensaje || '',
      focus: lastDiego?.mensaje || lastUser?.mensaje || profile?.emptyTitle || 'Sin foco reciente',
      updatedAt: lastDiego?.ts || lastUser?.ts || null,
    };
  }

  function buildTeamSnapshot(options) {
    const cases = Array.isArray(options?.cases) ? options.cases : [];
    const activeCases = cases.filter(item => String(item?.status?.key || item?.status || '').toLowerCase() !== 'resuelto');
    const owners = new Map();
    activeCases.forEach(item => {
      const owner = cleanText(item?.owner, 'Equipo');
      const current = owners.get(owner) || { owner, total: 0, alta: 0, abiertos: 0 };
      current.total += 1;
      if (String(item?.priority?.key || item?.priority || '').toLowerCase() === 'alta') current.alta += 1;
      if (String(item?.status?.key || item?.status || '').toLowerCase() === 'abierto') current.abiertos += 1;
      owners.set(owner, current);
    });
    return {
      total: activeCases.length,
      urgent: activeCases.filter(item => String(item?.priority?.key || item?.priority || '').toLowerCase() === 'alta').length,
      byOwner: [...owners.values()].sort((left, right) => right.total - left.total).slice(0, 4),
    };
  }

  window.DIEGO_MEMORY = {
    hydrateTurn,
    persistTurn,
    syncCases,
    rememberCase,
    listCaseMemory,
    buildTurnSnapshot,
    buildTeamSnapshot,
  };
})();
