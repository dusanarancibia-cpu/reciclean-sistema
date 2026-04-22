-- ================================================================
-- MIGRACION: Tablas base del protocolo unificado
-- Fecha: 2026-04-22
-- Autor: Dusan (via Claude Code, skill protocolo-datos-unificado)
-- Ejecutar en: https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
-- Impacto: crea 7 tablas nuevas. No toca tablas existentes.
-- Reversible: DROP TABLE <tabla>; (sin CASCADE a menos que ya haya FKs pobladas).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. tareas  (reemplaza PENDIENTES.md seccion "Abiertas")
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tareas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT CHECK (prioridad IN ('critica','alta','media','baja','diferida')) DEFAULT 'media',
  estado TEXT CHECK (estado IN ('abierta','bloqueada','en_revision','cerrada')) DEFAULT 'abierta',
  proxima_accion TEXT,
  bloqueador TEXT,
  branch TEXT,
  commit_sha TEXT,
  pr_numero INT,
  depende_de BIGINT[],
  creada_por TEXT,
  asignada_a TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad ON tareas(prioridad);
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 2. casos_asistente  (reemplaza casos-diego/*.md)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS casos_asistente (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  contacto_phone TEXT,
  contacto_nombre TEXT,
  asistente TEXT DEFAULT 'diego_alonso',
  duracion_min INT,
  mensajes_total INT,
  resultado TEXT CHECK (resultado IN ('resuelto','sin_resolver','parcial','abandonado')),
  resumen TEXT NOT NULL,
  diego_hizo_mal TEXT,
  diego_debio_hacer TEXT,
  bugs_vinculados BIGINT[],
  evidencia_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_casos_fecha ON casos_asistente(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_casos_contacto ON casos_asistente(contacto_phone);
ALTER TABLE casos_asistente ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3. bugs_asistente  (reemplaza PENDIENTES.md P5 lista 1-28)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bugs_asistente (
  id BIGSERIAL PRIMARY KEY,
  numero INT UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  severidad TEXT CHECK (severidad IN ('critica','alta','media','baja')) DEFAULT 'media',
  usuarios_confirmados TEXT[],
  casos_evidencia BIGINT[],
  version_detectada TEXT,
  version_fix TEXT,
  estado TEXT CHECK (estado IN ('abierto','en_progreso','fix_aplicado','verificado','cerrado')) DEFAULT 'abierto',
  workaround TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bugs_estado ON bugs_asistente(estado);
CREATE INDEX IF NOT EXISTS idx_bugs_severidad ON bugs_asistente(severidad);
ALTER TABLE bugs_asistente ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 4. plantillas_mensajes  (reemplaza mensajes-equipo/*.md)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plantillas_mensajes (
  id BIGSERIAL PRIMARY KEY,
  campana TEXT NOT NULL,
  destinatario_phone TEXT,
  destinatario_nombre TEXT,
  contexto TEXT,
  texto TEXT NOT NULL,
  canal TEXT DEFAULT 'whatsapp',
  estado TEXT CHECK (estado IN ('borrador','aprobado','enviado','respondido')) DEFAULT 'borrador',
  enviado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plantillas_campana ON plantillas_mensajes(campana);
ALTER TABLE plantillas_mensajes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 5. workflow_patches  (historial de cambios a Diego LIVE)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_patches (
  id BIGSERIAL PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workflow_nombre TEXT,
  version_from TEXT,
  version_to TEXT,
  fecha DATE NOT NULL,
  autor TEXT,
  resumen TEXT NOT NULL,
  diff_url TEXT,
  backup_path TEXT,
  smoke_test_resultado TEXT CHECK (smoke_test_resultado IN ('ok','parcial','fallo','rollback')),
  bugs_resueltos BIGINT[],
  tareas_vinculadas BIGINT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patches_workflow ON workflow_patches(workflow_id, fecha DESC);
ALTER TABLE workflow_patches ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 6. decisiones_lock  (decisiones bloqueadas por Dusan)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisiones_lock (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,
  tema TEXT NOT NULL,
  decision TEXT NOT NULL,
  contexto TEXT,
  fecha DATE NOT NULL,
  decidida_por TEXT DEFAULT 'Dusan',
  revertible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE decisiones_lock ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 7. credenciales_requeridas  (tracker de credenciales faltantes)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credenciales_requeridas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT UNIQUE,
  desbloquea TEXT[],
  urgencia TEXT CHECK (urgencia IN ('critica','alta','media','baja')) DEFAULT 'media',
  vence DATE,
  obtenida BOOLEAN DEFAULT false,
  obtenida_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE credenciales_requeridas ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Validacion
-- ----------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'tareas','casos_asistente','bugs_asistente','plantillas_mensajes',
    'workflow_patches','decisiones_lock','credenciales_requeridas'
  )
ORDER BY table_name;
-- Resultado esperado: 7 filas.
