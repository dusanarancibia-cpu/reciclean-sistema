-- ================================================================
-- MIGRACION: Tablas adicionales del protocolo unificado
-- Fecha: 2026-04-22
-- Origen: esquema-dusan/ — 5 tablas que no duplican las de la skill base.
-- Destino esperado: fusionar con
--   .claude/skills/protocolo-datos-unificado/sql/20260422_tablas_base_protocolo.sql
-- Ejecutar en: https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
--
-- Pre-requisito: correr ANTES el SQL base de la skill (7 tablas), porque
-- `preguntas_abiertas.decision_codigo` referencia `decisiones_lock.codigo`
-- y `objetivos` puede linkear `tareas.id`.
--
-- Impacto: crea 5 tablas nuevas. No toca tablas existentes.
-- Reversible: DROP TABLE <tabla>; (sin CASCADE salvo que ya haya FKs pobladas).
--
-- Convenciones de la skill respetadas:
--   - snake_case plural
--   - sin prefijo `dusan_`
--   - CHECK en columnas de estado
--   - timestamp como TIMESTAMPTZ
--   - RLS enabled
--   - indices por columnas de filtro frecuente
-- ================================================================

-- ----------------------------------------------------------------
-- 8. objetivos  (reemplaza O1-O12 de esquema-dusan/03-objetivos-y-vision.md)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objetivos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,                                     -- 'O1', 'O2', ...
  titulo TEXT NOT NULL,
  descripcion TEXT,
  horizonte TEXT CHECK (horizonte IN ('corto','medio','largo')),   -- 30d / 3-6m / 6-12m
  fase_proyecto INT CHECK (fase_proyecto BETWEEN 1 AND 4),
  deadline DATE,
  estado TEXT CHECK (estado IN ('pendiente','en_curso','completado','bloqueado','descartado')) DEFAULT 'pendiente',
  tareas_vinculadas BIGINT[],                                      -- FK a tareas.id
  bloqueador TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_objetivos_estado ON objetivos(estado);
CREATE INDEX IF NOT EXISTS idx_objetivos_horizonte ON objetivos(horizonte);
CREATE INDEX IF NOT EXISTS idx_objetivos_fase ON objetivos(fase_proyecto);
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 9. kpis  (catalogo del tablero personal, reemplaza seccion tabla de esquema-dusan/07-kpis-y-metricas.md)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpis (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fuente TEXT,                                                     -- 'diego_curador_wa' | 'supabase_query' | 'manual' | 'dashboard_fase2'
  query_sql TEXT,                                                  -- si la metrica se calcula por query
  umbral_verde TEXT,                                               -- string flexible: '0', '< 5s', '> 80%'
  umbral_amarillo TEXT,
  umbral_rojo TEXT,
  frecuencia TEXT CHECK (frecuencia IN ('tiempo_real','diaria','semanal','mensual')) DEFAULT 'diaria',
  fase_proyecto INT CHECK (fase_proyecto BETWEEN 1 AND 4),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kpis_activo ON kpis(activo);
CREATE INDEX IF NOT EXISTS idx_kpis_frecuencia ON kpis(frecuencia);
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 10. kpi_mediciones  (historial diario de cada KPI)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_mediciones (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  valor TEXT,                                                      -- flexibilidad
  valor_numerico NUMERIC,                                          -- opcional si es numero
  estado_semaforo TEXT CHECK (estado_semaforo IN ('verde','amarillo','rojo','gris')) DEFAULT 'gris',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kpi_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_kpi_medic_kpi_fecha ON kpi_mediciones(kpi_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_medic_semaforo ON kpi_mediciones(estado_semaforo);
ALTER TABLE kpi_mediciones ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 11. sesiones_trabajo  (bloques de foco, llamadas, implementaciones — reemplaza seccion rutinas)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones_trabajo (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('foco','implementacion_tecnica','llamada_cliente','planificacion','cierre_dia','mantenimiento')) DEFAULT 'foco',
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ,
  usuario TEXT DEFAULT 'Dusan',                                    -- escalable a Pablo, Andrea, etc.
  objetivo TEXT,
  resultado TEXT,
  tareas_vinculadas BIGINT[],                                      -- FK tareas.id
  caso_id BIGINT REFERENCES casos_asistente(id) ON DELETE SET NULL,
  aviso_grupo_enviado BOOLEAN DEFAULT false,                       -- respeta regla P.03 (aviso previo)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_inicio ON sesiones_trabajo(inicio DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_trabajo(usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_tipo ON sesiones_trabajo(tipo);
ALTER TABLE sesiones_trabajo ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 12. preguntas_abiertas  (decisiones pendientes aun sin LOCK)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_abiertas (
  id BIGSERIAL PRIMARY KEY,
  pregunta TEXT NOT NULL,
  contexto TEXT,
  bloqueada_por TEXT CHECK (bloqueada_por IN ('informacion_faltante','espera_externo','decision_superior','tiempo','sin_bloqueo')) DEFAULT 'sin_bloqueo',
  urgencia TEXT CHECK (urgencia IN ('critica','alta','media','baja')) DEFAULT 'media',
  deadline_decision DATE,
  resuelta BOOLEAN DEFAULT false,
  resolucion TEXT,                                                 -- la decision final
  decision_codigo TEXT,                                            -- FK soft a decisiones_lock.codigo si se consolida
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_preguntas_resuelta ON preguntas_abiertas(resuelta);
CREATE INDEX IF NOT EXISTS idx_preguntas_urgencia ON preguntas_abiertas(urgencia);
ALTER TABLE preguntas_abiertas ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 13. documentos  (catalogo de .md / .txt narrativos del repo)
-- ----------------------------------------------------------------
-- Proposito: dar visibilidad de todo archivo narrativo que NO es codigo
-- y que complementa alguna tabla. Cada fila apunta a un archivo + tabla
-- espejo si aplica, para navegacion bidireccional.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id BIGSERIAL PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,                                       -- 'esquema-dusan/01-identidad.md'
  titulo TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('esquema','spec','guia','caso','mensaje','pendientes','readme','brief','skill','historico')) DEFAULT 'esquema',
  proposito TEXT,                                                  -- 1 frase de para que sirve
  es_narrativa BOOLEAN DEFAULT true,                               -- true = contexto, no datos
  tabla_espejo TEXT,                                               -- nombre de tabla que contiene filas relacionadas (ej. 'objetivos')
  autor TEXT DEFAULT 'Dusan',
  version TEXT,                                                    -- 'v1.1'
  ultima_revision DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_activo ON documentos(activo);
CREATE INDEX IF NOT EXISTS idx_documentos_tabla_espejo ON documentos(tabla_espejo);
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Seed inicial — registra los .md existentes de esquema-dusan/
-- (opcional, ejecutar tras crear las tablas para poblar el catalogo)
-- ----------------------------------------------------------------
/*
INSERT INTO documentos (path, titulo, categoria, proposito, es_narrativa, tabla_espejo, version, ultima_revision) VALUES
  ('esquema-dusan/README.md',                        'Esquema Dusan — entrada',             'esquema', 'Brief maestro + mapa de carpeta',                           true,  NULL,                 'v1.1', '2026-04-22'),
  ('esquema-dusan/ALINEACION-SKILL.md',              'Alineacion con skill datos',          'skill',   'Diagnostico de duplicados y plan de migracion',             true,  NULL,                 'v1.0', '2026-04-22'),
  ('esquema-dusan/TABLAS-SKILL-RESUMEN.md',          'Tablas skill — vista consolidada',    'skill',   'Las 12 tablas del protocolo + FKs',                         true,  NULL,                 'v1.0', '2026-04-22'),
  ('esquema-dusan/01-identidad.md',                  'Identidad: quien es Dusan',           'esquema', 'Persona, valores, estilo, frase ancla',                     true,  NULL,                 'v1.0', '2026-04-22'),
  ('esquema-dusan/02-rol-y-responsabilidades.md',    'Rol y responsabilidades',             'esquema', 'Que hace, que delega, por capa',                            true,  NULL,                 'v1.0', '2026-04-22'),
  ('esquema-dusan/03-objetivos-y-vision.md',         'Objetivos y vision',                  'esquema', 'O1-O12 con horizontes',                                      true,  'objetivos',          'v1.0', '2026-04-22'),
  ('esquema-dusan/04-rutinas.md',                    'Rutinas',                             'esquema', 'Patrones diarios/semanales/mensuales/trimestrales',         true,  'sesiones_trabajo',   'v1.0', '2026-04-22'),
  ('esquema-dusan/05-condiciones-y-reglas.md',       'Condiciones y reglas LOCK',           'esquema', 'Reglas R.PUB/R.TEC/R.EMP/R.DIE/R.IA',                       true,  'decisiones_lock',    'v1.0', '2026-04-22'),
  ('esquema-dusan/06-stakeholders.md',               'Stakeholders',                        'esquema', 'Circulo interno, equipo, clientes, partners',               true,  'contactos',          'v1.0', '2026-04-22'),
  ('esquema-dusan/07-kpis-y-metricas.md',            'KPIs y metricas',                     'esquema', 'Tablero personal con umbrales',                             true,  'kpis',               'v1.0', '2026-04-22'),
  ('esquema-dusan/08-decisiones-lock.md',            'Decisiones LOCK',                     'esquema', 'Historial T/E/P + codigos C3..D4.a',                        true,  'decisiones_lock',    'v1.0', '2026-04-22'),
  ('esquema-dusan/09-comprension-y-logros.md',       'Comprension y logros (A/B/C/D + %)',  'esquema', 'Tablero auditable del estado de la relacion Dusan<->Claude', true, NULL,                 'v1.0', '2026-04-22'),
  ('CLAUDE.md',                                      'Instrucciones proyecto',              'readme',  'Contexto del proyecto para Claude',                          true,  NULL,                 NULL,   '2026-04-22'),
  ('PENDIENTES.md',                                  'Pendientes (pre-migracion)',          'pendientes','Historico, post-migracion queda como narrativa',           true,  'tareas',             NULL,   '2026-04-20'),
  ('CONTINUAR_SESION_DIEGO.txt',                     'Continuidad sesion movil',            'brief',   'Prompt para retomar en otra IA',                             true,  NULL,                 NULL,   '2026-04-22'),
  ('docs/diego-v4.2-spec.md',                        'Spec Diego v4.2 Modo Entrevista',     'spec',    'Diseno entregado a Pablo',                                   true,  'decisiones_lock',    'v4.2', '2026-04-20'),
  ('docs/diego-v4.2-implementacion-21abr.md',        'Guia implementacion 21-abr 08-10h',   'guia',    'Paso a paso para Dusan ejecute',                             true,  NULL,                 'v1.1', '2026-04-21'),
  ('casos-diego/20260420-ingrid.md',                 'Caso Ingrid — 2h 35msgs sin resolver','caso',    'Evidencia P2 CRITICO',                                       true,  'casos_asistente',    NULL,   '2026-04-20'),
  ('casos-diego/20260420-jair.md',                   'Caso Jair — mentira FC 9026',         'caso',    'Evidencia P2',                                               true,  'casos_asistente',    NULL,   '2026-04-20'),
  ('casos-diego/20260420-nicolas.md',                'Caso Nicolas — contradiccion cobre',  'caso',    'Evidencia P2',                                               true,  'casos_asistente',    NULL,   '2026-04-20'),
  ('mensajes-equipo/difusion-coordinar-equipo.md',   'Difusion coordinar-equipo',           'mensaje', '8 variantes personalizadas',                                 true,  'plantillas_mensajes',NULL,   '2026-04-20');
*/

-- ----------------------------------------------------------------
-- 14. estilo_respuesta_claude  (como Dusan quiere que Claude responda)
-- ----------------------------------------------------------------
-- Proposito: codificar las reglas de formato/tono/longitud de respuesta
-- para que cualquier agente (Diego, Curador, Claude Code, Claude.ai)
-- las lea antes de responder. Cubre todas las plataformas Claude.
-- Narrativa asociada: esquema-dusan/11-estilo-respuesta-claude.md
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estilo_respuesta_claude (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,                                     -- 'TIPO.STATUS', 'TIPO.DECISION', 'TRIGGER.MAS_CORTO', etc.
  categoria TEXT CHECK (categoria IN ('principio','tipo_pedido','plataforma','trigger','antipatron','patron','checklist')) NOT NULL,
  nombre TEXT NOT NULL,                                            -- nombre legible
  descripcion TEXT,
  plataforma TEXT CHECK (plataforma IN ('todas','claude_code_cli','claude_code_web','claude_ai','claude_api','movil','ide_vscode','ide_jetbrains')) DEFAULT 'todas',
  formato_default TEXT,                                            -- 'prosa' | 'tabla' | 'pasos_numerados' | 'codigo' | 'solo_texto' | 'opciones_abc'
  longitud_default TEXT CHECK (longitud_default IN ('cortisima','corta','media','larga','segun_pedido')) DEFAULT 'corta',
  incluye_proximo_paso BOOLEAN DEFAULT true,
  incluye_rollback BOOLEAN DEFAULT false,
  ejemplo_trigger TEXT,                                            -- ej. "status", "que hay pendiente"
  ejemplo_salida TEXT,                                             -- texto esperado
  activo BOOLEAN DEFAULT true,
  prioridad INT DEFAULT 100,                                       -- menor = mas prioridad al evaluar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_estilo_categoria ON estilo_respuesta_claude(categoria);
CREATE INDEX IF NOT EXISTS idx_estilo_plataforma ON estilo_respuesta_claude(plataforma);
CREATE INDEX IF NOT EXISTS idx_estilo_activo ON estilo_respuesta_claude(activo);
ALTER TABLE estilo_respuesta_claude ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Seed inicial — carga las reglas documentadas en 11-estilo-respuesta-claude.md
-- (opcional, descomentar para poblar al crear la tabla)
-- ----------------------------------------------------------------
/*
-- Principios globales
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, descripcion, prioridad) VALUES
  ('PRIN.01', 'principio', 'Espanol siempre',                 'Responder en ES aunque el sistema este en EN',                      1),
  ('PRIN.02', 'principio', 'Directo > cortes',                'Sin "excelente pregunta" ni "claro que si"',                        2),
  ('PRIN.03', 'principio', 'Accionable > explicativo',        'Ejecuta X, luego Y',                                                 3),
  ('PRIN.04', 'principio', 'Cortas primero, detalle si pide', 'Default 3-8 lineas',                                                 4),
  ('PRIN.05', 'principio', 'Proximo paso claro',              'Cerrar con que hago / que haces tu',                                5),
  ('PRIN.06', 'principio', 'Backup + rollback en tecnico',    'Cambios riesgosos vienen con plan de reversion',                    6),
  ('PRIN.07', 'principio', 'Sin emojis decorativos',          'Solo check/cross/warn semanticos',                                  7),
  ('PRIN.08', 'principio', 'Sin prologos',                    'No anunciar si la accion no tarda',                                 8),
  ('PRIN.09', 'principio', 'Sin resumen si es corto',         'Resumen final solo si > 30 lineas',                                 9),
  ('PRIN.10', 'principio', 'Codigo solo cuando se necesita',  'Si con una frase basta, no pegar bloque',                          10);

-- Tipos de pedido
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, formato_default, longitud_default, incluye_proximo_paso, incluye_rollback, ejemplo_trigger) VALUES
  ('TIPO.CONCEPTUAL',   'tipo_pedido', 'Pregunta conceptual',          'prosa',              'cortisima', false, false, 'que es RLS?'),
  ('TIPO.STATUS',       'tipo_pedido', 'Status / consulta de estado',  'tabla',              'corta',     true,  false, 'status / que hay pendiente'),
  ('TIPO.TAREA_TECNICA','tipo_pedido', 'Tarea tecnica (ejecutar)',     'pasos_numerados',    'media',     true,  true,  'modifica X / agrega feature Y'),
  ('TIPO.DECISION',     'tipo_pedido', 'Decision / planning',          'opciones_abc',       'media',     true,  true,  'como hacemos X / que opinas'),
  ('TIPO.SPEC',         'tipo_pedido', 'Diseno de sistema / spec',     'secciones_tablas',   'larga',     true,  true,  'disena spec para Z'),
  ('TIPO.DEBUG',        'tipo_pedido', 'Debug / diagnostico',          'hipotesis_fix',      'media',     true,  true,  'algo falla / por que no anda'),
  ('TIPO.REDACCION',    'tipo_pedido', 'Redactar mensaje / contenido', 'solo_texto',         'segun_pedido', false, false, 'redacta WA para X'),
  ('TIPO.REVISION',     'tipo_pedido', 'Revision / auditoria',         'tabla_hallazgos',    'media',     true,  false, 'revisa X / audita Y'),
  ('TIPO.CODIGO',       'tipo_pedido', 'Codigo (nuevo / fix)',         'codigo',             'segun_pedido', true, true,  'implementa / arregla'),
  ('TIPO.CONVERSACIONAL','tipo_pedido','Conversacional / feedback',    'prosa',              'cortisima', false, false, 'gracias / ok');

-- Plataformas (especializaciones)
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, plataforma, descripcion) VALUES
  ('PLAT.CLI',         'plataforma', 'Claude Code CLI/Web',  'claude_code_cli', 'Usar TodoWrite en 3+ pasos, tool calls paralelas, checkpoint antes de prod'),
  ('PLAT.AI',          'plataforma', 'Claude.ai web',        'claude_ai',       'Sin tools, ofrecer artifacts para codigo/docs/planes reusables'),
  ('PLAT.API',         'plataforma', 'Claude API custom',    'claude_api',      'Respetar system prompt, usar caching si contexto estable, structured output si aplica'),
  ('PLAT.MOVIL',       'plataforma', 'Movil',                'movil',           'Respuestas mas cortas, tablas <= 3 columnas, codigo en bloques chicos'),
  ('PLAT.IDE',         'plataforma', 'IDE VS Code/JetBrains','ide_vscode',      'Edits en linea, explicaciones muy cortas');

-- Triggers (el usuario pide cambio de formato)
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, ejemplo_trigger, descripcion) VALUES
  ('TRIG.CORTO',        'trigger', 'Mas corto / resume',      'mas corto',          'Cortisima, solo lo esencial'),
  ('TRIG.DETALLE',      'trigger', 'Con detalle',             'explicame bien',     'Larga con secciones'),
  ('TRIG.CODIGO_SI',    'trigger', 'Mostrar codigo',          'muestrame el codigo','Mostrar codigo completo'),
  ('TRIG.CODIGO_NO',    'trigger', 'No codigo',               'no muestres codigo', 'Prosa / pasos sin bloques de codigo'),
  ('TRIG.OPCIONES',     'trigger', 'Dame opciones',           'dame opciones',      'A/B/C + slot Z obligatorio'),
  ('TRIG.DECIDE',       'trigger', 'Decide tu',               'decide tu',          'Recomendacion directa + razon corta'),
  ('TRIG.WA',           'trigger', 'Pasame un WA',            'pasame un WA',       'Solo texto listo para copiar'),
  ('TRIG.SIN_RODEOS',   'trigger', 'Sin rodeos',              'sin rodeos',         'Elimina preambulo, empezar por el bullet');

-- Antipatrones
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, descripcion) VALUES
  ('ANTI.01', 'antipatron', 'Empezar con excelente pregunta',      'Prohibido cualquier variante'),
  ('ANTI.02', 'antipatron', 'Mentir sobre capacidades',            'Si no puedes hacerlo, decirlo (lecciones Ingrid/Jair/Nicolas)'),
  ('ANTI.03', 'antipatron', 'Inventar informacion',                'No hay en BD/repo/contexto = decir explicitamente'),
  ('ANTI.04', 'antipatron', 'Preguntas multiples sin rumbo',       'Maximo 2 preguntas de clarificacion'),
  ('ANTI.05', 'antipatron', 'Respuesta de 500 lineas a hola',      'Calibrar con el pedido'),
  ('ANTI.06', 'antipatron', 'Codigo sin contexto',                 '1 linea de que hace + codigo'),
  ('ANTI.07', 'antipatron', 'Romper reglas LOCK',                  'Palabras prohibidas, Puerto Montt, stack'),
  ('ANTI.08', 'antipatron', 'Decidir irreversibles por Dusan',     'Siempre checkpoint antes'),
  ('ANTI.09', 'antipatron', 'Confirmar algo que no paso',          'Si fallo, decirlo claro'),
  ('ANTI.10', 'antipatron', 'Emojis decorativos',                  'Permitidos solo check/cross/warn semanticos');

-- Patrones recomendados
INSERT INTO estilo_respuesta_claude (codigo, categoria, nombre, ejemplo_salida) VALUES
  ('PATR.STATUS_CORTO',   'patron', 'Status corto',                  E'Estado: X en curso.\nBloqueador: falta Y.\nProximo: cuando tengas Y aplico Z.'),
  ('PATR.DECISION_ABC',   'patron', 'Decision A/B/C',                E'Dos opciones:\n\nA) ...\nB) ...\n\nRecomiendo A. Confirmas?'),
  ('PATR.EJECUCION',      'patron', 'Ejecucion tecnica',             E'Voy a:\n1. Backup.\n2. Patch.\n3. Smoke test.\n\nRollback: reactivar backup.\n\nOK para empezar?'),
  ('PATR.ENTREGA_TEXTO',  'patron', 'Entrega de texto para copiar',  E'> texto para pegar en WA\n\nEnviar a: +56 ...');
*/

-- ----------------------------------------------------------------
-- Validacion
-- ----------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'objetivos','kpis','kpi_mediciones','sesiones_trabajo','preguntas_abiertas','documentos','estilo_respuesta_claude'
  )
ORDER BY table_name;
-- Resultado esperado: 7 filas.
