(function () {
  function removeThinking(history) {
    return (Array.isArray(history) ? history : []).filter(entry => entry.role !== 'thinking');
  }

  function buildResponseEntry(resp) {
    if (resp?.error) {
      return { role: 'diego', mensaje: '❌ ' + resp.error, ts: Date.now(), kind: 'bloqueado' };
    }

    return {
      role: 'diego',
      mensaje: resp?.reply || '(sin respuesta)',
      ts: Date.now(),
      kind: resp?.cola_id || (resp?.actions_taken || []).length
        ? 'ejecutado'
        : ((resp?.suggestions || []).length
            ? 'propuesta'
            : ((resp?.six_w && (resp.six_w.what || resp.six_w.when || resp.six_w.who))
                ? 'analisis'
                : 'consulta')),
      actions: resp?.actions_taken || [],
      suggestions: resp?.suggestions || [],
      six_w: resp?.six_w || {},
      cola_id: resp?.cola_id,
      tokens: resp?.tokens_used,
    };
  }

  function isPrecioImportMessage(msg, attach) {
    return !!(msg && attach &&
      /graba(?:r)?\s+(?:los\s+|estos\s+|estos\s+nuevos\s+)?precios?\s+(?:de|del|para)\s+(.+)/i.test(msg) &&
      typeof window.ChatbotPrecios !== 'undefined' &&
      typeof window.ChatbotPrecios.procesarMensajeConArchivo === 'function');
  }

  async function handlePrecioImport(options) {
    const msg = options.msg;
    const attach = options.attach;
    const sb = options.sb;
    const getHistory = options.getHistory;
    const setHistory = options.setHistory;
    const render = options.render;
    const getUserEmail = options.getUserEmail;

    console.log('[Precios] interceptor activo · descargando archivo de Storage...');
    const dl = await sb.storage.from('diego-chat-files').download(attach.file_url);
    if (dl.error) throw dl.error;

    const archivoFile = new File([dl.data], attach.file_name, { type: attach.file_mime || 'text/plain' });
    const ctx = {
      sb: sb,
      sucursal_id: (typeof window.currentSucursal !== 'undefined' && window.currentSucursal) || 'cerrillos',
      metadatos: { usuario_email: getUserEmail() || 'anon' },
      uiPreguntar: function (nombreCliente, cb) {
        console.log('[Precios] auto-creando cliente nuevo como histórico:', nombreCliente);
        cb('si');
      },
      uiRenderResumen: function (resumen, cb) {
        console.log('[Precios] auto-confirmando', resumen.n_items, 'items para', resumen.cliente);
        cb('si');
      },
      uiMensaje: function (texto) {
        if (texto === 'asistente_general') return;
        const nextHistory = removeThinking(getHistory());
        nextHistory.push({ role: 'diego', mensaje: texto, ts: Date.now() });
        setHistory(nextHistory);
        render();
      }
    };

    const resultado = await window.ChatbotPrecios.procesarMensajeConArchivo(msg, archivoFile, ctx);
    const nextHistory = removeThinking(getHistory());

    if (resultado.ok) {
      const total = (resultado.resultados || []).reduce((sum, row) => sum + (row.n || 0), 0);
      nextHistory.push({
        role: 'diego',
        mensaje: '✅ ' + total + ' propuesta(s) creadas en bandeja. Andrea y Dusan reciben aviso.',
        ts: Date.now(),
        kind: 'ejecutado'
      });
    } else {
      nextHistory.push({
        role: 'diego',
        mensaje: '❌ ' + (resultado.motivo || 'No pude procesar los precios'),
        ts: Date.now(),
        kind: 'bloqueado'
      });
    }

    setHistory(nextHistory);
    render();
    return true;
  }

  async function handleSubmit(options) {
    const event = options?.event;
    const input = options?.input;
    const sendBtn = options?.sendBtn;
    const attachPreview = options?.attachPreview;
    const render = options?.render;
    const callDiego = options?.callDiego;
    const refreshBadge = options?.refreshBadge;
    const sb = options?.sb;
    const getUserEmail = options?.getUserEmail;
    const getPendingFile = options?.getPendingFile;
    const clearPendingFile = options?.clearPendingFile;
    const getHistory = options?.getHistory;
    const setHistory = options?.setHistory;

    if (!event || !input || !sendBtn || !attachPreview || typeof render !== 'function' || typeof callDiego !== 'function') {
      return false;
    }

    event.preventDefault();
    const msg = input.value.trim();
    const pendingFile = typeof getPendingFile === 'function' ? getPendingFile() : null;
    if (!msg && !pendingFile) return true;

    sendBtn.disabled = true;
    const attach = pendingFile;
    const nextHistory = [...(typeof getHistory === 'function' ? getHistory() : [])];
    nextHistory.push({ role: 'user', mensaje: msg || '(adjunto)', attach: attach?.file_name, ts: Date.now() });
    nextHistory.push({ role: 'thinking', mensaje: 'Diego está escribiendo<span class="diego-typing-dots"><span></span><span></span><span></span></span>', ts: Date.now() });
    if (typeof setHistory === 'function') setHistory(nextHistory);
    render();

    input.value = '';
    input.style.height = 'auto';
    if (typeof clearPendingFile === 'function') clearPendingFile();
    attachPreview.style.display = 'none';

    try {
      if (isPrecioImportMessage(msg, attach)) {
        try {
          await handlePrecioImport({
            msg,
            attach,
            sb,
            getHistory,
            setHistory,
            render,
            getUserEmail,
          });
          sendBtn.disabled = false;
          if (typeof refreshBadge === 'function') refreshBadge();
          return true;
        } catch (errPrecios) {
          const historyWithError = removeThinking(typeof getHistory === 'function' ? getHistory() : []);
          historyWithError.push({
            role: 'diego',
            mensaje: '❌ Error flujo precios: ' + (errPrecios.message || errPrecios) + ' · sigo flujo normal',
            ts: Date.now(),
            kind: 'bloqueado'
          });
          if (typeof setHistory === 'function') setHistory(historyWithError);
          render();
          console.error('[Precios] interceptor fallo:', errPrecios);
        }
      }

      const resp = await callDiego(msg, attach);
      const settledHistory = removeThinking(typeof getHistory === 'function' ? getHistory() : []);
      settledHistory.push(buildResponseEntry(resp));
      if (typeof setHistory === 'function') setHistory(settledHistory);
      render();
    } finally {
      sendBtn.disabled = false;
      if (typeof refreshBadge === 'function') refreshBadge();
    }

    return true;
  }

  window.DIEGO_INTERACTION = {
    handleSubmit,
    removeThinking,
    buildResponseEntry,
  };
})();
