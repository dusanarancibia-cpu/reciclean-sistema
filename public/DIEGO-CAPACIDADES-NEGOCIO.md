# DIEGO — CAPACIDADES DE NEGOCIO (Agente B)

> **Fuente**: investigación coordinada para construir el prompt máximo del chatbot Diego v6.x (sucesor de v5.1.0).
> **Fecha**: 2026-05-22
> **Autor**: Agente B (Capacidades de Negocio)
> **Alcance**: Reciclean + Farex + GestionREP. WhatsApp + FAB panel-rdo.
> **Stack referencia**: Supabase `eknmtsrtfkzroxnovfqn` (78 migraciones, 12 EFs, schemas `panel/curated/staging/public`), Panel RDO Vercel.

---

## Convenciones de este documento

- **Usuarios internos**: Dusan (CEO), Pablo (tech lead), Andrea (comercial), Cony (admin), Dyana (contabilidad), 14 personas + choferes (5R, Diego Transportes).
- **Usuarios externos**: GENERADOR (entrante), COMERCIANTE PEQUEÑO, DONANTE, VALORIZADOR (saliente). NUNCA usar "cliente"/"proveedor" genérico.
- **Estado Diego v5.1.0**:
  - ✅ = ya lo hace
  - 🟡 = parcial / hay base, falta pulir
  - ❌ = no aún
  - 🔍 VERIFICAR = consultar Pablo antes de prometer
- **Prioridad**:
  - 🔴 ALTA = destrabe imposible sin Diego
  - 🟠 MEDIA = ahorra tiempo notable
  - 🟢 BAJA = nice-to-have

---

## 1. Gestión de clientes (GENERADORES / VALORIZADORES)

### 1.1 Buscar GENERADOR por nombre, RUT, alias o teléfono
- **Qué hace**: Búsqueda fuzzy multi-campo (nombre legal, alias comercial, RUT con/sin dígito verificador, teléfono normalizado).
- **Comando ejemplo**:
  - Andrea: "Diego, buscame Pincore"
  - Diego: "Encontré 2 coincidencias: 1) PINCORE SPA · 76.123.456-7 · Maipú · última compra 12-may · 4,2 ton cartón. 2) PINCORE LIMITADA · 77.987.654-3 · Cerrillos · sin movimiento desde 2024. ¿Cuál?"
- **Usuario**: Andrea, Cony, Dyana, Dusan, Chofer
- **Datos**: `panel.v_crm_impulsa_clientes`, `curated.clientes`, `staging.crm_impulsa_clientes` (1971 fichas)
- **Estado**: 🟡 (búsqueda exacta sí; fuzzy con tildes/abreviaciones VERIFICAR con Pablo)
- **Prioridad**: 🔴 ALTA

### 1.2 Crear ficha GENERADOR/VALORIZADOR nueva (completado progresivo)
- **Qué hace**: Captura mínima (RUT + nombre + teléfono + giro) y va completando en interacciones posteriores. Marca campos `_pending`.
- **Comando ejemplo**:
  - Chofer: "Diego, llegó un cliente nuevo a Talca. RUT 12.345.678-9, MADERAS DEL SUR, vende cartón."
  - Diego: "Ficha creada (ID prov 5847). Falta: dirección, contacto, sucursal, giro SII. ¿Quién completa? Andrea avisada."
- **Usuario**: Andrea, Chofer, Cony
- **Datos**: `curated.clientes` (INSERT), `panel.diego_bandeja` (tarea pendiente para Andrea)
- **Estado**: 🟡 (insert básico vía bandeja sí; flujo "progresivo" con re-pregunta automática ❌)
- **Prioridad**: 🔴 ALTA

### 1.3 Actualizar datos (dirección, contacto, sucursal, giro)
- **Qué hace**: UPDATE selectivo con audit log y permisos por rol.
- **Comando ejemplo**:
  - Andrea: "Diego, Pincore cambió oficina. Nueva dirección Av. Vicuña Mackenna 4500 Maipú."
  - Diego: "Confirmá: PINCORE SPA · dirección nueva: Av. Vicuña Mackenna 4500, Maipú. ¿OK?" → Andrea: "Sí." → Diego: "Actualizado. Cony notificada para revisar contratos vinculados."
- **Usuario**: Andrea (comercial), Cony (admin)
- **Datos**: `curated.clientes` UPDATE + `curated.clientes_audit_log`
- **Estado**: ❌ (hoy se hace en panel, no por chat)
- **Prioridad**: 🟠 MEDIA

### 1.4 Vincular cliente a oportunidad o crear nueva
- **Qué hace**: Match cliente↔oportunidad. Si no hay oportunidad abierta, propone crearla.
- **Comando ejemplo**:
  - Andrea: "Pincore quiere cotizar 8 ton cartón mensual recurrente."
  - Diego: "Pincore tiene oportunidad #OP-2026-042 abierta (etapa: cotización). ¿Sumo este pedido ahí o creo OP nueva?"
- **Usuario**: Andrea
- **Datos**: `curated.oportunidades`, `panel.v_crm_impulsa_oportunidades` (10.214 históricas)
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 1.5 Detectar duplicados (mismo RUT, nombres similares)
- **Qué hace**: Trigger al crear ficha. Algoritmo Levenshtein + match RUT raíz.
- **Comando ejemplo**:
  - Cony intenta crear "Pincore SPA" → Diego: "⚠️ Ya existe PINCORE SPA (76.123.456-7) con 12 oportunidades históricas. ¿Es la misma o es una empresa distinta del grupo?"
- **Usuario**: Andrea, Cony (al crear ficha)
- **Datos**: `curated.clientes` + función `f_detectar_duplicados_cliente`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 1.6 Historial completo de interacciones del cliente
- **Qué hace**: Timeline cronológico: cotizaciones, pesajes, facturas, llamadas, mails, eventos Diego.
- **Comando ejemplo**:
  - Dusan: "Diego, dame timeline Pincore últimos 90 días."
  - Diego: "PINCORE SPA · 90 días: 12 pesajes (38 ton cartón), 3 cotizaciones, 2 DTE emitidas ($4.2M), 1 reclamo abierto, 8 mensajes WhatsApp Andrea↔contacto. Última interacción hoy 10:14. ¿Detalle de alguno?"
- **Usuario**: Dusan, Andrea
- **Datos**: vista unificada `panel.v_cliente_timeline` (a construir) + `curated.pesajes`, `curated.cotizaciones`, `dte.documentos`, `panel.diego_bandeja`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 1.7 Análisis 360° del cliente
- **Qué hace**: Snapshot ejecutivo: facturación YTD, materiales principales, margen promedio, frecuencia, score riesgo, alertas activas.
- **Comando ejemplo**:
  - Dusan: "Diego, 360° Pincore."
  - Diego: "PINCORE SPA · YTD 2026: $18.4M ingresos, 142 ton (78% cartón, 22% plástico), margen prom 34% (sobre piso 30%), frecuencia 2.3 retiros/sem, score A. Alerta: cotización OP-2026-042 abajo del piso, revisar."
- **Usuario**: Dusan, Andrea
- **Datos**: `curated.f_cliente_360(cliente_id)` (RPC a construir)
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 1.8 Sucursal preferida y asignación automática
- **Qué hace**: Define cuál sucursal atiende a cada GENERADOR (regla por geo + capacidad).
- **Comando ejemplo**:
  - Andrea: "Pincore Maipú quiere mover su retiro a Cerrillos."
  - Diego: "Confirmás cambio sucursal? Impacta: 4 pesajes en curso, 1 cotización vigente, ruta chofer Hugo del jueves. Cony y operaciones notificados."
- **Usuario**: Andrea, Cony, Dusan
- **Datos**: `curated.clientes.sucursal_asignada`, `curated.rutas_chofer`
- **Estado**: ❌
- **Prioridad**: 🟢 BAJA

---

## 2. Cotizaciones y precios

### 2.1 Generar cotización end-to-end
- **Qué hace**: Wizard conversacional cliente → material → tonelaje → sucursal → flete → margen → precio final. Aplica matriz `D-OP-06-MATRIZ` (firmada 16-may).
- **Comando ejemplo**:
  - Andrea: "Cotización: Pincore, 5 ton cartón corrugado, retiro Maipú."
  - Diego: "Cotización borrador: PINCORE SPA · cartón corrugado OCC1 · 5.000 kg · base $180/kg · flete $35.000 · margen 32% · neto $1.140.000 + IVA. Tarifa publicada vigente. ¿Envío al cliente, guardo borrador o ajusto?"
- **Usuario**: Andrea, Dusan
- **Datos**: `curated.f_evaluar_retiro(cliente, material, tonelaje, sucursal)` v6, `curated.tarifas_vigentes`, `curated.matriz_descuentos`
- **Estado**: 🟡 (Diego ya usa `f_evaluar_retiro v6` parcialmente VERIFICAR)
- **Prioridad**: 🔴 ALTA

### 2.2 Mostrar precios vigentes por sucursal (tarifa oficial vs publicada)
- **Qué hace**: Tabla resumen actualizada con flag de desvío.
- **Comando ejemplo**:
  - Andrea: "Diego, precios cartón hoy."
  - Diego: "Cartón corrugado OCC1 · Cerrillos $185 (oficial $185 ✅) · Maipú $180 (oficial $185 ⚠️ -$5) · Talca $175 (oficial $180 ⚠️ -$5). 2 sucursales bajo tarifa."
- **Usuario**: Andrea, Chofer (en terreno)
- **Datos**: `panel.v_precios_vigentes_sucursal`, `curated.tarifas_oficiales`
- **Estado**: 🟡 (consulta precio sí, comparativo con desvío VERIFICAR)
- **Prioridad**: 🔴 ALTA

### 2.3 Cotizar con matriz de descuentos por categoría
- **Qué hace**: Aplica reglas `D-OP-06-MATRIZ`: A (>50 ton/mes), B (20-50), C (5-20), D (<5).
- **Comando ejemplo**:
  - Andrea: "Pincore cotización 12 ton cartón. ¿Qué categoría tiene?"
  - Diego: "PINCORE = Categoría B (32 ton/mes promedio). Aplica descuento 4% sobre tarifa publicada. Precio sugerido $177,6/kg."
- **Usuario**: Andrea
- **Datos**: `curated.cliente_categoria` (vista que clasifica por consumo 6 meses)
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 2.4 Cotizar retiro completo con `f_evaluar_retiro v6`
- **Qué hace**: Incluye servicios anexos (segregación, transporte largo, jaulas, certificados Ley REP).
- **Comando ejemplo**:
  - Andrea: "Diego, evaluá retiro Pincore: 5 ton cartón + 1 ton plástico mezclado, segregación en planta, requiere certificado REP."
  - Diego: "Total: $1.420.000 neto. Desglose: materiales $1.140k + transporte $80k + segregación $150k + certif REP $50k. Margen consolidado 28% (bajo piso, sugiero +$45k o achicar transporte)."
- **Usuario**: Andrea, Dusan
- **Datos**: `curated.f_evaluar_retiro` v6
- **Estado**: ✅ (operativo según contexto)
- **Prioridad**: 🔴 ALTA

### 2.5 Histórico de cotizaciones de un cliente
- **Qué hace**: Lista últimas N cotizaciones con tendencia precio/margen.
- **Comando ejemplo**:
  - Dusan: "Diego, histórico cotizaciones Pincore últimas 10."
  - Diego: "Pincore · 10 cotizaciones · margen prom 31% (↓3pp vs trimestre anterior) · 7 aceptadas, 2 perdidas (precio), 1 vigente. Tendencia: cliente negocia más duro desde feb-2026."
- **Usuario**: Andrea, Dusan
- **Datos**: `curated.cotizaciones`, `panel.v_crm_impulsa_cotizaciones` (1195 históricas)
- **Estado**: 🟡 (consulta directa sí, análisis tendencia ❌)
- **Prioridad**: 🟠 MEDIA

### 2.6 Alertar precios fuera de tarifa (advisor crítico)
- **Qué hace**: Diego se anticipa: cuando alguien cotiza fuera de tarifa, alerta antes de enviar.
- **Comando ejemplo**:
  - Andrea: "Pincore, cartón a $160."
  - Diego: "⚠️ ALERTA: $160 está $25 bajo tarifa publicada ($185) y $20 bajo piso operativo ($180). Margen estimado 19% (piso 30%). ¿Confirmás excepción? Requiere OK Dusan."
- **Usuario**: Andrea (alerta en cotización), Dusan (firma excepción)
- **Datos**: `panel.v_advisor_alertas_precio` (82 alertas críticas hoy según contexto)
- **Estado**: ❌ (advisor lo muestra en panel, Diego no lo inyecta en flujo)
- **Prioridad**: 🔴 ALTA

---

## 3. Pesajes y RDO (Reporte Diario de Operación)

### 3.1 Registrar pesaje desde foto de boleta
- **Qué hace**: OCR + extracción estructurada (folio, fecha, cliente, sucursal, materiales, kg).
- **Comando ejemplo**:
  - Chofer envía foto → Diego: "Boleta detectada: Folio 4521 · 22-may 11:14 · PINCORE SPA · Cerrillos · cartón OCC1 1.240 kg + plástico PET 180 kg. ¿Confirmo y guardo, o corrijo algo?"
- **Usuario**: Chofer, Andrea, Cony
- **Datos**: `panel.diego_bandeja` (boletas) + `curated.pesajes` (INSERT post-validación)
- **Estado**: ✅ (v5.1.0 ya procesa boletas con foto)
- **Prioridad**: 🔴 ALTA

### 3.2 Crear RDO diario por sucursal
- **Qué hace**: Diego compila resumen sucursal: pesajes del día, ingresos, alertas, choferes en ruta.
- **Comando ejemplo**:
  - Cony: "Diego, RDO Maipú hoy."
  - Diego: "RDO MAIPÚ 22-may: 14 pesajes (24.8 ton), $4.1M ingresos (+12% vs prom semana), 3 choferes activos (Hugo, Pedro, Luis), 2 retiros pendientes pasan al jueves. 1 alerta: folio 4521 sin cliente vinculado."
- **Usuario**: Cony, Dyana, Dusan
- **Datos**: `curated.f_rdo_diario(sucursal, fecha)` (RPC a construir)
- **Estado**: 🟡 (vista parcial en panel, no por chat)
- **Prioridad**: 🔴 ALTA

### 3.3 Buscar pesajes por filtros (rango fecha, sucursal, cliente, material)
- **Qué hace**: Query multifiltro en lenguaje natural.
- **Comando ejemplo**:
  - Andrea: "Diego, pesajes Pincore mayo cartón."
  - Diego: "Pincore · mayo · cartón: 8 pesajes · 32.4 ton · $5.8M. ¿Te paso el detalle, lo cruzo con DTE o lo exporto?"
- **Usuario**: Andrea, Cony, Dyana
- **Datos**: `curated.pesajes`
- **Estado**: 🟡 (consulta exacta sí, parser lenguaje natural VERIFICAR)
- **Prioridad**: 🔴 ALTA

### 3.4 Detectar anomalías en pesajes
- **Qué hace**: Peso fuera ±2σ del histórico cliente, folio duplicado, cliente sin ficha, sucursal/chofer inconsistente.
- **Comando ejemplo**:
  - Diego (proactivo en RDO PM): "⚠️ 3 anomalías hoy: 1) Pesaje folio 4521 sin cliente vinculado. 2) Folio 4480 duplicado en Cerrillos y Maipú. 3) Pincore 2.4 ton (prom 1.0 ton, +140%) — verificar si es retiro especial o error."
- **Usuario**: Cony, Dyana, Dusan
- **Datos**: `curated.f_anomalias_pesajes_diario` + estadística rolling
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 3.5 Asignar pesajes huérfanos (Andrea tiene 18 pendientes)
- **Qué hace**: Diego sugiere match cliente↔pesaje huérfano por sucursal+fecha+material.
- **Comando ejemplo**:
  - Diego (cada mañana a Andrea): "Buenos días Andrea. 18 pesajes huérfanos esperan asignación. Sugiero: folio 4521 → PINCORE (95% match por sucursal+chofer+material). Folio 4530 → ECOPACK (88% match). ¿Aplico, reviso uno por uno, o paso?"
- **Usuario**: Andrea
- **Datos**: `panel.v_pesajes_huerfanos` + `curated.f_sugerir_match_huerfano(pesaje_id)`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 3.6 Cierre diario/mensual (Dyana firma)
- **Qué hace**: Compila cierre, calcula totales, identifica gaps, prepara para firma Dyana.
- **Comando ejemplo**:
  - Diego (último día hábil mes, 18:00): "Dyana, cierre mayo listo para revisión: 312 pesajes · $87M ingresos · 4 anomalías sin resolver · 6 facturas pendientes emitir. ¿Reviso contigo o lo dejo en bandeja?"
- **Usuario**: Dyana, Cony
- **Datos**: `curated.f_cierre_mensual(mes, año)`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

---

## 4. Facturación

### 4.1 Recordar facturas pendientes de emitir
- **Qué hace**: Cruza pesajes con DTE. Flow: Andrea (cierra acuerdo) → Cony (instrucción) → Dyana (emite).
- **Comando ejemplo**:
  - Diego (mañana, a Cony): "Cony, 6 facturas listas para instrucción Dyana: Pincore $1.2M (3 pesajes mayo), Ecopack $890k (2 pesajes), [..]. ¿Las preparo todas o priorizamos?"
- **Usuario**: Andrea, Cony, Dyana
- **Datos**: `curated.pesajes` LEFT JOIN `dte.documentos` WHERE doc IS NULL
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 4.2 Cruzar pesajes con DTE emitidos (S5)
- **Qué hace**: Match folio/cliente/monto + flag desvíos.
- **Comando ejemplo**:
  - Dyana: "Diego, cruce pesajes vs DTE mayo Pincore."
  - Diego: "Pincore mayo: 8 pesajes ($5.8M) vs 6 DTE ($4.6M). Gap: $1.2M sin facturar (folios 4480, 4521). 2 DTE sin pesaje vinculado (verificar: ¿servicios?)."
- **Usuario**: Dyana, Cony
- **Datos**: vista `panel.v_cruce_pesajes_dte`
- **Estado**: 🟡 (S5 publica DTE, cruce VERIFICAR)
- **Prioridad**: 🔴 ALTA

### 4.3 Detectar gaps de facturación
- **Qué hace**: Reporte automático cliente con pesajes >15 días sin DTE.
- **Comando ejemplo**:
  - Diego (lunes 9am, a Cony): "Cony, gaps facturación al 22-may: 11 clientes con pesajes >15 días sin DTE. Top: Pincore ($1.2M), Maderas Sur ($680k), Ecopack ($540k). Total expuesto $4.8M."
- **Usuario**: Cony, Dyana, Dusan
- **Datos**: `curated.f_gaps_facturacion(dias_umbral)`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 4.4 Generar borrador de factura
- **Qué hace**: Pre-llena DTE: cliente, conceptos, montos, IVA, retención Farex si aplica.
- **Comando ejemplo**:
  - Cony: "Diego, prepará factura Pincore pesajes pendientes mayo."
  - Diego: "Borrador DTE Pincore (Reciclean SPA emisor, NO Farex porque cartón): 3 ítems · $1.005k neto · IVA $190k · total $1.195k. ¿Envío a Dyana para emitir?"
- **Usuario**: Cony, Dyana
- **Datos**: `curated.f_borrador_dte(cliente, pesajes_ids)` + reglas Farex/Reciclean por material
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 4.5 Estado de pagos (CxC vigentes y vencidas)
- **Qué hace**: Aging CxC + alertas vencimiento.
- **Comando ejemplo**:
  - Cony: "Diego, CxC al 22-may."
  - Diego: "CxC total $42M. Vigente $28M (66%). Vencida $14M: 0-30d $8M, 31-60d $4M, +60d $2M. Top vencido: VALORIZADOR-XX $2.1M (45d). ¿Llamo Andrea para gestión?"
- **Usuario**: Cony, Dusan, Dyana
- **Datos**: `dte.documentos` + `dte.pagos` (vincular vía folio/RUT)
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

---

## 5. Oportunidades comerciales (CRM)

### 5.1 Ver kanban de oportunidades
- **Qué hace**: Lista por etapa, valor ponderado, owner.
- **Comando ejemplo**:
  - Andrea: "Diego, kanban hoy."
  - Diego: "Pipeline: Prospecto 8 ops · Contacto 6 · Cotización 12 · Negociación 7 · Ganadas mes 3 ($8.4M). Valor ponderado pipeline $24M. ¿Detalle de alguna etapa?"
- **Usuario**: Andrea, Dusan
- **Datos**: `curated.oportunidades`, `panel.v_crm_impulsa_oportunidades`
- **Estado**: 🟡 (panel muestra, chat ❌ VERIFICAR)
- **Prioridad**: 🟠 MEDIA

### 5.2 Crear oportunidad desde conversación
- **Qué hace**: Cuando Andrea cuenta una nueva pista, Diego ofrece crearla.
- **Comando ejemplo**:
  - Andrea: "Llamó MADERAS DEL SUR, quieren cotizar retiro mensual."
  - Diego: "¿Creo oportunidad? Cliente MADERAS DEL SUR, etapa prospecto, owner Andrea, valor estimado a definir. ¿OK?"
- **Usuario**: Andrea
- **Datos**: `curated.oportunidades` INSERT
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 5.3 Mover etapa de oportunidad
- **Qué hace**: Avanza pipeline con validación de campos requeridos por etapa.
- **Comando ejemplo**:
  - Andrea: "OP-2026-042 pasó a negociación."
  - Diego: "OK. Para pasar a 'Negociación' requiero: monto estimado, fecha cierre esperada, decisor cliente. ¿Los tenés?"
- **Usuario**: Andrea
- **Datos**: `curated.oportunidades` UPDATE + `curated.oportunidad_etapa_log`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 5.4 Recordatorios de follow-up
- **Qué hace**: Diego revisa pipeline 8am, alerta oportunidades sin movimiento >X días por etapa.
- **Comando ejemplo**:
  - Diego (a Andrea, 8:30): "Andrea, 4 oportunidades necesitan follow-up: OP-042 Pincore (cotización 7d sin contacto), OP-051 Ecopack (negociación 12d), OP-038 Maderas Sur (prospecto 21d), OP-029 [..]. ¿Te armo agenda llamadas?"
- **Usuario**: Andrea
- **Datos**: `curated.oportunidades.fecha_ult_interaccion` + reglas SLA por etapa
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 5.5 Reporte de Pipeline
- **Qué hace**: Vista CEO: valor ponderado, ETA cierre, conversión por etapa, owner.
- **Comando ejemplo**:
  - Dusan: "Diego, pipeline ejecutivo."
  - Diego: "Pipeline $24M ponderado · 33 ops activas · cierre esperado Q2 $18M · top 3 ops: Pincore $4M (Andrea, 70%), Ecopack $3.2M (Andrea, 60%), Maderas Sur $2.8M (Pablo-Dusan, 40%). Riesgo: 6 ops estancadas >30d."
- **Usuario**: Dusan
- **Datos**: `curated.f_pipeline_ejecutivo()`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 5.6 Análisis de patrones de conversión
- **Qué hace**: ¿Qué tipo de prospecto convierte mejor? Material, sucursal, owner, tiempo.
- **Comando ejemplo**:
  - Dusan: "Diego, ¿qué oportunidades convierten más?"
  - Diego: "Análisis 10.214 oportunidades históricas Impulsa: 1) Cartón corrugado convierte 47% vs plástico 28%. 2) Maipú 41% vs Cerrillos 36%. 3) Tiempo cierre prom ganada 18d, perdida 42d. 4) Owner Andrea convierte 39% vs prom equipo 32%."
- **Usuario**: Dusan
- **Datos**: `panel.v_crm_impulsa_oportunidades` (analítica histórica)
- **Estado**: ❌
- **Prioridad**: 🟢 BAJA

---

## 6. Operaciones y logística

### 6.1 Programar recogida con chofer
- **Qué hace**: Asigna ruta, hora, vehículo según disponibilidad y geo.
- **Comando ejemplo**:
  - Andrea: "Diego, programá retiro Pincore mañana 10am."
  - Diego: "Mañana 10am Pincore Maipú: chofer Hugo (camión 5R-02) disponible, 4 retiros previos en ruta cerca. ETA 10:15. ¿Confirmo y aviso a Hugo y Pincore?"
- **Usuario**: Andrea, Cony, Chofer
- **Datos**: `curated.rutas_chofer`, `curated.vehiculos`, `curated.disponibilidad_chofer`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 6.2 Avisar al cliente "tu camión sale a las 10am"
- **Qué hace**: Notif outbound WhatsApp al contacto del cliente.
- **Comando ejemplo**:
  - Diego (auto, 30 min antes retiro): "Hola Pincore, soy Diego de Reciclean. Confirmamos retiro hoy 10:00 con chofer Hugo (camión patente XX-XX). Por favor tener listos los pallets. Cualquier cambio, respondé este mensaje."
- **Usuario**: Cliente externo (GENERADOR)
- **Datos**: `curated.retiros_programados` + WhatsApp API outbound
- **Estado**: ❌ (Diego hoy es solo inbound)
- **Prioridad**: 🔴 ALTA

### 6.3 Registrar incidentes en ruta
- **Qué hace**: Chofer reporta problema por WhatsApp, Diego abre ticket.
- **Comando ejemplo**:
  - Chofer Hugo: "Diego, Pincore no tiene los pallets listos, me hacen esperar 1h."
  - Diego: "Incidente registrado (INC-2026-0142). Aviso Andrea y le pregunto si re-priorizamos ruta. Hugo, ¿esperás o paso a próximo retiro?"
- **Usuario**: Chofer, Andrea, Cony
- **Datos**: `curated.incidentes_operacion`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 6.4 Reporte consumo diésel por vehículo
- **Qué hace**: Si hay integración COPEC/Petrobras, reporta consumo, eficiencia, alertas.
- **Comando ejemplo**:
  - Dusan: "Diego, diésel mayo."
  - Diego: "Mayo flota Reciclean: 8.420L · $9.8M · 4 vehículos · eficiencia prom 2.8 km/L (-8% vs abril). Alerta: camión 5R-04 consumo 2.1 km/L vs prom 3.0 — revisar mantención."
- **Usuario**: Dusan, Cony
- **Datos**: `staging.copec_consumos` (integración pendiente) + `curated.vehiculos`
- **Estado**: ❌ (cron COPEC pendiente VERIFICAR)
- **Prioridad**: 🟢 BAJA

### 6.5 Análisis sucursal: capacidad y stock
- **Qué hace**: Stock material por sucursal, capacidad ocupada, alertas saturación.
- **Comando ejemplo**:
  - Dusan: "Diego, ¿cómo está Maipú?"
  - Diego: "Maipú al 22-may: capacidad 78% (alerta amarilla >75%). Stock: cartón 42 ton (5d producción), plástico 18 ton, vidrio 6 ton. Próximo despacho VALORIZADOR-XX miércoles. Si no sale, sábado satura."
- **Usuario**: Dusan, Andrea, Cony
- **Datos**: `curated.stock_sucursal`, `curated.despachos_programados`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

---

## 7. Reportes y resúmenes automáticos

### 7.1 Reporte diario PM (cierre 18:00)
- **Qué hace**: Push automático a Dusan + Andrea + Cony al cierre operativo.
- **Comando ejemplo**:
  - Diego (auto 18:00): "Cierre 22-may: ingresos $12.4M (+8% vs prom), 42 pesajes, 18 ton, 3 sucursales activas. Alertas: 3 anomalías pesaje, 6 facturas pendientes, 18 huérfanos Andrea. Pipeline movió: 2 ops avanzaron, 1 perdida. Mañana: 8 retiros programados, capacidad Maipú 78%."
- **Usuario**: Dusan, Andrea, Cony
- **Datos**: `curated.f_resumen_diario()`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 7.2 Reporte semanal CEO (lunes 6am)
- **Qué hace**: Vista ejecutiva: top materiales, top clientes, anomalías, decisiones pendientes.
- **Comando ejemplo**:
  - Diego (auto lunes 6am, solo a Dusan): "Buenos días Dusan. Semana 19/2026: $58M ingresos (-3% vs sem anterior, dentro de banda). Top material: cartón $24M. Top cliente: Pincore $4.8M. Anomalía relevante: margen plástico bajó a 24% (piso 30%, sugiero revisar tarifa). Pipeline cerrado: $8M. Decisiones que esperan tu firma: 3."
- **Usuario**: Dusan
- **Datos**: `curated.f_resumen_semanal()`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 7.3 Reporte mensual día 1
- **Qué hace**: P&L preliminar, estado vs meta OKR, KPIs.
- **Comando ejemplo**:
  - Diego (auto día 1 mes, 7am): "Cierre abril 2026: ingresos $245M (meta $240M, +2% ✅), margen consolidado 31% (meta 30% ✅), nuevos clientes 14 (meta 12 ✅), churn 3 (meta <5 ✅). KPI rojo: tiempo cobro 47d (meta <35d ❌). ¿Querés el detalle por sucursal o por línea Reciclean/Farex?"
- **Usuario**: Dusan
- **Datos**: `curated.f_resumen_mensual()` + tabla `curated.metas_okr`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 7.4 Reportes ad-hoc por pregunta natural
- **Qué hace**: Parser que mapea preguntas a SQL.
- **Comando ejemplo**:
  - Dusan: "Diego, ¿cuánto cartón vendimos a valorizadores en abril desde Cerrillos?"
  - Diego: "Cerrillos abril 2026 → cartón a VALORIZADORES: 42.3 ton · $14.2M · 3 destinos (PAPELES INDUSTRIALES 28t, RECICLAJES UNIDOS 10t, PAPELERA SUR 4.3t). Margen prom salida 18%."
- **Usuario**: Dusan, Andrea, Cony
- **Datos**: vistas semánticas + LLM-to-SQL controlado
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

---

## 8. Alertas proactivas

### 8.1 Cliente inactivo (sin compra >60 días)
- **Qué hace**: Detecta clientes activos históricos que dejaron de operar.
- **Comando ejemplo**:
  - Diego (lunes a Andrea): "5 clientes inactivos >60d con histórico relevante: PINCORE LIMITADA (último 18-mar, $12M histórico), ECOPACK (28-feb), [..]. ¿Te armo agenda de contacto?"
- **Usuario**: Andrea
- **Datos**: `curated.f_clientes_inactivos(dias_umbral)`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 8.2 Folio duplicado pesaje vs DTE
- **Qué hace**: Detecta cuando un mismo folio aparece en dos pesajes o un folio físico no coincide con DTE.
- **Comando ejemplo**:
  - Diego: "⚠️ Folio 4480 aparece en pesajes Cerrillos (22-may) y Maipú (22-may). Imposible. Cony y Pablo notificados, hay que investigar."
- **Usuario**: Cony, Pablo, Dyana
- **Datos**: índice único folio + EF watchdog
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 8.3 Margen bajo piso
- **Qué hace**: Cualquier cotización o pesaje con margen <30% genera alerta.
- **Comando ejemplo**:
  - Diego (al cerrar cotización Andrea): "⚠️ Cotización OP-042 margen 24% (piso 30%). ¿Confirmás excepción y pedís OK Dusan, o ajustás precio?"
- **Usuario**: Andrea, Dusan (firma excepción)
- **Datos**: `curated.cotizaciones.margen_pct` + `curated.tarifas_oficiales.piso_margen`
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 8.4 Stock bajo en sucursal
- **Qué hace**: Stock material < umbral crítico → alerta operaciones.
- **Comando ejemplo**:
  - Diego: "🟡 Stock plástico Talca: 2.4 ton (umbral 3 ton). Próximo retiro programado jueves. Si Andrea cierra venta VALORIZADOR-XX, dejamos sin material."
- **Usuario**: Cony, Andrea
- **Datos**: `curated.stock_sucursal` + `curated.config_umbrales_stock`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 8.5 PR de Pablo esperando review
- **Qué hace**: Diego revisa GitHub vía webhook, avisa a Dusan PRs abiertos >24h.
- **Comando ejemplo**:
  - Diego (a Dusan): "2 PRs de Pablo esperan tu review: PR#142 'Cotizador v6.1 + matriz descuentos' (48h), PR#145 'EF reporte semanal' (8h). ¿Reviso resumen acá?"
- **Usuario**: Dusan
- **Datos**: GitHub API + tabla `panel.github_pr_estado`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 8.6 SLA respuesta cliente
- **Qué hace**: Si Andrea no responde un WhatsApp cliente >X horas, recordatorio.
- **Comando ejemplo**:
  - Diego (a Andrea): "Recordatorio: Pincore te escribió hace 4h pidiendo cotización. SLA 2h. ¿Respondo borrador yo o lo tomás vos?"
- **Usuario**: Andrea
- **Datos**: WhatsApp business + `panel.diego_bandeja` (ya capta mensajes)
- **Estado**: 🟡 (mensajes entran a bandeja, SLA tracking VERIFICAR)
- **Prioridad**: 🔴 ALTA

---

## 9. Compromisos y memoria del equipo

### 9.1 Recordar promesas a clientes
- **Qué hace**: Diego escucha frases tipo "le prometí" "le dije que" "queda" y crea recordatorio.
- **Comando ejemplo**:
  - Andrea (WhatsApp interno): "Le prometí a Pincore enviar muestra cartón OCC2 el viernes."
  - Diego: "Anotado. Recordatorio 'Enviar muestra OCC2 a Pincore' programado para viernes 9am, asignado Andrea. Si requiere coordinación con bodega Maipú, decime."
- **Usuario**: Andrea, Cony, todo el equipo
- **Datos**: `curated.compromisos` (tabla nueva)
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 9.2 Compromisos pendientes por persona
- **Qué hace**: Vista personal: lo que cada uno prometió y no cumplió.
- **Comando ejemplo**:
  - Andrea: "Diego, ¿qué tengo pendiente?"
  - Diego: "Andrea pendientes 22-may: 1) Enviar muestra Pincore (vence vie 24). 2) Llamar Ecopack (vence hoy). 3) Cotizar Maderas Sur (atrasada 3d). 4) Revisar 18 pesajes huérfanos. ¿Empezamos por algo?"
- **Usuario**: Todos
- **Datos**: `curated.compromisos` filtrado por owner
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 9.3 Decisiones firmadas Dusan (memoria histórica)
- **Qué hace**: Diego conserva firmas de Dusan tipo "Pto Montt arranca agosto", las saca cuando aplica.
- **Comando ejemplo**:
  - Andrea: "¿Puedo cotizar Pto Montt?"
  - Diego: "Pto Montt bloqueada por SEREMI (sin permiso operación). Decisión Dusan 21-may: NO promover D-2026-01-EXEC leasing ni D-2026-02-EXEC arriendo sin OK sesión activa. No cotizar hasta nueva firma."
- **Usuario**: Andrea, Pablo, Dusan
- **Datos**: `DECISIONES.md` (repo) + tabla `curated.decisiones_ceo`
- **Estado**: 🟡 (existe `mayordomo/DECISIONES.md` VERIFICAR si Diego accede)
- **Prioridad**: 🟠 MEDIA

### 9.4 Acuerdos con clientes (vencimientos)
- **Qué hace**: Contratos, acuerdos de exclusividad, descuentos vigencia limitada.
- **Comando ejemplo**:
  - Diego (a Andrea, 30d antes vencer): "Pincore: contrato precio cartón vence 22-jun (30d). ¿Renegociamos antes o lo dejamos correr?"
- **Usuario**: Andrea, Cony, Dusan
- **Datos**: `curated.acuerdos_cliente` (tabla nueva)
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

---

## 10. Inteligencia de negocio

### 10.1 Detectar tendencias de precio de mercado
- **Qué hace**: Conecta con índices LME (cobre, aluminio), Recypoint, RISI (cartón) → recomienda ajuste tarifa.
- **Comando ejemplo**:
  - Diego (a Dusan, lunes): "📈 Cobre +22% últimos 14d (LME). Nuestra tarifa compra cobre $X kg, venta $Y kg. Mantener margen % implica subir compra a $X+22% y venta a $Y+22%. ¿Subo o congelamos esta semana?"
- **Usuario**: Dusan
- **Datos**: scraping externo + `curated.tarifas_oficiales` + memoria "modelo comprador-revendedor margen %"
- **Estado**: ❌
- **Prioridad**: 🔴 ALTA

### 10.2 Sugerir cross-sell
- **Qué hace**: Detecta GENERADORES que compran 1 material pero no otros lógicos.
- **Comando ejemplo**:
  - Diego (a Andrea): "Detecté 5 GENERADORES Maipú que entregan cartón pero NO papel ($2.4M oportunidad estimada): Pincore, Ecopack, [..]. La mayoría son retail+oficina. ¿Te armo guion comercial?"
- **Usuario**: Andrea, Dusan
- **Datos**: `curated.f_cross_sell_oportunidades()` + heurística material-perfil
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 10.3 Comparar Reciclean vs Farex en mismo material
- **Qué hace**: Aluminio se cruza ambas líneas → analiza dónde conviene canalizarlo.
- **Comando ejemplo**:
  - Dusan: "Diego, aluminio Reciclean vs Farex."
  - Diego: "Aluminio abril 2026: Reciclean 8.4 ton ($14M, margen 28%), Farex 12.1 ton ($21M, margen 31% + retención IVA SII a favor). Sugerencia: si cliente es contribuyente IVA, Farex mejora 4-6pp margen efectivo."
- **Usuario**: Dusan
- **Datos**: `curated.pesajes` + flag empresa (Reciclean SPA / Farex SPA)
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 10.4 Simular impacto de decisiones
- **Qué hace**: What-if: cambiar margen, agregar sucursal, cerrar línea.
- **Comando ejemplo**:
  - Dusan: "Diego, ¿qué pasa si bajo margen cartón de 32% a 28% para ganar volumen?"
  - Diego: "Simulación con 6m histórico: a -4pp margen, asumiendo +18% volumen (elasticidad estimada): ingresos +12% ($+8.4M/mes), utilidad bruta -3% ($-1.1M). Punto equilibrio: necesitás +24% volumen para igualar utilidad actual. Riesgo: clientes existentes pueden pedir mismo precio = -$2.3M cliente actual."
- **Usuario**: Dusan
- **Datos**: `curated.f_simulacion_pricing(material, delta_margen)` + análisis elasticidad
- **Estado**: ❌
- **Prioridad**: 🟢 BAJA

### 10.5 Score de salud del negocio
- **Qué hace**: Indicador compuesto: ingresos, margen, churn, NPS, cumplimiento SLA.
- **Comando ejemplo**:
  - Dusan: "Diego, health score."
  - Diego: "Health score 22-may: 78/100 (verde, banda 70-85). Subscores: ingresos 82 ✅, margen 71 🟡 (bajando), operación 84 ✅, comercial 74 🟡 (pipeline estancado), finanzas 79 ✅. Riesgo principal: margen plástico cae 6 semanas seguidas, requiere acción."
- **Usuario**: Dusan
- **Datos**: `curated.f_health_score()` (composición ponderada)
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

### 10.6 Recomendaciones GestionREP (Ley REP)
- **Qué hace**: Calcula cumplimiento metas REP por categoría, alerta gaps.
- **Comando ejemplo**:
  - Diego (a Dusan, fin de trimestre): "Cumplimiento Ley REP Q1 2026: envases plástico 78% meta MMA (gap 22%), cartón 105% ✅, vidrio 91%. Si seguimos ritmo, multa estimada Q2 $XM. Sugerencia: pasar 12 ton plástico de Farex a Reciclean para que cuente como gestor REP."
- **Usuario**: Dusan
- **Datos**: integración SISREP MMA + `curated.cumplimiento_rep`
- **Estado**: ❌
- **Prioridad**: 🟠 MEDIA

---

## Resumen ejecutivo

- **Total capacidades documentadas**: 52 (10 secciones · 4-8 capacidades cada una)
- **Prioridades**: 🔴 22 ALTAS · 🟠 23 MEDIAS · 🟢 7 BAJAS
- **Estado v5.1.0**: ✅ 2 totalmente operativas · 🟡 8 parciales · ❌ 42 a construir
- **Tablas/RPCs a construir**: ~18 nuevas (compromisos, acuerdos, simulación, health score, decisiones_ceo, stock_sucursal, rutas, vehículos, incidentes, etc.)
- **Integraciones externas faltantes**: WhatsApp outbound, COPEC consumos, índices precios externos (LME/RISI), GitHub PRs, SISREP MMA

## Top 5 capacidades CRÍTICAS para destrabar HOY

1. **3.5 Asignar pesajes huérfanos** — Andrea tiene 18 pendientes, cada uno bloquea facturación
2. **4.1 + 4.3 Recordar facturas pendientes y gaps de facturación** — $4.8M expuesto sin DTE
3. **2.6 Alertar precios fuera de tarifa en cotización** — 82 alertas críticas advisor sin canalizar
4. **9.1 + 9.2 Compromisos y memoria del equipo** — promesas se pierden, recordatorio personal
5. **7.1 + 7.2 Reportes diario PM y semanal CEO** — Dusan necesita pulso sin pedir
