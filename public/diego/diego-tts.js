// public/diego/diego-tts.js
// Voz de salida para respuestas de Diego — paso 2 (D-DIEGO-VOZ-COMPOSER-001).
// Implementación mínima con la Web Speech API nativa del navegador
// (window.speechSynthesis). Cero backend, cero costo, cero dependencia externa.
//
// Reversible a propósito: toda la interfaz pública es speak/stop/isSpeaking/
// isSupported/getCurrentId. El día que se justifique un TTS más serio (OpenAI TTS,
// ElevenLabs, etc.), solo hay que reescribir adentro de speak() — nada que
// consuma este módulo (diego-render.js, el composer de Diego v6) necesita cambiar.
(function () {
  const state = {
    currentId: null,
  };

  function isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function stop() {
    if (isSupported()) window.speechSynthesis.cancel();
    state.currentId = null;
  }

  function speak(text, opts) {
    const options = opts || {};
    const clean = String(text || '').trim();
    if (!isSupported()) {
      if (typeof options.onError === 'function') options.onError(new Error('speechSynthesis no soportado en este navegador'));
      return null;
    }
    if (!clean) {
      if (typeof options.onError === 'function') options.onError(new Error('Nada que leer'));
      return null;
    }

    // Solo 1 locución activa a la vez — cortar cualquier anterior antes de arrancar.
    window.speechSynthesis.cancel();

    const id = options.id != null ? options.id : Date.now();
    // currentId se setea ACÁ, síncrono, no en onstart — algunos navegadores (o
    // este entorno de test) tardan en disparar onstart, y un 2do click rápido en
    // el mismo botón (para "Detener") tiene que ver el id ya activo, no null.
    state.currentId = id;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-CL';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = function () {
      if (typeof options.onStart === 'function') options.onStart(id);
    };
    utterance.onend = function () {
      if (state.currentId === id) state.currentId = null;
      if (typeof options.onEnd === 'function') options.onEnd(id);
    };
    utterance.onerror = function (event) {
      if (state.currentId === id) state.currentId = null;
      if (typeof options.onError === 'function') options.onError(event);
    };

    window.speechSynthesis.speak(utterance);
    return id;
  }

  function isSpeaking(id) {
    if (id == null) return state.currentId != null;
    return state.currentId === id;
  }

  function getCurrentId() {
    return state.currentId;
  }

  window.DIEGO_TTS = {
    isSupported,
    speak,
    stop,
    isSpeaking,
    getCurrentId,
  };
})();
