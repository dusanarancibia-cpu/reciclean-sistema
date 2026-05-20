# PENDIENTES-DATOS — panel-rdo-v4.html

> Tracker de queries Supabase faltantes y datos que necesitan reemplazo real.
> Generado en loop autónomo 2026-05-19 PM → 2026-05-20 AM (Camino B).
> Schema check de tablas hecho contra `eknmtsrtfkzroxnovfqn`.

## Convención

- 🔴 **CRÍTICO** — equipo no puede operar sin esto, el panel muestra "—".
- 🟡 **IMPORTANTE** — KPI visible que el equipo va a notar como vacío.
- 🟢 **CRECIMIENTO** — feature visual que puede esperar a Fase 2.

---

## 🔴 CRÍTICO — vistas/tablas que NO existen

### P01 · `curated.rdo_resumen_mensual` no existe
- **Síntoma:** KPI "RDO mes" muestra `—` con badge "pendiente".
- **Origen:** el bridge buscaba `curated.rdo_resumen_mensual(anio, mes, total_clp)` pero no hay tal vista. El cálculo RDO en `panel-rdo.html` se hace en cliente dentro de `loadRdoResumen()` (línea 1744).
- **SQL propuesto (Pablo):**
  ```sql
  CREATE OR REPLACE VIEW curated.rdo_resumen_mensual AS
  SELECT
    date_part('year',  fecha)::int AS anio,
    date_part('month', fecha)::int AS mes,
    sucursal,
    SUM(kg_neto)      AS kg_neto_total,
    SUM(monto_total)  AS total_clp,
    COUNT(*)          AS n_pesajes
  FROM curated.pesajes
  WHERE fecha IS NOT NULL
  GROUP BY 1,2,3;
  ```
- **Una vez creada**, descomentar la query original en `v4LoadKpiRdo()`.

### P02 · No hay vista de Tesorería / cashflow
- **Síntoma:** sección "Finanzas del grupo" muestra 4 cards con `—` (Saldo Banco, Por Cobrar, Pagos Programados, Inventario).
- **Origen:** no existe `curated.tesoreria_kpis` ni equivalente. Dyana/SERCOT manejan flujo bancario externamente.
- **SQL propuesto (medio plazo):**
  ```sql
  CREATE VIEW curated.finanzas_resumen AS
  SELECT
    (SELECT SUM(monto) FROM staging.facturacion_s5
       WHERE fecha > now() - interval '60 days' AND procesado = false) AS por_cobrar_clp,
    (SELECT SUM(monto) FROM curated.pagos_programados
       WHERE estado = 'pendiente' AND fecha_pago < now() + interval '30 days') AS por_pagar_clp;
  ```
  (depende de tabla `pagos_programados` que tampoco existe — coordinar con Dyana/SERCOT)
- **Camino corto:** integrar `mayordomo.bandeja_dyana` (si existe) o widget manual de input en panel admin.

### P03 · API UF / mindicador.cl no integrada
- **Síntoma:** topbar muestra "UF: —" en lugar del valor real.
- **Origen:** ninguna llamada externa a CMF/mindicador.
- **Camino corto:** Edge Function `f_uf_hoy` que cachea respuesta de `https://mindicador.cl/api/uf` por 24h. Llamarla desde `v4LoadUF()`.

---

## 🟡 IMPORTANTE — datos parciales o asumidos

### P04 · `empresa_id` en `curated.pesajes` es numérico (asumido)
- **Síntoma:** el pie chart agrupa por `empresa_id === 1 → Reciclean / === 2 → Farex / otro → string`. Si los IDs reales son distintos, sale "1", "2", "5" en el gráfico.
- **Verificación:** correr `SELECT DISTINCT empresa_id FROM curated.pesajes;`
- **Fix:** ajustar mapping en `v4InitCharts()` PIE block.

### P05 · No hay tabla de Oportunidades / Pipeline en el dashboard
- **Síntoma:** sección "Oportunidades" no existe en el v4 (la borré porque era 100% inventada en v4).
- **Camino propuesto:** agregar después de la sección Top 5 una vista de las 36 oportunidades vivas leyendo de `curated.oportunidades` (existe). Cards con cliente, sucursal, valor.

### P06 · Riesgos / Alertas resumidas — RESUELTO en loop
- ✅ **Verificado en el repo**: `loadAlertasPortada()` (línea 2199) escribe en `#portadaAlertas`.
- ✅ **Fix aplicado**: el contenedor del v4 fue renombrado de `#alertasPortadaContainer` a `#portadaAlertas`. El JS legacy lo va a llenar al abrir portada.

---

## 🟢 CRECIMIENTO — features para iteración 2

### P07 · Sparklines de 7 días en las KPI cards
- v4 originalmente tenía sparklines SVG inline en cada KPI. Yo los removí porque generarlos con datos reales requiere otra query agregada por día. Quedó plano.
- Camino: una EF `f_kpi_sparkline(kpi_name, days)` que devuelve 7 valores.

### P08 · Top 5 más allá de clientes/materiales/sucursales
- v4 original tenía 8 pestañas (proveedores, servicios, colaboradores, acreedores, retiros, cumpleaños).
- Datos reales solo existen para clientes/materiales/sucursales. El resto requiere tablas nuevas (proveedores, RRHH, contabilidad) que no están en curated/staging hoy.

### P09 · Mapa con datos en tiempo real
- Hoy el mapa muestra 4 sucursales fijas. Podría mostrar burbujas dimensionadas por # de pesajes hoy en cada sucursal.

### P10 · Menú contextual E360
- Existe el menú contextual en click derecho pero todas las opciones son placeholders ("Próximamente E360"). Cuando E360 esté integrado, las opciones tienen que apuntar a vistas reales.

---

## Tablas reales confirmadas (schema check 2026-05-20 02:00Z)

```
staging.pesaje_s1       (id, fecha, turno, peso_toneladas, raw_json, subido_por, subido_en, procesado)
staging.facturacion_s5  (id, fecha, cliente, monto, raw_json, subido_por, subido_en, procesado)
curated.pesajes         (id, staging_id, fecha, folio, empresa_id, sucursal, tipo_servicio, proveedor_rut, proveedor_nombre, material_codigo, material_descripcion, kg_neto, monto_total, precio_unitario, precio_tarifa, pct_desviacion, fuera_tarifa, created_at, updated_at)
curated.alertas         (id, fecha, tipo_alerta, severidad, descripcion, referencia_id, referencia_tabla, detalle_json, resuelta, resuelta_at, created_at, updated_at)
```

`curated.rdo_resumen_mensual`: NO EXISTE. Ver P01.
`curated.alertas_negocio`: NO EXISTE (la tabla real es `curated.alertas`, ya corregido en el bridge).
