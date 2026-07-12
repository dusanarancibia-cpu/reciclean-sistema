(function () {
  const state = {
    destinos: [],
    topClientes: [],
    seleccionados: new Set(),
    aiSugeridos: new Set(),
    archivo: null,
    archivoUrl: null,
  };

  window.DIEGO_STATE = {
    getDestinos: function () { return state.destinos; },
    setDestinos: function (items) { state.destinos = Array.isArray(items) ? items : []; return state.destinos; },

    getTopClientes: function () { return state.topClientes; },
    setTopClientes: function (items) { state.topClientes = Array.isArray(items) ? items : []; return state.topClientes; },

    getSeleccionados: function () { return state.seleccionados; },
    setSeleccionados: function (ids) { state.seleccionados = new Set(Array.isArray(ids) ? ids : []); return state.seleccionados; },
    toggleSeleccionado: function (id) {
      if (state.seleccionados.has(id)) state.seleccionados.delete(id);
      else state.seleccionados.add(id);
      return state.seleccionados;
    },
    clearSeleccionados: function () { state.seleccionados.clear(); return state.seleccionados; },

    getAiSugeridos: function () { return state.aiSugeridos; },
    setAiSugeridos: function (ids) { state.aiSugeridos = new Set(Array.isArray(ids) ? ids : []); return state.aiSugeridos; },
    clearAiSugeridos: function () { state.aiSugeridos.clear(); return state.aiSugeridos; },

    getArchivo: function () { return state.archivo; },
    setArchivo: function (file) { state.archivo = file || null; return state.archivo; },
    clearArchivo: function () { state.archivo = null; state.archivoUrl = null; },

    getArchivoUrl: function () { return state.archivoUrl; },
    setArchivoUrl: function (url) { state.archivoUrl = url || null; return state.archivoUrl; },
  };
})();
