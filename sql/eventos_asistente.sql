-- ================================================================
-- MIGRACION: Sistema de Tracking de Uso del Asistente Comercial
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ================================================================

CREATE TABLE eventos_asistente (
  id            BIGSERIAL PRIMARY KEY,
  session_id    TEXT NOT NULL,
  usuario_id    INTEGER NOT NULL,
  evento        TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  sucursal      TEXT,
  client_ts     TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE eventos_asistente
  ADD CONSTRAINT chk_evento CHECK (evento IN (
    'login',
    'seleccionar_sucursal',
    'abrir_datos_negocio',
    'completar_datos_negocio',
    'buscar_material',
    'filtrar_categoria',
    'ver_tabla_precios',
    'ingresar_kg',
    'ingresar_precio',
    'cerrar_consulta',
    'ver_preview',
    'generar_pdf',
    'compartir_whatsapp',
    'logout'
  ));

CREATE INDEX idx_eventos_usuario    ON eventos_asistente(usuario_id);
CREATE INDEX idx_eventos_session    ON eventos_asistente(session_id);
CREATE INDEX idx_eventos_evento     ON eventos_asistente(evento);
CREATE INDEX idx_eventos_created    ON eventos_asistente(created_at DESC);
CREATE INDEX idx_eventos_usuario_fecha
  ON eventos_asistente(usuario_id, created_at DESC);

ALTER TABLE eventos_asistente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asistente inserta eventos"
  ON eventos_asistente FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin lee todos los eventos"
  ON eventos_asistente FOR SELECT USING (true);
