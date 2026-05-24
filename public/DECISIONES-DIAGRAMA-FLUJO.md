# Decisiones diagrama flujo material V2 — 5 puntos confusos resueltos

> Default razonable propuesto + pregunta abierta para que Dusan firme antes de hacer vinculante.

---

## Punto 1 — "PROCEDENCIA RETIRO TIPO VENTA DESTINO FINAL SI"

**Confusión:** el nodo es ambiguo. Mezcla 4 conceptos.

**Propuesta:** reformular como **"¿Drop-shipping o pasa por planta?"** (binary clara).

| Opción | Significado |
|---|---|
| **Drop-shipping** | El proveedor entrega DIRECTO al destino final (cliente valorizador). Reciclean intermedia comercialmente pero no físicamente. |
| **Pasa por planta** | Reciclean retira, lleva a planta, procesa (enfardado/segregación), después despacha a destino final. |

**Default V2:** binary "drop-shipping vs pasa por planta" en etapa 5 del diagrama nuevo.

**¿OK?** Si querés más opciones, lista las.

---

## Punto 2 — "DONACION TIPO INGRESO COMPRA"

**Confusión:** 3 conceptos juntos.

**Propuesta:** separar en 3 ramas del nodo decisión "Tipo de operación":

| Tipo | Documento generado |
|---|---|
| **Compra** | Factura compra (proveedor emite o Reciclean si retenedor IVA) |
| **Donación** | Declaración Donación firmada (no genera DTE compra) |
| **Depósito gratuito** | Acta depósito (sin transacción económica — material queda en custodia) |

**Default V2:** 3 ramas en etapa 1 del diagrama nuevo.

**¿OK?** Si hay un cuarto tipo (canje? trueque?), avísame.

---

## Punto 3 — "ARRIENDO DE CONTENEDOR"

**Confusión:** aparece en columna SERVICIOS pero no se conecta al flujo de material.

**Hipótesis:** es un servicio puro (cobro mensual por tener un contenedor en planta del cliente), independiente del material que recoge.

**Propuesta:** flujo lateral simple "Servicios sin material asociado":
```
Cotización arriendo → Contrato firmado → Facturación recurrente mensual
                                            ↓
                                        Cobranza mensual
```

**Default V2:** lo marqué en diagrama como flujo lateral (no entra en las 9 etapas principales).

**¿OK?** O ¿prefieres que sea un diagrama separado de "Servicios Recurrentes" con su propio ciclo?

---

## Punto 4 — "SEGREGACIÓN" y "DESMANTELAMIENTO"

**Confusión:** son servicios físicos en planta. ¿Son sub-procesos dentro de un retiro existente o son servicios separados con su propio ciclo?

**Propuesta:** son sub-procesos opcionales dentro de la etapa 5 ("Proceso + despacho a destino final"). Cuando el material entra a planta, puede pasar por enfardado, segregación o desmantelamiento antes de despacho final.

**Default V2:** integrado como sub-tarea en etapa 5 (no es columna propia).

**¿OK?** O ¿prefieres que sean un proceso separado con su propio costo + facturación al cliente?

---

## Punto 5 — "CAPACITACIÓN" e "IMÁGENES / RESPALDOS"

**Confusión:** servicios de consultoría y marketing. No deberían estar en el mismo diagrama que el flujo de material.

**Propuesta:** moverlos a un diagrama separado **"Servicios Consultoría / Comerciales"** con su propio ciclo (cotización → contrato → entregables → facturación → cobranza).

**Default V2:** los saqué del diagrama V2 de flujo material (quedan en limbo hasta que se decida).

**¿OK?** O ¿prefieres mantenerlos en el flujo principal aunque no entren material físico?

---

## Resumen para tu decisión

| # | Default V2 propuesto | Si NO te gusta |
|---|---|---|
| 1 | Binary "drop-shipping vs pasa por planta" | Decime opciones alternativas |
| 2 | 3 ramas: compra / donación / depósito gratuito | Sumá las que falten |
| 3 | Arriendo contenedor = flujo lateral simple | ¿Diagrama separado servicios recurrentes? |
| 4 | Segregación + desmantelamiento = sub-tareas etapa 5 | ¿Procesos separados con costo propio? |
| 5 | Capacitación + imágenes = OTRO diagrama | ¿Los dejo igual mezclados? |

**Si me decís "los 5 defaults OK"** → todo queda como en `DIAGRAMA-FLUJO-MATERIAL-V2.html` + procesos 18-23 de `MANUAL-OPERATIVO-EQUIPO.md`.

**Si querés ajustes** → decime cuáles y rehago el diagrama.

---

**Firmado:** PC Dusan, 2026-05-24 madrugada (pendiente firma Dusan).
