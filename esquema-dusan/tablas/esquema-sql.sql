-- =====================================================
-- ESQUEMA DUSAN v1.0 — Tablas Supabase
-- Fecha: 2026-04-22
-- Autor: Dusan Arancibia
-- Proposito: Memoria externa de Dusan — identidad, contexto,
--            tareas, decisiones y tablero personal, consumible
--            por IAs que colaboren con el (Claude Code, Diego, etc.)
--
-- Espejo del patron de tablas Diego v4.2 (procesos_empresa,
-- sesiones_entrevista, etc.) pero aplicado a la persona Dusan.
--
-- NOTA: Este SQL NO se aplica automaticamente. Es un contrato
-- de esquema. Cuando Dusan decida materializarlo en Supabase,
-- ejecutar este archivo en SQL Editor del proyecto
-- `eknmtsrtfkzroxnovfqn` siguiendo el patron de la guia
-- `docs/diego-v4.2-implementacion-21abr.md`.
-- =====================================================

-- -------------------------------------------------------
-- Tabla 1: Contexto base de Dusan (quien es, que hace)
-- Equivale a `procesos_empresa` de Diego pero centrado en Dusan.
-- Se alimenta desde los .md del esquema-dusan/ (1 fila por archivo/tema).
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_contexto (
  id BIGSERIAL PRIMARY KEY,
  tema TEXT NOT NULL,                         -- ej. 'identidad', 'rol', 'rutinas'
  categoria TEXT NOT NULL,                    -- 'identidad' | 'rol' | 'objetivos' | 'rutinas' | 'reglas' | 'stakeholders' | 'kpis' | 'decisiones'
  contenido TEXT NOT NULL,                    -- texto markdown o plain del archivo
  fuente_archivo TEXT,                        -- ej. 'esquema-dusan/01-identidad.md'
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_contexto_categoria ON dusan_contexto(categoria);
CREATE INDEX IF NOT EXISTS idx_dusan_contexto_activo ON dusan_contexto(activo);

-- -------------------------------------------------------
-- Tabla 2: Objetivos (corto / medio / largo plazo)
-- Espejo del archivo 03-objetivos-y-vision.md
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_objetivos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,                -- 'O1', 'O2', ...
  titulo TEXT NOT NULL,
  descripcion TEXT,
  horizonte TEXT NOT NULL,                    -- 'corto' (30d) | 'medio' (3-6m) | 'largo' (6-12m)
  deadline DATE,
  estado TEXT DEFAULT 'pendiente',            -- 'pendiente' | 'en_curso' | 'completado' | 'bloqueado' | 'descartado'
  fase_proyecto INT,                          -- 1, 2, 3, 4
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dusan_objetivos_estado ON dusan_objetivos(estado);
CREATE INDEX IF NOT EXISTS idx_dusan_objetivos_horizonte ON dusan_objetivos(horizonte);

-- -------------------------------------------------------
-- Tabla 3: Tareas / pendientes (analogo a PENDIENTES.md pero estructurado)
-- Espejo de sesiones_entrevista pero para tareas propias.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_tareas (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT DEFAULT 'media',             -- 'critica' | 'alta' | 'media' | 'baja'
  estado TEXT DEFAULT 'pendiente',            -- 'pendiente' | 'en_curso' | 'completada' | 'bloqueada' | 'descartada'
  objetivo_id BIGINT REFERENCES dusan_objetivos(id) ON DELETE SET NULL,
  duenio TEXT DEFAULT 'Dusan',                -- 'Dusan' | 'Pablo' | 'Andrea' | etc.
  deadline DATE,
  bloqueado_por TEXT,                         -- nota libre si bloqueada (ej. 'permisos Puerto Montt')
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dusan_tareas_estado ON dusan_tareas(estado);
CREATE INDEX IF NOT EXISTS idx_dusan_tareas_prioridad ON dusan_tareas(prioridad);
CREATE INDEX IF NOT EXISTS idx_dusan_tareas_duenio ON dusan_tareas(duenio);

-- -------------------------------------------------------
-- Tabla 4: Decisiones LOCK (espejo 08-decisiones-lock.md)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_decisiones (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,                -- 'T.01', 'E.04', 'P.03', 'C3', etc.
  familia TEXT NOT NULL,                      -- 'tecnologia' | 'empresa' | 'diego' | 'personal'
  decision TEXT NOT NULL,
  razon TEXT,
  fecha DATE NOT NULL,
  fuente_doc TEXT,                            -- ej. 'docs/diego-v4.2-spec.md'
  estado TEXT DEFAULT 'vigente',              -- 'vigente' | 'obsoleta'
  reemplaza_codigo TEXT,                      -- si obsoletiza otra
  obsoletada_por TEXT,                        -- codigo que la reemplaza
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_decisiones_familia ON dusan_decisiones(familia);
CREATE INDEX IF NOT EXISTS idx_dusan_decisiones_estado ON dusan_decisiones(estado);

-- -------------------------------------------------------
-- Tabla 5: Stakeholders (circulo interno + equipo + partners)
-- Espejo del 06-stakeholders.md
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_stakeholders (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT,
  tipo TEXT NOT NULL,                         -- 'interno' | 'equipo' | 'cliente' | 'proveedor' | 'partner_tecnico' | 'autoridad' | 'ia'
  sucursal TEXT,                              -- 'Cerrillos' | 'Maipu' | 'Talca' | 'Puerto Montt' | NULL
  canal_principal TEXT,                       -- 'WA' | 'email' | 'dashboard' | 'GitHub' | etc.
  contacto TEXT,                              -- numero WA o email (si aplica y NO es privado)
  criticidad TEXT DEFAULT 'media',            -- 'critica' | 'alta' | 'media' | 'baja'
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_stakeholders_tipo ON dusan_stakeholders(tipo);
CREATE INDEX IF NOT EXISTS idx_dusan_stakeholders_activo ON dusan_stakeholders(activo);

-- -------------------------------------------------------
-- Tabla 6: KPIs configurados (el tablero personal)
-- Espejo del 07-kpis-y-metricas.md
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_kpis (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fuente TEXT,                                -- 'diego_curador_wa' | 'supabase_query' | 'manual' | 'dashboard_fase2'
  umbral_verde TEXT,                          -- string flexible (ej. '0', '< 5s', '> 80%')
  umbral_amarillo TEXT,
  umbral_rojo TEXT,
  frecuencia TEXT DEFAULT 'diaria',           -- 'diaria' | 'semanal' | 'mensual' | 'tiempo_real'
  fase_proyecto INT,                          -- 1 (ya vive) | 2 (por construir) | 3 | 4
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_kpis_activo ON dusan_kpis(activo);

-- -------------------------------------------------------
-- Tabla 7: Mediciones de KPIs (historial diario)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_kpi_mediciones (
  id BIGSERIAL PRIMARY KEY,
  kpi_id BIGINT REFERENCES dusan_kpis(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  valor TEXT,                                 -- guardado como texto para flexibilidad
  valor_numerico NUMERIC,                     -- opcional, si es numero
  estado_semaforo TEXT,                       -- 'verde' | 'amarillo' | 'rojo'
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_kpi_medic_kpi_fecha ON dusan_kpi_mediciones(kpi_id, fecha DESC);

-- -------------------------------------------------------
-- Tabla 8: Casos (aprendizajes propios — espejo casos-diego/)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_casos (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  titulo TEXT NOT NULL,
  contexto TEXT,
  que_paso TEXT,
  que_aprendi TEXT,
  regla_impactada TEXT,                       -- codigo de decision afectada (ej. 'R.DIE.2')
  archivo_md TEXT,                            -- ej. 'casos-dusan/20260425-ejemplo.md'
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_casos_fecha ON dusan_casos(fecha DESC);

-- -------------------------------------------------------
-- Tabla 9: Sesiones de trabajo (analogo a sesiones_entrevista pero para Dusan)
-- Registra sesiones de foco, implementaciones, llamadas importantes.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_sesiones_trabajo (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,                         -- 'foco' | 'implementacion_tecnica' | 'llamada_cliente' | 'planificacion' | 'cierre_dia'
  inicio TIMESTAMP NOT NULL,
  fin TIMESTAMP,
  objetivo TEXT,
  resultado TEXT,
  tarea_ids BIGINT[],                         -- tareas asociadas
  caso_id BIGINT REFERENCES dusan_casos(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dusan_sesiones_inicio ON dusan_sesiones_trabajo(inicio DESC);

-- -------------------------------------------------------
-- Tabla 10: Pendientes de validacion (borradores de IA esperando visto bueno)
-- Espejo de `procesos_borrador` de Diego-Curador, pero generalizado.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_pendientes_validacion (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,                         -- 'sop_diego' | 'mensaje_equipo' | 'respuesta_cliente' | 'contenido_rrss' | 'precio_publicar'
  titulo TEXT NOT NULL,
  contenido_borrador TEXT NOT NULL,
  origen TEXT,                                -- 'diego_curador' | 'make_rrss' | 'claude_code' | etc.
  estado TEXT DEFAULT 'pendiente',            -- 'pendiente' | 'aprobado' | 'corregido' | 'descartado'
  comentarios_dusan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dusan_pend_estado ON dusan_pendientes_validacion(estado);
CREATE INDEX IF NOT EXISTS idx_dusan_pend_tipo ON dusan_pendientes_validacion(tipo);

-- -------------------------------------------------------
-- Tabla 11: Preguntas abiertas de Dusan (cosas que aun no decide)
-- Espejo de `vacios_conocimiento` pero para decisiones pendientes propias.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dusan_preguntas_abiertas (
  id BIGSERIAL PRIMARY KEY,
  pregunta TEXT NOT NULL,
  contexto TEXT,
  bloqueada_por TEXT,                         -- 'informacion_faltante' | 'espera_externo' | 'decision_superior' | 'tiempo'
  deadline_decision DATE,
  resuelta BOOLEAN DEFAULT false,
  resolucion TEXT,                            -- la decision final cuando se resuelva
  decision_codigo TEXT,                       -- codigo LOCK si se consolida (ej. 'T.07')
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dusan_preg_resuelta ON dusan_preguntas_abiertas(resuelta);

-- =====================================================
-- RLS (Row Level Security)
-- Mismo patron que tablas Diego v4.2: solo service_role.
-- Estas tablas son privadas de Dusan — no expuestas a frontend publico.
-- =====================================================
ALTER TABLE dusan_contexto               ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_objetivos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_tareas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_decisiones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_stakeholders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_kpis                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_kpi_mediciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_casos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_sesiones_trabajo       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_pendientes_validacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dusan_preguntas_abiertas     ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Validacion post-creacion
-- =====================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public' AND table_name LIKE 'dusan_%'
-- ORDER BY table_name;
--
-- Resultado esperado: 11 filas.
