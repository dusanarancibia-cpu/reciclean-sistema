(function () {
  const STORAGE_KEY = 'diego_active_strategy_v1';
  const listeners = new Set();

  const PRESETS = [
    {
      id: 'margen_defendido',
      title: 'Margen defendido',
      objective: 'Defender margen y sostener disciplina comercial sin regalar precio.',
      whenToUse: 'Cuando el volumen no justifica sacrificar rentabilidad o hay presion puntual de mercado.',
      publicationPolicy: 'Publicar solo precios defendibles y evitar senales que degraden la referencia.',
      branchPolicy: 'Mantener coherencia entre sucursales, salvo excepcion explicitamente justificada.',
      duration: 'Hasta que cambie el riesgo de margen o aparezca una oportunidad mayor.',
      prompts: [
        'Evalua este precio bajo estrategia margen defendido y dime si cabe en autonomia',
        'Dime el mejor precio defendible sin romper margen ni politica'
      ]
    },
    {
      id: 'captura_servicio',
      title: 'Servicio primero',
      objective: 'Usar precio y operacion para ganar servicio, continuidad y confianza del generador.',
      whenToUse: 'Cuando el generador valora retiro, cumplimiento, rapidez o certeza mas que el ultimo peso.',
      publicationPolicy: 'Publicar solo lo necesario para sostener la promesa comercial; el resto queda guiado por servicio.',
      branchPolicy: 'Privilegiar la sucursal capaz de cumplir mejor el servicio prometido.',
      duration: 'Mientras la experiencia de servicio sea la variable que mas mueve el negocio.',
      prompts: [
        'Analiza este caso bajo estrategia servicio primero y separa precio de promesa operativa',
        'Dime si conviene sostener servicio con este precio o escalar'
      ]
    },
    {
      id: 'volumen_locomotora',
      title: 'Volumen locomotora',
      objective: 'Mover materiales locomotora para arrastrar volumen total y captura de canasta.',
      whenToUse: 'Cuando un material tractor trae otros materiales, frecuencia o caja incremental.',
      publicationPolicy: 'Publicar locomotoras clave; los vagones se resuelven como acompanamiento, no siempre como cara publica.',
      branchPolicy: 'Apoyar sucursales donde el volumen adicional realmente se convierte en caja o flujo util.',
      duration: 'Por ventana tactica definida y con seguimiento de volumen real.',
      prompts: [
        'Analiza este material como locomotora y dime que vagones justificaria mover',
        'Dime si este precio sirve para capturar volumen total o solo destruye margen'
      ]
    },
    {
      id: 'apertura_proyecto',
      title: 'Apertura de proyecto',
      objective: 'Abrir relacion, canal o proyecto nuevo aunque el primer precio no maximice margen.',
      whenToUse: 'Cuando el generador puede habilitar una cuenta, contrato o flujo de largo plazo.',
      publicationPolicy: 'No publicar automaticamente; distinguir precio de apertura versus precio estable.',
      branchPolicy: 'Asignar la sucursal que mejor sirva como punta de lanza del proyecto.',
      duration: 'Hasta validar traccion real y reglas de continuidad.',
      prompts: [
        'Evalua si este caso amerita precio de apertura de proyecto o estrategia normal',
        'Dime que condiciones y plazo deberia tener este precio de apertura'
      ]
    },
    {
      id: 'defensa_sucursal',
      title: 'Defensa de sucursal',
      objective: 'Proteger o empujar una sucursal especifica cuando necesita apoyo comercial u operativo.',
      whenToUse: 'Cuando hay tension territorial, competencia local o una sucursal necesita traccion puntual.',
      publicationPolicy: 'Permitir asimetria controlada; no todo precio debe replicarse en toda la red.',
      branchPolicy: 'El foco principal es la sucursal prioritaria y su area de influencia.',
      duration: 'Hasta que la sucursal recupere posicion o cambie la condicion local.',
      prompts: [
        'Analiza este caso como defensa de sucursal y dime si corresponde asimetria de precio',
        'Dime cuanto tiempo deberia durar este apoyo de sucursal'
      ]
    },
    {
      id: 'tactica_temporal',
      title: 'Tactica temporal',
      objective: 'Tomar una posicion puntual por periodo acotado ante una condicion especifica del mercado.',
      whenToUse: 'Cuando hay una oportunidad o amenaza transitoria y no conviene fijar una politica permanente.',
      publicationPolicy: 'Publicar con criterio de ventana, fecha de salida y reevaluacion obligatoria.',
      branchPolicy: 'Aplicar solo donde la condicion temporal realmente existe.',
      duration: 'Hasta fecha o condicion de salida definida desde el inicio.',
      prompts: [
        'Dime si este caso requiere una tactica temporal o una regla estable',
        'Propone precio, vigencia y condicion de salida para esta tactica temporal'
      ]
    }
  ];

  function clonePreset(preset) {
    return preset ? {
      id: preset.id,
      title: preset.title,
      objective: preset.objective,
      whenToUse: preset.whenToUse,
      publicationPolicy: preset.publicationPolicy,
      branchPolicy: preset.branchPolicy,
      duration: preset.duration,
      prompts: Array.isArray(preset.prompts) ? [...preset.prompts] : [],
    } : null;
  }

  function loadActiveId() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return PRESETS.some(p => p.id === stored) ? stored : PRESETS[0].id;
    } catch (_) {
      return PRESETS[0].id;
    }
  }

  let activeId = loadActiveId();

  function getPresetById(id) {
    return PRESETS.find(p => p.id === id) || PRESETS[0];
  }

  function getActive() {
    return clonePreset(getPresetById(activeId));
  }

  function saveActive(id) {
    activeId = getPresetById(id).id;
    try {
      window.localStorage.setItem(STORAGE_KEY, activeId);
    } catch (_) {
      // noop
    }
    const payload = getActive();
    listeners.forEach(fn => {
      try { fn(payload); } catch (_) { /* noop */ }
    });
    try {
      window.dispatchEvent(new window.CustomEvent('diego-strategy-changed', { detail: payload }));
    } catch (_) {
      // noop
    }
    return payload;
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.add(fn);
    return function unsubscribe() {
      listeners.delete(fn);
    };
  }

  window.DIEGO_STRATEGY = {
    getPresets: function () { return PRESETS.map(clonePreset); },
    getActive,
    setActive: saveActive,
    subscribe,
    getPromptPack: function () {
      const active = getActive();
      return active && Array.isArray(active.prompts) ? [...active.prompts] : [];
    },
  };
})();
