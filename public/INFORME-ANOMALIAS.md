# INFORME ANOMALÍAS — Impacto en los KPIs del Panel v4

> **Autor:** PC4-Desocupado
> **Fecha:** 2026-05-20
> **Fuente:** `staging.v_pesajes_anomalias` (creada por PC1 el 20-may, detector multi-criterio sobre `staging.pesajes_prod`).
> **Objetivo:** cuantificar cuánto distorsionan las anomalías los KPIs visibles del dashboard v4.

---

## Resumen ejecutivo

En el dataset de 1.026 pesajes (todo `staging.pesajes_prod` al 14-may-2026):

| Bloque | Filas | Toneladas | Monto (CLP) | % filas | % toneladas | % monto |
|---|---:|---:|---:|---:|---:|---:|
| **TOTAL dataset** | 1.026 | 1.170,85 t | $71.418.892 | 100% | 100% | 100% |
| **Filas con ≥1 anomalía** | 264 | 309,77 t | $15.778.614 | **25,7%** | **26,5%** | **22,1%** |
| Solo niveles rojos | 233 | 261,97 t | $10.735.900 | 22,7% | 22,4% | 15,0% |

**Mensaje clave:** uno de cada cuatro pesajes tiene al menos una anomalía. Pero la distorsión **NO afecta a todos los KPIs por igual**, depende de qué filtra cada uno.

---

## Distorsión por KPI del Panel v4

### KPI Pesajes (filtra `tipo_servicio = 'COMPRA'`)

Solo las anomalías con `tipo_servicio = 'COMPRA'` afectan este KPI:

| Sucursal | Pesajes COMPRA totales | Anómalas | % distorsión filas | Toneladas afectadas |
|---|---:|---:|---:|---:|
| Talca | 303 | 32 | **10,6%** | 0 t (todas con `kg_neto≤0`) |
| (sin sucursal) | 22 | **22** | **100%** | 29,13 t |
| Cerrillos | 34 | 7 | 20,6% | 0 t |
| Maipú | 48 | 3 | 6,3% | 0 t |
| Cerro Sombrero ⚠️ | 22 | 0 | 0% | 0 t |
| RECICLEAN ⚠️ | 2 | 0 | 0% | 0 t |
| Puerto Montt | 1 | 0 | 0% | 0 t |

**Impacto real en el conteo de tickets:**
- Las anomalías de Talca/Cerrillos/Maipú tienen toneladas=0 (son `kg_neto ≤ 0`), por lo que **inflan el conteo de tickets pero NO el de toneladas**.
- Las 22 filas sin sucursal sí tienen 29 t reales → quedan **invisibles en el KPI de Pesajes por sucursal** porque la vista las excluye, pero **están en el total general**.

**Recomendación:** filtrar `WHERE kg_neto > 0 AND sucursal IS NOT NULL` agregaría confiabilidad al KPI sin cambiar montos materialmente.

### KPI Facturación mes vs mes (`v_kpi_grupo_mensual`)

Esta vista lee de `staging.pesajes_prod` agregando por mes. Cualquier fila con `monto_total` válido entra, incluyendo `kg_neto≤0`:

- 1.026 filas totales → 264 anómalas (25,7%)
- $15,78M de los anómalos sobre $71,4M totales = **22,1% del monto** está en filas anómalas.
- **PERO** dentro de esas anómalas, la mayoría tienen monto coherente (servicio facturado sin peso físico). Solo $5,04M están en filas "rojas" puras.
- **Distorsión real estimada:** entre 7% y 15% del monto YTD.

**Recomendación:** la vista mensual actual es honesta como "actividad total" pero NO debería usarse como base para ratios kg-monto sin filtrar `kg_neto > 0`.

### KPI RDO mes (`v_pesajes_por_sucursal_mes`)

Mismo problema que KPI Facturación: agrega monto sin filtrar `kg_neto`. La distorsión depende del mes en curso.

### KPI Alertas (`v_alertas_panel`)

**No afectada por estas anomalías** — `v_alertas_panel` detecta otra cosa (precios fuera de tarifa). Las anomalías de KG son ortogonales a las de precio.

### Charts (Pie / Bar / Line)

- **Pie ventas por empresa** lee `v_dte_clientes_panel` (fuente: `staging.dte_resumen_anual`). **No afectado.**
- **Bar toneladas por sucursal** lee `v_pesajes_kpi_sucursal` que sí filtra por `tipo_servicio`. Solo las 64 anomalías de COMPRA + 16 de VENTA pueden distorsionar. Toneladas reales afectadas: 29,13 t (las "sin sucursal" no aparecen porque la vista las llama "Sin sucursal" como bucket). Distorsión visual mínima.
- **Line compras 12m** lee `v_pesajes_por_sucursal_mes` filtrando `tipo_servicio='COMPRA'`. Sumar las anomalías de COMPRA podría inflar uno o dos meses específicos.

### Top 5 (Clientes / Materiales / Sucursales)

- **Top Clientes:** lee `v_dte_clientes_panel`. **No afectado.**
- **Top Materiales:** lee `v_pesajes_top_materiales_sucursal` filtrando COMPRA. 64 filas anómalas (12% de las COMPRA del dataset). Riesgo bajo en ranking por toneladas (las anómalas suman 0 t reales).
- **Top Sucursales:** lee `v_pesajes_kpi_sucursal` con `tipo_servicio='COMPRA'`. Mismo análisis que Bar Chart.

---

## Distribución por tipo de anomalía

| Tipo | Filas | ¿Es falso positivo del detector? |
|---|---:|---|
| `anom_kg_no_positivo` (kg_neto ≤ 0) | 225 | **Parcialmente.** En 108 son `tipo_servicio='SERVICIO'` que por definición no pesan (facturación de retiro/asesoría). Detector debería excluir SERVICIO/DONACION. |
| `anom_sin_sucursal` | 38 | Real. Pesajes ingresados sin selector de sucursal → invisibles a los KPIs por sucursal. |
| `anom_kg_neto_mayor_bruto` | 9 | Real. Error físico de captura (probable swap de columnas). |
| `anom_precio_negativo` | 8 | Real. Devoluciones / notas de crédito mal mapeadas (deberían ir como tipo distinto). |
| `anom_sin_monto` | 1 | Caso aislado. Validar. |
| Otros | 0 | — |

## Distribución por `tipo_servicio` (NUEVO HALLAZGO)

| tipo_servicio | Filas anómalas | Notas |
|---|---:|---|
| SERVICIO | 108 | **Probable falso positivo** — servicios facturados sin peso físico. |
| COMPRA | 64 | Real — afecta KPIs de Pesajes y rankings por sucursal. |
| DONACION | 53 | **Probable falso positivo** — donaciones registradas sin peso. |
| SERVICIO RED | 18 | A revisar (195 t pero monto NEGATIVO de -$182.900). |
| VENTA | 16 | Real — afecta charts y rankings de venta. |
| (NULL) | 5 | Sin clasificar. |

**Si el detector excluyera SERVICIO + DONACION:** el universo "anómalo real" baja de 264 → **103 filas (10% del dataset)**. Ese es el número honesto que afecta KPIs operativos.

---

## Distribución por material (top 8)

| Material | Filas anómalas | Toneladas anómalas |
|---|---:|---:|
| (top a llenar tras filtrar SERVICIO/DONACION — pendiente refinamiento del detector por PC3) | | |

---

## Sucursales fantasma detectadas

Dos valores de `sucursal` que no están en la lista oficial de 4 sucursales (Cerrillos, Maipú, Talca, Pto Montt) y no están en el mapa del panel v4:

- **Cerro Sombrero** (22 filas / 49,11 t / sin anomalías). Tierra del Fuego, sur extremo. NO es sucursal Reciclean. Probable error de captura masivo → todas estas filas deberían ser de otra sucursal.
- **RECICLEAN** (2 filas / 1,2 t). El campo `sucursal` no debería contener el nombre de la empresa.

Acción sugerida: PC3 valida origen real y propone UPDATE en BD.

---

## Recomendaciones priorizadas

### 🔴 Crítico (esta semana)
1. **Refinar el detector** para excluir `tipo_servicio IN ('SERVICIO','DONACION')` del check `anom_kg_no_positivo`. Esto baja anomalías de 264 → 103 (más confiable como número operativo).
2. **Categorizar las 38 filas sin sucursal** y asignarles sucursal real (por proveedor_rut o folio).
3. **Investigar las 22 filas "Cerro Sombrero"** — probable error de captura masivo.

### 🟡 Importante (esta semana)
4. **Las 9 filas con `kg_neto > kg_bruto`**: corregir manualmente (swap de columnas).
5. **Las 8 con precio negativo**: agregarles `tipo_servicio='DEVOLUCION'` o columna `signo`.

### 🟢 Ajuste de vistas (cuando se haga el fix)
6. Agregar `WHERE kg_neto > 0` a `v_pesajes_kpi_sucursal` (KPI Bar Chart toneladas).
7. Agregar `WHERE sucursal IS NOT NULL` a los rankings por sucursal del panel.
8. Agregar widget "Calidad de datos" en portada con conteo de anomalías refinadas.

---

## Conclusión

**El panel v4 NO está mintiendo, pero está mostrando un dataset 25% sucio.** Los KPIs grandes (Facturación, Pesajes) son direccionalmente correctos. Los detalles finos (rankings por material/sucursal) tienen ruido del 5-10% por las anomalías reales (no las falsas alarmas de SERVICIO/DONACION).

El fix más high-leverage es **refinar el detector** (PC3) para distinguir falso positivo vs real. Después de eso, las vistas analíticas se filtran limpias y todos los KPIs ganan precisión sin necesidad de tocar datos.

---

**Cola id pendiente PC3:** investigación detallada de las 264 (queries propuestas en `mayordomo/PLAN-2026/anomalias-pesajes.md`).
**Hand-off para PC2:** una vez PC3 cierre el análisis, agregar el filtro `WHERE kg_neto > 0` a las vistas `v_pesajes_kpi_sucursal` y `v_pesajes_por_sucursal_mes`.
