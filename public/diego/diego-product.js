(function () {
  const roleBase = {
    direccion: {
      emptyTitle: 'Diego puede operar como jefe de gabinete y copiloto ejecutivo.',
      emptySub: 'Toma ideas, compromisos, objetivos en riesgo, precio ejecutivo y excepciones, y los baja a casos, agenda o escalamiento.',
      prompts: [
        'Ordena mis compromisos de hoy y dime que merece foco real',
        'Resume que esta frenando los objetivos y a quien debo empujar',
        'Calcula precio ejecutivo y dime si este caso requiere escalamiento jerarquico',
        'Dame el panorama ejecutivo de sucursales, riesgos y pendientes'
      ]
    },
    comercial: {
      emptyTitle: 'Diego puede capturar reclamos comerciales y mover cierre real.',
      emptySub: 'Convierte reclamos, cotizaciones, cobros y negociaciones en oportunidad, responsable, siguiente paso y seguimiento.',
      prompts: [
        'Registra esta negociacion y bajala a oportunidad con responsable',
        'Propone precio ejecutivo defendible para este cliente',
        'Dime que clientes, cobros y compromisos debo mover hoy',
        'Resume reclamos comerciales abiertos y cual merece escalar'
      ]
    },
    operaciones: {
      emptyTitle: 'Diego puede ordenar el dia operativo y destrabar terreno.',
      emptySub: 'Recibe incidentes, servicio, panel, flota o trabas y los convierte en accion, seguimiento y escalamiento util.',
      prompts: [
        'Ordena las trabas operativas de hoy y dime que destrabar primero',
        'Transforma este incidente en caso con responsable y control',
        'Dime que esta caido, que esta atrasado y quien debe responder',
        'Resume que sucursal requiere ayuda ahora'
      ]
    },
    finanzas: {
      emptyTitle: 'Diego puede bajar cobros, pagos y riesgos a gestion real.',
      emptySub: 'Ayuda a distinguir reclamo, compromiso, bloqueo y prioridad financiera con dueno y fecha.',
      prompts: [
        'Resume cobros, pagos y riesgos abiertos con responsable',
        'Registra este reclamo de cobro y dime el siguiente paso correcto',
        'Dime que compromisos financieros estan vencidos o en riesgo',
        'Que debo empujar hoy para proteger caja y cierre'
      ]
    },
    cumplimiento: {
      emptyTitle: 'Diego puede ordenar documentos, permisos y evidencia requerida.',
      emptySub: 'Convierte faltantes documentales en trabajo priorizado, responsable, fecha y cierre visible.',
      prompts: [
        'Registra este faltante documental y bajalo a lista de trabajo',
        'Dime que permisos, firmas o evidencias estan en riesgo',
        'Resume que bloqueo documental requiere escalamiento',
        'Que debe hacer cada responsable documental hoy'
      ]
    },
    general: {
      emptyTitle: 'Diego puede recibir texto o voz y convertirlo en claridad operativa.',
      emptySub: 'Panel, precios, documentos, informacion, cobros, pagos, servicio o agenda: todo debe poder bajar a caso, tarea o escalamiento.',
      prompts: [
        'Convierte este reclamo en caso con responsable y siguiente paso',
        'Dime que tengo pendiente hoy y que merece foco primero',
        'Toma esta idea y bajala a oportunidad o tarea real',
        'Resume que cosas estan trabadas y a quien debo avisar'
      ]
    }
  };

  window.DIEGO_PRODUCT_MODEL = {
    roles: roleBase,
    roleExamples: [
      { label: 'CEO', prompt: 'Como CEO, ordena ideas, compromisos, agenda y objetivos en riesgo con foco del dia', hint: 'Jefe de gabinete y foco ejecutivo' },
      { label: 'Comercial', prompt: 'Como comercial, convierte este reclamo o conversacion en oportunidad con siguiente paso', hint: 'Clientes, precios y cierre' },
      { label: 'Operaciones', prompt: 'Como operaciones, ordena trabas, incidentes y sucursales en riesgo', hint: 'Terreno, servicio y destrabe' },
      { label: 'Finanzas', prompt: 'Como finanzas, resume cobros, pagos y compromisos abiertos por prioridad', hint: 'Caja, vencidos y control' },
      { label: 'Cumplimiento', prompt: 'Como cumplimiento, convierte faltantes documentales en trabajo priorizado', hint: 'Permisos, contratos y evidencia' },
      { label: 'Personal', prompt: 'Como apoyo personal, ordena agenda, medico, salud, deporte y recordatorios sensibles sin perder contexto', hint: 'Agenda y vida personal' }
    ],
    complaintIntake: [
      { label: 'Panel', prompt: 'Registrar reclamo del panel y decir si corresponde soporte, caso o escalamiento', hint: 'Errores, vistas, permisos o caidas' },
      { label: 'Precios', prompt: 'Registrar reclamo de precios y transformarlo en oportunidad o excepcion con responsable', hint: 'Precio, margen y publicacion' },
      { label: 'Documentos', prompt: 'Registrar reclamo documental y bajar lista de pendientes con evidencia', hint: 'Facturas, contratos, permisos' },
      { label: 'Informacion', prompt: 'Registrar reclamo por informacion faltante y decir que dato debe levantarse', hint: 'Datos ausentes o inconsistentes' },
      { label: 'Servicios', prompt: 'Registrar reclamo de servicio y convertirlo en plan de respuesta', hint: 'Calidad, atencion y postventa' },
      { label: 'Cobros', prompt: 'Registrar reclamo de cobro y decir que debe hacer finanzas y comercial', hint: 'Cobranza, vencidos y promesas' },
      { label: 'Pagos', prompt: 'Registrar pago trabado y ordenar responsable, evidencia y fecha', hint: 'Proveedores, aprobaciones y caja' },
      { label: 'Trabas', prompt: 'Registrar traba operativa y convertirla en caso gestionable', hint: 'Bloqueos internos y externos' },
      { label: 'Voz', prompt: 'Toma esta nota de voz y conviertela en caso, agenda o seguimiento', hint: 'Ideas, reuniones y audio terreno' }
    ],
    teamCoordination: {
      default: [
        'Dime que debe hacer cada persona hoy para empujar objetivos',
        'Resume pendientes, bloqueos y compromisos por responsable',
        'Que casos requieren seguimiento hoy y cual debe escalar',
        'Que logro intermedio conviene reconocer para mantener ritmo'
      ],
      direccion: [
        'Dime que debo mover yo y que debo delegar hoy',
        'Resume excepciones, compromisos y decisiones que no debo olvidar',
        'Que casos requieren mi escalamiento jerarquico hoy',
        'Ordena mi agenda segun impacto real y urgencia'
      ]
    },
    executivePricePrompts: {
      direccion: [
        'Calcula precio ejecutivo maximo defendible y dime si este caso debe escalar a Dusan',
        'Separa precio sugerido, techo de autonomia y techo que requiere jerarquia',
        'Dime si este caso de precio debe ir a Andrea, Mesa de Precios o Dusan'
      ],
      comercial: [
        'Propone precio ejecutivo defendible para este cliente y explica el riesgo',
        'Dime hasta donde puedo negociar sin romper margen ni politica',
        'Debo crear propuesta normal o escalar esta discusion de precio'
      ],
      default: [
        'Dime si este caso de precio es lectura, propuesta, confirmacion o escalamiento',
        'Calcula precio ejecutivo sugerido y el siguiente paso correcto',
        'Explica si este caso cabe en autonomia o debe escalar'
      ]
    },
    sideCards: [
      {
        key: 'mayordomo',
        title: 'Mayordomo ejecutivo',
        items: [
          'Captura ideas, reclamos, compromisos y pendientes al vuelo',
          'Ordena foco del dia, agenda, casos y siguiente movimiento',
          'Empuja equipo, objetivos, precio ejecutivo y escalamiento'
        ],
        prompts: [
          'Ordena mis ideas y compromisos de hoy en foco, agenda y casos',
          'Dime que merece atencion CEO ahora y que puede delegarse',
          'Resume que esta frenando objetivos, equipo y sucursales'
        ]
      },
      {
        key: 'dominios',
        title: 'Dominios vivos',
        items: [
          'Empresa: reclamos, oportunidades, tareas y bloqueos',
          'Equipo: responsables, pendientes, celebracion y seguimiento',
          'Persona: agenda, salud, medico, deporte y compromisos'
        ],
        prompts: [
          'Ordena este caso entre empresa, equipo o agenda personal',
          'Dime si esto debe quedar como caso, tarea, recordatorio o escalamiento'
        ]
      },
      {
        key: 'voz',
        title: 'Captura por voz',
        items: [
          'Nivel 1: audio a texto',
          'Nivel 2: audio a caso, tarea u oportunidad',
          'Nivel 3: voz conversacional cuando la base sea estable'
        ],
        prompts: [
          'Toma esta nota de voz y bajala a resumen, caso y siguiente paso',
          'Convierte este audio de reunion en compromisos y responsables',
          'Resume este audio corto y dime que no debo olvidar'
        ]
      }
    ]
  };
})();
