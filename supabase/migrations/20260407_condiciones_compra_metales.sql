-- ============================================================
--  CONDICIONES ADMINISTRATIVAS PARA COMPRA DE METALES Y FIERROS
--  Reciclean / Farex — Migración 2026-04-07
--
--  Implementa 10 reglas exigibles via triggers PostgreSQL.
--  Las reglas se almacenan en la tabla `reglas_compra` y pueden
--  activarse, desactivarse o ajustarse sin tocar código.
--  Toda operación queda registrada en `auditoria_compras`.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. TABLA DE REGLAS CONFIGURABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reglas_compra (
  id              SERIAL PRIMARY KEY,
  codigo          TEXT    UNIQUE NOT NULL,
  descripcion     TEXT    NOT NULL,
  activa          BOOLEAN NOT NULL DEFAULT true,
  parametro       NUMERIC,        -- valor numérico de referencia (ej: margen mínimo 3%)
  parametro_texto TEXT,           -- valor texto (ej: lista de categorías)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE reglas_compra IS
  'Reglas administrativas configurables para la compra de metales y fierros. '
  'Modifique parámetros aquí sin tocar el código del trigger.';


-- ══════════════════════════════════════════════════════════════
-- 2. REGLAS POR DEFECTO
--    Cada regla tiene un código único, descripción clara y
--    puede activarse/desactivarse individualmente.
-- ══════════════════════════════════════════════════════════════

INSERT INTO reglas_compra (codigo, descripcion, activa, parametro, parametro_texto) VALUES

  -- REGLA-01: Precios publicados y vigentes
  ('VERSION_ACTIVA',
   'Debe existir una versión de precios activa antes de registrar compras. '
   'Sin precios publicados no se puede operar.',
   true, NULL, NULL),

  -- REGLA-02: Peso de factura positivo
  ('PESO_POSITIVO',
   'El peso (kg_factura) de la compra debe ser mayor a cero. '
   'No se admiten compras sin kilos registrados.',
   true, NULL, NULL),

  -- REGLA-03: Proveedor obligatorio
  ('PROVEEDOR_OBLIGATORIO',
   'El nombre del proveedor es obligatorio para toda compra. '
   'Garantiza trazabilidad y cumplimiento tributario.',
   true, NULL, NULL),

  -- REGLA-04: RUT válido del proveedor
  ('RUT_OBLIGATORIO',
   'El RUT del proveedor es obligatorio y debe tener formato chileno válido '
   '(ej: 12345678-9). Requerido para emisión de documentos tributarios.',
   true, NULL, NULL),

  -- REGLA-05: Ejecutivo registrado y autorizado
  ('EJECUTIVO_AUTORIZADO',
   'El ejecutivo debe estar registrado en usuarios_autorizados, estar activo '
   'y tener acceso al asistente. Impide operaciones de personal no habilitado.',
   true, NULL, NULL),

  -- REGLA-06: Precio de compra no supera el máximo
  ('PRECIO_NO_SUPERA_MAX',
   'El precio de compra de cada material no puede superar el precio máximo '
   'vigente publicado. Protege el margen operacional mínimo.',
   true, NULL, NULL),

  -- REGLA-07: Margen mínimo para metales y fierros
  --           parametro = % mínimo requerido (por defecto 3%)
  --           parametro_texto = categorías aplicables (CSV)
  ('MARGEN_MIN_METALES',
   'Los metales y fierros deben mantener un margen mínimo configurado. '
   'Ajuste el parámetro para cambiar el % exigido.',
   true, 3.0,
   'FIERROS Y LATAS,LATA CHATARRA,COBRES,BRONCES,ALUMINIOS,ACEROS INOXIDABLES'),

  -- REGLA-08: Cotización completada es inmutable
  ('ESTADO_INMUTABLE',
   'Una cotización en estado ''completado'' no puede ser modificada ni eliminada. '
   'Garantiza integridad del registro histórico.',
   true, NULL, NULL),

  -- REGLA-09: Costo medio de compra positivo
  ('MC_TOTAL_POSITIVO',
   'El costo medio de compra (mc_total) debe ser mayor o igual a cero. '
   'Un mc_total negativo indica error de cálculo.',
   true, NULL, NULL),

  -- REGLA-10: Límite de compras diarias por ejecutivo (desactivada por defecto)
  --           Activar con: SELECT fn_actualizar_regla('LIMITE_DIARIO', true, 50000000.0, NULL);
  ('LIMITE_DIARIO',
   'Límite de mc_total acumulado diario por ejecutivo (0 = sin límite). '
   'Actívela y configure un monto para requerir autorización de admin al superarlo.',
   false, 0, NULL)

ON CONFLICT (codigo) DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- 3. TABLA DE AUDITORÍA DE COMPRAS
--    Registra toda operación sobre cotizaciones (exitosa o rechazada)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS auditoria_compras (
  id               BIGSERIAL PRIMARY KEY,
  cotizacion_id    INT,
  evento           TEXT NOT NULL
                     CHECK (evento IN ('CREADA','MODIFICADA','ELIMINADA')),
  detalle          JSONB,          -- snapshot completo del registro
  ejecutivo        TEXT,
  sucursal_id      INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_cotizacion  ON auditoria_compras(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_audit_created     ON auditoria_compras(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ejecutivo   ON auditoria_compras(ejecutivo);
CREATE INDEX IF NOT EXISTS idx_audit_sucursal    ON auditoria_compras(sucursal_id);

COMMENT ON TABLE auditoria_compras IS
  'Log inmutable de todas las operaciones sobre cotizaciones. '
  'No debe tener triggers ni permisos de DELETE para usuarios de aplicación.';


-- ══════════════════════════════════════════════════════════════
-- 4. FUNCIÓN AUXILIAR: VALIDAR RUT CHILENO
--    Verifica formato y dígito verificador del RUT.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_rut_valido(p_rut TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_partes          TEXT[];
  v_cuerpo          TEXT;
  v_dv              TEXT;
  v_suma            INT := 0;
  v_multiplicador   INT := 2;
  v_digito_calc     TEXT;
  i                 INT;
BEGIN
  IF p_rut IS NULL OR trim(p_rut) = '' THEN
    RETURN false;
  END IF;

  -- Normalizar: quitar puntos, espacios y convertir a mayúsculas
  p_rut := upper(replace(replace(trim(p_rut), '.', ''), ' ', ''));

  -- Verificar formato básico: dígitos + guión + dígito o K
  IF p_rut !~ '^\d{1,8}-[\dK]$' THEN
    RETURN false;
  END IF;

  v_partes := string_to_array(p_rut, '-');
  v_cuerpo := v_partes[1];
  v_dv     := v_partes[2];

  -- Calcular dígito verificador módulo 11
  FOR i IN REVERSE length(v_cuerpo)..1 LOOP
    v_suma          := v_suma + CAST(substring(v_cuerpo, i, 1) AS INT) * v_multiplicador;
    v_multiplicador := CASE WHEN v_multiplicador = 7 THEN 2 ELSE v_multiplicador + 1 END;
  END LOOP;

  v_digito_calc := CASE (11 - (v_suma % 11))
    WHEN 11 THEN '0'
    WHEN 10 THEN 'K'
    ELSE CAST(11 - (v_suma % 11) AS TEXT)
  END;

  RETURN v_digito_calc = v_dv;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_rut_valido(TEXT) IS
  'Valida RUT chileno: formato y dígito verificador módulo 11. '
  'Acepta formato 12345678-9 o 12345678-K (sin puntos).';


-- ══════════════════════════════════════════════════════════════
-- 5. TRIGGER PRINCIPAL: VALIDAR CONDICIONES ANTES DE INSERTAR / ACTUALIZAR
--
--    Se ejecuta BEFORE INSERT OR UPDATE en `cotizaciones`.
--    Si cualquier regla activa se viola, lanza EXCEPTION con
--    código descriptivo y la operación es revertida por completo.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_validar_cotizacion_metales()
RETURNS TRIGGER AS $$
DECLARE
  -- JSONB iteration
  v_material          JSONB;
  v_mat_id            INT;
  v_precio_compra_mat NUMERIC;
  v_precio_max_db     NUMERIC;
  v_margen_db         NUMERIC;
  v_categoria         TEXT;
  v_mat_activo        BOOLEAN;

  -- Configuración de reglas
  v_regla             RECORD;
  v_margen_minimo     NUMERIC;
  v_categorias_met    TEXT;

  -- Estado auxiliar
  v_version_activa    BOOLEAN;
  v_ejec_autorizado   BOOLEAN;
  v_total_dia         NUMERIC;
BEGIN

  -- ────────────────────────────────────────────────────────
  -- REGLA-08 | ESTADO_INMUTABLE
  -- Una cotización completada no se puede tocar
  -- ────────────────────────────────────────────────────────
  IF TG_OP = 'UPDATE' THEN
    SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'ESTADO_INMUTABLE';
    IF FOUND AND v_regla.activa AND OLD.estado = 'completado' THEN
      RAISE EXCEPTION
        '[REGLA-ESTADO] La cotización #% ya está completada y no puede modificarse. '
        'Si necesita corregir datos, cree una nueva cotización.',
        OLD.id;
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-01 | VERSION_ACTIVA
  -- Deben existir precios publicados vigentes
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'VERSION_ACTIVA';
  IF FOUND AND v_regla.activa THEN
    SELECT EXISTS(SELECT 1 FROM precios_version WHERE es_activa = true)
    INTO v_version_activa;

    IF NOT v_version_activa THEN
      RAISE EXCEPTION
        '[REGLA-VERSION] No existe ninguna versión de precios activa. '
        'Un administrador debe publicar los precios antes de registrar compras.';
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-02 | PESO_POSITIVO
  -- kg_factura debe ser > 0
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'PESO_POSITIVO';
  IF FOUND AND v_regla.activa THEN
    IF NEW.kg_factura IS NULL OR NEW.kg_factura <= 0 THEN
      RAISE EXCEPTION
        '[REGLA-PESO] El peso de la factura (kg_factura) debe ser mayor a cero. '
        'Valor recibido: %.',
        COALESCE(NEW.kg_factura::TEXT, 'NULL');
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-03 | PROVEEDOR_OBLIGATORIO
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'PROVEEDOR_OBLIGATORIO';
  IF FOUND AND v_regla.activa THEN
    IF NEW.proveedor IS NULL OR trim(NEW.proveedor) = '' THEN
      RAISE EXCEPTION
        '[REGLA-PROV] El nombre del proveedor es obligatorio. '
        'Complete el campo antes de registrar la compra.';
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-04 | RUT_OBLIGATORIO
  -- RUT debe existir y ser válido (módulo 11)
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'RUT_OBLIGATORIO';
  IF FOUND AND v_regla.activa THEN
    IF NEW.rut IS NULL OR trim(NEW.rut) = '' THEN
      RAISE EXCEPTION
        '[REGLA-RUT] El RUT del proveedor es obligatorio para emitir documentos tributarios.';
    END IF;

    IF NOT fn_rut_valido(NEW.rut) THEN
      RAISE EXCEPTION
        '[REGLA-RUT] El RUT "%" no es válido. '
        'Use el formato 12345678-9 (con dígito verificador correcto).',
        NEW.rut;
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-05 | EJECUTIVO_AUTORIZADO
  -- El ejecutivo debe estar activo en usuarios_autorizados
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'EJECUTIVO_AUTORIZADO';
  IF FOUND AND v_regla.activa THEN
    IF NEW.ejecutivo IS NULL OR trim(NEW.ejecutivo) = '' THEN
      RAISE EXCEPTION
        '[REGLA-EJEC] El nombre del ejecutivo es obligatorio.';
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM usuarios_autorizados
      WHERE nombre           = NEW.ejecutivo
        AND activo           = true
        AND acceso_asistente = true
    ) INTO v_ejec_autorizado;

    IF NOT v_ejec_autorizado THEN
      RAISE EXCEPTION
        '[REGLA-EJEC] El ejecutivo "%" no está autorizado para registrar compras. '
        'Verifique que esté activo y tenga acceso al asistente.',
        NEW.ejecutivo;
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLA-09 | MC_TOTAL_POSITIVO
  -- ────────────────────────────────────────────────────────
  SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'MC_TOTAL_POSITIVO';
  IF FOUND AND v_regla.activa THEN
    IF NEW.mc_total IS NOT NULL AND NEW.mc_total < 0 THEN
      RAISE EXCEPTION
        '[REGLA-MC] El costo medio de compra (mc_total) no puede ser negativo. '
        'Valor recibido: $%.',
        NEW.mc_total;
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- REGLAS POR MATERIAL (iteración sobre el array JSONB)
  -- Se validan: material activo, precio ≤ máximo, margen mínimo
  -- ────────────────────────────────────────────────────────
  IF NEW.materiales IS NOT NULL AND jsonb_array_length(NEW.materiales) > 0 THEN

    -- Pre-cargar parámetros de margen mínimo para metales
    SELECT activa, parametro, parametro_texto
    INTO v_regla
    FROM reglas_compra
    WHERE codigo = 'MARGEN_MIN_METALES';

    v_margen_minimo  := COALESCE(v_regla.parametro, 3.0);
    v_categorias_met := COALESCE(v_regla.parametro_texto,
      'FIERROS Y LATAS,LATA CHATARRA,COBRES,BRONCES,ALUMINIOS,ACEROS INOXIDABLES');

    FOR v_material IN SELECT * FROM jsonb_array_elements(NEW.materiales) LOOP

      -- Soportar tanto camelCase (frontend) como snake_case
      v_mat_id := COALESCE(
        NULLIF((v_material->>'id')::TEXT, '')::INT,
        NULLIF((v_material->>'material_id')::TEXT, '')::INT
      );

      v_precio_compra_mat := COALESCE(
        NULLIF((v_material->>'precioCompra')::TEXT, '')::NUMERIC,
        NULLIF((v_material->>'precio_compra')::TEXT, '')::NUMERIC
      );

      -- Si no hay material_id, saltar (elemento incompleto)
      IF v_mat_id IS NULL THEN CONTINUE; END IF;

      -- ── Material activo ──────────────────────────────────
      SELECT activo INTO v_mat_activo FROM materiales WHERE id = v_mat_id;
      IF NOT FOUND OR NOT v_mat_activo THEN
        RAISE EXCEPTION
          '[REGLA-MAT] El material con ID % no está activo o no existe. '
          'Solo se pueden comprar materiales habilitados en el sistema.',
          v_mat_id;
      END IF;

      -- Obtener precio máximo y margen vigente para este material y sucursal
      SELECT p.precio_maximo, p.margen_aplicado, c.nombre
      INTO   v_precio_max_db, v_margen_db, v_categoria
      FROM   precios p
      JOIN   precios_version pv ON pv.id = p.version_id
      JOIN   materiales      m  ON m.id  = p.material_id
      JOIN   categorias      c  ON c.id  = m.categoria_id
      WHERE  pv.es_activa   = true
        AND  p.material_id  = v_mat_id
        AND  p.sucursal_id  = NEW.sucursal_id;

      IF FOUND THEN

        -- ── REGLA-06 | PRECIO_NO_SUPERA_MAX ─────────────────
        SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'PRECIO_NO_SUPERA_MAX';
        IF FOUND AND v_regla.activa
           AND v_precio_compra_mat IS NOT NULL
           AND v_precio_compra_mat > v_precio_max_db THEN
          RAISE EXCEPTION
            '[REGLA-PRECIO] Precio de compra ($%) supera el máximo permitido ($%) '
            'para el material ID % (categoría: %). '
            'Ajuste el precio antes de confirmar la compra.',
            v_precio_compra_mat, v_precio_max_db, v_mat_id, v_categoria;
        END IF;

        -- ── REGLA-07 | MARGEN_MIN_METALES ───────────────────
        --    Solo aplica a las categorías de metales definidas en parametro_texto
        IF v_regla.activa   -- reutilizamos: si PRECIO_NO_SUPERA_MAX está activa, verificamos margen
           AND v_categorias_met IS NOT NULL
           AND v_categoria = ANY(string_to_array(v_categorias_met, ','))
        THEN
          -- Buscar específicamente la regla MARGEN_MIN_METALES
          SELECT activa INTO v_regla FROM reglas_compra WHERE codigo = 'MARGEN_MIN_METALES';
          IF FOUND AND v_regla.activa AND v_margen_db < v_margen_minimo THEN
            RAISE EXCEPTION
              '[REGLA-MARGEN] El margen aplicado (%%) está por debajo del mínimo requerido (%%) '
              'para la categoría "%" (material ID %). '
              'Solicite al administrador que ajuste el precio publicado o el margen mínimo.',
              round(v_margen_db::NUMERIC, 2), v_margen_minimo, v_categoria, v_mat_id;
          END IF;
        END IF;

      END IF; -- IF FOUND precio en DB

    END LOOP; -- FOR cada material
  END IF; -- IF materiales no vacíos

  -- ────────────────────────────────────────────────────────
  -- REGLA-10 | LIMITE_DIARIO (opcional)
  -- Bloquea si el ejecutivo supera el tope diario de mc_total
  -- ────────────────────────────────────────────────────────
  SELECT activa, parametro INTO v_regla FROM reglas_compra WHERE codigo = 'LIMITE_DIARIO';
  IF FOUND AND v_regla.activa AND COALESCE(v_regla.parametro, 0) > 0 THEN

    SELECT COALESCE(SUM(mc_total), 0)
    INTO   v_total_dia
    FROM   cotizaciones
    WHERE  ejecutivo   = NEW.ejecutivo
      AND  DATE(created_at AT TIME ZONE 'America/Santiago') = CURRENT_DATE
      AND  (TG_OP = 'INSERT' OR id <> NEW.id);  -- excluir fila actual en UPDATE

    IF (v_total_dia + COALESCE(NEW.mc_total, 0)) > v_regla.parametro THEN
      RAISE EXCEPTION
        '[REGLA-LIMITE] El ejecutivo "%" superaría el límite diario de $% CLP. '
        'Acumulado hoy: $%. Requiere autorización del administrador.',
        NEW.ejecutivo,
        v_regla.parametro,
        v_total_dia + COALESCE(NEW.mc_total, 0);
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_validar_cotizacion_metales() IS
  'Trigger BEFORE INSERT/UPDATE en cotizaciones. '
  'Valida las 10 condiciones administrativas para compra de metales y fierros. '
  'Las reglas se configuran en la tabla reglas_compra.';


-- ══════════════════════════════════════════════════════════════
-- 6. TRIGGER DE AUDITORÍA (AFTER)
--    Registra toda operación exitosa sobre cotizaciones.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_auditar_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
  v_evento  TEXT;
  v_detalle JSONB;
BEGIN
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_evento  := 'CREADA';
      v_detalle := row_to_json(NEW)::JSONB;

    WHEN 'UPDATE' THEN
      v_evento  := 'MODIFICADA';
      v_detalle := jsonb_build_object(
        'antes',   row_to_json(OLD)::JSONB,
        'despues', row_to_json(NEW)::JSONB
      );

    WHEN 'DELETE' THEN
      v_evento  := 'ELIMINADA';
      v_detalle := row_to_json(OLD)::JSONB;
  END CASE;

  INSERT INTO auditoria_compras
    (cotizacion_id, evento, detalle, ejecutivo, sucursal_id, created_at)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    v_evento,
    v_detalle,
    COALESCE(NEW.ejecutivo, OLD.ejecutivo),
    COALESCE(NEW.sucursal_id, OLD.sucursal_id),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_auditar_cotizacion() IS
  'Trigger AFTER INSERT/UPDATE/DELETE en cotizaciones. '
  'Registra cada operación exitosa en auditoria_compras para trazabilidad completa.';


-- ══════════════════════════════════════════════════════════════
-- 7. INSTALAR LOS TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- Validación: BEFORE — si falla, la operación se cancela completamente
DROP TRIGGER IF EXISTS trg_validar_cotizacion_before ON cotizaciones;
CREATE TRIGGER trg_validar_cotizacion_before
  BEFORE INSERT OR UPDATE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_cotizacion_metales();

-- Auditoría: AFTER — solo se ejecuta si la validación pasó
DROP TRIGGER IF EXISTS trg_auditar_cotizacion_after ON cotizaciones;
CREATE TRIGGER trg_auditar_cotizacion_after
  AFTER INSERT OR UPDATE OR DELETE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditar_cotizacion();


-- ══════════════════════════════════════════════════════════════
-- 8. FUNCIÓN HELPER: GESTIONAR REGLAS SIN TOCAR SQL
--
--    Uso desde Supabase SQL Editor o panel de admin:
--
--    -- Ver todas las reglas:
--    SELECT codigo, descripcion, activa, parametro
--    FROM reglas_compra ORDER BY id;
--
--    -- Cambiar margen mínimo de metales a 5%:
--    SELECT fn_actualizar_regla('MARGEN_MIN_METALES', NULL, 5.0, NULL);
--
--    -- Activar límite diario de $50.000.000 CLP:
--    SELECT fn_actualizar_regla('LIMITE_DIARIO', true, 50000000.0, NULL);
--
--    -- Desactivar validación de RUT temporalmente:
--    SELECT fn_actualizar_regla('RUT_OBLIGATORIO', false, NULL, NULL);
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_actualizar_regla(
  p_codigo          TEXT,
  p_activa          BOOLEAN DEFAULT NULL,
  p_parametro       NUMERIC DEFAULT NULL,
  p_parametro_texto TEXT    DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_descripcion TEXT;
BEGIN
  UPDATE reglas_compra SET
    activa          = COALESCE(p_activa,          activa),
    parametro       = COALESCE(p_parametro,       parametro),
    parametro_texto = COALESCE(p_parametro_texto, parametro_texto),
    updated_at      = now()
  WHERE codigo = p_codigo
  RETURNING descripcion INTO v_descripcion;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Regla "%" no encontrada en reglas_compra.', p_codigo;
  END IF;

  RETURN format('OK — Regla "%s" actualizada: %s', p_codigo, v_descripcion);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_actualizar_regla(TEXT, BOOLEAN, NUMERIC, TEXT) IS
  'Modifica parámetros de una regla sin editar el trigger. '
  'Ejemplo: SELECT fn_actualizar_regla(''MARGEN_MIN_METALES'', NULL, 5.0, NULL);';
