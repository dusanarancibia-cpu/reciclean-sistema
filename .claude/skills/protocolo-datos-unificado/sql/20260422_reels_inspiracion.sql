-- ================================================================
-- MIGRACION: Biblioteca de reels / inspiracion externa
-- Fecha: 2026-04-22
-- Autor: Dusan (via Claude Code, skill protocolo-datos-unificado)
-- Ejecutar en: https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
-- Proposito: Biblioteca de reels / videos / posts externos que nos inspiran
-- o ensenan algo aplicable al negocio. Cada fila tiene columnas boolean
-- por cada LUGAR del sistema donde podria aplicarse + FK arrays a tareas
-- y objetivos concretos.
-- ================================================================

CREATE TABLE IF NOT EXISTS reels_inspiracion (
  id BIGSERIAL PRIMARY KEY,

  -- Identificacion (2 palabras para escanear rapido)
  nombre_tema TEXT NOT NULL,              -- Max 2 palabras, ej: 'onboarding empatico', 'precio comparado'

  -- Origen
  url TEXT,
  plataforma TEXT CHECK (plataforma IN ('instagram','tiktok','youtube','x','linkedin','whatsapp','otro')),
  autor_handle TEXT,                      -- '@usuario'
  autor_nombre TEXT,
  duracion_seg INT,
  fecha_publicacion DATE,

  -- Contenido
  transcripcion TEXT,                     -- Texto completo del audio/video
  resumen TEXT,                           -- 1-2 oraciones
  idea_central TEXT,                      -- Que se puede aplicar a nosotros

  -- Estado de incorporacion
  incorporada TEXT CHECK (incorporada IN (
    'pendiente_evaluar','evaluando','adoptada','parcial','descartada'
  )) DEFAULT 'pendiente_evaluar',
  como_se_incorporo TEXT,                 -- Descripcion de la implementacion
  incorporada_fecha DATE,

  -- LUGARES del sistema donde podria aplicarse (boolean por cada uno)
  aplica_panel_admin        BOOLEAN DEFAULT false,
  aplica_asistente          BOOLEAN DEFAULT false,
  aplica_diego_alonso       BOOLEAN DEFAULT false,
  aplica_widgets_publicos   BOOLEAN DEFAULT false,
  aplica_sitio_reciclean    BOOLEAN DEFAULT false,
  aplica_sitio_farex        BOOLEAN DEFAULT false,
  aplica_rrss_automaticas   BOOLEAN DEFAULT false,
  aplica_chatbot_whatsapp   BOOLEAN DEFAULT false,
  aplica_cotizaciones       BOOLEAN DEFAULT false,
  aplica_onboarding_equipo  BOOLEAN DEFAULT false,
  aplica_auditoria          BOOLEAN DEFAULT false,
  aplica_comunicacion_interna BOOLEAN DEFAULT false,
  aplica_presentacion_externa BOOLEAN DEFAULT false,
  aplica_fichas_gmb         BOOLEAN DEFAULT false,

  -- Vinculos a taxonomia del proyecto
  tarea_ids     BIGINT[],                 -- FK a tareas.id relevantes
  objetivo_ids  BIGINT[],                 -- FK a objetivos.id
  area_ids      BIGINT[],                 -- FK a areas.id
  empresa_ids   BIGINT[],                 -- FK a empresas.id

  -- Extras utiles
  tono TEXT,                              -- 'educativo','humoristico','emotivo','tecnico','ventas'
  formato TEXT,                           -- 'tutorial','testimonio','comparativa','storytelling','ugc'
  duplicable BOOLEAN DEFAULT false,       -- Se puede replicar con Canva+Buffer?
  costo_estimado_replica TEXT,            -- 'bajo','medio','alto'
  prioridad_implementacion TEXT CHECK (prioridad_implementacion IN ('critica','alta','media','baja')) DEFAULT 'media',

  -- Metadatos
  clasificacion_id BIGINT REFERENCES clasificacion_informacion(id),
  cargado_por TEXT,                       -- 'dusan','andrea','pablo'
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reels_incorporada ON reels_inspiracion(incorporada);
CREATE INDEX IF NOT EXISTS idx_reels_prioridad ON reels_inspiracion(prioridad_implementacion);
CREATE INDEX IF NOT EXISTS idx_reels_plataforma ON reels_inspiracion(plataforma);
CREATE INDEX IF NOT EXISTS idx_reels_nombre ON reels_inspiracion(nombre_tema);
ALTER TABLE reels_inspiracion ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Registrar la tabla en el inventario de conocimiento
-- ----------------------------------------------------------------
INSERT INTO conocimiento_documentos
  (origen_tipo, origen_path, titulo, resumen, categoria_tematica, clasificacion_id, fuente_carga, fecha_carga, visible_para_diego, indexado_rag, rol_aplicable, notas)
VALUES
  ('tabla', 'tabla:reels_inspiracion',
   'Biblioteca de reels / inspiracion externa',
   'Reels, videos, posts externos que nos ensenan algo aplicable. Con transcripcion, lugar donde aplica, y estado de incorporacion.',
   'rrss',
   (SELECT id FROM clasificacion_informacion WHERE codigo='operativo'),
   'dusan', CURRENT_DATE, false, false,
   ARRAY['comercial','direccion','tech'],
   'Consumo interno del equipo. NO indexar en RAG de Diego (no son procesos oficiales).');

-- ----------------------------------------------------------------
-- Vistas utiles
-- ----------------------------------------------------------------

-- Reels pendientes de evaluar ordenados por prioridad
CREATE OR REPLACE VIEW v_reels_por_evaluar AS
SELECT
  id,
  nombre_tema,
  plataforma,
  autor_handle,
  resumen,
  idea_central,
  incorporada,
  prioridad_implementacion,
  fecha_publicacion,
  url
FROM reels_inspiracion
WHERE incorporada IN ('pendiente_evaluar','evaluando')
ORDER BY
  CASE prioridad_implementacion
    WHEN 'critica' THEN 1
    WHEN 'alta'    THEN 2
    WHEN 'media'   THEN 3
    WHEN 'baja'    THEN 4
  END,
  created_at DESC;

-- Reels ya adoptados con su impacto
CREATE OR REPLACE VIEW v_reels_adoptados AS
SELECT
  nombre_tema,
  idea_central,
  como_se_incorporo,
  incorporada_fecha,
  cardinality(tarea_ids)    AS n_tareas,
  cardinality(objetivo_ids) AS n_objetivos,
  url
FROM reels_inspiracion
WHERE incorporada IN ('adoptada','parcial')
ORDER BY incorporada_fecha DESC;

-- Reels por lugar del sistema (util para planear que implementar donde)
CREATE OR REPLACE VIEW v_reels_por_lugar AS
SELECT
  'panel_admin' AS lugar, COUNT(*) AS total,
  COUNT(*) FILTER (WHERE incorporada='adoptada') AS adoptados
FROM reels_inspiracion WHERE aplica_panel_admin
UNION ALL SELECT 'asistente', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_asistente
UNION ALL SELECT 'diego_alonso', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_diego_alonso
UNION ALL SELECT 'widgets', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_widgets_publicos
UNION ALL SELECT 'rrss', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_rrss_automaticas
UNION ALL SELECT 'chatbot_wa', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_chatbot_whatsapp
UNION ALL SELECT 'cotizaciones', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_cotizaciones
UNION ALL SELECT 'onboarding', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_onboarding_equipo
UNION ALL SELECT 'auditoria', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_auditoria
UNION ALL SELECT 'comunicacion_interna', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_comunicacion_interna
UNION ALL SELECT 'presentacion_externa', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_presentacion_externa
UNION ALL SELECT 'fichas_gmb', COUNT(*), COUNT(*) FILTER (WHERE incorporada='adoptada') FROM reels_inspiracion WHERE aplica_fichas_gmb
ORDER BY total DESC;

-- ----------------------------------------------------------------
-- Ejemplo de INSERT (comentado — plantilla para cuando cargues reels reales)
-- ----------------------------------------------------------------
-- INSERT INTO reels_inspiracion
--   (nombre_tema, url, plataforma, autor_handle, duracion_seg,
--    transcripcion, resumen, idea_central,
--    incorporada,
--    aplica_diego_alonso, aplica_onboarding_equipo,
--    tono, formato, duplicable, prioridad_implementacion,
--    cargado_por, notas)
-- VALUES
--   ('onboarding empatico',
--    'https://instagram.com/reel/XXX',
--    'instagram', '@startuphr', 45,
--    'Cuando alguien nuevo entra al equipo le decimos exactamente que NO sabemos...',
--    'Bot nuevo admite lo que no sabe en vez de fingir. El equipo lo ensena.',
--    'Aplicar a Diego Alonso v4.2 Modo Entrevista: decir "no manejo [tema] todavia" abiertamente.',
--    'parcial',
--    true, true,
--    'educativo', 'storytelling', false, 'alta',
--    'dusan',
--    'Muy alineado con spec diego-v4.2. Idea ya en implementacion.');

-- ----------------------------------------------------------------
-- Validacion
-- ----------------------------------------------------------------
SELECT 'reels_inspiracion' AS tabla, COUNT(*) FROM reels_inspiracion;
SELECT * FROM v_reels_por_lugar;
