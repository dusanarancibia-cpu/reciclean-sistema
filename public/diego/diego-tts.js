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
    voices: [],
  };

  function isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function stop() {
    if (isSupported()) window.speechSynthesis.cancel();
    state.currentId = null;
  }

  // Selección de voz nativa (cierre etapa voz 14-jul-2026). getVoices() puede
  // devolver [] en la primera llamada — varios navegadores (Chrome incluido)
  // cargan la lista de voces de forma async y recién avisan con el evento
  // 'voiceschanged'. Por eso se refresca al cargar el modulo Y cada vez que
  // ese evento dispara, no solo una vez.
  function refreshVoices() {
    if (!isSupported()) return;
    try {
      state.voices = window.speechSynthesis.getVoices() || [];
    } catch (e) {
      state.voices = [];
    }
  }

  function normalizeLang(lang) {
    return String(lang || '').toLowerCase().replace('_', '-');
  }

  // Prioridad simple y estable: es-CL exacto -> es-ES exacto -> cualquier
  // es-* -> null (fallback: se deja utterance.lang='es-CL' sin voice fijada,
  // mismo comportamiento que antes de este cambio).
  function pickBestVoice() {
    const voices = state.voices;
    if (!voices || !voices.length) return null;
    const byLang = (target) => voices.find((v) => normalizeLang(v.lang) === target);
    return byLang('es-cl') || byLang('es-es') || voices.find((v) => normalizeLang(v.lang).startsWith('es')) || null;
  }

  // Inspección simple desde consola: window.DIEGO_TTS.getSelectedVoice() /
  // .listVoices() — pedido opcional de Dusan, sin UI ni config nueva.
  function getSelectedVoice() {
    const v = pickBestVoice();
    return v ? { name: v.name, lang: v.lang, voiceURI: v.voiceURI, default: !!v.default } : null;
  }

  function listVoices() {
    return state.voices.map((v) => ({ name: v.name, lang: v.lang, default: !!v.default }));
  }

  if (isSupported()) {
    refreshVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
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
    // Si el navegador ya cargó voces nativas en español, fijar la mejor
    // disponible. Si no hay ninguna (voces vacías o sin match es-*), queda
    // sin `voice` fijada — mismo comportamiento de siempre: el navegador usa
    // su default para utterance.lang='es-CL'.
    const bestVoice = pickBestVoice();
    if (bestVoice) utterance.voice = bestVoice;

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
    getSelectedVoice,
    listVoices,
  };
})();
