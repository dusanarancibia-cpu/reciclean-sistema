// public/diego/diego-stt.js
// Entrada de voz para Diego — PR1 del camino "modo voz conversacional"
// (D-DIEGO-VOZ-CONVERSACIONAL-001). PRUEBA EXPLÍCITA, no decisión de
// arquitectura final: valida si el STT nativo del navegador
// (window.SpeechRecognition) alcanza en precisión para vocabulario del
// rubro (materiales, sucursales, números) antes de invertir en el loop
// conversacional completo (PR2).
//
// Alcance de este módulo: SOLO transcribe. No decide qué hacer con el
// texto — quien lo consuma (hoy: dictado al input de Diego) decide si
// lo envía, lo edita o lo descarta. Cero autosend, cero backend, cero
// dependencia de diego-chat-process ni de diego-tts.js.
//
// PR2a (14-jul-2026): motor nativo aceptado como camino real tras prueba
// humana (ver mayordomo/BITACORA-VIVA.md). Corrección de nombres propios
// y registro de aprendizaje viven en módulos aparte
// (diego-stt-correcciones.js / diego-stt-log.js) — este archivo sigue
// siendo solo el wrapper de SpeechRecognition, sin lógica de negocio.
//
// Reversible a propósito, mismo criterio que diego-tts.js: si el día de
// mañana hace falta más precisión (Whisper u otro motor), se reescribe
// adentro de startListening()/stopListening() — el consumidor no cambia.
(function () {
  const state = {
    recognition: null,
    listening: false,
    finalTranscript: '',
  };

  function getCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function isSupported() {
    return typeof window !== 'undefined' && !!getCtor();
  }

  function isListening() {
    return state.listening;
  }

  function stopListening() {
    if (state.recognition) {
      try { state.recognition.stop(); } catch (e) { /* noop */ }
    }
  }

  function startListening(opts) {
    const options = opts || {};
    const Ctor = getCtor();
    if (!Ctor) {
      if (typeof options.onError === 'function') options.onError(new Error('SpeechRecognition no soportado en este navegador'));
      return;
    }
    // Solo 1 sesión de escucha activa a la vez — mismo criterio que diego-tts.js
    // con speechSynthesis.cancel(): cortar cualquier anterior antes de arrancar.
    if (state.recognition) stopListening();

    const recognition = new Ctor();
    recognition.lang = 'es-CL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    state.finalTranscript = '';
    let lastInterim = '';

    recognition.onstart = function () {
      state.listening = true;
      if (typeof options.onStart === 'function') options.onStart();
    };

    recognition.onresult = function (event) {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          state.finalTranscript = (state.finalTranscript ? state.finalTranscript + ' ' : '') + transcript.trim();
        } else {
          interim += transcript;
        }
      }
      lastInterim = interim.trim();
      if (lastInterim) {
        // Vista completa siempre: lo ya confirmado + lo que se está diciendo ahora.
        if (typeof options.onInterim === 'function') options.onInterim((state.finalTranscript + ' ' + lastInterim).trim());
      } else if (typeof options.onFinal === 'function') {
        options.onFinal(state.finalTranscript.trim());
      }
    };

    recognition.onerror = function (event) {
      state.listening = false;
      if (typeof options.onError === 'function') options.onError(event);
    };

    recognition.onend = function () {
      state.listening = false;
      // Si el navegador cortó con un tramo interino sin confirmar (ej: usuario
      // clickeó "detener" a mitad de frase), no perderlo — promoverlo a final.
      if (lastInterim) {
        state.finalTranscript = (state.finalTranscript ? state.finalTranscript + ' ' : '') + lastInterim;
        lastInterim = '';
      }
      if (typeof options.onFinal === 'function') options.onFinal(state.finalTranscript.trim());
      state.recognition = null;
    };

    state.recognition = recognition;
    try {
      recognition.start();
    } catch (e) {
      state.listening = false;
      state.recognition = null;
      if (typeof options.onError === 'function') options.onError(e);
    }
  }

  window.DIEGO_STT = {
    isSupported,
    startListening,
    stopListening,
    isListening,
  };
})();
