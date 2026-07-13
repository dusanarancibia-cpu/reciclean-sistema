;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  const ROADMAP = [
    {
      id: '01_dominio',
      title: 'Formalizar el dominio Precios',
      objective: 'Separar limites, responsabilidades y roadmap del dominio fuera de panel-rdo.html.',
      meaningNow: 'El equipo deja de crecer a ciegas dentro del HTML gigante.',
      example: 'Mesa, Bandeja, Publicados y politica pasan a conversar bajo un mismo contrato.',
      timeSuggested: '4 a 6 horas',
    },
    {
      id: '02_state',
      title: 'Extraer estado externo',
      objective: 'Sacar runtime, seleccion, refresh y foco a un store externo.',
      meaningNow: 'El panel deja de depender solo de variables internas del monolito.',
      example: 'La Mesa puede recordar init, refresh, foco y snapshot sin vivir encerrada en un IIFE.',
      timeSuggested: '6 a 10 horas',
    },
    {
      id: '03_read_model',
      title: 'Extraer read model',
      objective: 'Unificar la lectura de Mesa y su snapshot ejecutivo.',
      meaningNow: 'La Mesa deja de leer el DOM y los datos de forma dispersa.',
      example: 'Un mismo snapshot sirve para UI, auditoria y monitoreo.',
      timeSuggested: '6 a 10 horas',
    },
    {
      id: '04_render',
      title: 'Extraer render de Mesa',
      objective: 'Mover el render a modulos externos y dejar panel-rdo como host.',
      meaningNow: 'Cambiar la Mesa no arriesga el resto del panel.',
      example: 'Las tarjetas de estrategia y detalle se renderizan desde archivos propios.',
      timeSuggested: '8 a 14 horas',
    },
    {
      id: '05_commands',
      title: 'Commands autoritativos',
      objective: 'Llevar aprobar, rechazar, publicar y locks a backend autoritativo.',
      meaningNow: 'La decision deja de depender de updates sueltos desde browser.',
      example: 'Aprobar precio corre por un command con validacion, auditoria y resultado unico.',
      timeSuggested: '10 a 16 horas',
    },
    {
      id: '06_concurrency',
      title: 'Concurrencia real',
      objective: 'Agregar versionado, conflicto, lock y resolucion explicita.',
      meaningNow: 'Dos personas no pisan una decision sin saberlo.',
      example: 'Si otro usuario ya movio una propuesta, la Mesa lo declara y no oculta el choque.',
      timeSuggested: '8 a 14 horas',
    },
    {
      id: '07_policy',
      title: 'Politica unica Mesa-Diego',
      objective: 'Hacer que ambos lean la misma politica ejecutiva y operativa.',
      meaningNow: 'Se termina la duplicacion de criterio entre interfaces.',
      example: 'La regla de publicacion inteligente se decide una vez y se refleja en ambos.',
      timeSuggested: '6 a 10 horas',
    },
    {
      id: '08_observability',
      title: 'Observabilidad del dominio',
      objective: 'Medir eventos, errores, refresh y trazabilidad del flujo.',
      meaningNow: 'La operacion deja de ser caja negra.',
      example: 'Se ve cuando refresco, que snapshot quedo y si la lectura esta desfasada.',
      timeSuggested: '4 a 8 horas',
    },
    {
      id: '09_multitenant',
      title: 'Base multiempresa',
      objective: 'Preparar tenant, configuracion por empresa y aislamiento de reglas.',
      meaningNow: 'El sistema deja de estar casado solo con una operacion.',
      example: 'Otra empresa puede usar su politica sin mezclar datos ni decisiones.',
      timeSuggested: '12 a 20 horas',
    },
    {
      id: '10_shell',
      title: 'Panel shell liviano',
      objective: 'Dejar panel-rdo como carcasa y no como cerebro.',
      meaningNow: 'El crecimiento futuro cae en dominios, no en un unico HTML inmenso.',
      example: 'El panel queda como host, navegacion y ensamblador de modulos.',
      timeSuggested: '6 a 12 horas',
    }
  ];

  const statusByStep = {
    '01_dominio': 'completed',
    '02_state': 'in_progress',
    '03_read_model': 'in_progress',
    '04_render': 'completed',
    '05_commands': 'in_progress',
    '06_concurrency': 'completed',
    '07_policy': 'completed',
    '08_observability': 'completed',
    '09_multitenant': 'completed',
    '10_shell': 'completed',
  };

  function cloneStep(step) {
    return {
      id: step.id,
      title: step.title,
      objective: step.objective,
      meaningNow: step.meaningNow,
      example: step.example,
      timeSuggested: step.timeSuggested,
      status: statusByStep[step.id] || 'pending',
    };
  }

  function getRoadmap() {
    return ROADMAP.map(cloneStep);
  }

  function getStep(stepId) {
    const found = ROADMAP.find(function (step) { return step.id === stepId; });
    return found ? cloneStep(found) : null;
  }

  function setStepStatus(stepId, status) {
    if (!statusByStep[stepId]) return null;
    statusByStep[stepId] = status;
    return getStep(stepId);
  }

  function getSummary() {
    const roadmap = getRoadmap();
    const completed = roadmap.filter(function (step) { return step.status === 'completed'; }).length;
    const inProgress = roadmap.filter(function (step) { return step.status === 'in_progress'; }).length;
    return {
      version: 'v1-domain',
      totalSteps: roadmap.length,
      completed: completed,
      inProgress: inProgress,
      activeStep: roadmap.find(function (step) { return step.status === 'in_progress'; }) || roadmap[0],
    };
  }

  api.domain = {
    version: 'v1-domain',
    getRoadmap: getRoadmap,
    getStep: getStep,
    setStepStatus: setStepStatus,
    getSummary: getSummary,
  };
})();
