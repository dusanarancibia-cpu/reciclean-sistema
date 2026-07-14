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

  // Preferencia manual de voz (14-jul-2026) — guardada en localStorage, no en
  // BD ni backend. Se guarda el voiceURI (o el name si el navegador no expone
  // voiceURI) porque es el identificador mas estable entre recargas de la
  // misma maquina/navegador.
  //
  // LIMITE ESTRUCTURAL (14-jul-2026, hallazgo real Dusan: PC y movil suenan
  // distinto) — no es un bug, es como funciona localStorage:
  //   localStorage vive aislado por origen (dominio) Y por navegador/perfil.
  //   Chrome en el PC y Chrome en el celular son DOS cajas de storage
  //   totalmente separadas, aunque abran la misma URL — no existe ningun
  //   mecanismo nativo del navegador que las sincronice sin backend. Lo
  //   mismo pasa entre 2 navegadores distintos en la MISMA maquina (Chrome
  //   vs Edge). Para que la preferencia manual "viajara" entre dispositivos
  //   haria falta guardarla en un lugar compartido (ej. Supabase asociado al
  //   usuario logueado) — eso es justo lo que esta etapa NO debe tocar
  //   (cero backend, cero proveedor externo).
  //   Lo que SI se resuelve sin backend: que el DEFAULT AUTOMATICO (sin
  //   preferencia manual guardada en ESE dispositivo) sea razonable en
  //   cualquier maquina — ver isDiegoDefaultMaleVoice() mas abajo.
  //   Limite real que sigue existiendo aun con la heuristica: el catalogo de
  //   voces de Android/Chrome movil no es el mismo que el de Windows — los
  //   nombres "Alvaro"/"Jorge"/etc son voces de Microsoft (Windows), Android
  //   normalmente solo expone "Google español" (motor de Google, sin
  //   variante masculina conocida por nombre en la mayoria de los equipos).
  //   Es decir: la heuristica puede acertar en PC/Windows y aun asi caer al
  //   fallback generico (posiblemente femenino) en el celular, porque ahi
  //   simplemente no hay ninguna voz masculina identificable por nombre.
  const PREFERRED_VOICE_KEY = 'diego_tts_preferred_voice';

  function readPreferredVoiceId() {
    try {
      return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem(PREFERRED_VOICE_KEY) : null;
    } catch (e) {
      return null; // localStorage bloqueado (modo privado, sandbox, etc.) — no es critico.
    }
  }

  // Busca la preferencia guardada DENTRO del catalogo de voces ya cargado. Si
  // el navegador ya no la tiene (voz desinstalada, otro dispositivo, etc.),
  // devuelve null y pickBestVoice() cae con gracia al selector automatico.
  function findPreferredVoice() {
    const storedId = readPreferredVoiceId();
    if (!storedId) return null;
    return state.voices.find((v) => v.voiceURI === storedId || v.name === storedId) || null;
  }

  // Coherencia de personaje (14-jul-2026): Diego es un personaje masculino —
  // "Sabina" (voz femenina, es-MX) quedó mal elegida en la pasada anterior y
  // se retira como default. La Web Speech API NO expone género como campo de
  // SpeechSynthesisVoice — no hay forma de preguntarle a una voz si es
  // masculina; el nombre es la única señal real disponible. Lista acotada a
  // nombres reales y documentados de voces masculinas en español del
  // catálogo Microsoft (voces "naturales" de Windows 10/11 + Edge/Chrome
  // sobre Windows, y SAPI5 legado donde aplica) — no es una lista inventada:
  //   es-ES: Alvaro (neural) · Pablo (legado SAPI5 Desktop)
  //   es-MX: Jorge (neural)
  //   es-US: Alonso (neural)
  //   es-AR: Tomas (neural) · es-CO: Gonzalo (neural)
  //   es-CL: Lorenzo (neural) · es-VE: Sebastian (neural) · es-UY: Mateo (neural)
  // Si el equipo real no tiene ninguna de estas instalada, no hay falso
  // positivo: cae con gracia a la prioridad automática de siempre.
  const MALE_VOICE_NAMES = ['alvaro', 'pablo', 'jorge', 'alonso', 'tomas', 'gonzalo', 'lorenzo', 'sebastian', 'mateo'];

  // Refuerzo movil (14-jul-2026, hallazgo real Dusan: PC ya suena masculino,
  // movil sigue sonando femenino/generico). 3 señales adicionales, todas
  // honestas — ninguna inventa genero donde el catalogo no da ninguna pista:
  //
  // 1. Chequear v.voiceURI ademas de v.name — algunos motores (sobre todo en
  //    Android, donde el motor real suele ser Google TTS o el del fabricante)
  //    ponen la info descriptiva en voiceURI y no en name, o al reves segun
  //    version de Chrome/WebView.
  // 2. Palabras de genero explicitas ("masculin", "hombre", "varon", " male")
  //    — legitimo en CUALQUIER plataforma: si un motor (Android, Samsung TTS,
  //    algun engine de terceros) etiqueta la voz con esa palabra literal, es
  //    señal real, no inventada. "male" lleva espacio/limite delante para no
  //    matchear como substring de "female"/"femenino".
  // 3. Exclusion de nombres femeninos CONOCIDOS cuando hay alternativa en el
  //    mismo nivel de idioma — no es lo mismo que "adivinar cual es macho":
  //    es "evitar la que se sabe que es mujer" cuando el catalogo ofrece mas
  //    de una opcion es-* en ese dispositivo. Si esa es la UNICA voz de ese
  //    idioma disponible, se usa igual — mejor una voz femenina real que
  //    ningun audio (fallback con gracia sigue vigente).
  //
  // Limite real que esto NO resuelve: si Android/Chrome del equipo solo
  // expone UNA voz en español sin ningun nombre ni palabra de genero (caso
  // tipico: "Google español" pelado), no hay señal de ningun tipo — ahi se
  // usa esa unica voz tal cual, sin fingir que sabemos su genero.
  const FEMALE_VOICE_NAMES = ['sabina', 'helena', 'elvira', 'dalia', 'paloma', 'salome', 'catalina', 'monica', 'laura', 'raquel', 'camila', 'lucia', 'valeria'];

  function voiceHaystack(v) {
    return `${v?.name || ''} ${v?.voiceURI || ''}`.toLowerCase();
  }

  // "male" es sustring de "female" — un includes() plano matchearia
  // "Microsoft Voice Female" como si fuera masculina. \bmale\b exige limite
  // de palabra en ambos lados: en "female" no hay limite entre 'e' y 'm'
  // (ambos son caracteres de palabra), asi que el regex NO matchea ahi, pero
  // SI matchea separadores reales tipicos de voiceURI (punto, guion, espacio,
  // guion bajo) como "es.male.v2" o "es-ES-male-1".
  const MALE_WORD_RE = /\bmale\b/;

  function hasExplicitGenderWord(haystack, plainWords) {
    if (MALE_WORD_RE.test(haystack)) return true;
    return plainWords.some((w) => haystack.includes(w));
  }

  function isDiegoDefaultMaleVoice(v) {
    if (!normalizeLang(v?.lang).startsWith('es')) return false;
    const haystack = voiceHaystack(v);
    if (MALE_VOICE_NAMES.some((n) => haystack.includes(n))) return true;
    if (hasExplicitGenderWord(haystack, ['masculin', 'hombre', 'varon'])) return true;
    return false;
  }

  function isKnownFemaleVoiceName(v) {
    const haystack = voiceHaystack(v);
    if (haystack.includes('femenin') || haystack.includes('female')) return true;
    return FEMALE_VOICE_NAMES.some((n) => haystack.includes(n));
  }

  // Entre varias voces del MISMO nivel de idioma, prefiere una que no sea
  // conocida como femenina si hay alternativa — no inventa cual es "el
  // macho", solo evita la que se sabe que no lo es. Si la unica opcion
  // disponible es la femenina conocida, se usa igual (fallback con gracia).
  function pickAvoidingKnownFemale(candidates) {
    if (!candidates.length) return null;
    return candidates.find((v) => !isKnownFemaleVoiceName(v)) || candidates[0];
  }

  // Prioridad: preferencia manual (si sigue existiendo, gana siempre) ->
  // voz masculina conocida en español (nombre, voiceURI o palabra de genero
  // explicita) -> es-CL (evitando femeninas conocidas si hay alternativa) ->
  // es-ES (idem) -> cualquier es-* (idem) -> null (fallback: utterance.
  // lang='es-CL' sin voice fijada, mismo comportamiento de siempre).
  function pickBestVoice() {
    const voices = state.voices;
    if (!voices || !voices.length) return null;
    const preferred = findPreferredVoice();
    if (preferred) return preferred;
    const maleDefault = voices.find(isDiegoDefaultMaleVoice);
    if (maleDefault) return maleDefault;
    const byLang = (target) => pickAvoidingKnownFemale(voices.filter((v) => normalizeLang(v.lang) === target));
    const anyEs = voices.filter((v) => normalizeLang(v.lang).startsWith('es'));
    return byLang('es-cl') || byLang('es-es') || pickAvoidingKnownFemale(anyEs) || null;
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

  // window.DIEGO_TTS.listMaleVoiceCandidates() — de las voces cargadas en
  // ESTE dispositivo/navegador, cuales matchean la heuristica masculina
  // (isDiegoDefaultMaleVoice) y cual de ellas es la que realmente se usaria
  // hoy como default (la primera que encuentra state.voices.find(), marcada
  // aparte). Ayuda de consola pedida por Dusan, sin UI nueva.
  function listMaleVoiceCandidates() {
    const candidates = state.voices.filter(isDiegoDefaultMaleVoice);
    const elegida = candidates[0] || null;
    const rows = candidates.map((v) => ({ name: v.name, lang: v.lang, usadaComoDefault: v === elegida }));
    if (typeof console !== 'undefined' && typeof console.table === 'function') {
      console.table(rows.length ? rows : [{ name: '(ninguna voz masculina conocida en este catálogo)', lang: '-', usadaComoDefault: false }]);
    }
    return rows;
  }

  // Texto fijo de prueba local (14-jul-2026) — mismo texto para TODAS las
  // voces, para que la comparacion entre ellas sea justa.
  const PREVIEW_TEXT = 'Hola Dusan, buenos dias, tenemos que revisar los precios y los stock de cerrillos, puerto montt y maipu.';

  // window.DIEGO_TTS.listVoicesNumbered() — misma lista que listVoices() pero
  // numerada 1..N segun el orden actual de state.voices. El numero es estable
  // MIENTRAS el catalogo cargado no cambie (no hay otro 'voiceschanged' de por
  // medio entre llamadas) — alcanza para un test local en una sola sesion.
  function listVoicesNumbered() {
    const rows = state.voices.map((v, i) => ({ numero: i + 1, name: v.name, lang: v.lang, default: !!v.default }));
    if (typeof console !== 'undefined' && typeof console.table === 'function') console.table(rows);
    return rows;
  }

  function voiceByIndex(number) {
    const idx = Number(number) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= state.voices.length) {
      return { ok: false, reason: `No hay voz con numero ${number}. Usa DIEGO_TTS.listVoicesNumbered() para ver el rango valido (1-${state.voices.length}).` };
    }
    return { ok: true, voice: state.voices[idx] };
  }

  // window.DIEGO_TTS.previewVoice(numero) — reproduce el texto fijo de prueba
  // con la voz de ese numero, SIN tocar la preferencia guardada.
  function previewVoice(number) {
    const found = voiceByIndex(number);
    if (!found.ok) return found;
    const id = speak(PREVIEW_TEXT, { id: `preview-${number}`, voice: found.voice });
    if (id == null) return { ok: false, reason: 'No se pudo reproducir (speechSynthesis no soportado o modulo no inicializado).' };
    return { ok: true, number: Number(number), voice: { name: found.voice.name, lang: found.voice.lang, voiceURI: found.voice.voiceURI } };
  }

  // window.DIEGO_TTS.setPreferredVoiceByIndex(numero) — atajo de
  // setPreferredVoice() usando el mismo numero que listVoicesNumbered().
  function setPreferredVoiceByIndex(number) {
    const found = voiceByIndex(number);
    if (!found.ok) return found;
    return setPreferredVoice(found.voice.voiceURI || found.voice.name);
  }

  // window.DIEGO_TTS.setPreferredVoice('Google español' | voiceURI) — fija
  // preferencia manual. Requiere que la voz ya este en el catalogo cargado
  // (usar listVoices() primero); si no matchea nada, no guarda nada y avisa.
  function setPreferredVoice(nameOrUri) {
    const target = String(nameOrUri || '').trim();
    if (!target) return { ok: false, reason: 'Nombre o voiceURI vacio.' };
    const match = state.voices.find((v) => v.name === target || v.voiceURI === target);
    if (!match) {
      return { ok: false, reason: `No hay ninguna voz cargada que coincida con "${target}". Usa DIEGO_TTS.listVoices() para ver las disponibles.` };
    }
    try {
      if (window.localStorage) window.localStorage.setItem(PREFERRED_VOICE_KEY, match.voiceURI || match.name);
    } catch (e) {
      return { ok: false, reason: 'No se pudo guardar en localStorage (modo privado o bloqueado). La preferencia no persiste.' };
    }
    return { ok: true, voice: { name: match.name, lang: match.lang, voiceURI: match.voiceURI } };
  }

  // window.DIEGO_TTS.clearPreferredVoice() — vuelve al selector automatico.
  function clearPreferredVoice() {
    try {
      if (window.localStorage) window.localStorage.removeItem(PREFERRED_VOICE_KEY);
    } catch (e) { /* noop */ }
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
    // options.voice fuerza una voz puntual (usado por previewVoice() para
    // probar una voz especifica sin tocar la preferencia guardada). Sin eso,
    // sigue el criterio de siempre: preferencia manual -> automatico es-CL/
    // es-ES/es-* -> sin `voice` fijada (default del navegador).
    const bestVoice = options.voice || pickBestVoice();
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
    setPreferredVoice,
    clearPreferredVoice,
    listVoicesNumbered,
    previewVoice,
    setPreferredVoiceByIndex,
    listMaleVoiceCandidates,
  };
})();
