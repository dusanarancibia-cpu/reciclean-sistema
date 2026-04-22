# Checklist pre-lanzamiento Diego v4.2 — 30-abr-2026

> **Origen:** panel consultor 3 especialistas (Sección 7 del diagnóstico 22-abr).
> **Responsable:** Dusan personalmente.
> **Objetivo:** validar los 5 ítems críticos ANTES de activar Diego v4.2 LIVE el jueves 30-abr.
> **Si alguno queda abierto el 30-abr:** posponer lanzamiento o lanzar con alcance reducido (solo subconjunto formal: clientes con factura, proveedores con RUT, operaciones diurnas).

---

## Los 5 ítems críticos (panel Sección 7 — antes del 30-abr)

### ☐ 1. Mutual ACHS — confirmar afiliación activa

**Estado actual:** el mapa decía "(por validar)". No es opcional — Ley 16.744 exige afiliación a mutual para cualquier empleador con trabajadores.

**Acción Dusan:**
1. Llamar ACHS (o mutual actual) y pedir certificado de afiliación vigente.
2. Obtener número de adherente y tasa de siniestralidad vigente.
3. Pegar evidencia (PDF o foto) en `docs/evidencias-cumplimiento/` [crear carpeta].
4. Registrar en `docs/cumplimiento-legal-v1.md` sección 4 "Estado actual".

**Si no está afiliado:** gestión de afiliación urgente antes del 30-abr. Paralizar contrataciones nuevas.

**Bloqueador del lanzamiento:** SÍ. Sin mutual, todo accidente = responsabilidad penal.

---

### ☐ 2. Calibración romana SEC — certificado vigente en 3 sucursales

**Sucursales operativas:** Cerrillos, Maipú, Talca. (Puerto Montt no opera según CLAUDE.md.)

**Acción Dusan:**
1. Cerrillos: verificar certificado SEC vigente. Responsable: Juan Mendoza.
2. Maipú: verificar certificado SEC vigente. Responsable: [asignar].
3. Talca: verificar certificado SEC vigente. Responsable: Ingrid Cancino.

**Qué pedir:**
- Certificado de calibración (PDF) con fecha de emisión y fecha de vencimiento.
- Resolución de aprobación de modelo (de la SEC).

**Si cualquier certificado vence <30 días o está vencido:** paralizar pesaje en esa sucursal y gestionar recalibración.

**Crear en Supabase:** tabla `activos_calibracion` con las 3 sucursales cargadas. Diego consulta cada mañana 08:00 AM.

**Bloqueador del lanzamiento:** SÍ para la sucursal afectada.

---

### ☐ 3. 10 actas PDI reales en Supabase — prueba de trazabilidad

**Objetivo:** validar que el flujo pesaje → acta PDI → folio en Supabase funciona end-to-end.

**Acción:**
1. Pablo (al volver 26-abr) o Nicolás cargan 10 actas PDI reales de la última semana.
2. Verificar que cada una tiene: folio único, RUT proveedor, patente, kg, material, fecha, hora, sucursal.
3. Verificar que el folio se puede vincular a la boleta de compra correspondiente.
4. Diego debe poder consultar por folio vía query y responder correctamente.

**Bloqueador del lanzamiento:** NO (lanzamiento puede seguir), pero sí es bloqueador para activar el control #4 abajo.

---

### ☐ 4. Alerta cuadre caja vs actas — probar con datos históricos

**Objetivo:** Diego debe detectar desviaciones >2% entre efectivo cuadrado en caja y sumatoria de actas PDI del día.

**Acción Pablo (26-abr al volver):**
1. Query histórica: por cada día de las últimas 2 semanas, calcular:
   - Suma de efectivo salido de caja (según registro manual o API banco)
   - Suma de actas PDI del día (según tabla `actas_pdi`)
2. Calcular desviación %.
3. Identificar cuántos días históricos tuvieron desviación >2%.
4. Configurar Diego para que, cuando detecte este patrón en tiempo real, alerte a Dusan por WhatsApp.

**Bloqueador del lanzamiento:** NO. Es función que Diego puede activar post-lanzamiento sin romper nada.

---

### ☐ 5. Proceso retención IVA — documentado con contador externo

**Objetivo:** confirmar con contador que:
- (a) Facturacion.cl emite boletas de compra con retención IVA 100%, O identificar plataforma alternativa.
- (b) El proceso paso a paso de emisión + declaración en F29 está claro.
- (c) Diego tiene el prompt correcto para exigir número de boleta antes de autorizar pago.

**Acción Dusan:**
1. Reunión de 30 min con contador externo antes del 28-abr.
2. Obtener confirmación escrita (email) de:
   - Plataforma usada
   - Periodicidad declaración
   - Código/concepto en F29
3. Andrea o Dusan documenta en `docs/cumplimiento-legal-v1.md` sección 3 "En el sistema".

**Bloqueador del lanzamiento:** SÍ. Sin este proceso claro, Diego podría autorizar pagos sin retención (= evasión fiscal).

---

## Estado final — actualizar cada ítem

| # | Ítem | Estado | Fecha validación | Evidencia |
|---|---|---|---|---|
| 1 | Mutual ACHS | ☐ pendiente | — | — |
| 2 | Romana SEC Cerrillos | ☐ pendiente | — | — |
| 2 | Romana SEC Maipú | ☐ pendiente | — | — |
| 2 | Romana SEC Talca | ☐ pendiente | — | — |
| 3 | 10 actas PDI en Supabase | ☐ pendiente | — | — |
| 4 | Alerta cuadre caja-actas | ☐ pendiente | — | — |
| 5 | Proceso retención IVA + contador | ☐ pendiente | — | — |

---

## Decisión de GO / NO-GO (29-abr en la tarde)

Criterio de lanzamiento:

- **GO completo 30-abr:** ítems 1, 2 (3 sucursales), 5 ✅. Ítems 3, 4 pueden quedar post-lanzamiento.
- **GO reducido 30-abr:** solo alguna sucursal tiene romana OK + mutual OK + retención IVA OK. Lanzamiento solo en esa sucursal.
- **NO-GO 30-abr:** si falta mutual o retención IVA. Posponer a mayo.

**Dusan decide el 29-abr 18:00 con evidencia en la mano.**
