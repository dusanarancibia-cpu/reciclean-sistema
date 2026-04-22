-- ================================================================
-- MIGRACION: Clasificacion de informacion + control de acceso Diego
-- Fecha: 2026-04-22
-- Autor: Dusan (via Claude Code, skill protocolo-datos-unificado)
-- Ejecutar en: https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
-- Impacto: crea 2 tablas + 1 vista + seeds. No toca tablas existentes.
-- Principio: Diego solo accede a lo que sirve para operacion. Lo
-- reservado (sueldos, finanzas privadas, conflictos, estrategia) NO.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. clasificacion_informacion  (taxonomia fija de niveles)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clasificacion_informacion (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,         -- 'publico','operativo','restringido','confidencial'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  diego_puede_leer BOOLEAN DEFAULT false,
  diego_puede_compartir BOOLEAN DEFAULT false,
  roles_acceso TEXT[],                 -- ['publico'], ['nivel_2','nivel_3'], ['nivel_3']
  ejemplo TEXT,
  color_hex TEXT,                      -- para UI panel
  orden INT,                            -- para ordenar en selects
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clasificacion_informacion ENABLE ROW LEVEL SECURITY;

-- Seeds: 4 niveles base
INSERT INTO clasificacion_informacion
  (codigo, nombre, descripcion, diego_puede_leer, diego_puede_compartir, roles_acceso, ejemplo, color_hex, orden)
VALUES
  ('publico',
   'Publico',
   'Info que se publica en widgets, redes sociales, sitios reciclean.cl/farex.cl. Cualquiera la ve.',
   true, true,
   ARRAY['publico'],
   'Precios publicados, telefono comercial, direccion sucursales activas',
   '#22c55e', 1),

  ('operativo',
   'Operativo interno',
   'Info que el equipo usa dia a dia. Diego la consulta para responder al equipo. NO se publica.',
   true, false,
   ARRAY['nivel_2','nivel_3'],
   'Procesos de despacho, contactos del equipo, rutas de camion, cliente quien coordina, FAQs internas',
   '#3b82f6', 2),

  ('restringido',
   'Restringido',
   'Info sensible operativa: margenes, costos, datos clientes. Solo nivel 2+ y solo bajo solicitud explicita. Diego NO la usa por defecto.',
   false, false,
   ARRAY['nivel_2','nivel_3'],
   'Margenes por material, costos compra, listas precios cliente, deudas',
   '#f59e0b', 3),

  ('confidencial',
   'Confidencial',
   'Info estrategica/personal. Solo Dusan. Diego NO la conoce ni la consulta.',
   false, false,
   ARRAY['nivel_3'],
   'Sueldos, despidos, conflictos personales, estrategia comercial, finanzas privadas, negociaciones en curso',
   '#ef4444', 4);

CREATE INDEX IF NOT EXISTS idx_clasif_codigo ON clasificacion_informacion(codigo);

-- ----------------------------------------------------------------
-- 2. conocimiento_documentos  (inventario: que info entra al sistema y como se clasifica)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conocimiento_documentos (
  id BIGSERIAL PRIMARY KEY,
  origen_tipo TEXT CHECK (origen_tipo IN ('archivo','carpeta','tabla','vista','url','mensaje','workflow')) NOT NULL,
  origen_path TEXT,                    -- 'casos-diego/', 'PENDIENTES.md', 'tabla:precios', 'https://portalvu.mma.gob.cl'
  titulo TEXT NOT NULL,
  resumen TEXT,
  categoria_tematica TEXT,             -- 'precios','operacion','rrhh','finanzas','permisologia','incidente_asistente','difusion','spec_tecnico','sesion_claude'
  clasificacion_id BIGINT REFERENCES clasificacion_informacion(id) NOT NULL,
  fuente_carga TEXT,                   -- 'dusan','pablo','andrea','sistema'
  fecha_carga DATE NOT NULL DEFAULT CURRENT_DATE,
  visible_para_diego BOOLEAN DEFAULT false,   -- override puntual sobre clasificacion (excepcion)
  indexado_rag BOOLEAN DEFAULT false,         -- esta inyectado en procesos_empresa para que Diego lo consulte?
  rol_aplicable TEXT[],                -- a quien le sirve: ['comercial','permisologia','operaciones']
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conoc_clasificacion ON conocimiento_documentos(clasificacion_id);
CREATE INDEX IF NOT EXISTS idx_conoc_categoria ON conocimiento_documentos(categoria_tematica);
CREATE INDEX IF NOT EXISTS idx_conoc_visible_diego ON conocimiento_documentos(visible_para_diego) WHERE visible_para_diego = true;
CREATE INDEX IF NOT EXISTS idx_conoc_origen_path ON conocimiento_documentos(origen_path);
ALTER TABLE conocimiento_documentos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3. Vista: lo que Diego SI puede leer (combina clasificacion + override)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW v_diego_puede_leer AS
SELECT
  d.id,
  d.origen_tipo,
  d.origen_path,
  d.titulo,
  d.resumen,
  d.categoria_tematica,
  c.codigo AS clasificacion,
  d.indexado_rag,
  d.rol_aplicable,
  d.fecha_carga
FROM conocimiento_documentos d
JOIN clasificacion_informacion c ON c.id = d.clasificacion_id
WHERE c.diego_puede_leer = true OR d.visible_para_diego = true;

-- ----------------------------------------------------------------
-- 4. Seeds: inventario inicial con lo creado el 20-21 abr
-- ----------------------------------------------------------------

-- Resolver IDs de clasificacion
WITH cl AS (
  SELECT codigo, id FROM clasificacion_informacion
)
INSERT INTO conocimiento_documentos
  (origen_tipo, origen_path, titulo, resumen, categoria_tematica, clasificacion_id, fuente_carga, fecha_carga, visible_para_diego, indexado_rag, rol_aplicable, notas)
VALUES
  -- Carpeta nueva 1: casos-diego/  (operativo interno, NO visible a Diego — es evidencia de sus fallas)
  ('carpeta', 'casos-diego/',
   'Casos documentados de fallas del Asistente Diego con el equipo',
   'Cada archivo registra un incidente: fecha, contacto, duracion, mensajes, que hizo mal, que debio hacer. Sirve para detectar bugs sistemicos. NO indexar en RAG (sesgaria a Diego).',
   'incidente_asistente',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'dusan', '2026-04-20', false, false,
   ARRAY['tech','direccion'],
   'Migrar a tabla casos_asistente. Mientras tanto, Dusan y Pablo lo leen, Diego NO.'),

  -- Carpeta nueva 2: mensajes-equipo/  (operativo interno, NO visible a Diego)
  ('carpeta', 'mensajes-equipo/',
   'Borradores de mensajes para difusion al equipo',
   'Mensajes personalizados que Dusan envia desde su WhatsApp al equipo. Tono reflexivo, referencian casos concretos.',
   'difusion',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'dusan', '2026-04-20', false, false,
   ARRAY['direccion'],
   'Migrar a tabla plantillas_mensajes.'),

  -- Carpeta nueva 3: docs/  (operativo, especificaciones tecnicas — Diego no necesita verlas)
  ('carpeta', 'docs/',
   'Especificaciones tecnicas y guias de implementacion',
   'Documentos de diseño Diego v4.2, plan de implementacion 21-abr, etc.',
   'spec_tecnico',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'dusan', '2026-04-20', false, false,
   ARRAY['tech'],
   'Para Pablo. Diego no debe consumir specs como si fueran procesos.'),

  -- Archivo individual: PENDIENTES.md
  ('archivo', 'PENDIENTES.md',
   'Lista viva de tareas pendientes del proyecto',
   '6 tareas P1-P6 + 28 bugs detectados en P5.',
   'sesion_claude',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'dusan', '2026-04-20', false, false,
   ARRAY['direccion','tech'],
   'Migrar a tablas tareas y bugs_asistente.'),

  -- Archivo: CONTINUAR_SESION_DIEGO.txt
  ('archivo', 'CONTINUAR_SESION_DIEGO.txt',
   'Prompt de continuidad sesion movil 20-abr',
   'Contexto para retomar la sesion en otro dispositivo.',
   'sesion_claude',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'dusan', '2026-04-20', false, false,
   ARRAY['direccion','tech'], NULL),

  -- Tabla existente: precios (publico — los precios se publican en widgets)
  ('tabla', 'tabla:precios',
   'Precios por material x sucursal',
   'Precios vigentes que Diego puede consultar para responder a clientes y al equipo.',
   'precios',
   (SELECT id FROM cl WHERE codigo='publico'),
   'sistema', '2026-04-18', true, false,
   ARRAY['comercial','operaciones','direccion'],
   'Indexar en RAG procesos_empresa. Diego SI puede dar precio publicado.'),

  -- Tabla: precios_cliente (RESTRINGIDO — margenes y precios cliente especifico)
  ('tabla', 'tabla:precios_cliente',
   'Precios negociados con cada cliente',
   'Info comercial sensible. Diego NO debe revelarla aunque le pregunten.',
   'precios',
   (SELECT id FROM cl WHERE codigo='restringido'),
   'sistema', '2026-04-18', false, false,
   ARRAY['direccion'], NULL),

  -- Tabla: contactos (operativo — Diego necesita saber telefonos del equipo para generar wa.me)
  ('tabla', 'tabla:contactos',
   'Whitelist del equipo (9 personas)',
   'Telefono, nombre, nivel, rol, sucursal. Diego usa esta info para generar links wa.me.',
   'operacion',
   (SELECT id FROM cl WHERE codigo='operativo'),
   'sistema', '2026-04-18', true, true,
   ARRAY['comercial','operaciones','tech','permisologia'], NULL),

  -- Carpeta hipotetica futura: finanzas privadas (CONFIDENCIAL — Diego nunca)
  ('carpeta', 'finanzas-privadas/ (futuro)',
   'Sueldos, gastos personales, negociaciones bancarias',
   'NO existe aun. Cuando exista, Diego NO la accede bajo ninguna circunstancia.',
   'finanzas',
   (SELECT id FROM cl WHERE codigo='confidencial'),
   'dusan', '2026-04-22', false, false,
   ARRAY['direccion'],
   'Recordatorio para cuando se cree.');

-- ----------------------------------------------------------------
-- Validacion
-- ----------------------------------------------------------------
SELECT
  d.titulo,
  d.origen_path,
  c.codigo AS clasificacion,
  d.visible_para_diego,
  d.indexado_rag
FROM conocimiento_documentos d
JOIN clasificacion_informacion c ON c.id = d.clasificacion_id
ORDER BY c.orden, d.fecha_carga DESC;

-- Que puede leer Diego hoy:
SELECT * FROM v_diego_puede_leer ORDER BY clasificacion, fecha_carga DESC;
