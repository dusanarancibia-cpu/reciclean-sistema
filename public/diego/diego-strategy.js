(function () {
  const STORAGE_KEY = 'diego_active_strategy_v1';
  const listeners = new Set();

  const PRESETS = [
    {
      id: 'margen_defendido',
      title: 'Margen defendido',
      objective: 'Defender margen y sostener disciplina comercial sin regalar precio.',
      segmentFocus: 'Generadores que comparan precio pero no justifican perder rentabilidad estructural.',
      whenToUse: 'Cuando el volumen no justifica sacrificar rentabilidad o hay presion puntual de mercado.',
      materialFocus: 'Materiales nobles, escasos o de sensibilidad alta donde el numero defendible importa mas que correr volumen.',
      servicePolicy: 'Servicio correcto, sin sobreprometer extras que despues se subsidian con precio.',
      pricePolicy: 'Usar el mejor precio defendible y escalar solo si el caso abre una excepcion real.',
      publicationPolicy: 'Publicar solo precios defendibles y evitar senales que degraden la referencia.',
      branchPolicy: 'Mantener coherencia entre sucursales, salvo excepcion explicitamente justificada.',
      duration: 'Hasta que cambie el riesgo de margen o aparezca una oportunidad mayor.',
      exitCondition: 'Salir cuando el margen deje de estar en riesgo o el caso demuestre valor estructural adicional.',
      prompts: [
        'Evalua este precio bajo estrategia margen defendido y dime si cabe en autonomia',
        'Dime el mejor precio defendible sin romper margen ni politica'
      ]
    },
    {
      id: 'captura_servicio',
      title: 'Servicio primero',
      objective: 'Usar precio y operacion para ganar servicio, continuidad y confianza del generador.',
      segmentFocus: 'Generadores que valoran retiro, cumplimiento, rapidez, trazabilidad o certeza mas que el ultimo peso.',
      whenToUse: 'Cuando el generador valora retiro, cumplimiento, rapidez o certeza mas que el ultimo peso.',
      materialFocus: 'Materiales donde la continuidad operacional y la experiencia del generador sostienen la relacion.',
      servicePolicy: 'Privilegiar promesa operativa, cumplimiento y experiencia visible para el cliente.',
      pricePolicy: 'Separar el precio del paquete de servicio y evitar confundir subsidio con estrategia.',
      publicationPolicy: 'Publicar solo lo necesario para sostener la promesa comercial; el resto queda guiado por servicio.',
      branchPolicy: 'Privilegiar la sucursal capaz de cumplir mejor el servicio prometido.',
      duration: 'Mientras la experiencia de servicio sea la variable que mas mueve el negocio.',
      exitCondition: 'Cerrar cuando el servicio deje de ser la palanca principal o el cliente se vuelva plenamente transaccional.',
      prompts: [
        'Analiza este caso bajo estrategia servicio primero y separa precio de promesa operativa',
        'Dime si conviene sostener servicio con este precio o escalar'
      ]
    },
    {
      id: 'volumen_locomotora',
      title: 'Volumen locomotora',
      objective: 'Mover materiales locomotora para arrastrar volumen total y captura de canasta.',
      segmentFocus: 'Generadores que concentran volumen, frecuencia o canasta amplia y permiten monetizar vagones alrededor.',
      whenToUse: 'Cuando un material tractor trae otros materiales, frecuencia o caja incremental.',
      materialFocus: 'Materiales locomotora y sus acompanantes; no todo se publica ni se pelea con la misma intensidad.',
      servicePolicy: 'Sostener servicio donde el volumen adicional realmente se transforma en caja util y permanencia.',
      pricePolicy: 'Permitir numero de entrada agresivo en locomotoras, pero proteger vagones y acompanantes.',
      publicationPolicy: 'Publicar locomotoras clave; los vagones se resuelven como acompanamiento, no siempre como cara publica.',
      branchPolicy: 'Apoyar sucursales donde el volumen adicional realmente se convierte en caja o flujo util.',
      duration: 'Por ventana tactica definida y con seguimiento de volumen real.',
      exitCondition: 'Cortar cuando el volumen prometido no llegue o cuando los vagones no compensen el sacrificio inicial.',
      prompts: [
        'Analiza este material como locomotora y dime que vagones justificaria mover',
        'Dime si este precio sirve para capturar volumen total o solo destruye margen'
      ]
    },
    {
      id: 'apertura_proyecto',
      title: 'Apertura de proyecto',
      objective: 'Abrir relacion, canal o proyecto nuevo aunque el primer precio no maximice margen.',
      segmentFocus: 'Generadores que pueden abrir cuenta, contrato, canal o proyecto futuro de valor mayor.',
      whenToUse: 'Cuando el generador puede habilitar una cuenta, contrato o flujo de largo plazo.',
      materialFocus: 'Materiales de entrada o casos iniciales que habilitan relacion, no necesariamente rentabilidad inmediata.',
      servicePolicy: 'Garantizar una experiencia de arranque impecable para validar traccion real.',
      pricePolicy: 'Distinguir precio de apertura versus precio estable y dejar visible la condicion de continuidad.',
      publicationPolicy: 'No publicar automaticamente; distinguir precio de apertura versus precio estable.',
      branchPolicy: 'Asignar la sucursal que mejor sirva como punta de lanza del proyecto.',
      duration: 'Hasta validar traccion real y reglas de continuidad.',
      exitCondition: 'Salir cuando el proyecto no escale o cuando ya exista evidencia suficiente para pasar a estrategia estable.',
      prompts: [
        'Evalua si este caso amerita precio de apertura de proyecto o estrategia normal',
        'Dime que condiciones y plazo deberia tener este precio de apertura'
      ]
    },
    {
      id: 'defensa_sucursal',
      title: 'Defensa de sucursal',
      objective: 'Proteger o empujar una sucursal especifica cuando necesita apoyo comercial u operativo.',
      segmentFocus: 'Casos locales donde la tension competitiva, operativa o territorial vive en una sucursal concreta.',
      whenToUse: 'Cuando hay tension territorial, competencia local o una sucursal necesita traccion puntual.',
      materialFocus: 'Materiales o clientes donde una sucursal requiere apoyo explicito y asimetrico.',
      servicePolicy: 'Alinear servicio con la sucursal que necesita defender posicion o capturar terreno.',
      pricePolicy: 'Permitir asimetria controlada y dejar visible quien recibe apoyo y por que.',
      publicationPolicy: 'Permitir asimetria controlada; no todo precio debe replicarse en toda la red.',
      branchPolicy: 'El foco principal es la sucursal prioritaria y su area de influencia.',
      duration: 'Hasta que la sucursal recupere posicion o cambie la condicion local.',
      exitCondition: 'Terminar cuando la sucursal vuelva a equilibrio o la competencia local deje de justificar apoyo.',
      prompts: [
        'Analiza este caso como defensa de sucursal y dime si corresponde asimetria de precio',
        'Dime cuanto tiempo deberia durar este apoyo de sucursal'
      ]
    },
    {
      id: 'tactica_temporal',
      title: 'Tactica temporal',
      objective: 'Tomar una posicion puntual por periodo acotado ante una condicion especifica del mercado.',
      segmentFocus: 'Casos donde existe una oportunidad o amenaza transitoria y no conviene convertirla en regla fija.',
      whenToUse: 'Cuando hay una oportunidad o amenaza transitoria y no conviene fijar una politica permanente.',
      materialFocus: 'Materiales o relaciones con fecha, ventana o condicion clara de entrada y salida.',
      servicePolicy: 'Sostener solo el servicio necesario para la ventana tactica, evitando heredar compromisos permanentes.',
      pricePolicy: 'Definir numero, vigencia y condicion de salida desde el principio.',
      publicationPolicy: 'Publicar con criterio de ventana, fecha de salida y reevaluacion obligatoria.',
      branchPolicy: 'Aplicar solo donde la condicion temporal realmente existe.',
      duration: 'Hasta fecha o condicion de salida definida desde el inicio.',
      exitCondition: 'Cerrar al cumplir la fecha, la condicion de salida o al agotarse la oportunidad.',
      prompts: [
        'Dime si este caso requiere una tactica temporal o una regla estable',
        'Propone precio, vigencia y condicion de salida para esta tactica temporal'
      ]
    }
  ];

  let activeId = loadActiveId();
  let currentContext = null;

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function clonePreset(preset) {
    return preset ? {
      id: preset.id,
      title: preset.title,
      objective: preset.objective,
      segmentFocus: preset.segmentFocus,
      whenToUse: preset.whenToUse,
      materialFocus: preset.materialFocus,
      servicePolicy: preset.servicePolicy,
      pricePolicy: preset.pricePolicy,
      publicationPolicy: preset.publicationPolicy,
      branchPolicy: preset.branchPolicy,
      duration: preset.duration,
      exitCondition: preset.exitCondition,
      prompts: Array.isArray(preset.prompts) ? [...preset.prompts] : [],
    } : null;
  }

  function cloneContext(context) {
    return context ? {
      materialId: context.materialId || null,
      materialName: context.materialName || '',
      materialRoleHint: context.materialRoleHint || '',
      branchNames: Array.isArray(context.branchNames) ? [...context.branchNames] : [],
      branchCount: Number(context.branchCount || 0),
      rowCount: Number(context.rowCount || 0),
      urgentCount: Number(context.urgentCount || 0),
      directCount: Number(context.directCount || 0),
      signalCount: Number(context.signalCount || 0),
      proposedMin: Number(context.proposedMin || 0),
      proposedMax: Number(context.proposedMax || 0),
      listMin: Number(context.listMin || 0),
      listMax: Number(context.listMax || 0),
      executiveMin: Number(context.executiveMin || 0),
      executiveMax: Number(context.executiveMax || 0),
      maxMin: Number(context.maxMin || 0),
      maxMax: Number(context.maxMax || 0),
      currentMin: Number(context.currentMin || 0),
      currentMax: Number(context.currentMax || 0),
      publishedMin: Number(context.publishedMin || 0),
      publishedMax: Number(context.publishedMax || 0),
      notes: context.notes || '',
      sourceNames: Array.isArray(context.sourceNames) ? [...context.sourceNames] : [],
    } : null;
  }

  function loadActiveId() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return PRESETS.some(preset => preset.id === stored) ? stored : PRESETS[0].id;
    } catch (_) {
      return PRESETS[0].id;
    }
  }

  function getPresetById(id) {
    return PRESETS.find(preset => preset.id === id) || PRESETS[0];
  }

  function getActive() {
    return clonePreset(getPresetById(activeId));
  }

  function getContext() {
    return cloneContext(currentContext);
  }

  function saveActive(id) {
    activeId = getPresetById(id).id;
    try {
      window.localStorage.setItem(STORAGE_KEY, activeId);
    } catch (_) {
      // noop
    }
    const payload = buildSnapshot();
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

  function setContext(context) {
    currentContext = cloneContext(context);
    const payload = buildSnapshot();
    try {
      window.dispatchEvent(new window.CustomEvent('diego-strategy-context-changed', { detail: payload }));
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

  function inferMaterialRole(context, strategy) {
    const material = normalizeText(context?.materialName);
    const notes = normalizeText(context?.notes);
    const hint = normalizeText(context?.materialRoleHint);
    if (!material && !notes && !hint) return 'Sin material foco activo';
    if (hint) {
      if (hint.includes('locomotora')) return 'Locomotora';
      if (hint.includes('acompanante') || hint.includes('vagon')) return 'Acompanante';
      if (hint.includes('local')) return 'Ancla local';
    }
    if (notes.includes('acompan') || notes.includes('mix') || notes.includes('combo')) return 'Acompanante';
    if (strategy?.id === 'volumen_locomotora') {
      if (/(fierro|acero|carton|carton|papel|pet|cobre|aluminio|bronce|chatarra)/.test(material)) return 'Locomotora';
      return 'Acompanante';
    }
    if (strategy?.id === 'defensa_sucursal') return context?.branchNames?.length === 1 ? 'Ancla local' : 'Expansion controlada';
    if (strategy?.id === 'apertura_proyecto') return 'Material de entrada';
    if (strategy?.id === 'captura_servicio') return 'Material de continuidad';
    if (strategy?.id === 'tactica_temporal') return 'Material tactico';
    return 'Material defendible';
  }

  function inferPublicationDecision(context, strategy, materialRole) {
    const urgent = Number(context?.urgentCount || 0);
    if (strategy?.id === 'volumen_locomotora') {
      if (materialRole === 'Locomotora') return 'Publicar locomotora y manejar acompanantes fuera de pizarra publica.';
      return 'No publicar en masa; usarlo como apoyo del material locomotora.';
    }
    if (strategy?.id === 'apertura_proyecto') return 'No publicar masivo; dejarlo como precio de apertura con condicion de salida.';
    if (strategy?.id === 'defensa_sucursal') return 'Publicar solo donde necesites defender sucursal y no replicar por inercia.';
    if (strategy?.id === 'captura_servicio') return urgent > 0
      ? 'Publicar lo minimo necesario para sostener la promesa de servicio.'
      : 'Evitar sobreexponer precio; la palanca principal es el servicio.';
    if (strategy?.id === 'tactica_temporal') return 'Publicar con vigencia visible y reevaluacion obligatoria.';
    return 'Publicar solo si el numero sigue siendo defendible despues de revisar margen y contexto.';
  }

  function inferBranchDirective(context, strategy) {
    const branchNames = Array.isArray(context?.branchNames) ? context.branchNames.filter(Boolean) : [];
    if (!branchNames.length) return strategy?.branchPolicy || 'Sin foco de sucursal visible.';
    if (strategy?.id === 'defensa_sucursal') return 'Sucursal foco: ' + branchNames[0] + (branchNames.length > 1 ? ' · no replicar automaticamente al resto.' : '.');
    if (strategy?.id === 'captura_servicio') return 'Priorizar ' + branchNames[0] + ' si es la sucursal que mejor cumple servicio.';
    if (strategy?.id === 'volumen_locomotora') return branchNames.length > 1
      ? 'Coordinar ' + branchNames.join(' · ') + ' solo si el volumen adicional se convierte en caja real.'
      : 'Usar ' + branchNames[0] + ' como punta de captura de volumen.';
    return 'Sucursales afectadas: ' + branchNames.join(' · ');
  }

  function inferWindow(context, strategy) {
    const urgent = Number(context?.urgentCount || 0);
    if (strategy?.id === 'tactica_temporal') return 'Ventana corta con fecha o condicion de salida obligatoria.';
    if (strategy?.id === 'defensa_sucursal') return urgent > 0
      ? 'Ventana corta hasta estabilizar la sucursal.'
      : strategy?.duration;
    if (strategy?.id === 'volumen_locomotora') return context?.rowCount > 2
      ? 'Ventana tactica con revision semanal de volumen y canasta.'
      : strategy?.duration;
    return strategy?.duration || 'Hasta nueva definicion ejecutiva.';
  }

  function inferExecutiveSummary(context, strategy, materialRole) {
    const materialName = context?.materialName || 'este material';
    const firstBranch = Array.isArray(context?.branchNames) && context.branchNames.length ? context.branchNames[0] : 'la sucursal foco';
    if (strategy?.id === 'margen_defendido') {
      return 'No corras detras del precio con ' + materialName + '; defendelo si no abre volumen o valor nuevo.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'Usa ' + materialName + ' para vender cumplimiento y continuidad, no solo precio.';
    }
    if (strategy?.id === 'volumen_locomotora') {
      return materialRole === 'Locomotora'
        ? materialName + ' es locomotora: puede justificar mover la canasta si arrastra volumen real.'
        : materialName + ' funciona como apoyo; no conviene pelearlo como si fuera la locomotora principal.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'Acepta una entrada medida en ' + materialName + ' solo si abre relacion o proyecto de valor mayor.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return 'Dale aire a ' + firstBranch + ' sin contagiar automaticamente a toda la red.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'Jugada temporal sobre ' + materialName + ': entra con fecha de salida definida desde el inicio.';
    }
    return 'Resolvé ' + materialName + ' con criterio defendible, trazable y sin improvisacion.';
  }

  function inferExample(context, strategy, materialRole) {
    const materialName = context?.materialName || 'este material';
    const branches = Array.isArray(context?.branchNames) ? context.branchNames.filter(Boolean) : [];
    const branchSpan = branches.length ? branches.join(' y ') : 'las sucursales afectadas';
    if (strategy?.id === 'margen_defendido') {
      return 'Ejemplo: si ' + materialName + ' sube por competencia pero no trae mas volumen ni mejor servicio, defendé el numero y no publiques por ansiedad.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'Ejemplo: si el cliente acepta pagar parecido pero exige retiro rapido y trazabilidad, sostené servicio y evita subsidiarlo con precio oculto.';
    }
    if (strategy?.id === 'volumen_locomotora') {
      return materialRole === 'Locomotora'
        ? 'Ejemplo: si ' + materialName + ' abre ' + branchSpan + ' y arrastra otros materiales, podés entrar mas agresivo en la locomotora y defender los vagones.'
        : 'Ejemplo: si ' + materialName + ' viene junto a una locomotora, usalo como acompanante y no lo expongas como precio estrella.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'Ejemplo: si este primer negocio abre contrato o flujo recurrente, podés aceptar una entrada medida con condicion de continuidad visible.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return 'Ejemplo: si una sucursal esta siendo presionada localmente, apoyala con una asimetria controlada sin replicarla por defecto al resto.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'Ejemplo: si hay una oportunidad de pocos dias, publicá con fecha de salida y revisá si la ventana sigue viva antes de renovar.';
    }
    return 'Ejemplo: si el caso no abre una jugada comercial especial, resolvelo con criterio defendible y seguimiento corto.';
  }

  function inferTimeSuggestion(context, strategy) {
    const urgent = Number(context?.urgentCount || 0);
    if (strategy?.id === 'margen_defendido') {
      return urgent > 0
        ? 'Resolver hoy y revisar en 24-48 h si la presion de margen sigue viva.'
        : 'Usarla en ventana corta y revisarla semanalmente o cuando cambie el riesgo.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'Mantenerla mientras servicio siga moviendo el negocio; revisar cada semana o ante un incumplimiento.';
    }
    if (strategy?.id === 'volumen_locomotora') {
      return 'Ventana tactica de 1 a 2 semanas, con revision de volumen real, canasta y caja capturada.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'Usarla como piloto corto: 1 a 3 semanas o hasta la primera evidencia real de traccion.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return urgent > 0
        ? 'Resolver hoy y medir en 3-7 dias si la sucursal recupera posicion.'
        : 'Aplicarla por pocos dias y revisar si la condicion local sigue justificando apoyo.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'Definir fecha de salida desde el inicio: horas, dias o una campana puntual, pero nunca indefinida.';
    }
    return 'Usarla por ventana corta y revalidarla apenas cambie el contexto.';
  }

  function formatClp(value) {
    const numeric = Number(value || 0);
    if (!(numeric > 0)) return 'sin numero visible';
    return '$' + Math.round(numeric).toLocaleString('es-CL');
  }

  function formatBand(min, max) {
    const safeMin = Number(min || 0);
    const safeMax = Number(max || 0);
    if (!(safeMin > 0) && !(safeMax > 0)) return 'sin numero visible';
    if (safeMin > 0 && safeMax > 0) {
      if (Math.round(safeMin) === Math.round(safeMax)) return formatClp(safeMax);
      return formatClp(safeMin) + ' a ' + formatClp(safeMax);
    }
    return formatClp(safeMax || safeMin);
  }

  function inferOperatingDirective(context, strategy, materialRole) {
    const materialName = context?.materialName || 'este material';
    const opBand = formatBand(context?.executiveMin || context?.proposedMin, context?.executiveMax || context?.proposedMax);
    const firstBranch = Array.isArray(context?.branchNames) && context.branchNames.length ? context.branchNames[0] : 'la sucursal foco';
    if (strategy?.id === 'volumen_locomotora') {
      return materialRole === 'Locomotora'
        ? 'Operá con Ejecutivo cerca de ' + opBand + ' y usá ' + materialName + ' como locomotora para capturar canasta.'
        : 'Operá con Ejecutivo cerca de ' + opBand + ' y usá ' + materialName + ' solo como apoyo, no como precio estrella.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'Operá con Ejecutivo cerca de ' + opBand + ' sin regalar precio; el diferencial debe sostener servicio en ' + materialName + '.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'Operá con Ejecutivo cerca de ' + opBand + ' como entrada medida para ' + materialName + ', no como lista general.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return 'Operá con Ejecutivo en ' + firstBranch + ' cerca de ' + opBand + ' y evitá copiar ese numero por inercia al resto.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'Operá con Ejecutivo cerca de ' + opBand + ' solo mientras la ventana tactica de ' + materialName + ' siga viva.';
    }
    return 'Operá con Ejecutivo cerca de ' + opBand + ' como numero defendible de resolucion para ' + materialName + '.';
  }

  function inferPublicDirective(context, strategy, materialRole) {
    const materialName = context?.materialName || 'este material';
    const listBand = formatBand(context?.listMin || context?.proposedMin, context?.listMax || context?.proposedMax);
    const liveBand = formatBand(context?.publishedMin || context?.currentMin, context?.publishedMax || context?.currentMax);
    const proposedMax = Number(context?.listMax || context?.proposedMax || 0);
    const currentMax = Number(context?.publishedMax || context?.currentMax || 0);
    const gapUp = proposedMax > 0 && currentMax > 0 && proposedMax > (currentMax * 1.08);
    if (strategy?.id === 'volumen_locomotora') {
      return materialRole === 'Locomotora'
        ? 'Publicá con Lista cerca de ' + listBand + ' solo si querés usar ' + materialName + ' como locomotora visible; los acompanantes quedan fuera o con referencia ' + liveBand + '.'
        : 'Mantené publicado ' + liveBand + ' y usá Lista ' + listBand + ' solo si suma claridad; el resto queda como apoyo comercial.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'Mostrá hacia afuera Lista ' + listBand + ' solo si ayuda a sostener la promesa; si ya existe ' + liveBand + ', no conviertas todo el operativo en precio publico.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'No publiques masivo; si hace falta mostrar algo, dejá Lista ' + listBand + ' como referencia y negociá el resto caso a caso.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return 'Publicá con Lista ' + listBand + ' solo en la sucursal foco cuando haga falta defenderla; base visible actual: ' + liveBand + '.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'Publicá con Lista ' + listBand + ' con vigencia corta y fecha de salida visible.';
    }
    if (gapUp) {
      return 'Publicá por ahora ' + liveBand + ' y no subas automatico a Lista ' + listBand + ' hasta validar margen y contexto.';
    }
    return 'Publicá con Lista ' + listBand + ' solo si sigue siendo defendible como cara visible.';
  }

  function inferListRoleDirective(context) {
    const listBand = formatBand(context?.listMin || context?.proposedMin, context?.listMax || context?.proposedMax);
    const publishedBand = formatBand(context?.publishedMin || context?.currentMin, context?.publishedMax || context?.currentMax);
    if (publishedBand !== 'sin numero visible') {
      return 'Lista ' + listBand + ' es la cara publica. Si hoy afuera vive ' + publishedBand + ', solo la movés cuando conviene exponer el cambio.';
    }
    return 'Lista ' + listBand + ' es la cara publica recomendada: referencia visible, defendible y apta para mostrar afuera.';
  }

  function inferExecutiveRoleDirective(context) {
    const executiveBand = formatBand(context?.executiveMin || context?.proposedMin, context?.executiveMax || context?.proposedMax);
    return 'Ejecutivo ' + executiveBand + ' es el numero operativo: sirve para negociar, cerrar y jugar la estrategia sin volver todo precio publico.';
  }

  function inferMaxRoleDirective(context) {
    const maxBand = formatBand(context?.maxMin, context?.maxMax);
    return 'Maximo ' + maxBand + ' es el techo de autonomia. No se publica automatico y se usa solo como limite o excepcion.';
  }

  function inferRoleSummary() {
    return 'Lista publica · Ejecutivo opera · Maximo techa';
  }

  function inferPublicationRule(context, strategy, materialRole) {
    const hasSpread = Number(context?.branchCount || 0) > 1;
    if (strategy?.id === 'volumen_locomotora') {
      return materialRole === 'Locomotora'
        ? 'Separá locomotora publicada de vagones internos: no todo lo que mueve negocio va a pizarra.'
        : 'Si es acompanante, la regla es simple: operar si ayuda, publicar solo si suma claridad y no erosiona referencia.';
    }
    if (strategy?.id === 'captura_servicio') {
      return 'La regla manda que servicio viaje en la explicacion y no quede escondido como descuento permanente.';
    }
    if (strategy?.id === 'apertura_proyecto') {
      return 'La regla es entrada controlada: negociar adentro, publicar solo cuando el caso deje de ser piloto.';
    }
    if (strategy?.id === 'defensa_sucursal') {
      return hasSpread
        ? 'La regla es asimetria controlada: una sucursal se puede defender sin contaminar a toda la red.'
        : 'La regla es apoyo local: sostener la sucursal sin convertirlo en politica general.';
    }
    if (strategy?.id === 'tactica_temporal') {
      return 'La regla es vigencia visible: si el precio sale afuera, debe salir con reloj y condicion de salida.';
    }
    return 'La regla es no igualar automaticamente operativo y publicado; primero se valida si conviene mostrarlo afuera.';
  }

  function buildGuide(context, strategy) {
    const active = strategy || getActive();
    const resolvedContext = cloneContext(context) || getContext();
    const materialRole = inferMaterialRole(resolvedContext, active);
    return {
      active,
      context: resolvedContext,
      materialRole,
      appliedSummary: resolvedContext?.materialName
        ? active.title + ' aplicado sobre ' + resolvedContext.materialName
        : active.title + ' sin material foco explicito',
      publicationDecision: inferPublicationDecision(resolvedContext, active, materialRole),
      branchDirective: inferBranchDirective(resolvedContext, active),
      validityDecision: inferWindow(resolvedContext, active),
      exitDirective: active.exitCondition || 'Sin condicion de salida visible.',
      executiveSummary: inferExecutiveSummary(resolvedContext, active, materialRole),
      exampleScenario: inferExample(resolvedContext, active, materialRole),
      timeSuggestion: inferTimeSuggestion(resolvedContext, active),
      roleSummary: inferRoleSummary(),
      listRoleDirective: inferListRoleDirective(resolvedContext, active),
      executiveRoleDirective: inferExecutiveRoleDirective(resolvedContext, active, materialRole),
      maxRoleDirective: inferMaxRoleDirective(resolvedContext, active, materialRole),
      operatingDirective: inferOperatingDirective(resolvedContext, active, materialRole),
      publicDirective: inferPublicDirective(resolvedContext, active, materialRole),
      publicationRule: inferPublicationRule(resolvedContext, active, materialRole),
    };
  }

  function buildSnapshot(context) {
    return buildGuide(context, getActive());
  }

  window.DIEGO_STRATEGY = {
    getPresets: function () { return PRESETS.map(clonePreset); },
    getActive,
    setActive: saveActive,
    subscribe,
    setContext,
    getContext,
    getGuide: buildGuide,
    getSnapshot: buildSnapshot,
    getPromptPack: function () {
      const active = getActive();
      return active && Array.isArray(active.prompts) ? [...active.prompts] : [];
    },
  };
})();
