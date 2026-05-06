-- ============================================================
-- ENTREVISTA A2 — Schema Supabase
-- Fecha: 2026-05-06
-- Cuestionario Andrea v4 FINAL + 11 destinatarios adicionales
-- Compliance: Ley 21.719 + Art. 5 Código del Trabajo
-- ============================================================

-- Tabla 1: Personas (clave individual + metadata)
CREATE TABLE IF NOT EXISTS public.entrevista_personas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  cuestionario TEXT NOT NULL,
  clave TEXT UNIQUE NOT NULL,
  email TEXT,
  whatsapp TEXT,
  estado TEXT DEFAULT 'pendiente', -- pendiente | en_curso | completado | abandonado
  fecha_envio TIMESTAMPTZ,
  fecha_inicio TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  consentimiento_aceptado_at TIMESTAMPTZ,
  consentimiento_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entrevista_personas_estado ON entrevista_personas(estado);

-- Tabla 2: Respuestas (un registro por persona, JSON con todas las preguntas)
CREATE TABLE IF NOT EXISTS public.entrevista_respuestas (
  id BIGSERIAL PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES entrevista_personas(id) ON DELETE CASCADE,
  cuestionario TEXT NOT NULL,
  respuestas JSONB NOT NULL DEFAULT '{}'::jsonb,
  indice_actual INTEGER DEFAULT 0,
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT entrevista_respuestas_persona_unique UNIQUE (persona_id)
);

CREATE INDEX IF NOT EXISTS idx_entrevista_respuestas_persona ON entrevista_respuestas(persona_id);

-- Tabla 3: Auditoría de accesos (compliance)
CREATE TABLE IF NOT EXISTS public.entrevista_auditoria (
  id BIGSERIAL PRIMARY KEY,
  persona_id TEXT,
  accion TEXT NOT NULL, -- login | guardar | leer_admin | exportar | eliminar
  ip TEXT,
  user_agent TEXT,
  detalle JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entrevista_auditoria_persona ON entrevista_auditoria(persona_id);
CREATE INDEX IF NOT EXISTS idx_entrevista_auditoria_timestamp ON entrevista_auditoria(timestamp DESC);

-- Tabla 4: Archivos subidos (referencia a Storage)
CREATE TABLE IF NOT EXISTS public.entrevista_archivos (
  id BIGSERIAL PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES entrevista_personas(id) ON DELETE CASCADE,
  pregunta_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  nombre_original TEXT,
  tamano_bytes BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla 5: Audio grabados (referencia a Storage)
CREATE TABLE IF NOT EXISTS public.entrevista_audios (
  id BIGSERIAL PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES entrevista_personas(id) ON DELETE CASCADE,
  pregunta_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duracion_segundos INTEGER,
  transcripcion TEXT,
  transcrito_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — compliance Ley 21.719
-- ============================================================

ALTER TABLE entrevista_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevista_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevista_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevista_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevista_audios ENABLE ROW LEVEL SECURITY;

-- Política: solo admin (Dusan) puede leer todo
-- Pablo Arancibia explícitamente NO tiene acceso de lectura por segregación de funciones
CREATE POLICY "admin_dusan_lectura_completa" ON entrevista_respuestas
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'dusan@gestionrepchile.cl'
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "admin_dusan_lectura_personas" ON entrevista_personas
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'dusan@gestionrepchile.cl'
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Política: Andrea/persona puede insertar/actualizar SUS respuestas con clave válida
-- Esto se valida server-side vía Edge Function en producción
CREATE POLICY "persona_escribe_sus_respuestas" ON entrevista_respuestas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "persona_actualiza_sus_respuestas" ON entrevista_respuestas
  FOR UPDATE
  USING (true);

-- Auditoría: insertable por todos, legible solo admin
CREATE POLICY "auditoria_insertable" ON entrevista_auditoria
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "auditoria_legible_admin" ON entrevista_auditoria
  FOR SELECT
  USING (auth.jwt() ->> 'email' = 'dusan@gestionrepchile.cl');

-- ============================================================
-- SEED — 12 destinatarios con sus claves individuales
-- ============================================================

INSERT INTO entrevista_personas (id, nombre, rol, cuestionario, clave, estado) VALUES
  ('andrea',     'Andrea Rivera Contreras',   'admin_ventas',       'andrea_v4',    'AND-2026-AR42', 'pendiente'),
  ('pablo',      'Pablo Arancibia',           'sistemas_pagos',     'pablo_v1',     'PAB-2026-PA50', 'pendiente'),
  ('cesar',      'Cesar Mora',                'tech_dashboard',     'cesar_v1',     'CES-2026-CM30', 'pendiente'),
  ('juan_mendoza','Juan Mendoza',             'operativo_terreno',  'operativo_v1', 'JUM-2026-JM15', 'pendiente'),
  ('ingrid',     'Ingrid Cancino',            'operativo_terreno',  'operativo_v1', 'ING-2026-IC15', 'pendiente'),
  ('nicolas',    'Nicolás Arancibia',         'operativo_terreno',  'operativo_v1', 'NIC-2026-NA15', 'pendiente'),
  ('cristian_m', 'Cristián Montesino',        'operativo_terreno',  'operativo_v1', 'CRM-2026-CM15', 'pendiente'),
  ('andres',     'Andrés Braniff',            'operativo_terreno',  'operativo_v1', 'AND-2026-AB15', 'pendiente'),
  ('cristian_v', 'Cristian Valenzuela',       'operativo_terreno',  'operativo_v1', 'CRV-2026-CV15', 'pendiente'),
  ('victor',     'Víctor [apellido pendiente]','operativo_terreno', 'operativo_v1', 'VIC-2026-VT15', 'pendiente'),
  ('carlos',     'Carlos Iturra',             'operativo_terreno',  'operativo_v1', 'CAR-2026-CI15', 'pendiente'),
  ('jair',       'Jair Sanmartín',            'operativo_terreno',  'operativo_v1', 'JAI-2026-JS15', 'pendiente')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET para archivos y audios
-- ============================================================
-- Ejecutar en Supabase Dashboard → Storage:
-- 1. Crear bucket 'entrevistas' (privado)
-- 2. Política: solo Dusan + service_role pueden leer
-- 3. Subida vía Edge Function que valida la clave
-- 4. Retención: 12 meses con job de eliminación automática

-- ============================================================
-- VISTA AGREGADA para Dusan
-- ============================================================

CREATE OR REPLACE VIEW v_entrevista_progreso AS
SELECT
  p.id,
  p.nombre,
  p.rol,
  p.cuestionario,
  p.estado,
  p.fecha_inicio,
  p.fecha_completado,
  COALESCE(r.indice_actual, 0) AS preguntas_respondidas,
  COALESCE(jsonb_array_length(jsonb_path_query_array(r.respuestas, '$.*')), 0) AS total_respuestas,
  r.ultima_actualizacion,
  CASE
    WHEN p.estado = 'completado' THEN '✅'
    WHEN p.estado = 'en_curso' THEN '🟡'
    ELSE '⚪'
  END AS estado_visual
FROM entrevista_personas p
LEFT JOIN entrevista_respuestas r ON p.id = r.persona_id
ORDER BY p.rol, p.nombre;

-- ============================================================
-- TRIGGER de retención automática (compliance Ley 21.719)
-- ============================================================
-- Eliminar respuestas más viejas de 12 meses
CREATE OR REPLACE FUNCTION eliminar_respuestas_antiguas() RETURNS void AS $$
BEGIN
  DELETE FROM entrevista_respuestas
  WHERE ultima_actualizacion < NOW() - INTERVAL '12 months';

  INSERT INTO entrevista_auditoria (accion, detalle)
  VALUES ('retencion_automatica', jsonb_build_object('ejecutado_at', NOW()));
END;
$$ LANGUAGE plpgsql;

-- Ejecutar este trigger via pg_cron o vía Edge Function programada
-- SELECT cron.schedule('retencion_entrevistas', '0 3 * * 0', 'SELECT eliminar_respuestas_antiguas();');

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
