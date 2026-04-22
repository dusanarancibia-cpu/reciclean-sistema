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
-- Validacion
-- ----------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'objetivos','kpis','kpi_mediciones','sesiones_trabajo','preguntas_abiertas'
  )
ORDER BY table_name;
-- Resultado esperado: 5 filas.
