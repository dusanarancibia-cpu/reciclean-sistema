-- ================================================================
-- MIGRACION: Estructura empresarial + objetivos + vista de evolucion
-- Fecha: 2026-04-22
-- Autor: Dusan (via Claude Code, skill protocolo-datos-unificado)
-- Ejecutar en: https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
-- Impacto:
--   - 4 tablas nuevas: empresas, areas, objetivos, kpis
--   - ALTER tareas: agrega objetivo_id, area_id, empresa_id, porcentaje_avance
--   - Vista v_tareas_evolucion (una linea por tarea + barra + color + objetivo)
--   - Seeds: 2 empresas + grupo, 7 areas, 18 objetivos propuestos
-- ================================================================

-- ----------------------------------------------------------------
-- 1. empresas  (Grupo, Reciclean, Farex)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sucursales_codigos TEXT[],           -- ['cerrillos','maipu','talca','puerto_montt']
  iva_regla TEXT,                       -- 'retencion_19', 'sin_iva'
  dominio TEXT,                         -- 'reciclean.cl', 'farex.cl'
  color_hex TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

INSERT INTO empresas (codigo, nombre, descripcion, sucursales_codigos, iva_regla, dominio, color_hex) VALUES
  ('grupo',     'Grupo Reciclean-Farex', 'Holding comercial reciclaje de materiales',
   ARRAY['cerrillos','maipu','talca','puerto_montt'], NULL, NULL, '#0f172a'),
  ('reciclean', 'Reciclean',             '4 sucursales, sin IVA',
   ARRAY['cerrillos','maipu','talca','puerto_montt'], 'sin_iva', 'reciclean.cl', '#22c55e'),
  ('farex',     'Farex',                 '2 sucursales, con Retencion IVA 19%',
   ARRAY['cerrillos','maipu'], 'retencion_19', 'farex.cl', '#3b82f6');

-- ----------------------------------------------------------------
-- 2. areas  (areas funcionales: Comercial, Operaciones, Tech, ...)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  responsable_phone TEXT,
  color_hex TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

INSERT INTO areas (codigo, nombre, descripcion, responsable_phone, color_hex) VALUES
  ('direccion',    'Direccion',    'CEO + estrategia + autorizaciones',            '+56963069065', '#0f172a'),
  ('tech',         'Tecnologia',   'Panel, Asistente, Diego Alonso, workflows',    '+56923962018', '#6366f1'),
  ('comercial',    'Comercial',    'Cotizaciones, clientes compradores, widgets',  '+56961596938', '#f59e0b'),
  ('operaciones',  'Operaciones',  'Terreno, camiones, despachos, sucursales',     '+56990552591', '#10b981'),
  ('admin',        'Admin/Pagos',  'Facturacion, cuentas, pagos',                  '+56967280603', '#ec4899'),
  ('permisologia', 'Permisologia', 'Portal VU, RETC, permisos municipales',        '+56986558236', '#8b5cf6'),
  ('rrhh',         'RRHH',         'Equipo, onboarding, comunicacion interna',     '+56963069065', '#ef4444');

-- ----------------------------------------------------------------
-- 3. objetivos  (general | particular; alcance: grupo | empresa | area)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objetivos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('general','particular')) NOT NULL,
  alcance TEXT CHECK (alcance IN ('grupo','empresa','area')) NOT NULL,
  empresa_id BIGINT REFERENCES empresas(id),
  area_id BIGINT REFERENCES areas(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  periodo TEXT,
  meta_cuantitativa TEXT,
  prioridad TEXT CHECK (prioridad IN ('critica','alta','media','baja')) DEFAULT 'media',
  estado TEXT CHECK (estado IN ('propuesto','activo','en_pausa','cumplido','descartado')) DEFAULT 'activo',
  objetivo_padre_id BIGINT REFERENCES objetivos(id),
  porcentaje_avance INT DEFAULT 0 CHECK (porcentaje_avance BETWEEN 0 AND 100),
  fecha_inicio DATE,
  fecha_objetivo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_obj_alcance ON objetivos(alcance);
CREATE INDEX IF NOT EXISTS idx_obj_padre ON objetivos(objetivo_padre_id);
CREATE INDEX IF NOT EXISTS idx_obj_estado ON objetivos(estado);
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 4. kpis  (indicadores cuantitativos por objetivo)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpis (
  id BIGSERIAL PRIMARY KEY,
  objetivo_id BIGINT REFERENCES objetivos(id) NOT NULL,
  codigo TEXT,
  nombre TEXT NOT NULL,
  unidad TEXT,                         -- '%', 'bugs', 'cotizaciones/semana'
  meta_valor NUMERIC,
  valor_actual NUMERIC,
  frecuencia_medicion TEXT,            -- 'diaria','semanal','mensual'
  fuente_medicion TEXT,                -- 'supabase:SELECT COUNT(*)...', 'manual'
  ultima_medicion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kpis_objetivo ON kpis(objetivo_id);
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 5. Objetivos PROPUESTOS (Claude los sugiere con base en CLAUDE.md + Fases + tareas)
-- ----------------------------------------------------------------

-- A) GENERALES DEL GRUPO
INSERT INTO objetivos (codigo, tipo, alcance, empresa_id, area_id, titulo, descripcion, periodo, meta_cuantitativa, prioridad, estado, fecha_inicio, fecha_objetivo) VALUES
('G-01', 'general', 'grupo',
 (SELECT id FROM empresas WHERE codigo='grupo'), NULL,
 'Sistema comercial unificado del Grupo',
 'Reciclean + Farex operan bajo una sola plataforma Panel + Asistente + Widgets publicos',
 '2026', '4 sucursales operativas con catalogo unificado', 'alta', 'activo', '2026-01-01', '2026-12-31'),

('G-02', 'general', 'grupo',
 (SELECT id FROM empresas WHERE codigo='grupo'), NULL,
 'Comunicacion digital con el equipo via Diego Alonso',
 'Los 9 contactos activos usan Diego Alonso como punto unico de coordinacion interna',
 '2026-Q2', '9 personas usando Diego, 0 bugs criticos', 'critica', 'activo', '2026-04-01', '2026-06-30'),

('G-03', 'general', 'grupo',
 (SELECT id FROM empresas WHERE codigo='grupo'), NULL,
 'Auditoria y monitoreo continuo',
 'Diego-Curador diario + revision semanal de KPIs operacionales',
 '2026', 'Reporte Diego-Curador 02:00 AM diario', 'alta', 'propuesto', '2026-04-28', '2026-12-31'),

('G-04', 'general', 'grupo',
 (SELECT id FROM empresas WHERE codigo='grupo'), NULL,
 'Datos unificados en Supabase (fin de archivos sueltos)',
 'Toda info estructural en tablas; archivos solo para narrativa',
 '2026-Q2', 'PENDIENTES.md + casos-diego migrados a tablas', 'alta', 'activo', '2026-04-22', '2026-06-30');

-- B) PARTICULARES POR EMPRESA
INSERT INTO objetivos (codigo, tipo, alcance, empresa_id, area_id, titulo, descripcion, periodo, meta_cuantitativa, prioridad, estado, objetivo_padre_id, fecha_inicio, fecha_objetivo) VALUES
('REC-01', 'particular', 'empresa',
 (SELECT id FROM empresas WHERE codigo='reciclean'), NULL,
 'Reciclean: 4 sucursales con catalogo unificado',
 'Cerrillos + Maipu + Talca + Puerto Montt operando el mismo panel',
 '2026', '4/4 sucursales activas', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-01'), '2026-01-01', '2026-12-31'),

('REC-02', 'particular', 'empresa',
 (SELECT id FROM empresas WHERE codigo='reciclean'), NULL,
 'Activar operacion Puerto Montt',
 'En espera de permisos finales. Una vez obtenidos, publicar precios y activar widget',
 'indefinido', 'Puerto Montt publicando precios', 'media', 'en_pausa',
 (SELECT id FROM objetivos WHERE codigo='REC-01'), NULL, NULL),

('REC-03', 'particular', 'empresa',
 (SELECT id FROM empresas WHERE codigo='reciclean'), NULL,
 'Widget reciclean.cl con precios en vivo',
 'Sync Realtime Panel -> asistente_snapshot -> widget publico',
 '2026', 'Widget live, sin bugs visibles', 'media', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-01'), '2026-01-01', '2026-06-30'),

('FAR-01', 'particular', 'empresa',
 (SELECT id FROM empresas WHERE codigo='farex'), NULL,
 'Farex: 2 sucursales con IVA Retencion 19%',
 'Cerrillos + Maipu con regla IVA especial aplicada automaticamente',
 '2026', 'Calculos con retencion 19% en todas las cotizaciones', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-01'), '2026-01-01', '2026-12-31'),

('FAR-02', 'particular', 'empresa',
 (SELECT id FROM empresas WHERE codigo='farex'), NULL,
 'Widget farex.cl con precios en vivo',
 'Sync Realtime equivalente a reciclean',
 '2026', 'Widget live, sin bugs visibles', 'media', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-01'), '2026-01-01', '2026-06-30');

-- C) PARTICULARES POR AREA
INSERT INTO objetivos (codigo, tipo, alcance, empresa_id, area_id, titulo, descripcion, periodo, meta_cuantitativa, prioridad, estado, objetivo_padre_id, fecha_inicio, fecha_objetivo) VALUES
('TECH-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='tech'),
 'Diego Alonso v4.2 LIVE estable',
 'Rename a Diego Alonso + bloque coordinacion + 0 bugs criticos en 7 dias',
 '2026-Q2', '0 bugs criticos, 100% patches aplicados', 'critica', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-02'), '2026-04-21', '2026-05-31'),

('TECH-02', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='tech'),
 'Panel Admin v91 responsive mobile',
 'Panel funciona bien en celular para el equipo en terreno',
 '2026-Q2', 'Panel usable en pantalla <400px', 'media', 'propuesto',
 (SELECT id FROM objetivos WHERE codigo='G-01'), '2026-05-01', '2026-06-30'),

('TECH-03', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='tech'),
 'Migrar archivos estructurales a tablas Supabase',
 'PENDIENTES.md + casos-diego/ + mensajes-equipo/ a tablas',
 '2026-Q2', '58 filas migradas', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-04'), '2026-04-22', '2026-05-31'),

('COM-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='comercial'),
 'Reducir tiempo respuesta a cotizaciones',
 'Asistente terreno + Diego Alonso permiten responder en <5 min',
 '2026-Q2', 'Tiempo respuesta <5 min promedio', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-02'), '2026-04-01', '2026-06-30'),

('OPS-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='operaciones'),
 'Asistente terreno PWA instalado en celulares del equipo',
 '9 personas con la PWA instalada y usandola',
 '2026-Q2', '9/9 celulares con PWA activa', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-02'), '2026-04-01', '2026-06-30'),

('ADM-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='admin'),
 'Integrar Google Workspace (Fase 2)',
 'Email corporativo + Drive + Calendar sincronizado',
 '2026-Q2', 'Workspace activo para 9 contactos', 'media', 'propuesto',
 (SELECT id FROM objetivos WHERE codigo='G-03'), '2026-05-01', '2026-06-30'),

('PER-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='permisologia'),
 'Portal VU + RETC al dia',
 'Declaraciones actualizadas mes a mes, sin multas',
 '2026', '0 declaraciones atrasadas', 'alta', 'activo',
 (SELECT id FROM objetivos WHERE codigo='G-03'), '2026-01-01', '2026-12-31'),

('DIR-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='direccion'),
 'Auditoria semanal Diego-Curador activa',
 'Reporte cada viernes 02:00 AM Chile con errores + resumen + borradores',
 '2026-Q2', 'Reporte semanal cumpliendose 4/4 semanas', 'alta', 'propuesto',
 (SELECT id FROM objetivos WHERE codigo='G-03'), '2026-04-28', '2026-05-31'),

('RRHH-01', 'particular', 'area', NULL,
 (SELECT id FROM areas WHERE codigo='rrhh'),
 'Onboarding del equipo con Diego Alonso (mensaje M2)',
 'Los 8 contactos activos reciben M2 y empiezan entrevistas modo v4.2',
 '2026-04-30', '8/8 contactos activos con sesion iniciada', 'critica', 'propuesto',
 (SELECT id FROM objetivos WHERE codigo='G-02'), '2026-04-30', '2026-05-30');

-- ----------------------------------------------------------------
-- 6. ALTER tareas: vincular a empresa + area + objetivo + avance
-- ----------------------------------------------------------------
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresas(id);
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS area_id BIGINT REFERENCES areas(id);
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS objetivo_id BIGINT REFERENCES objetivos(id);
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS porcentaje_avance INT DEFAULT 0 CHECK (porcentaje_avance BETWEEN 0 AND 100);

-- ----------------------------------------------------------------
-- 7. VISTA: evolucion de tareas en UNA SOLA LINEA por tarea
--    Columnas: codigo, titulo, pct, barra, color, prioridad, peso,
--              estado, objetivo, area, empresa, proxima_accion, bloqueador.
--    Ordenada por prioridad (peso) -> codigo.
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_tareas_evolucion AS
SELECT
  t.codigo,
  t.titulo,
  t.porcentaje_avance::text || '%' AS pct,
  -- Barra ASCII 10 bloques
  repeat('#', GREATEST(0, t.porcentaje_avance / 10)) ||
  repeat('-', GREATEST(0, 10 - t.porcentaje_avance / 10)) AS barra,
  -- Color por estado / prioridad (emoji -> UI puede mapear a clase CSS)
  CASE
    WHEN t.estado = 'cerrada'      THEN 'verde'
    WHEN t.estado = 'en_revision'  THEN 'amarillo'
    WHEN t.estado = 'bloqueada'    THEN 'rojo'
    WHEN t.prioridad = 'critica'   THEN 'naranja'
    ELSE 'azul'
  END AS color,
  t.prioridad,
  CASE t.prioridad
    WHEN 'critica'  THEN 1
    WHEN 'alta'     THEN 2
    WHEN 'media'    THEN 3
    WHEN 'baja'     THEN 4
    WHEN 'diferida' THEN 5
  END AS peso,
  t.estado,
  COALESCE(o.codigo, '—') AS objetivo_codigo,
  COALESCE(o.titulo, '(sin objetivo)') AS objetivo_titulo,
  COALESCE(op.codigo, '—') AS objetivo_padre_codigo,
  COALESCE(a.codigo, '—') AS area,
  COALESCE(e.codigo, 'grupo') AS empresa,
  t.proxima_accion,
  t.bloqueador,
  t.branch,
  t.created_at::date AS creada,
  t.closed_at::date AS cerrada
FROM tareas t
LEFT JOIN objetivos o  ON o.id = t.objetivo_id
LEFT JOIN objetivos op ON op.id = o.objetivo_padre_id
LEFT JOIN areas a      ON a.id = t.area_id
LEFT JOIN empresas e   ON e.id = t.empresa_id
ORDER BY
  CASE t.estado WHEN 'cerrada' THEN 2 ELSE 1 END,   -- abiertas primero
  CASE t.prioridad
    WHEN 'critica'  THEN 1
    WHEN 'alta'     THEN 2
    WHEN 'media'    THEN 3
    WHEN 'baja'     THEN 4
    WHEN 'diferida' THEN 5
  END,
  t.codigo;

-- ----------------------------------------------------------------
-- 8. Vista complementaria: coherencia objetivos -> tareas
--    (para cada objetivo, cuantas tareas abiertas, avance promedio, tareas bloqueadas)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_objetivos_estado AS
SELECT
  o.codigo,
  o.tipo,
  o.alcance,
  o.titulo,
  o.estado,
  o.porcentaje_avance AS pct_declarado,
  o.prioridad,
  COUNT(t.id) FILTER (WHERE t.estado <> 'cerrada') AS tareas_abiertas,
  COUNT(t.id) FILTER (WHERE t.estado = 'bloqueada') AS tareas_bloqueadas,
  COUNT(t.id) FILTER (WHERE t.estado = 'cerrada') AS tareas_cerradas,
  ROUND(AVG(t.porcentaje_avance)::numeric, 0) AS pct_avance_tareas,
  COALESCE(e.codigo, 'grupo') AS empresa,
  COALESCE(a.codigo, '—') AS area,
  COALESCE(op.codigo, '—') AS objetivo_padre
FROM objetivos o
LEFT JOIN tareas t     ON t.objetivo_id = o.id
LEFT JOIN empresas e   ON e.id = o.empresa_id
LEFT JOIN areas a      ON a.id = o.area_id
LEFT JOIN objetivos op ON op.id = o.objetivo_padre_id
GROUP BY o.id, o.codigo, o.tipo, o.alcance, o.titulo, o.estado, o.porcentaje_avance, o.prioridad, e.codigo, a.codigo, op.codigo
ORDER BY
  CASE o.prioridad
    WHEN 'critica' THEN 1
    WHEN 'alta'    THEN 2
    WHEN 'media'   THEN 3
    WHEN 'baja'    THEN 4
  END,
  o.codigo;

-- ----------------------------------------------------------------
-- Validacion
-- ----------------------------------------------------------------
SELECT 'empresas' AS tabla, COUNT(*) FROM empresas
UNION ALL SELECT 'areas', COUNT(*) FROM areas
UNION ALL SELECT 'objetivos', COUNT(*) FROM objetivos
UNION ALL SELECT 'kpis', COUNT(*) FROM kpis;

-- Ver objetivos propuestos ordenados:
SELECT codigo, tipo, alcance,
       COALESCE((SELECT codigo FROM empresas WHERE id=objetivos.empresa_id),'—') AS empresa,
       COALESCE((SELECT codigo FROM areas WHERE id=objetivos.area_id),'—') AS area,
       titulo, prioridad, estado
FROM objetivos
ORDER BY tipo DESC, alcance, codigo;

-- Ver evolucion tareas (vacio hasta que se migre PENDIENTES.md):
SELECT * FROM v_tareas_evolucion;
