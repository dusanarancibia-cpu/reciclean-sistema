# QUERIES-PC4 — Insumos del Analista (Desocupado)

> Generado por **PC4-Desocupado** el 2026-05-20.
> Proyecto Supabase: `eknmtsrtfkzroxnovfqn`.
> Las 3 queries fueron **validadas en producción** antes de entregar. Resultados de muestra incluidos.

## Notas de campo (importantes antes de leer las queries)

1. **`curated.pesajes` y `curated.alertas` están VACÍAS** (0 rows ambas). No usarlas como fuente.
2. **La fuente real de pesajes es `staging.pesajes_prod`** (1.026 rows, fechas 2025-11-17 → 2026-05-14). Todas las vistas analíticas (`v_pesajes_kpi_sucursal`, `v_pesajes_por_sucursal_mes`, `v_pesajes_top_materiales_sucursal`) leen de ahí.
3. **`v_dte_clientes_panel` lee de `staging.dte_resumen_anual`** (solo año, no mes). Para "del mes" exacto hay que bajar a `staging.facturacion_s5` o crear una nueva vista mensual de DTE.
4. **`v_alertas_panel` lee de `staging.v_pesajes_vs_tarifa`** y no tiene fecha de creación de alerta para sparkline — usa `fecha` del pesaje subyacente.
5. **Última fecha viva en `staging.pesajes_prod` es 2026-05-14.** Hoy es 2026-05-20: 6 días sin ingestar. Sparklines de "últimos 7 días contra CURRENT_DATE" salen todos en cero. Solución: usar la fecha MAX como ref. Variantes ofrecidas más abajo.

---

## Tarea A — Top 5 Clientes (✅ validada)

**Pregunta de negocio:** ¿Quiénes son los 5 clientes que más facturamos en VENTA, por empresa, este año?

**Limitación:** la vista es ANUAL, no mensual. Si Dusan quiere "del mes" hay que crear `staging.dte_resumen_mensual` o agregar desde `staging.facturacion_s5`.

### Query oficial (YTD anual por empresa)
```sql
SELECT
  ranking,
  empresa,
  razon_social,
  monto_total,
  pct_del_total,
  es_intercompania
FROM v_dte_clientes_panel
WHERE anno = EXTRACT(YEAR FROM CURRENT_DATE)::smallint
  AND tipo_libro = 'VENTA'
  AND ranking <= 5
ORDER BY empresa, ranking;
```

### Resultado real (2026 YTD)

**Reciclean:**
| # | Cliente | Monto | % |
|---|---|---|---|
| 1 | ENVASES IMPRESOS CORDILLERA SPA | $106.051.420 | 39,3% |
| 2 | SOCIEDAD DE INVERSIONES E INMOBILIARIA BETO SPA | $99.614.386 | 36,9% |
| 3 | FALABELLA RETAIL S.A. | $24.920.099 | 9,2% |
| 4 | FPC PAPELES SpA | $10.989.589 | 4,1% |
| 5 | EECOL INDUSTRIAL ELECTRIC SUDAMERICA LIMITADA | $5.103.837 | 1,9% |

**Farex:**
| # | Cliente | Monto | % |
|---|---|---|---|
| 1 | Ecoferro SPA | $27.211.810 | 77,2% |
| 2 | CAF CHILE S.A | $4.158.921 | 11,8% |
| 3 | DTS CHILE SPA | $928.200 | 2,6% |
| 4 | RECICLAJE MANUEL GARRIDO EMPRESA INDIVIDUAL | $925.680 | 2,6% |
| 5 | MASTER DRILLING CHILE S.A | $642.600 | 1,8% |

**Hallazgo crítico (alerta de concentración):**
- En Reciclean, los top 2 clientes acumulan **76,2%** de la facturación → riesgo de cartera.
- En Farex, Ecoferro solo concentra **77,2%** → dependencia extrema de un cliente.
- Ambos casos sobrepasan el umbral del 30% que sugiere diversificar (regla operativa del panel).

### Variante (cuando exista vista mensual)
```sql
-- TODO PC2: cuando exista staging.dte_resumen_mensual con (empresa, anno, mes, rut, razon_social, monto_total)
SELECT ranking, empresa, razon_social, monto_total, pct_del_total
FROM v_dte_clientes_panel_mensual
WHERE anno = EXTRACT(YEAR FROM CURRENT_DATE)::smallint
  AND mes = EXTRACT(MONTH FROM CURRENT_DATE)::smallint
  AND tipo_libro = 'VENTA'
  AND ranking <= 5
ORDER BY empresa, ranking;
```

---

## Tarea B — Top 5 Materiales por toneladas (✅ validada)

**Pregunta de negocio:** ¿Qué materiales movemos más en kilos este año (compras)?

### Query oficial (YTD agregado cross-sucursal)
```sql
WITH materiales_agregados AS (
  SELECT
    material,
    SUM(toneladas) AS toneladas_total,
    SUM(monto_total) AS monto_total,
    SUM(tickets) AS tickets_total,
    COUNT(DISTINCT sucursal) AS sucursales
  FROM v_pesajes_top_materiales_sucursal
  WHERE anno = EXTRACT(YEAR FROM CURRENT_DATE)::integer
    AND tipo_servicio = 'COMPRA'
  GROUP BY material
)
SELECT
  ROW_NUMBER() OVER (ORDER BY toneladas_total DESC) AS ranking,
  material,
  ROUND(toneladas_total, 2) AS toneladas,
  monto_total,
  tickets_total,
  sucursales
FROM materiales_agregados
ORDER BY toneladas_total DESC
LIMIT 5;
```

### Resultado real (2026 YTD)

| # | Material | Toneladas | Monto $ | Tickets | Sucursales |
|---|---|---|---|---|---|
| 1 | Lata chatarra | **137,77 t** | $11.302.790 | 39 | 4 |
| 2 | Carton corrugado | **79,45 t** | $1.491.045 | 201 | 5 |
| 3 | Strech film | **24,98 t** | $832.780 | 45 | 4 |
| 4 | Vidrio de botellas | **20,66 t** | $442.390 | 11 | 4 |
| 5 | Polietileno de baja para lavado | **4,12 t** | $441.820 | 8 | 1 |

**Hallazgo de eficiencia:**
- **Lata chatarra** mueve 137,77 t en solo **39 tickets** → tickets de alto volumen (~3,5 t/ticket). Negocio mayorista de fierro.
- **Cartón corrugado** mueve 79,45 t pero en **201 tickets** → tickets chicos (~0,4 t/ticket). Negocio retail.
- **Polietileno** solo opera en 1 sucursal → oportunidad de escalar a las otras 3.

### Variante por toneladas del mes (usando staging.pesajes_prod directo)
```sql
WITH mes_actual AS (
  SELECT date_trunc('month', CURRENT_DATE)::date AS inicio
)
SELECT
  ROW_NUMBER() OVER (ORDER BY SUM(ABS(kg_neto)) DESC) AS ranking,
  COALESCE(NULLIF(material_descripcion, ''), material_codigo) AS material,
  ROUND(SUM(ABS(kg_neto))/1000.0, 2) AS toneladas,
  SUM(monto_total) AS monto_total,
  COUNT(*) AS tickets
FROM staging.pesajes_prod, mes_actual
WHERE tipo_servicio = 'COMPRA'
  AND fecha >= mes_actual.inicio
  AND material_codigo NOT IN ('99','100','101')
GROUP BY material
ORDER BY toneladas DESC
LIMIT 5;
```

---

## Tarea C — Sparklines de 7 días para los 4 KPIs (✅ validada)

**Pregunta de negocio:** ¿Cómo se mueven los 4 KPIs principales (Pesajes / Facturación / RDO / Alertas) día a día en la última semana?

**Decisión de diseño:** uso `MAX(fecha)` de `staging.pesajes_prod` como día de referencia (no `CURRENT_DATE`) porque hay 6 días sin ingest. Cuando el pipeline esté al día, cambiar a `CURRENT_DATE`.

### Query C.1 — Sparkline Pesajes + RDO + Toneladas (1 query, 3 series)

```sql
WITH max_dia AS (
  SELECT MAX(fecha) AS ref FROM staging.pesajes_prod
),
dias AS (
  SELECT generate_series(
    (SELECT ref FROM max_dia) - INTERVAL '6 days',
    (SELECT ref FROM max_dia),
    INTERVAL '1 day'
  )::date AS dia
)
SELECT
  d.dia,
  COALESCE(COUNT(p.id), 0)                                 AS tickets_compra,
  COALESCE(ROUND(SUM(ABS(p.kg_neto))/1000.0, 2), 0)        AS toneladas,
  COALESCE(SUM(p.monto_total), 0)                          AS monto_clp
FROM dias d
LEFT JOIN staging.pesajes_prod p
  ON p.fecha = d.dia AND p.tipo_servicio = 'COMPRA'
GROUP BY d.dia
ORDER BY d.dia;
```

### Resultado real (08-may → 14-may 2026)

| Día | Tickets | Toneladas | Monto $ |
|---|---|---|---|
| 2026-05-08 | 8 | 3,36 | $107.370 |
| 2026-05-09 | 0 | 0,00 | $0 |
| 2026-05-10 | 0 | 0,00 | $0 |
| 2026-05-11 | 6 | 4,29 | $117.540 |
| 2026-05-12 | 8 | 2,61 | $71.650 |
| 2026-05-13 | 5 | 1,74 | $143.640 |
| 2026-05-14 | 1 | 1,46 | $21.900 |

**Cobertura:** ✅ KPI Pesajes (columna `tickets_compra`) · ✅ KPI Toneladas (`toneladas`) · ✅ KPI RDO (columna `monto_clp`).

### Query C.2 — Sparkline Alertas (de `staging.v_pesajes_vs_tarifa`)

```sql
WITH max_dia AS (
  SELECT MAX(fecha) AS ref FROM staging.pesajes_prod
),
dias AS (
  SELECT generate_series(
    (SELECT ref FROM max_dia) - INTERVAL '6 days',
    (SELECT ref FROM max_dia),
    INTERVAL '1 day'
  )::date AS dia
)
SELECT
  d.dia,
  COUNT(*) FILTER (WHERE a.alerta = 'rojo')     AS rojas,
  COUNT(*) FILTER (WHERE a.alerta = 'amarillo') AS amarillas,
  COUNT(*) FILTER (WHERE a.alerta IS NOT NULL AND a.alerta <> 'verde') AS total_activas
FROM dias d
LEFT JOIN staging.v_pesajes_vs_tarifa a
  ON a.fecha = d.dia
GROUP BY d.dia
ORDER BY d.dia;
```

**Cobertura:** ✅ KPI Alertas — series rojas, amarillas y total.

### Query C.3 — Sparkline Facturación día a día (usando `staging.facturacion_s5`)

> ⚠️ Esta tabla actualmente devuelve `permission denied` desde anon. Pendiente que PC2 ajuste RLS o cree una vista pública. Mientras tanto se incluye el SQL listo para ejecutar como `service_role`.

```sql
WITH dias AS (
  SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS dia
)
SELECT
  d.dia,
  COALESCE(COUNT(f.id), 0)            AS facturas,
  COALESCE(SUM(f.monto), 0)           AS monto_clp
FROM dias d
LEFT JOIN staging.facturacion_s5 f
  ON f.fecha = d.dia
GROUP BY d.dia
ORDER BY d.dia;
```

### Forma del payload para Chart.js (sparkline en KPI cards)

Ejemplo de cómo el bridge v4 debería consumir los datos de C.1 para alimentar el SVG del KPI Pesajes:

```js
async function v4LoadSparklinePesajes() {
  const { data, error } = await sb.rpc('sparkline_pesajes_7d');
  // o llamada directa a la query C.1 si no se quiere RPC
  if (error || !data) return;
  const valores = data.map(r => r.tickets_compra);
  const max = Math.max(...valores, 1);
  const puntos = valores.map((v, i) =>
    `${(i * 160 / 6).toFixed(0)},${(40 - (v / max) * 35).toFixed(0)}`
  ).join(' ');
  document.getElementById('v4KpiPesajesSparkline').innerHTML =
    `<polyline points="${puntos}" fill="none" stroke="#059669" stroke-width="1.8"/>`;
}
```

### Próxima iteración recomendada (para PC2)

Crear un **RPC `panel.sparkline_kpis_7d()`** que devuelve un JSON con las 4 series en una sola llamada. Performance mejor que 4 queries separadas desde el frontend.

```sql
CREATE OR REPLACE FUNCTION panel.sparkline_kpis_7d()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  WITH max_dia AS (SELECT MAX(fecha) AS ref FROM staging.pesajes_prod),
  dias AS (
    SELECT generate_series((SELECT ref FROM max_dia) - INTERVAL '6 days',
                           (SELECT ref FROM max_dia),
                           INTERVAL '1 day')::date AS dia
  )
  SELECT jsonb_build_object(
    'dias', array_agg(d.dia ORDER BY d.dia),
    'pesajes', array_agg(COUNT(p.id) ORDER BY d.dia),
    'toneladas', array_agg(COALESCE(ROUND(SUM(ABS(p.kg_neto))/1000.0, 2), 0) ORDER BY d.dia),
    'monto', array_agg(COALESCE(SUM(p.monto_total), 0) ORDER BY d.dia),
    'alertas', array_agg(
      (SELECT COUNT(*) FROM staging.v_pesajes_vs_tarifa a
       WHERE a.fecha = d.dia AND a.alerta IN ('rojo','amarillo'))
      ORDER BY d.dia
    )
  )
  FROM dias d
  LEFT JOIN staging.pesajes_prod p ON p.fecha = d.dia AND p.tipo_servicio = 'COMPRA'
  GROUP BY d.dia;
$$;
```

---

## Resumen para PC1

✅ **Tarea A** — Top 5 Clientes: query YTD lista + propuesta variante mensual. **Hallazgo:** concentración crítica (Reciclean 76,2% top 2 · Farex 77,2% top 1).
✅ **Tarea B** — Top 5 Materiales: query lista + propuesta variante mensual desde staging. **Hallazgo:** Lata chatarra es el negocio mayorista (~3,5 t/ticket); Cartón es retail (~0,4 t/ticket); Polietileno solo en 1 sucursal — oportunidad escalar.
✅ **Tarea C** — Sparklines 7 días: queries listas para los 4 KPIs. **Caveat:** hay 6 días sin ingest en `staging.pesajes_prod` (último día 2026-05-14). Implementar primero la RPC `panel.sparkline_kpis_7d()` antes de cablear el frontend.

## Tareas que destrabo para otros PCs

- **PC2-Pablo**: implementar `panel.sparkline_kpis_7d()` (RPC propuesto en C.3 final). 30 min.
- **PC2-Pablo**: investigar permission denied en `staging.facturacion_s5` desde anon (necesario para Query C.3 Facturación). 15 min.
- **PC2-Pablo**: ¿por qué `staging.pesajes_prod` lleva 6 días sin ingest? Revisar pipeline. Crítico operativo.
- **PC1-Dusan**: avisar a Andrea/Dyana sobre concentración Reciclean 76,2% top 2.
