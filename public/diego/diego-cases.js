(function () {
  function cleanText(value, cleanMsg) {
    if (typeof cleanMsg === 'function') return cleanMsg(value || '');
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function inferCaseType(entry) {
    const txt = String(entry?.mensaje || '').toLowerCase();
    if (entry?.kind === 'bloqueado' || txt.includes('bloqueo') || txt.includes('traba')) return { key: 'bloqueo', label: 'Bloqueo' };
    if (entry?.kind === 'ejecutado' || entry?.cola_id || txt.includes('oportunidad') || txt.includes('cliente')) return { key: 'oportunidad', label: 'Oportunidad' };
    if ((entry?.suggestions || []).length > 0 || txt.includes('debe hacer') || txt.includes('pendiente')) return { key: 'tarea', label: 'Tarea' };
    return { key: 'reclamo', label: 'Reclamo' };
  }

  function inferCasePriority(entry) {
    const txt = String(entry?.mensaje || '').toLowerCase();
    if (entry?.kind === 'bloqueado' || txt.includes('urgente') || txt.includes('hoy') || txt.includes('caida') || txt.includes('cobro')) {
      return { key: 'alta', label: 'Alta' };
    }
    if ((entry?.suggestions || []).length > 0 || (entry?.actions || []).length > 0 || txt.includes('precio') || txt.includes('servicio')) {
      return { key: 'media', label: 'Media' };
    }
    return { key: 'baja', label: 'Baja' };
  }

  function inferCaseStatus(entry) {
    if (entry?.kind === 'ejecutado' || entry?.cola_id) return { key: 'resuelto', label: 'Resuelto' };
    if (entry?.kind === 'bloqueado') return { key: 'abierto', label: 'Abierto' };
    if ((entry?.suggestions || []).length > 0) return { key: 'por_confirmar', label: 'Por confirmar' };
    if ((entry?.actions || []).length > 0) return { key: 'en_curso', label: 'En curso' };
    return { key: 'abierto', label: 'Abierto' };
  }

  function inferCaseOwner(profile, entry) {
    const txt = String(entry?.mensaje || '').toLowerCase();
    if (txt.includes('precio') || txt.includes('cliente') || txt.includes('comercial')) return 'Andrea / Comercial';
    if (txt.includes('cobro') || txt.includes('pago') || txt.includes('factura')) return 'Finanzas';
    if (txt.includes('document') || txt.includes('permiso') || txt.includes('firma')) return 'Cumplimiento';
    if (txt.includes('panel') || txt.includes('servicio') || txt.includes('traba') || txt.includes('oper')) return 'Operaciones';
    if (profile?.key === 'direccion') return 'Dirección';
    return profile?.label || 'Equipo';
  }

  function inferCaseTitle(entry, index, cleanMsg) {
    const base = cleanText(entry?.mensaje || '', cleanMsg);
    if (!base) return `Caso Diego ${index + 1}`;
    return base.length > 88 ? `${base.slice(0, 85)}...` : base;
  }

  function buildCases(options) {
    const history = Array.isArray(options?.history) ? options.history : [];
    const profile = options?.profile || { label: 'Equipo' };
    const inferTrace = typeof options?.inferTrace === 'function' ? options.inferTrace : function () { return 'Sin traza'; };
    const inferNextStep = typeof options?.inferNextStep === 'function' ? options.inferNextStep : function () { return 'Seguir'; };
    const cleanMsg = options?.cleanMsg;

    return history
      .filter(entry => entry && entry.role === 'diego' && entry.kind !== 'consulta')
      .slice(-4)
      .reverse()
      .map((entry, index) => ({
        title: inferCaseTitle(entry, index, cleanMsg),
        type: inferCaseType(entry),
        priority: inferCasePriority(entry),
        status: inferCaseStatus(entry),
        owner: inferCaseOwner(profile, entry),
        trace: inferTrace(entry),
        step: inferNextStep(entry),
      }));
  }

  window.DIEGO_CASES = {
    buildCases,
  };
})();
