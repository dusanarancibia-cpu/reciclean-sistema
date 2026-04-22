# Respuesta al panel consultor — Diagnóstico 22-abr-2026

> **Panel:** 3 especialistas (operaciones, digital, auditor).
> **Documento base:** diagnóstico consolidado 22-abr — errores críticos, omisiones, supuestos cuestionables, controles débiles.
> **Autor respuesta:** Dusan Arancibia con apoyo Claude Code.
> **Objetivo:** cerrar con el panel los puntos aceptados, defender los que no aplican, listar validaciones externas pendientes.

---

## Veredicto general

**Acepto el veredicto del panel.** El mapa original necesitaba el retrabajo en los 5 puntos críticos señalados. Este documento corrige la postura oficial.

Acciones tomadas hoy 22-abr antes del 30-abr:
- Documento `docs/cumplimiento-legal-v1.md` como fuente de verdad para Diego v4.2 (RAG).
- Checklist `docs/checklist-prelanzamiento-30abr.md` con los 5 ítems críticos a validar personalmente.
- Patch en system prompt Diego v4.2 (bloque CUMPLIMIENTO OBLIGATORIO) programado junto con el patch coordinación equipo (P2 de PENDIENTES).

---

## 1. Errores críticos — respuesta punto por punto

### 1.1 Acta PDI — ACEPTADO
- Corrección implementada en `cumplimiento-legal-v1.md` §1.
- Se exige libro digital con firma avanzada o libro foliado PDI, además del físico.
- Pendiente: confirmar número exacto de Orden General PDI con asesor legal antes del 30-abr.

### 1.2 Retención IVA chatarra — ACEPTADO
- Corrección en `cumplimiento-legal-v1.md` §3.
- Boleta de compra electrónica con retención 100% ANTES de entregar efectivo.
- Pendiente: validar con contador que Facturacion.cl cumple (ver checklist ítem 5).

### 1.3 Calibración romana SEC — ACEPTADO
- Corrección en `cumplimiento-legal-v1.md` §2.
- Certificado vigente obligatorio + alerta automática 15 días antes de vencer.
- Tabla `activos_calibracion` a crear (asignado Pablo 26-abr).

---

## 2. Omisiones — respuesta punto por punto

### 2.1 Declaración REMA — ACEPTADO
- Incorporado `cumplimiento-legal-v1.md` §5.
- Responsable interno: Jair Sanmartín.
- URL oficial confirmada: `portalvu.mma.gob.cl` (corregida vs invento Diego en caso Jair 20-abr).

### 2.2 Retención IVA — ACEPTADO (ver 1.2)

### 2.3 Declaración Jurada 1879 — PARCIALMENTE ACEPTADO
- Aplica solo si hay ventas a empresas de construcción. FPC y ADASME son clientes.
- Acción: Andrea valida con contador si aplica para volumen actual. Si sí, incorporar al ciclo anual. [tarea post-lanzamiento]

### 2.4 Ley REP (20.920) — ACEPTADO
- Incorporado `cumplimiento-legal-v1.md` §6.
- Jair valida qué productos prioritarios aplican.

### 2.5 Certificación SEC operador romana — PENDIENTE VALIDAR
- El panel afirma que "la Ley Eléctrica exige certificación SEC vigente para el operador de romana".
- Duda: la certificación SEC del operador aplica a instaladores eléctricos (SEC-A/B/D). Para operador de balanza comercial no es claro que aplique la misma certificación.
- Acción: Jair consulta directo con SEC antes del 30-abr. Si aplica, capacitar operadores. Si no, documentar aclaración.

---

## 3. Supuestos cuestionables — respuesta punto por punto

### 3.1 Mutual ACHS — ACEPTADO GAP CRÍTICO
- Checklist ítem 1 asignado a Dusan.
- Sin mutual, NO se lanza.

### 3.2 Turno noche Talca 22:00-06:00 — PENDIENTE VALIDAR
- `cumplimiento-legal-v1.md` §10 lista los 4 requisitos (contrato, asistencia, iluminación, protocolo seguridad).
- Dusan + Ingrid validan antes del 30-abr.
- Postura del panel: auditor dice documentar antes de declarar vigente. Aceptado.

### 3.3 Facturacion.cl — PENDIENTE VALIDAR
- Aceptado como duda legítima.
- Checklist ítem 5 cubre validación.

### 3.4 Pago 30 días proveedores formales — RECHAZADO PARCIAL
- En el rubro hay mezcla:
  - Clientes grandes (HUAL, RESIMEX, FPC): 30-60 días estándar.
  - Chatarreros informales: contado.
- No es un supuesto del mapa; es la realidad dual. Se documenta en `cumplimiento-legal-v1.md` §11 (tensión formal/informal).
- No bloquea lanzamiento.

---

## 4. Controles internos débiles — respuesta punto por punto

### 4.1 Segregación de funciones — ACEPTADO
- `cumplimiento-legal-v1.md` §7 define la matriz.
- Acción: auditar roles actuales en 4 sucursales. Si hay acumulación, reorganizar turnos.

### 4.2 Cuadre caja doble firma — ACEPTADO
- `cumplimiento-legal-v1.md` §7 exige arqueo diario firmado por 2 personas.
- Tabla `arqueos_diarios` a crear (asignado Pablo 26-abr).

### 4.3 Trazabilidad pesaje-factura — ACEPTADO
- `cumplimiento-legal-v1.md` §8 exige `folio_factura` + `folio_acta_pdi` obligatorios.
- Modificación schema `pesajes` (asignado Pablo 26-abr).

### 4.4 Autorización precios — ACEPTADO CON AJUSTE
- `cumplimiento-legal-v1.md` §9 define 3 tramos: dentro pricelist / hasta 5% / >5%.
- Ajuste del panel: el límite original era "ejecutivo autoriza vs Dusan OK". Incorporamos tramo intermedio (Diego Arancibia jefe comercial hasta 5%) para no embotellar a Dusan en cada caso.

---

## 5. Oportunidades de automatización Diego — ACEPTADAS EN ROADMAP

| Tarea | Prioridad panel | Nuestra versión | Estado |
|---|---|---|---|
| Registro acta PDI desde foto WhatsApp | Alta | v4.2 + OCR | En diseño |
| Cuadre caja vs actas | Alta | v4.2 alerta >2% | Checklist ítem 4 |
| Verificar calibración SEC vigente | Alta | v4.2 alerta 15 días | Checklist ítem 2 |
| Conciliación bancaria diaria | Media | v5.0 | Post-lanzamiento |
| Control EPP | Media | v5.0 | Post-lanzamiento |
| Boleta compra con retención IVA | Baja | v6.0 (integración Facturacion.cl API) | Post-lanzamiento |

---

## 6. KPIs de industria — REGISTRADOS COMO BENCHMARK

Los valores del panel se registran como benchmark para revisar trimestralmente:

- DSO: 45-60 días
- Margen MC: 15-25% (cobre hasta 25%, fierro 10-15%)
- Tasa accidentalidad: 15-20/100 trabajadores/año
- Toneladas/operario/día: 5-8
- Rotura stock: 10-15%
- Uptime romana: 99.5%
- Eficacia cobranza 60 días: 90%

**Acción:** Pablo crea vista Supabase `v_kpis_mensual` con estos 7 KPIs. Diego reporta cada primer lunes del mes.

---

## 7. Prioridad 30-abr — ALINEADO CON EL PANEL

El orden que propone el panel (Sección 7) lo adoptamos tal cual:

**Antes del 30-abr (checklist):**
1. ✅ Mutual ACHS
2. ✅ Calibración SEC 3 sucursales
3. ✅ 10 actas PDI en Supabase
4. ✅ Alerta cuadre caja-actas (prueba histórica)
5. ✅ Proceso retención IVA + contador

**Después del 30-abr:**
- Vinculación pesaje → factura electrónica
- Integración Facturacion.cl API
- Control EPP + matriz riesgos en Diego
- Ley REP y REMA declaraciones

---

## 8. Challenge (Sección 8 del panel) — RESPUESTA

**Pregunta:** ¿cómo manejas el conflicto cuando un chatarrero informal exige efectivo sin boleta y Diego registra la omisión?

**Respuesta oficial:**

Diego **NO ignora la alerta** ni **fuerza la formalidad instantánea**. La tensión se resuelve en 3 capas:

1. **Capa técnica (Diego):** cada operación queda registrada. Si se paga sin boleta de retención, se marca `operacion_no_conforme=true`. Diego no oculta, no omite, no suaviza.

2. **Capa de decisión (Dusan):** el desbloqueo de una operación no conforme requiere OK explícito mío con justificación escrita (queda en log). Asumo la responsabilidad de la decisión.

3. **Capa de política (empresa):** meta pública interna de llevar operaciones no conformes a 0% en 12 meses. Reporte mensual a Diego me muestra la curva. La tensión se resuelve por reducción gradual, no por salto abrupto que me deje sin proveedores.

**Lo que el mapa corregido NO hace:** pretender que la informalidad no existe. Lo que SÍ hace: registrarla, medirla, ponerle meta de reducción, y asignar responsabilidad de cada decisión a una persona con nombre.

Es la respuesta honesta que el panel pidió. Asumimos que no es perfecta hoy, pero sí auditable y con trayectoria de mejora.

---

## Cierre

- Documento compartido con el panel para segunda ronda de revisión.
- Dusan firma las acciones antes del 30-abr.
- Revisión post-lanzamiento el 27-mayo (4 semanas después).
