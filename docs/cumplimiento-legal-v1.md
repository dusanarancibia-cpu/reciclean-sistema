# Cumplimiento legal — Fuente de verdad v1

> **Fecha:** 2026-04-22
> **Estado:** borrador para validación de Dusan + asesor legal externo
> **Destino:** tabla `procesos_empresa` (RAG de Diego v4.2) — cargar como categoria=`cumplimiento_legal`
> **Origen:** panel consultor 3 especialistas (Sección 1-4 del diagnóstico, 22-abr)
> **Regla dura:** Diego NUNCA debe aprender ni canonizar procesos que contradigan este documento, aunque el equipo los enseñe en entrevistas. Si detecta contradicción en `entrevistas_respuestas`, Diego-Curador marca el borrador como `revision_legal_requerida=true` y NO lo promueve a `procesos_empresa` sin OK Dusan.

---

## 1. Registro PDI — Receptación de metales

**Marco legal:** Ley N° 20.962 (receptación) + normativa PDI específica para compra de chatarra metálica [validar número exacto de Orden General con asesor legal].

**Regla operativa:**
- El triplicado físico **NO es suficiente** por sí solo.
- Se requiere registro digital con:
  - (a) Firma electrónica avanzada del operador que recibe, O
  - (b) Libro especial foliado autorizado por PDI.
- Conservar originales y digitalización por **5 años mínimo**.
- Cada compra a persona natural requiere: RUT, patente del vehículo, kg, material, fecha, hora, precio unitario, total.

**En el sistema:**
- Cada acta PDI tiene folio único en Supabase (`actas_pdi.folio`).
- El folio debe quedar vinculado a la boleta/factura de compra correspondiente (ver sección 3).
- Si falta algún dato obligatorio, Diego **NO autoriza** la operación y escala a supervisor.

**Riesgo si se omite:** multa y clausura de la sucursal por PDI.

---

## 2. Calibración romana (SEC)

**Marco legal:** NCh 2654 — instrumentos de pesaje. Reglamento de metrología legal (SEC).

**Regla operativa:**
- Toda romana en uso operativo debe tener:
  - (a) Resolución de aprobación de modelo vigente.
  - (b) Certificado de calibración anual vigente.
- Antes de iniciar pesaje del día, verificar vigencia del certificado.
- Si el certificado vence en **<15 días**, Diego avisa a Dusan + Jair (responsable permisología).
- Si está vencido, **NO se pesa**. Se paraliza compra/venta en esa romana hasta recalibración.

**En el sistema:**
- Tabla `activos_calibracion` (a crear) con: sucursal, equipo, modelo, fecha_emision, fecha_vencimiento, documento_pdf.
- Diego consulta cada mañana 08:00 AM. Alerta Dusan si algún certificado vence <15 días.

**Riesgo si se omite:** todo pesaje queda invalidado para SII y PDI. Multa SEC.

---

## 3. Retención de IVA a la compra de chatarra

**Marco legal:** Ley N° 20.727 (retención IVA operaciones con chatarra metálica). Circulares SII correspondientes.

**Regla operativa:**
- Toda compra a persona natural o empresa chatarrera requiere **boleta de compra electrónica con retención del 100% del IVA** emitida ANTES de entregar el efectivo.
- La boleta se emite vía Facturacion.cl (o plataforma que soporte boleta de compra con retención — [validar con Andrea/contador]).
- El flujo correcto es: pesar → emitir acta PDI → emitir boleta compra con retención → entregar efectivo.
- **NUNCA** pagar efectivo sin boleta emitida primero.

**En el sistema:**
- El nodo de pago en Diego exige el número de boleta de compra antes de marcar la operación como cerrada.
- Diego declara mensualmente en F29 el IVA retenido (la suma debe cuadrar con lo reportado en SII).

**Riesgo si se omite:** evasión fiscal. Multa + responsabilidad penal tributaria.

**Validación pendiente:** confirmar con contador externo que Facturacion.cl soporta boleta de compra con retención IVA. Si no, evaluar plataforma alternativa [asignar a Andrea antes del 30-abr].

---

## 4. Mutual de seguridad — Ley 16.744

**Marco legal:** Ley N° 16.744 (accidentes del trabajo y enfermedades profesionales).

**Regla operativa:**
- Afiliación a mutual (ACHS, Mutual de Seguridad CChC, o IST) es **obligatoria** para todo empleador con trabajadores contratados.
- No es opcional, no es "por validar". Es requisito legal antes de operar.

**Estado actual:** el panel reporta que el mapa dice "Mutual ACHS (por validar)". Esto es un gap crítico.

**Acción Dusan antes del 30-abr:**
- Confirmar afiliación activa y número de adherente.
- Obtener tasa de siniestralidad vigente.
- Dejar documentado en `docs/cumplimiento-legal-v1.md` sección "Estado actual".

**Riesgo si no hay afiliación:** multa + responsabilidad penal del empleador ante cualquier accidente laboral.

---

## 5. Declaración REMA / RETC (residuos peligrosos)

**Marco legal:** Decreto Supremo 148/2003 MINSAL + RETC (Registro de Emisiones y Transferencia de Contaminantes) del MMA.

**Regla operativa:**
- Si la operación genera residuos peligrosos (aceites usados, baterías, filtros, solventes, trapos contaminados, etc.), se requiere:
  - (a) Registro como generador en portal MMA.
  - (b) Declaración anual REMA vía `portalvu.mma.gob.cl` (URL correcta según caso Jair 20-abr).
- Disposición vía transportista y destinatario autorizados.

**En el sistema:**
- Diego mantiene en `procesos_empresa` la URL correcta `portalvu.mma.gob.cl` y el calendario de declaración anual.
- **Diego NUNCA debe inventar URLs gubernamentales** (bug #22 documentado 20-abr caso Jair).

**Responsable interno:** Jair Sanmartín (permisología).

---

## 6. Ley REP (20.920) — Reciclador base

**Marco legal:** Ley N° 20.920 (Marco para la gestión de residuos, responsabilidad extendida del productor y fomento al reciclaje).

**Regla operativa:**
- Como operador de reciclaje, puede aplicar el registro en el **Registro de Recicladores Base** (MMA) según los materiales gestionados.
- Productos prioritarios bajo REP: envases y embalajes, neumáticos, aceites lubricantes, aparatos eléctricos y electrónicos, pilas, baterías.
- Metas de valorización según decreto reglamentario del producto prioritario.

**Acción:** Jair valida cuáles productos prioritarios REP aplican a la operación actual y si corresponde registro formal [tarea post-lanzamiento].

---

## 7. Segregación de funciones (control interno)

**Regla dura:** una sola persona NO puede acumular roles que permiten fraude.

| Rol | Acceso permitido | Acceso prohibido |
|---|---|---|
| Operador romana (pesador) | Pesar + emitir acta PDI | Caja efectivo |
| Cajero | Pagar + cuadrar caja | Romana |
| Supervisor | Revisar + firmar arqueos | Ninguno operativo (solo revisión) |

**Cuadre diario:**
- Acta de arqueo diario firmada por **2 personas** (operador + jefe de turno).
- Registro en Supabase tabla `arqueos_diarios`.
- Diego consulta: si diferencia caja vs actas >**2%**, alerta Dusan automáticamente.

**Riesgo si se omite:** fraude interno (kilos adulterados, desvío de fondos).

---

## 8. Trazabilidad pesaje → factura

**Regla dura:** cada pesaje debe quedar vinculado a su folio de factura/boleta de compra o venta.

**En el sistema:**
- Tabla `pesajes` tiene campo `folio_factura` y `folio_acta_pdi`, ambos obligatorios antes de cerrar operación.
- Diego rechaza cierre si alguno está vacío.

**Riesgo si se omite:** se pueden facturar kilos no pesados (fraude) o pesar sin facturar (evasión).

---

## 9. Autorización de precios de compra

**Regla:**
- Precios **dentro** de rango pricelist vigente → autoriza ejecutivo (Nicolás, Juan, Cesar, Andrea según sucursal).
- Precios **sobre** pricelist hasta 5% → autoriza Diego Arancibia (jefe comercial).
- Precios **sobre** pricelist >5% → requiere OK explícito de **Dusan** vía WhatsApp con foto de evidencia.

**En el sistema:**
- Diego valida el precio ingresado contra `precios_cliente` y escala según el tramo.

---

## 10. Jornada nocturna (Talca 22:00–06:00)

**Estado actual:** el panel reporta que se declara como vigente sin validación. Pendiente confirmar con DT.

**Requisitos legales para operar turno noche:**
- Contrato de trabajo con jornada nocturna explícita.
- Registro de asistencia con control horario.
- Iluminación según norma (SEC/SEREMI Salud).
- Protocolo de seguridad nocturno (comunicación + respaldo ante emergencias).

**Acción Dusan antes del 30-abr:** validar los 4 puntos con Ingrid (jefa Talca) y registrar evidencia en este documento.

---

## 11. Tensión formal vs informal (challenge Sección 8 del panel)

**Escenario:** chatarrero informal sin RUT exige pago efectivo sin boleta.

**Regla Diego:**
- Diego **NO oculta** la operación. Si se paga sin boleta, queda registrado como `operacion_no_conforme=true`.
- Diego **NO autoriza** el pago. El desbloqueo manual requiere OK Dusan con justificación escrita (queda en log).
- Diego genera reporte mensual de `operaciones_no_conformes` para decisión de política.

**Postura documentada de la empresa:**
- Meta: llevar a 0% las operaciones no conformes en 12 meses.
- Transición: aceptar volumen decreciente mientras el mercado se formaliza.
- Dusan decide caso a caso, pero la decisión queda trazable.

**El mapa NO oculta esta realidad — la documenta y la mide.**

---

## Cambios sobre el mapa original (resumen para el panel)

Este documento **corrige** los 5 errores críticos señalados:

1. ✅ **1.1 PDI:** se exige libro electrónico + firma avanzada, no solo triplicado físico.
2. ✅ **1.2 Retención IVA:** se incorpora boleta compra con retención 100% obligatoria antes del pago.
3. ✅ **1.3 Romana SEC:** se exige certificado vigente + alerta 15 días antes de vencer.
4. ✅ **2.1 Mutual:** se reconoce como gap crítico y se asigna validación a Dusan pre-30-abr.
5. ✅ **4.1-4.4 Control interno:** segregación de funciones, arqueo doble firma, trazabilidad pesaje-factura, límites de autorización.

Omisiones relevantes (2.1-2.5) cubiertas: REMA, retención IVA, Ley REP, certificación SEC operador.

---

## Próxima revisión

- Validación con asesor legal externo: **antes del 30-abr-2026**.
- Revisión trimestral post-lanzamiento.
- Actualización automática si cambia la legislación (responsable: Jair + Dusan).
