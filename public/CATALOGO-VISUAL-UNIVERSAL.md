# CATÁLOGO VISUAL UNIVERSAL — Grupo Reciclean-Farex-SERCOT

> Catálogo de referencia para la regla "Modo Visual Universal (instinto)" — D-VISUAL-ORO-002 firmada 22-may-2026 por Dusan.
>
> **Espejo de** `reciclean-rdo/mayordomo/skills/visual-oro/CATALOGO-VISUAL-UNIVERSAL.md` (fuente canónica).
>
> Registrado en Supabase `panel.config_ui.catalogo_visual_v1`.

---

## Decisor rápido — qué visualización para qué dato

| Si tu dato es… | Visualización óptima | Librería primaria | Por qué |
|---|---|---|---|
| **Serie temporal** (1 métrica en el tiempo) | Línea | Chart.js | Tendencia legible de un vistazo |
| **Series temporales múltiples** (2-5 métricas) | Líneas múltiples | Chart.js | Comparar trayectorias |
| **Series temporales muchas** (>5) | Slope chart o small multiples | D3 / ECharts | Evita spaghetti |
| **Composición en el tiempo** | Stacked area | Chart.js | Total + partes |
| **Comparación pocos ítems** (2-7) | Barras verticales | Chart.js | Magnitud directa |
| **Comparación muchos ítems** (8-25) | Barras horizontales | Chart.js | Etiquetas legibles |
| **Ranking top-N** (3-10) | Tarjetas Top 5/10 + barra fina | HTML/CSS | Premios + dato destacado |
| **Distribución parte/todo** (3-6 categorías) | Donut 65% | Chart.js | Proporciones limpias |
| **Distribución muchas categorías** (>6) | Treemap | ECharts / D3 | Jerarquía + áreas |
| **Frecuencia / distribución estadística** | Histograma | Chart.js | Buckets de valores |
| **Correlación 2 variables** | Scatter | Chart.js | Patrones y outliers |
| **Correlación 3 variables** | Bubble (3ra = tamaño) | Chart.js | Tercera dimensión |
| **Flujo entre nodos** (origen → destino) | Sankey | ECharts | Volumen entre estados |
| **Red de relaciones** | Network / force graph | D3 / ECharts | Topología |
| **Geografía** (ubicaciones) | Mapa con marcadores | Leaflet | CartoDB Positron, marker círculo |
| **Geografía** (densidad regional) | Choropleth | Leaflet + D3 | Mapa coropletas |
| **Avance vs meta** | Bullet chart o barra progreso 4px | D3 / HTML | Target visible |
| **Estado actual + variación** | KPI card + sparkline + badge | HTML/CSS | Glance ejecutivo |
| **Densidad temporal** (qué pasa cada día/semana) | Heatmap calendar | D3 | Patrones cíclicos |
| **Antes vs después** (2 puntos en el tiempo) | Slope chart | D3 / HTML | Diferencia directa |
| **Funnel / embudo conversión** | Funnel chart | ECharts | Pasos secuenciales |
| **Comparativa multidimensional** (4-8 métricas por ítem) | Radar | Chart.js | Perfil de cada uno |
| **Rango con valor objetivo** | Gauge / dial | ECharts | Velocímetro |
| **1-2 valores únicos** | TEXTO (no gráfico) | — | Un gráfico de 1 dato es ruido |
| **Mucha data tabular** (>50 filas) | Tabla + gráfico resumen | HTML + Chart.js | La tabla manda |

---

## Decisor por canal de entrega

| Dónde sale el dato | Visualización propuesta | Notas |
|---|---|---|
| **Chat texto puro** | Tabla Markdown + propuesta de gráfico | Proponer antes de generar |
| **Chat con artifact disponible** | Generar Chart.js / HTML directo | Mostrar inmediato |
| **Panel web** (panel-rdo, asistente, login) | Chart.js / Leaflet / HTML embebido | Aplicar `visual_standard_v1` literal |
| **PPTX / Gamma / Canva / Slides** | Traducir paleta hex + Inter | Sin grid vertical |
| **Imagen IA** (nanobanana / Gemini) | Embed paleta hex en prompt | Sin emojis ni stock corny |
| **PDF / docx** | Imagen estática Chart.js + tabla | Para imprimir/firmar |
| **Bitácora / informe markdown** | Tabla MD + ASCII bars | Sin imágenes |

---

## Cuándo NO hacer un gráfico

1. 1-2 valores únicos → texto.
2. Orden y detalle importan más que forma → tabla.
3. <3 puntos en una serie.
4. Datos muy ruidosos sin patrón claro.
5. Dusan dijo "estilo libre" o "ignorá la pauta" en el mismo turno.

---

## Paleta + tipografía (no negociables — heredados de `visual_standard_v1`)

- **Verde principal**: `#059669` · Alternos: `#2563eb` `#ea580c` `#9333ea` · Alertas: `#dc2626` `#d97706`
- **Fondos**: `#ffffff` `#f8fafc` `#f1f5f9` · **Texto**: `#0f172a` `#475569` `#94a3b8`
- **Tipografía**: Inter (fallback Calibri/Arial)
- **Chart.js**: leyenda abajo con círculos · líneas tension 0.4 · área 20% · sin grid vertical · barras `borderRadius:6` · donut 65%

---

## Plantilla de propuesta

```
¿Querés que te muestre esto como [tipo de gráfico]? Es ideal para [razón en 1 línea].
```

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| v1 | 2026-05-22 | Catálogo inicial. Espejo de la fuente canónica en mayordomo/skills/visual-oro/. |
