-- ================================================================
-- MIGRACION: Sistema de Erratas Canónicas para Diego (WhatsApp)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ================================================================
-- Tabla canónica de correcciones que Diego debe respetar.
-- n8n consulta esta tabla antes de cada llamada a Claude (Haiku) y
-- la inyecta al inicio del system prompt como bloque "ERRATAS CONOCIDAS".
--
-- El panel admin (index.html → tab "I · Erratas Diego") permite a
-- usuarios autenticados crear, editar y activar/desactivar filas
-- desde el móvil en menos de 30 segundos.
-- ================================================================

CREATE TABLE diego_correcciones (
  id              BIGSERIAL PRIMARY KEY,
  activa          BOOLEAN NOT NULL DEFAULT true,
  error_detectado TEXT NOT NULL,
  correccion      TEXT NOT NULL,
  tipo            TEXT,
  scope           TEXT DEFAULT 'general',
  issue_url       TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diego_correcciones_activa
  ON diego_correcciones(activa) WHERE activa = true;

CREATE INDEX idx_diego_correcciones_created
  ON diego_correcciones(created_at DESC);

-- Trigger para mantener updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION trg_diego_correcciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_diego_correcciones_updated_at
  BEFORE UPDATE ON diego_correcciones
  FOR EACH ROW
  EXECUTE FUNCTION trg_diego_correcciones_updated_at();

-- ================================================================
-- RLS — mismo patrón laxo que `usuarios_autorizados` y
-- `eventos_asistente`: el frontend usa `anon key` y el panel filtra
-- accesos por sesión en localStorage. n8n usa `service_role` y
-- bypassa RLS por defecto. Si en el futuro se quiere endurecer, ver
-- nota al final.
-- ================================================================
ALTER TABLE diego_correcciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura erratas"
  ON diego_correcciones FOR SELECT USING (true);

CREATE POLICY "Insertar erratas"
  ON diego_correcciones FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualizar erratas"
  ON diego_correcciones FOR UPDATE USING (true);

CREATE POLICY "Eliminar erratas"
  ON diego_correcciones FOR DELETE USING (true);

-- ================================================================
-- SEED: la primera errata real (la que disparó este sistema)
-- ================================================================
INSERT INTO diego_correcciones
  (error_detectado, correccion, tipo, scope, issue_url, created_by)
VALUES (
  'Diego dijo "hoy es 20 de enero 2025" / "hoy es 28 de enero 2025" — inventó una fecha en 2025 cuando el corpus está fechado en abril-2026.',
  'NUNCA generes información factual (fechas, números, URLs, precios, contactos, capacidades del sistema, registros "guardados en memoria") que no esté explícitamente presente en el mensaje del usuario o en los documentos provistos en este prompt. Si te preguntan "qué fecha es hoy", "qué día es hoy" o "en qué año estamos" y NO ves la fecha en el mensaje del usuario, responde exactamente: "No la sé con certeza — necesito que me confirmes la fecha o que aparezca en algún archivo de sesión". No supongas. No uses tu cutoff de entrenamiento. NUNCA inventes una fecha.',
  'fecha',
  'general',
  'https://github.com/dusanarancibia-cpu/reciclean-manifiesto-diego/issues/2',
  'sistema (seed)'
);

-- ================================================================
-- NOTA — endurecimiento futuro (opcional, no aplicar ahora):
-- Si querés que solo usuarios con rol admin/editor puedan escribir
-- desde el panel, hay que migrar de la auth custom (PIN en
-- localStorage) a Supabase Auth real, y reemplazar las policies
-- anteriores por algo como:
--
--   CREATE POLICY "Admin/editor escriben"
--     ON diego_correcciones FOR ALL
--     USING (auth.jwt() ->> 'role' IN ('admin','editor'));
--
-- Mientras tanto, el control de acceso vive en el panel
-- (index.html → gateTabUsuarios pattern).
-- ================================================================
