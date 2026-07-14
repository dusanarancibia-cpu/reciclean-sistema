// public/diego/diego-stt-log.js
// Registro de aprendizaje del dictado por voz — PR2a
// (D-DIEGO-VOZ-CONVERSACIONAL-001). Compara lo que el motor transcribió
// contra lo que realmente se terminó enviando, para saber si el motor
// nativo alcanza sin tener que preguntarle al usuario "¿te falló?".
//
// Honestidad de diseño (no fingir precisión que no existe): solo puedo
// detectar con certeza 2 tipos de corrección crítica —
//   1) corrección de sucursal (vía diego-stt-correcciones.js, exacta)
//   2) diferencia de dígitos/números entre lo dictado y lo enviado
// Cualquier otro cambio manual del usuario (podría ser material, podría
// ser cualquier cosa) se guarda como "otra_edicion" SIN inventar si es
// "menor" o "crítica" — eso requiere revisión humana periódica, no una
// heurística de texto que finja saber lo que no sabe.
//
// Guardado 100% local (localStorage), cero backend, cero tabla nueva —
// se escala a Supabase después, solo si hace falta de verdad.
(function () {
  const STORAGE_KEY = 'diego_stt_log_v1';
  const MAX_ENTRIES = 200;

  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function guardar(entradas) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entradas.slice(-MAX_ENTRIES)));
    } catch (e) {
      // localStorage lleno o bloqueado — no es crítico, el registro es solo
      // para aprendizaje, no para operación. Se pierde este dato y sigue.
      console.warn('[Diego STT log] no se pudo guardar:', e);
    }
  }

  function extraerDigitos(texto) {
    return (String(texto || '').match(/\d+/g) || []).join(',');
  }

  function clasificar(crudo, final, huboCorreccionSucursal) {
    if (crudo.trim() === final.trim()) return 'sin_cambios';
    if (huboCorreccionSucursal) return 'correccion_sucursal';
    if (extraerDigitos(crudo) !== extraerDigitos(final)) return 'diferencia_numerica';
    return 'otra_edicion';
  }

  // options: { crudo, final, correccionesDiccionario: [] }
  function registrar(options) {
    const opts = options || {};
    const crudo = String(opts.crudo || '');
    const final = String(opts.final || '');
    const correcciones = Array.isArray(opts.correccionesDiccionario) ? opts.correccionesDiccionario : [];
    const categoria = clasificar(crudo, final, correcciones.length > 0);
    const entrada = {
      ts: opts.ts != null ? opts.ts : Date.now(),
      crudo,
      final,
      categoria,
      correcciones,
    };
    const entradas = leer();
    entradas.push(entrada);
    guardar(entradas);
    return entrada;
  }

  // Resumen con los % que definen la regla de decisión ya acordada:
  // <20% sin_cambios+correcciones triviales -> seguir ajustando / avanzar
  // 20-40% -> zona gris, seguir ajustando
  // >40% o categorías críticas dominantes -> evaluar cambio de motor
  function resumen() {
    const entradas = leer();
    const total = entradas.length;
    const conteo = { sin_cambios: 0, correccion_sucursal: 0, diferencia_numerica: 0, otra_edicion: 0 };
    entradas.forEach((e) => {
      if (conteo[e.categoria] != null) conteo[e.categoria] += 1;
    });
    const conCorreccion = total - conteo.sin_cambios;
    const criticas = conteo.correccion_sucursal + conteo.diferencia_numerica;
    const pctConCorreccion = total ? Math.round((conCorreccion / total) * 100) : 0;
    const pctCriticas = total ? Math.round((criticas / total) * 100) : 0;
    return { total, conteo, pctConCorreccion, pctCriticas };
  }

  function exportar() {
    return leer();
  }

  function limpiar() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
  }

  window.DIEGO_STT_LOG = {
    registrar,
    resumen,
    exportar,
    limpiar,
  };
})();
