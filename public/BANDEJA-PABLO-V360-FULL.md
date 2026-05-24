# Bandeja Pablo — Spec `panel.v_cliente_360_full` (vista unificada Impulsa + curated)

> Hallazgo en sesión 2026-05-24 madrugada con Dusan. Cliente **PINCORE** (cliente_id=c29) es 100% curated (no está en CRM Impulsa) y tiene 1 oportunidad URGENTE por 14.5 UF. La ficha 360 actual del panel le diría "sin oportunidades" porque solo lee Impulsa. Esto viola R-AUD-008 (no decir "no hay" sin verificar).
>
> Spec listo para que vos lo apliques como mig 069 cuando tomes el ticket.

---

## Problema

`panel.v_crm_cliente_360` (la fuente actual de la ficha 360 del panel) solo lee `panel.v_crm_impulsa_*`. Si un cliente fue cargado a mano en `curated.clientes` (sin venir del CRM Impulsa), la ficha aparece vacía aunque tenga oportunidades, cartera y cotizaciones internas.

**Ejemplo real PINCORE (cliente_id=c29):**
- `curated.clientes`: ✅ existe (giro industrial_demolicion, sucursal Maipú, rol_rep GENERADOR)
- `curated.cartera_clientes_categoria`: ✅ categoría "en_prueba", calidad 4, encaje sí, motivo URGENTE
- `curated.oportunidades`: ✅ 1 oportunidad abierta — chatarra ferrosa, 5-10k kg/semanal, 14.5 UF, en_evaluacion
- `panel.v_crm_cliente_360`: ❌ **no aparece** (porque no está en Impulsa)

## Solución propuesta — NUEVA vista, no reemplazar la actual

Crear `panel.v_cliente_360_full` con UNION ALL de 2 mundos:

1. **Origin `impulsa`**: clientes de CRM Impulsa con contadores que también suman `curated` cuando hay matching por `curated.clientes.external_id_crm = id_impulsa`.
2. **Origin `curated`**: clientes de `curated.clientes` que NO tienen `external_id_crm` (puros internos).

La vista `v_crm_cliente_360` **NO se toca** — sigue funcionando para el código actual del panel que la consume (línea 7526 panel-rdo.html). El front migra a la nueva vista en una iteración separada.

## SQL — Mig 069 (lista para aplicar)

```sql
-- ============================================================
-- Mig 069 · panel.v_cliente_360_full
-- ============================================================
-- Vista canónica de ficha 360 que une CRM Impulsa + curated.
-- Reemplaza progresivamente a panel.v_crm_cliente_360
-- (esta sigue activa para back-compat hasta que el front migre).
-- ============================================================

CREATE OR REPLACE VIEW panel.v_cliente_360_full AS
WITH
-- 1) Cartera vigente por cliente_id (curated)
cartera AS (
  SELECT cliente_id, categoria_id AS cartera_categoria,
         calidad_relacion, encaje_estrategico, riesgo_legal,
         motivo_asignacion AS cartera_motivo,
         fecha_asignacion AS cartera_fecha
  FROM curated.cartera_clientes_categoria
  WHERE vigente = true
),
-- 2) Agregados de oportunidades curated por cliente_id
opos_curated AS (
  SELECT cliente_id,
         COUNT(*) AS n_op_internas,
         COUNT(*) FILTER (WHERE estado NOT IN ('cerrada','perdida','cancelada')) AS n_op_internas_abiertas,
         SUM(valor_estimado_uf) FILTER (WHERE estado NOT IN ('cerrada','perdida','cancelada')) AS uf_pipeline_internas,
         MAX(fecha_recepcion) AS ultima_op_interna_at
  FROM curated.oportunidades
  WHERE cliente_id IS NOT NULL
  GROUP BY cliente_id
),
-- 3) Agregados de contactos curated por cliente_id
contactos_curated AS (
  SELECT cliente_id, COUNT(*) AS n_contactos_internos
  FROM curated.contactos_clientes
  WHERE cliente_id IS NOT NULL
  GROUP BY cliente_id
),
-- 4) Bloque 1: clientes que vienen de Impulsa (con o sin matching curated)
desde_impulsa AS (
  SELECT
    'impulsa'::text             AS origen,
    c.id_impulsa,
    cu.cliente_id               AS cliente_id_curated,
    COALESCE(cu.razon_social, c.razon_social) AS razon_social,
    COALESCE(cu.rut, c.rut)     AS rut,
    c.estado                    AS estado_impulsa,
    c.segmento,
    cu.giro_id,
    cu.sucursal_principal,
    cu.rol_rep,
    -- Cartera (solo si hay matching curated)
    car.cartera_categoria,
    car.calidad_relacion,
    car.encaje_estrategico,
    car.riesgo_legal,
    car.cartera_motivo,
    car.cartera_fecha,
    -- Contadores Impulsa
    (SELECT COUNT(*) FROM panel.v_crm_impulsa_contactos x WHERE x.id_cliente = c.id_impulsa) AS n_contactos_impulsa,
    (SELECT COUNT(*) FROM panel.v_crm_impulsa_oportunidades x WHERE x.cliente_rut = c.rut) AS n_op_impulsa,
    (SELECT COUNT(*) FROM panel.v_crm_impulsa_oportunidades x WHERE x.cliente_rut = c.rut AND x.estado = 'Abierta') AS n_op_impulsa_abiertas,
    (SELECT COUNT(*) FROM panel.v_crm_impulsa_cotizaciones x WHERE x.cliente_rut = c.rut) AS n_cotizaciones,
    (SELECT MAX(x.fecha_creacion) FROM panel.v_crm_impulsa_oportunidades x WHERE x.cliente_rut = c.rut) AS ultima_op_impulsa_at,
    -- Contadores curated (solo si hay matching)
    COALESCE(cc.n_contactos_internos, 0) AS n_contactos_internos,
    COALESCE(oc.n_op_internas, 0) AS n_op_internas,
    COALESCE(oc.n_op_internas_abiertas, 0) AS n_op_internas_abiertas,
    COALESCE(oc.uf_pipeline_internas, 0) AS uf_pipeline_internas,
    oc.ultima_op_interna_at
  FROM panel.v_crm_impulsa_clientes c
  LEFT JOIN curated.clientes cu ON cu.external_id_crm = c.id_impulsa
  LEFT JOIN cartera car ON car.cliente_id = cu.cliente_id
  LEFT JOIN opos_curated oc ON oc.cliente_id = cu.cliente_id
  LEFT JOIN contactos_curated cc ON cc.cliente_id = cu.cliente_id
),
-- 5) Bloque 2: clientes 100% curated (no están en Impulsa)
desde_curated AS (
  SELECT
    'curated'::text             AS origen,
    NULL::text                  AS id_impulsa,
    cu.cliente_id               AS cliente_id_curated,
    cu.razon_social,
    cu.rut,
    CASE WHEN cu.activo THEN 'activo' ELSE 'inactivo' END AS estado_impulsa,
    NULL::text                  AS segmento,
    cu.giro_id,
    cu.sucursal_principal,
    cu.rol_rep,
    car.cartera_categoria,
    car.calidad_relacion,
    car.encaje_estrategico,
    car.riesgo_legal,
    car.cartera_motivo,
    car.cartera_fecha,
    0::bigint AS n_contactos_impulsa,
    0::bigint AS n_op_impulsa,
    0::bigint AS n_op_impulsa_abiertas,
    0::bigint AS n_cotizaciones,
    NULL::timestamp AS ultima_op_impulsa_at,
    COALESCE(cc.n_contactos_internos, 0) AS n_contactos_internos,
    COALESCE(oc.n_op_internas, 0) AS n_op_internas,
    COALESCE(oc.n_op_internas_abiertas, 0) AS n_op_internas_abiertas,
    COALESCE(oc.uf_pipeline_internas, 0) AS uf_pipeline_internas,
    oc.ultima_op_interna_at
  FROM curated.clientes cu
  LEFT JOIN cartera car ON car.cliente_id = cu.cliente_id
  LEFT JOIN opos_curated oc ON oc.cliente_id = cu.cliente_id
  LEFT JOIN contactos_curated cc ON cc.cliente_id = cu.cliente_id
  WHERE cu.external_id_crm IS NULL  -- evitar duplicar los ya en Impulsa
)
-- 6) UNION final + columnas derivadas útiles para la UI
SELECT
  *,
  (n_contactos_impulsa + n_contactos_internos) AS n_contactos_total,
  (n_op_impulsa + n_op_internas)               AS n_op_total,
  (n_op_impulsa_abiertas + n_op_internas_abiertas) AS n_op_abiertas_total,
  GREATEST(
    COALESCE(ultima_op_impulsa_at, '1970-01-01'::timestamp),
    COALESCE(ultima_op_interna_at, '1970-01-01'::timestamp)
  ) AS ultima_actividad_at
FROM (
  SELECT * FROM desde_impulsa
  UNION ALL
  SELECT * FROM desde_curated
) u;

COMMENT ON VIEW panel.v_cliente_360_full IS
  'Mig 069. Ficha 360 unificada CRM Impulsa + curated. Reemplaza progresivamente a panel.v_crm_cliente_360 (esta sigue para back-compat). Fix R-AUD-008: clientes 100% curated (como Pincore c29) ahora aparecen con sus oportunidades, cartera y contactos internos.';
```

## Test de aceptación

Después de aplicar, este SELECT debe mostrar a PINCORE con su oportunidad real:

```sql
SELECT origen, cliente_id_curated, razon_social, cartera_categoria,
       n_op_abiertas_total, uf_pipeline_internas, ultima_actividad_at
FROM panel.v_cliente_360_full
WHERE razon_social ILIKE '%pincore%';
```

**Esperado:**
```
origen    | cliente_id_curated | razon_social | cartera_categoria | n_op_abiertas_total | uf_pipeline_internas | ultima_actividad_at
----------+--------------------+--------------+-------------------+---------------------+----------------------+--------------------
curated   | c29                | Pincore      | en_prueba         | 1                   | 14.5                 | 2026-05-11
```

## Cambio en el front (panel-rdo.html, después de aplicar mig 069)

Línea 7526 actual:
```js
sb.schema('panel').from('v_crm_cliente_360').select('*').eq('id_impulsa', idImpulsa).maybeSingle()
```

Cambio:
```js
// Query unificada: matchea por id_impulsa O por cliente_id_curated
sb.schema('panel').from('v_cliente_360_full').select('*')
  .or(`id_impulsa.eq.${idImpulsa},cliente_id_curated.eq.${idCurated}`)
  .maybeSingle()
```

Y el render del drawer debe sumar el bloque **"Oportunidades + pipeline UF (curated)"** además de los contadores Impulsa.

## Estimación

- **DDL aplicar**: 2 min (1 query CREATE OR REPLACE VIEW).
- **Front update**: 15 min (modificar query + bloque drawer).
- **QA con Pincore**: 5 min (login Dusan → tab Cartera → buscar Pincore → click → verificar que aparece la oportunidad).

## Por qué no lo apliqué yo ahora

Regla CLAUDE.md PC Dusan: *"Supabase: SELECT en todo. Para DML/DDL, pasarle al PC Pablo el SQL propuesto."* DDL = pasa a Pablo. Yo solo dejo el spec.

---

**Firmado:** PC Dusan, 2026-05-24 madrugada. Spec validado contra schema real (verificado columnas reales de las 4 tablas involucradas + viewdef actual de `v_crm_cliente_360`).
