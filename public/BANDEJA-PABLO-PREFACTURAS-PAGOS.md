# Bandeja Pablo — Mig 070: tablas prefacturas + pagos_emitidos

> Spec listo para que apliques cuando termines el deploy EF v10.13.
> Soporta procesos 19 (prefactura) y 22 (pago proveedor) del MANUAL-OPERATIVO-EQUIPO.md V2.

> ⚠️ **Nota de actualización · 2026-07-07 (Fase 2 Paso 2.4)**
> Las referencias a `curated.facturas` en este spec son históricas. La tabla fue droppeada porque el diseño evolucionó desde 24-jun-2026:
> - Facturas de compra: `curated.facturacion_raw` (scraper `facturacion-cl-scraper`)
> - Facturas emitidas: `curated.facturacion_emitida_raw`
> - Vista canónica unificada: `curated.facturas_todas` (con columna `origen`)
> - Post-Fase 3 (07-jul-2026): la vista shim fue eliminada. Las 20 tools de Diego IA apuntan al layer canónico `curated._facturas_venta_view`.
> Cuando este spec de prefacturas/pagos se implemente, debe apuntar a la nueva arquitectura:
>   - **Compras**: `curated.facturacion_raw` (fuente scraper) o `curated.facturas_todas WHERE origen='compra'`
>   - **Ventas**: `curated.facturacion_emitida_raw` (con trigger auto_privada Ley 21.719) o `curated.facturas_todas WHERE origen='venta'`

---

## Mig 070 — DDL completo

```sql
-- =====================================
-- TABLA 1: curated.prefacturas (proceso 19)
-- =====================================
CREATE TABLE IF NOT EXISTS curated.prefacturas (
  prefactura_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                 TEXT NOT NULL CHECK (tipo IN ('venta','compra')),
  cliente_id           TEXT REFERENCES curated.clientes(cliente_id),
  cliente_nombre_libre TEXT,
  oportunidad_id       UUID REFERENCES curated.oportunidades(oportunidad_id),
  negocio_id           UUID REFERENCES curated.negocio_expedicionario(negocio_id),
  material_id          TEXT,
  cantidad_estimada_kg NUMERIC,
  precio_estimado_clp_kg NUMERIC,
  monto_estimado_clp   NUMERIC GENERATED ALWAYS AS (cantidad_estimada_kg * precio_estimado_clp_kg) STORED,
  sucursal_id          TEXT,
  fecha_emision        DATE NOT NULL DEFAULT CURRENT_DATE,
  validez_dias         INT DEFAULT 30,
  estado               TEXT NOT NULL DEFAULT 'borrador'
                       CHECK (estado IN ('borrador','enviada','aceptada','rechazada','facturada','vencida','anulada')),
  factura_id           UUID,  -- referencia a curated.facturacion_raw (compras) o curated.facturacion_emitida_raw (ventas) cuando se promueve
  delta_pct_aceptado   NUMERIC DEFAULT 5.0,  -- delta % permitido antes de NC
  cantidad_real_kg     NUMERIC,
  monto_real_clp       NUMERIC,
  delta_calculado_pct  NUMERIC GENERATED ALWAYS AS (
    CASE WHEN monto_estimado_clp > 0 AND monto_real_clp IS NOT NULL
         THEN ((monto_real_clp - monto_estimado_clp) / monto_estimado_clp * 100)
         ELSE NULL END
  ) STORED,
  responsable_comercial TEXT,  -- email Andrea
  notas                TEXT,
  pdf_url              TEXT,
  metadata             JSONB DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  created_by           TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_by           TEXT
);
CREATE INDEX IF NOT EXISTS idx_prefacturas_cliente ON curated.prefacturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prefacturas_estado ON curated.prefacturas(estado);
CREATE INDEX IF NOT EXISTS idx_prefacturas_fecha ON curated.prefacturas(fecha_emision DESC);

ALTER TABLE curated.prefacturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prefacturas_read ON curated.prefacturas;
CREATE POLICY prefacturas_read ON curated.prefacturas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS prefacturas_service ON curated.prefacturas;
CREATE POLICY prefacturas_service ON curated.prefacturas FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE curated.prefacturas IS
  'Mig 070 P19. Documento preliminar entre cierre comercial y DTE definitivo. Andrea genera, Dyana promueve. Si delta_calculado_pct > delta_pct_aceptado → NC.';

-- =====================================
-- TABLA 2: curated.pagos_emitidos (proceso 22)
-- =====================================
CREATE TABLE IF NOT EXISTS curated.pagos_emitidos (
  pago_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id           UUID,  -- referencia a curated.facturacion_raw / curated.facturacion_emitida_raw
  factura_folio        TEXT,  -- denormalizado para audit rápido
  proveedor_id         TEXT,
  proveedor_rut        TEXT,
  proveedor_nombre     TEXT NOT NULL,
  monto_clp            BIGINT NOT NULL CHECK (monto_clp > 0),
  moneda               TEXT DEFAULT 'CLP',
  fecha_pago           DATE NOT NULL,
  banco_origen         TEXT,  -- BCI / Santander / etc.
  cuenta_origen        TEXT,
  banco_destino        TEXT,
  cuenta_destino       TEXT,
  metodo               TEXT CHECK (metodo IN ('transferencia','cheque','efectivo','tarjeta','otro')),
  comprobante_url      TEXT,  -- PDF banco
  firmado_por          TEXT,  -- email Dusan
  ejecutado_por        TEXT,  -- email Dyana
  estado               TEXT NOT NULL DEFAULT 'programado'
                       CHECK (estado IN ('programado','firmado','ejecutado','rechazado','anulado','reversado')),
  semana_planilla      TEXT,  -- ej '2026-W21' para agrupar planilla semanal
  notas                TEXT,
  metadata             JSONB DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  created_by           TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_by           TEXT
);
CREATE INDEX IF NOT EXISTS idx_pagos_proveedor ON curated.pagos_emitidos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON curated.pagos_emitidos(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON curated.pagos_emitidos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_semana ON curated.pagos_emitidos(semana_planilla);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON curated.pagos_emitidos(fecha_pago DESC);

ALTER TABLE curated.pagos_emitidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pagos_read ON curated.pagos_emitidos;
CREATE POLICY pagos_read ON curated.pagos_emitidos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS pagos_service ON curated.pagos_emitidos;
CREATE POLICY pagos_service ON curated.pagos_emitidos FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE curated.pagos_emitidos IS
  'Mig 070 P22. Egresos bancarios a proveedores. Dyana prepara, Dusan firma (>10 UF), Dyana ejecuta. Vincula 1:1 con curated.facturacion_raw (compras).';

-- =====================================
-- VISTA: dashboard pagos semana
-- =====================================
CREATE OR REPLACE VIEW panel.v_pagos_semana_actual AS
SELECT
  semana_planilla,
  COUNT(*) AS pagos_total,
  COUNT(*) FILTER (WHERE estado = 'programado') AS pendientes_firma,
  COUNT(*) FILTER (WHERE estado = 'firmado') AS firmados_no_ejecutados,
  COUNT(*) FILTER (WHERE estado = 'ejecutado') AS ejecutados,
  SUM(monto_clp) AS monto_total_clp,
  SUM(monto_clp) FILTER (WHERE estado = 'ejecutado') AS monto_ejecutado_clp
FROM curated.pagos_emitidos
WHERE semana_planilla = to_char(CURRENT_DATE, 'IYYY-"W"IW')
GROUP BY semana_planilla;

COMMENT ON VIEW panel.v_pagos_semana_actual IS 'Mig 070. Dashboard pagos semana actual para card Portada Dusan.';

-- =====================================
-- VISTA: prefacturas pendientes promover
-- =====================================
CREATE OR REPLACE VIEW panel.v_prefacturas_pendientes AS
SELECT
  prefactura_id, tipo, cliente_nombre_libre, monto_estimado_clp,
  cantidad_estimada_kg, fecha_emision, estado,
  EXTRACT(DAY FROM NOW() - fecha_emision) AS dias_emitida
FROM curated.prefacturas
WHERE estado IN ('borrador','enviada','aceptada')
ORDER BY fecha_emision DESC;

COMMENT ON VIEW panel.v_prefacturas_pendientes IS 'Mig 070. Andrea ve en tab Cartera prefacturas que aún no se promovieron a DTE.';
```

## Tests de aceptación

Después de aplicar la mig, ejecutar estos SELECTs:

```sql
-- 1. Tablas creadas y vacías
SELECT 'prefacturas' AS tabla, COUNT(*) FROM curated.prefacturas
UNION ALL SELECT 'pagos_emitidos', COUNT(*) FROM curated.pagos_emitidos;

-- 2. Vistas operativas
SELECT * FROM panel.v_pagos_semana_actual;
SELECT * FROM panel.v_prefacturas_pendientes;

-- 3. Insert demo prefactura Pincore (oportunidad 942b0224... ya existe)
INSERT INTO curated.prefacturas
  (tipo, cliente_id, oportunidad_id, material_id, cantidad_estimada_kg,
   precio_estimado_clp_kg, sucursal_id, responsable_comercial, created_by)
VALUES
  ('compra', 'c29', '942b0224-0a63-4810-99e8-91b04a117705',
   'chatarra_ferrosa', 7500, 80, 'maipu',
   'servicios@gestionrepchile.cl', 'andrea')
RETURNING prefactura_id, monto_estimado_clp;
-- Esperado: monto_estimado_clp = 7500 * 80 = 600.000

-- 4. Verificar delta cuando se carga cantidad real
UPDATE curated.prefacturas
SET cantidad_real_kg = 7200, monto_real_clp = 576000
WHERE cliente_id = 'c29'
RETURNING delta_calculado_pct;
-- Esperado: delta_calculado_pct ≈ -4.0 (dentro del 5% aceptado → se promueve a DTE)
```

## Pendientes UI tras mig 070

| Tab | Cambio |
|---|---|
| **Cartera** | Card "Prefacturas pendientes" usando `v_prefacturas_pendientes` |
| **Facturación** | Botón "Promover prefactura → DTE" + form ajuste delta |
| **Portada Dusan** | Card "Pagos semana" usando `v_pagos_semana_actual` con CTA "Firmar 3 pendientes" |

## Estimación Pablo

- DDL apply: **2 min** (`apply_migration`).
- 3 cards UI: **45 min** (Cartera + Facturación + Portada).
- Insert demo + verificación: **5 min**.

## Por qué no lo apliqué yo

Regla CLAUDE.md: *"Supabase: SELECT en todo. Para DML/DDL, pasarle al PC Pablo el SQL propuesto."* DDL = Pablo.

---

**Firmado:** PC Dusan, 2026-05-24 madrugada. Spec validado contra schemas reales `curated.clientes`, `curated.oportunidades`, `curated.negocio_expedicionario`, `curated.facturas_todas` (post-Fase 3), `panel.tesoreria_kpis`.
