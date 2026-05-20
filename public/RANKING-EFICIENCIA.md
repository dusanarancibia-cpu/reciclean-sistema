# RANKING EFICIENCIA MATERIALES — Margen estimado por material

> **Autor:** PC4-Desocupado
> **Fecha:** 2026-05-20
> **Fuente:** `v_pesajes_top_materiales_sucursal` (datos YTD 2026, agregado cross-sucursal).
> **Método:** precio_unitario derivado = `monto_total / (toneladas × 1000)` para COMPRA y VENTA por separado; margen = diferencia.
> **Caveat:** los pesajes anómalos (`v_pesajes_anomalias`) NO se filtraron en este análisis. Si PC3 cierra anomalías, el ranking se recalcula con datos más limpios.

---

## Ranking por margen estimado absoluto (CLP YTD)

| # | Material | Ton compra | $/kg compra | Ton venta | $/kg venta | Margen $/kg | Margen % | Margen estimado |
|--:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Lata chatarra** | 137,77 | $82 | 103,47 | $183 | **+$101** | **55,2%** | **$10,4M** ⭐ |
| 2 | **Cartón corrugado** | 79,45 | $19 | 135,27 | $91 | +$72 | **79,3%** | $5,7M ⭐⭐ |
| 3 | Vidrio de botellas | 20,66 | $21 | 43,67 | $52 | +$30 | 58,6% | $627K |
| 4 | Polietileno baja (lavado) | 4,12 | $107 | 5,34 | $200 | +$93 | 46,4% | $382K |
| 5 | Papel oficina (Blanco 2) | 3,03 | $64 | 10,12 | $140 | +$76 | 54,5% | $231K |
| 6 | Fierro chatarra | 1,03 | $88 | 14,32 | $184 | +$96 | 52,2% | $99K |
| 7 | Stretch film | 24,98 | $33 | 0,20 | $30 | **−$3** | **−11,7%** | −$698 ⚠️ |

---

## Análisis por categoría

### 🏆 Top performers (los 2 que mueven la aguja)

**1. Lata chatarra · $10,4M margen YTD**
- Volumen alto + margen sólido. 137,77 t compradas, 103,47 t vendidas (queda inventario de 34 t).
- 55,2% de margen es excelente para una commodity reciclable.
- **Acción:** asegurar suministro continuo (es el motor del grupo). Andrea ya debería tener este dato priorizado.

**2. Cartón corrugado · $5,7M margen YTD · MEJOR margen %**
- 79,3% de margen — el más alto del catálogo.
- Curiosidad: vendiste más toneladas (135,27) que las que compraste (79,45). Probablemente hay stock acumulado de meses anteriores o ingresos vía donación.
- **Acción:** escalar compra. Cada tonelada extra rinde 79% más rentable que latas (en porcentaje).

### 🟡 Volumen chico, margen alto (oportunidades de escalar)

**3. Polietileno de baja para lavado · margen $93/kg (46%)**
- Solo 4 t compradas, 5,3 t vendidas. Precio de venta alto ($200/kg).
- **Acción:** si la operación de lavado tiene capacidad ociosa, multiplicar volumen 5x daría ~$2M margen extra anual al ritmo actual.

**4. Papel oficina (Blanco 2) · margen $76/kg (54%)**
- Volumen muy bajo (3 t compradas) pero margen sólido.
- **Acción:** evaluar si conviene priorizarlo en rutas de retiro (oficinas centro Stgo).

**5. Fierro chatarra · margen $96/kg (52%)**
- Ton compra 1,03 vs ton venta 14,32 → vendiendo 13× lo que compraste = vaciando stock viejo.
- **Acción:** stock acumulado se está liquidando. Cuando se acabe el inventario histórico, el margen real cae al diferencial compra-venta del mes (que igual sigue siendo bueno).

### 🟢 Stable (sin alarma ni gran oportunidad)

**6. Vidrio de botellas · $627K margen / 58,6%**
- Volumen mediano, margen porcentual alto, monto absoluto bajo.
- Mantener como está.

### ⚠️ Problema: Stretch film

**7. Stretch film · −$698 margen / −11,7%**
- 24,98 t compradas pero solo **0,20 t vendidas** (vendiste menos del 1% de lo comprado).
- Precio de venta ($30/kg) más bajo que el de compra ($33/kg) → **vendiendo perdés plata**.
- **Hipótesis:**
  - (a) El stretch film se usa internamente (embalaje propio) y no se vende → no entra al ranking como venta real.
  - (b) Hay 24,78 t acumuladas en inventario que no encontraron comprador.
  - (c) Error de captura: la venta debería estar como "consumo interno" u otro tipo.
- **Acción urgente:** Andrea + Dusan deciden:
  - Vender al precio actual y aceptar pérdida.
  - Bajar la compra hasta consumir stock.
  - Cambiar el `tipo_servicio` de las 24,78 t a "USO_INTERNO" si es consumo propio.

---

## Vista lateral: márgenes vs precios de mercado

Para validar si los márgenes son altos o bajos comparado con el mercado chileno reciclaje:

| Material | $/kg compra Reciclean | $/kg compra mercado (referencia 2025) | Status |
|---|---:|---|---|
| Lata chatarra | $82 | $80-110 (aluminio mezclado) | en línea |
| Cartón corrugado | $19 | $15-25 | en línea, lado bajo |
| Vidrio botellas | $21 | $15-30 | en línea |
| Polietileno BD | $107 | $80-130 | en línea |
| Papel oficina | $64 | $50-80 | en línea |
| Fierro chatarra | $88 | $70-100 | en línea |
| Stretch film | $33 | $20-40 | en línea (compra), problema en venta |

> Los rangos de mercado son aproximados. Para defensa pública del plan necesitamos cotizaciones reales (PC1 puede pedirle a Andrea que arme la grilla en 30 min con corretaje online).

---

## Distorsión por sucursal (extracto)

Talca concentra el volumen de fierro chatarra (rural / industria pesada zona maule). Maipú concentra cartón corrugado (retail RM). Cerrillos es mixta.

| Sucursal | Material #1 | Toneladas YTD |
|---|---|---:|
| Talca | Lata chatarra | 91,72 t (incluye fierro) |
| Maipú | Cartón corrugado | ~25 t |
| Cerrillos | Mixto | volumen chico |
| Pto Montt | — | 0 t (SEREMI) |

---

## Recomendaciones para Dusan

### 🔴 Atender esta semana
1. **Stretch film** — definir si es consumo interno o venta perdida. -$700 YTD es chico ahora, pero si seguís comprando 25 t más al año sin vender, el stock crece.
2. **Cartón corrugado** — el 79% de margen no se aprovecha al máximo. ¿Hay capacidad de retirar más? Andrea evalúa.

### 🟡 Atender en el mes
3. **Polietileno de baja** — escalar compra 3-5x si la capacidad de lavado lo permite.
4. **Papel oficina** — testear ruta dedicada a oficinas en Las Condes / Providencia / Vitacura.

### 🟢 Monitorear
5. **Fierro chatarra** — confirmar cuándo se acaba el stock acumulado y proyectar margen real estable.

---

## Limitaciones del ranking

1. **No incluye costos operativos** (peoneta, transporte, energía planta, mermas). Margen real podría ser 30-50% del bruto mostrado.
2. **No incluye materiales sin venta YTD** (porque la query requiere COMPRA y VENTA). Hay materiales que solo se compran y se acumulan, o solo se venden de stock viejo.
3. **Anomalías no filtradas** — 25,7% del dataset es ruido. PC3 está limpiando. Cuando termine, este ranking se recalcula y los números pueden moverse 5-10%.
4. **YTD = 5 meses 2026** — escenarios estacionales (cartón pico fin de año, fierro pico construcción Q2-Q3) no están normalizados.

---

## Próximo paso

PC1 puede llevar este ranking al panel v4 como **widget "Materiales más rentables"** en la portada (5 cards o tabla). Lectura directa de una vista nueva que materialice este SQL:

```sql
CREATE VIEW public.v_materiales_eficiencia AS
-- el SQL de este informe, ordenado por margen_estimado_clp DESC
-- (PC2 puede materializarla cuando vuelva).
```
