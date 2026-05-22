# DIEGO — Capacidades de Integración (Agente D · v1.0)

> Documento técnico exhaustivo de TODO lo que el chatbot Diego (asistente conversacional WhatsApp de Reciclean-Farex-SERCOT, v5.1.0 producción) puede / debe conectar.
>
> **Fuente de verdad**: Supabase project `eknmtsrtfkzroxnovfqn` (sa-east-1, PG 17.6) · 78 migraciones · 21 Edge Functions activas (verificado MCP 22-may-2026) · 52+ políticas RLS · 10 buckets Storage · 4 cron jobs activos.
>
> **Audiencia**: Agente Z (consolidador) + Pablo (tech lead) + Dusan (CEO firmante).

---

## ÍNDICE

1. [Integración Supabase](#1-integración-supabase)
2. [Edge Functions](#2-edge-functions)
3. [APIs externas](#3-apis-externas)
4. [n8n workflows](#4-n8n-workflows)
5. [Webhooks entrantes](#5-webhooks-entrantes)
6. [Webhooks salientes](#6-webhooks-salientes)
7. [Eventos y bus de mensajes](#7-eventos-y-bus-de-mensajes)
8. [Multi-tenant (Reciclean / Farex / SERCOT / GestionREP)](#8-multi-tenant)
9. [Observability](#9-observability)
10. [Seguridad de integraciones](#10-seguridad-de-integraciones)

---

## 1. Integración Supabase

Diego vive dentro del ecosistema Supabase. Es a la vez **consumidor** (SELECT, RPC, Storage download, Realtime subscriber) y **productor** (INSERT auditado, Storage upload, evento `panel.diego_bandeja`).

### 1.1 Lectura — Vistas curadas (SELECT)

**Qué hace**: Diego responde preguntas de negocio en NL traduciéndolas a `SELECT` sobre vistas curadas. Nunca toca tablas crudas directamente.

**Vistas canónicas disponibles** (verificado 22-may-2026 vía `pg_views`):

| Vista | Propósito | Diego la usa para |
|---|---|---|
| `curated.vw_alertas_criticas` | Alertas activas que requieren atención | "¿qué alertas críticas hay hoy?" |
| `curated.vw_cartera_clientes_actual` | Cartera viva con categoría evolutiva | "¿cómo está la cartera de Pincore?" |
| `curated.vw_cartera_detalle` | Detalle 8 métricas por cliente | "dame el detalle de SERCOT Cerrillos" |
| `curated.vw_cierre_hoy` | Estado cierre del día actual | "¿cerramos el día?" |
| `curated.vw_cierre_mes_actual` | KPIs mes corriente | "¿cómo vamos este mes?" |
| `curated.vw_clientes_status` | Status comercial cliente | "¿qué cliente está frío?" |
| `curated.vw_compras_diesel_dia_empresa` | Diesel consumido hoy | "¿cuánto diesel se quemó hoy?" |
| `curated.vw_costo_personal_grupo` | Costo personal grupo entero | "costo total planilla" |
| `curated.vw_costo_personal_por_sucursal` | Costo personal x sucursal | "costo Cerrillos vs Maipú" |
| `curated.vw_costos_fijos_vigente` | Costos fijos del mes | "costos fijos vigentes" |
| `curated.vw_costos_variables_vigente` | Costos variables del mes | input cotizador |
| `curated.vw_descuentos_pisos_vigente` | Pisos descuento por rol | guardrail Diego cotización |
| `curated.vw_documentos_negocio` | Entregables por negocio | "¿qué docs hay del negocio X?" |
| `curated.vw_e360_cobertura` | Cobertura E360 click-derecho | navegación contextual RDO |
| `curated.vw_entidades_rep` | Entidades Ley REP | "¿quién es valorizador?" |
| `curated.vw_entregables_estado_matriz` | Matriz envío entregables | "¿se envió la carta a Pincore?" |
| `curated.vw_estructura_costos_mensual` | Estructura costos mes | reporte ejecutivo mensual |
| `curated.vw_margen_metas_vigente` | Margen meta por categoría | validar margen cotizado |
| `curated.vw_materiales_sucursal_precios_vigente` | Precios material x sucursal | "¿a cuánto compramos PET?" |
| `curated.vw_negocio_timeline` | Timeline eventos negocio | "¿qué pasó con negocio X?" |
| `curated.vw_oferentes_ranking` | Ranking proveedores externos | sugerir transportista |
| `curated.vw_oportunidades_crm` | Oportunidades CRM | "¿qué oportunidades hay?" |
| `curated.vw_oportunidades_kanban` | Kanban embudo | estado embudo comercial |
| `curated.vw_parametros_retiro_vigente` | Parámetros cotizador | input `f_evaluar_retiro` |
| `curated.vw_personal_detalle_por_sucursal` | Detalle planilla x sucursal | "¿quién trabaja en Maipú?" |
| `curated.vw_precio_diesel_actual` | Precio diesel CLP/L hoy | input cotizador |
| `curated.vw_propuestas_activas` | Propuestas equipo (16 activas) | "¿qué propuestas hay?" |
| `curated.vw_reconciliacion_buckets` | Buckets categorización clientes | reporte cartera |
| `curated.vw_reconciliacion_planilla` | Reconciliación SERCOT vs operativo | "¿planilla cuadra?" |
| `curated.vw_scoring_pesos_vigente` | Pesos scoring vigentes | scoring cliente |
| `curated.vw_tarifas_uf_vigente` | Tarifas UF T01-T11 firmadas | "¿qué tarifa cobramos?" |
| `panel.v_crm_cliente_360` | Vista 360 cliente Impulsa+RDO | "todo sobre cliente X" |
| `panel.v_crm_impulsa_clientes` | 1971 clientes Impulsa | "¿está en Impulsa?" |
| `panel.v_crm_impulsa_oportunidades` | 10214 oportunidades Impulsa | "histórico Impulsa" |
| `panel.v_crm_impulsa_cotizaciones` | Cotizaciones Impulsa | precios referencia históricos |
| `panel.v_crm_impulsa_contactos` | Contactos Impulsa | "¿tenés mail de X?" |
| `panel.v_crm_impulsa_productos` | Productos Impulsa | catálogo histórico |
| `panel.v_crm_impulsa_prospectos` | Prospectos Impulsa | leads sin convertir |
| `panel.v_diego_pendientes` | Bandeja Diego pendientes | "¿qué tengo pendiente?" |
| `panel.v_diego_resueltos_recientes` | Bandeja resueltos | "¿qué cerramos hoy?" |
| `panel.v_equipo_completo` | Trabajadores + asignación | "¿quién es Andrea?" |
| `panel.v_panel_silos_visibles` | Permisos por usuario | autorización lectura |
| `panel.v_tesoreria_ultimo` | KPIs tesorería | "saldo caja" |
| `panel.vw_diego_bandeja_detalle` | Bandeja Diego detallada | dashboard Diego |

**Endpoint Diego (NL → SQL)**:
```typescript
// Diego pregunta interna ChatGPT/Claude:
// "Usuario quiere saber cartera de Pincore. ¿Qué view?"
// → vw_cartera_detalle WHERE cliente_nombre ILIKE '%pincore%'
const { data } = await supabase
  .schema('curated')
  .from('vw_cartera_detalle')
  .select('*')
  .ilike('cliente_nombre', '%pincore%')
  .limit(5);
```

**Estado actual Diego v5.1.0**: PARCIAL. Diego v5.1 lee `staging.dieguito_destinations` y `panel.usuarios_autorizados` (validación). No tiene aún NL→SQL sobre vistas curadas — es la gran extensión 2026.

**Riesgos**: SQL injection si NL→SQL no usa parametrización. Mitigación: **whitelist de vistas + parser AST de SQL generado** (Postgres `EXPLAIN` antes de ejecutar).

**Prioridad**: ALTA.

### 1.2 Escritura controlada (INSERT / UPDATE / DELETE auditados)

**Qué hace**: Diego puede crear oportunidades, registrar negocios expedicionarios, capturar pesajes manuales, actualizar estado de entregables.

**Tablas escribibles** (RLS habilitada post mig 047, `security_invoker=on`):

| Tabla | Operación Diego | Auditoría |
|---|---|---|
| `curated.oportunidades` | INSERT (lead nuevo) / UPDATE estado | trigger `negocios_notificaciones` automático |
| `curated.pesajes_operacion` | INSERT desde WhatsApp foto romana | OCR vía `ocr-tablero` + verificación supervisor |
| `curated.compras_diesel` | INSERT desde foto boleta | `ocr-diesel` → `registros_diesel` (revisado=false hasta validar) |
| `curated.entregables_envios` | INSERT en cola envío email/WA | poll n8n cada 30s |
| `curated.propuestas_equipo` | INSERT propuesta interna | proponente, ámbito, impacto |
| `staging.dieguito_tasks` | INSERT tarea desde NL | trazabilidad fuente_texto + ai_reasoning |
| `staging.dieguito_captured_messages` | INSERT log mensaje | destination_ids + tasks_creadas |
| `panel.diego_bandeja` | INSERT/UPDATE 8W | `what/who/where_/when_/why/how_` + responsable |
| `mayordomo.cola_construccion` | INSERT ítem `tipo='diego_propuesta'` | flujo audit→sign→exec |

**Patrón escritura segura**:
```typescript
// Cliente service_role (Edge Function) NUNCA el anon
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// 1. Validar usuario autorizado primero
const { data: usuario } = await sb.schema('panel')
  .from('usuarios_autorizados')
  .select('email, activo, rol')
  .eq('email', subido_por).eq('activo', true).maybeSingle();
if (!usuario) return { error: 'No autorizado' };

// 2. Aplicar guardrails (margen mínimo, descuento permitido)
const { data: validacion } = await sb.rpc('f_validar_descuento', {
  p_cliente_id, p_nivel_autorizacion: usuario.rol, p_descuento_propuesto
});
if (!validacion.permitido) return { error: 'Descuento excede piso' };

// 3. Insertar con trazabilidad
await sb.schema('curated').from('oportunidades').insert({
  ..., created_by: subido_por, fuente: 'diego_whatsapp'
});
```

**Estado actual Diego v5.1.0**: PARCIAL. Escribe en `staging.dieguito_*` (sandbox). NO escribe aún en `curated.*` ni en `panel.diego_bandeja` 8W estructurada.

**Riesgos**: Diego escribiendo en producción sin doble validación humana puede contaminar datos. Mitigación: **toda escritura crítica pasa por `mayordomo.cola_construccion` con `requiere_firma=true`** si afecta dinero/contratos.

**Prioridad**: ALTA.

### 1.3 RPC — Ejecutar funciones de negocio

**Qué hace**: Diego invoca funciones SQL del schema `curated` para cotizar, cerrar día, listar oferentes, generar entregables.

**Funciones disponibles** (verificado vía `pg_proc`):

| Función | Args | Retorna | Uso Diego |
|---|---|---|---|
| `curated.f_evaluar_retiro` | km, kilos, material_id, cliente_id, sucursal, uf_clp, etc. | TABLE rank ordering vehículos + decisión | "cotizame retiro 30 km, 500 kg PET, cliente X" |
| `curated.f_cerrar_dia` | p_fecha | TABLE(empresa, accion, facturado_neto) | "cerrá el día" (cron diario 23:55 CL) |
| `curated.f_cerrar_mes` | p_fecha_referencia | TABLE cierre mensual | "cerrá el mes" (cron día 1) |
| `curated.f_descuento_permitido` | cliente_id, nivel_autorizacion | jsonb {permitido, piso_uf} | guardrail cotización |
| `curated.f_validar_descuento` | cliente_id, nivel, descuento_propuesto | jsonb {permitido, motivo} | guardrail cotización |
| `curated.f_listar_oferentes` | tipo_servicio_id, zona | TABLE ranking oferentes | "sugerí transportista en Talca" |
| `curated.f_sugerir_oferentes_para_negocio` | zona_origen | TABLE oferentes x servicio | armar negocio expedicionario |
| `curated.f_generar_alcance_negocio` | negocio_id | text (HTML alcance) | "generá alcance negocio X" |
| `curated.f_generar_carta_cliente` | negocio_id, asunto | text (HTML carta) | "redactá carta a cliente X" |
| `curated.f_generar_diagrama_activacion` | negocio_id | text (HTML mermaid) | diagrama activación |
| `curated.f_generar_diagrama_cotizacion` | negocio_id | text (HTML) | diagrama cotización |
| `curated.f_generar_pack_comercial` | negocio_id | TABLE 5 entregables | "armá pack comercial" |
| `curated.f_generar_pauta_seguimiento` | negocio_id | text | pauta seguimiento |
| `curated.f_generar_presentacion_corporativa` | (sin args) | text | presentación corp |
| `curated.f_generar_presentacion_servicio` | negocio_id | text | presentación servicio |
| `curated.f_generar_ruta_dia` | trabajador_id, fecha | text | ruta diaria operario |
| `curated.f_renderizar_entregables_html` | negocio_id | bigint (render_request_id) | dispara render Storage |
| `curated.f_crm_sugerencias_match` | threshold, limit | TABLE matches CRM Impulsa↔RDO | "matcheá clientes Impulsa" |
| `curated.f_decisiones_for_entity` | tipo, id | jsonb decisiones | histórico decisiones entidad |
| `curated.f_e360_slice_for_entity` | tipo, id, nivel | jsonb slice E360 | navegación contextual |
| `curated.f_kpis_for_entity` | tipo, id | jsonb KPIs | KPIs entidad |
| `mayordomo.f_claim_next_item` | pc, tipos[] | uuid | reclamar siguiente tarea cola |
| `mayordomo.f_heartbeat` | pc, sesion_id, notas | timestamp | latido PC |
| `mayordomo.f_monitor_5min` | (sin args) | TABLE anomalías | cron 5min watchdog |
| `mayordomo.f_release_expired_claims` | (sin args) | integer | liberar locks expirados |

**Patrón invocación**:
```typescript
const { data, error } = await sb.rpc('f_evaluar_retiro', {
  p_km: 30, p_kilos: 500, p_material_id: 'M-PET-001',
  p_cliente_id: 'C-PINCORE', p_uf_clp: 40273.69
});
// data = [{rank:1, vehiculo_tipo:'camion_3/4', margen_pct:0.22, decision:'OK'}]
```

**Estado actual Diego v5.1.0**: NO. Diego v5.1 no invoca RPCs aún. Es la **segunda gran extensión 2026**.

**Riesgos**: `f_evaluar_retiro` con parámetros inválidos puede dar cotización absurda. Mitigación: **validación esquema input antes de RPC + log de cada invocación en `curated.diego_logs`**.

**Prioridad**: ALTA.

### 1.4 Realtime — Subscripciones en vivo

**Qué hace**: Diego se suscribe a cambios en tablas críticas y reacciona en tiempo real.

**Tablas con Realtime habilitado**:
- `panel.diego_bandeja` — nueva pregunta entrante 8W → Diego procesa
- `curated.oportunidades` — cambio de estado → notifica responsable
- `mayordomo.cola_construccion` — nuevo ítem pendiente → PC reclama
- `curated.pesajes_operacion` — pesaje nuevo → valida tara/bruto/neto
- `curated.alertas` — alerta crítica → broadcast WhatsApp grupo

**Patrón subscription**:
```typescript
supabase
  .channel('diego-bandeja-watcher')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'panel', table: 'diego_bandeja' },
    payload => processBandejaItem(payload.new))
  .subscribe();
```

**Estado actual Diego v5.1.0**: NO. Diego v5.1 es pull (webhook WhatsApp → process). No tiene workers Realtime aún.

**Riesgos**: Reconexión socket, mensaje perdido. Mitigación: **resync periódico vía SELECT últimas 100 filas + last_seen_id**.

**Prioridad**: MEDIA.

### 1.5 Storage — Buckets

**Qué hace**: Diego sube fotos boleta/romana/IDs desde WhatsApp y baja entregables PDF/HTML para enviar.

**Buckets activos** (verificado `storage.buckets`):

| Bucket | Público | Diego usa para |
|---|---|---|
| `chatbot-fotos` | sí | fotos entrantes WhatsApp Diego v5.0 legacy |
| `fotos-vehiculo` | sí | fotos camiones operativo |
| `rrss-templates` | sí | plantillas redes sociales |
| `proveedores` | no | docs oferentes externos |
| `audio_mensajes` | sí | audios WhatsApp transcribir |
| `evidencias_dieguito` | no | evidencias por tarea Dieguito |
| `logos_corporativos` | sí | branding entregables |
| `entregables_html` | sí | HTMLs cartas/presentaciones (serve-entregable-html) |
| `operativos` | no | PDFs operativos diarios |
| `impulsa-documentos` | no | scraping CRM Impulsa |

**Patrón upload Diego**:
```typescript
// Diego recibe foto romana por WhatsApp
const { data: media } = await fetch(`graph.facebook.com/v19.0/${mediaId}`);
const blob = await media.blob();
await sb.storage.from('evidencias_dieguito')
  .upload(`pesajes/${negocio_id}/${Date.now()}.jpg`, blob,
    { contentType: 'image/jpeg', upsert: false });
// Luego OCR
await sb.functions.invoke('ocr-tablero', { body: { url: signedUrl } });
```

**Estado actual Diego v5.1.0**: PARCIAL. Sube a `evidencias_dieguito`, `audio_mensajes`. No baja entregables aún para enviar (workflow n8n pendiente).

**Riesgos**: Buckets públicos exponen URLs adivinables. Mitigación: **signed URLs con expiración** + paths con UUID, no IDs secuenciales.

**Prioridad**: MEDIA.

### 1.6 Auth — Validación JWT y rol

**Qué hace**: Diego valida el JWT del usuario que pregunta (web embedido) o mapea phone WhatsApp → email autorizado (`panel.usuarios_autorizados`, 14 usuarios).

**Patrón**:
```typescript
// Vía Edge Function dieguito-whatsapp:
const WA_USER_MAP: Record<string, string> = {
  '56963069065': 'dusan.arancibia@gmail.com',
  '56987654321': 'andrea@reciclean.cl',
  default: 'gerencia@gestionrepchile.cl',
};
const email = WA_USER_MAP[from] ?? WA_USER_MAP['default'];
const { data: usuario } = await sb.schema('panel')
  .from('usuarios_autorizados')
  .select('email, activo, rol')
  .ilike('email', email).eq('activo', true).maybeSingle();
```

**Estado actual Diego v5.1.0**: SÍ implementado. Mapeo simple hardcoded → migrar a tabla `panel.diego_phone_user_map`.

**Riesgos**: Spoof WhatsApp number. Mitigación: **WhatsApp Business API ya valida número por sí mismo + firma webhook X-Hub-Signature-256**.

**Prioridad**: ALTA (migrar mapping a tabla).

---

## 2. Edge Functions

**21 Edge Functions activas** verificadas vía `mcp__claude_ai_Supabase__list_edge_functions` (22-may-2026). Listado real, no estimado.

### 2.1 dieguito-whatsapp (v1, verify_jwt=false)

**Qué hace**: Webhook entrada WhatsApp Cloud API. Verifica `hub.verify_token` en GET. Recibe mensajes en POST, marca leído, traduce a `dieguito-process`, responde al usuario.

**Endpoint**: `POST https://eknmtsrtfkzroxnovfqn.supabase.co/functions/v1/dieguito-whatsapp`

**ENV secrets**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN` (default `reciclean2026`).

**Inputs**: body WhatsApp Cloud API estándar (entry[0].changes[0].value.messages[0]).

**Outputs**: siempre HTTP 200 (Meta requiere). Mensaje WhatsApp de retorno con tareas creadas.

**Limitación actual**: solo procesa text. Audio/imagen/PDF ignorados con mensaje genérico. Falta soporte media WhatsApp (`/v19.0/{media_id}` + auth bearer).

**Estado**: SÍ producción v5.1. Falta media y templates.

**Prioridad upgrade**: ALTA.

### 2.2 dieguito-process (v7, verify_jwt=true)

**Qué hace**: Núcleo NLP. Recibe `{subido_por, text, file_base64, file_mime, file_name, suggest_only}`. Si tiene archivo: audio→Whisper-1, imagen→GPT-4o vision, PDF/texto→decode. Llama GPT-4o con prompt sistema Dieguito + lista `staging.dieguito_destinations` activas. Extrae `tasks[]` con `{titulo, descripcion, prioridad, categoria, destination_ids}`. Inserta en `staging.dieguito_tasks` + `staging.dieguito_task_destinations` + log en `staging.dieguito_captured_messages`.

**ENV secrets**: `OPENAI_API_KEY` (saldo + acceso gpt-4o + whisper-1).

**Doble cliente Supabase** (patrón validado producción):
- `anon` JWT legacy (hardcoded) → SELECT `panel.usuarios_autorizados`
- `service_role` → INSERT `staging.dieguito_*`

**Estado**: SÍ producción v5.1.

**Limitación**: solo escribe en `staging`. No genera respuestas conversacionales — solo extrae tareas. Falta:
- Modo "responder pregunta" (NL→SQL→respuesta natural)
- Modo "ejecutar acción" (RPC + confirmación)
- Memoria conversacional (hilos por usuario)

**Prioridad upgrade**: ALTA.

### 2.3 rdo-builder (v7, verify_jwt=true)

**Qué hace**: Construye RDO diario consolidado por sucursal/empresa. Usado por panel-rdo.html (botón "Generar RDO hoy").

**Estado**: SÍ producción. Diego puede invocarlo: "armá el RDO de hoy".

**Prioridad**: MEDIA.

### 2.4 serve-entregable-html (v2, verify_jwt=true)

**Qué hace**: Sirve HTMLs entregables desde bucket `entregables_html` con headers correctos (no descarga, render inline).

**Endpoint**: `GET /functions/v1/serve-entregable-html?id={entregable_id}`

**Estado**: SÍ producción. Diego envía URL acortada por WhatsApp al cliente.

**Prioridad**: ALTA (ya funcional).

### 2.5 render-entregable-html (v4, verify_jwt=false)

**Qué hace**: Renderiza entregable HTML desde plantilla + datos negocio. Sube a Storage `entregables_html`.

**Estado**: SÍ producción.

### 2.6 uf-diaria (v2, verify_jwt=false)

**Qué hace**: Cron 13:00 UTC (10am CL). Llama `mindicador.cl/api/uf` → UPSERT `curated.uf_historico` (507 filas históricas verificadas).

**ENV**: ninguno (API pública mindicador).

**Cron**: `0 13 * * *` job `uf-diaria-daily` activo.

**Estado**: SÍ producción.

**Diego usa**: "¿cuánto está la UF hoy?" → SELECT última fila.

### 2.7 f-uf-hoy (v1, verify_jwt=false)

**Qué hace**: Devuelve UF de hoy (wrapper de la SQL function `f_uf_hoy`). Diego usa para conversión UF↔CLP en cotizaciones.

**Estado**: SÍ.

### 2.8 ocr-tablero (v7, verify_jwt=false)

**Qué hace**: OCR fotos tablero/romana (peso bruto, tara, neto) vía visión IA → `curated.pesajes_operacion`.

**Estado**: SÍ producción.

**Diego usa**: foto romana WhatsApp → OCR → pesaje registrado (con `revisado=false` hasta supervisor).

### 2.9 ocr-diesel (v2, verify_jwt=false)

**Qué hace**: OCR boleta diesel (precio litro, total CLP, RUT estación) → `curated.registros_diesel`.

**Estado**: SÍ producción.

**Diego usa**: foto boleta diesel → OCR → registro diesel.

### 2.10 google-maps-distance (v2, verify_jwt=false)

**Qué hace**: Wrapper Google Maps Distance Matrix API. Input: origen/destino. Output: km + minutos.

**ENV**: `GOOGLE_MAPS_API_KEY` (pendiente P1.4 según PENDIENTES.md).

**Estado**: ACTIVA pero clave Maps pendiente. Diego no la usa aún.

**Diego usa (futuro)**: "Costanera 1234 Maipú → Cerrillos" → km → `f_evaluar_retiro`.

**Prioridad**: ALTA.

### 2.11 ingest-pesajes-csv (v2, verify_jwt=true)

**Qué hace**: Ingesta masiva CSV pesajes (carga histórica).

**Estado**: SÍ producción.

**Diego**: no usa directamente. Andrea/Cony lo dispara desde panel.

### 2.12 export-csv-pesajes (v1, verify_jwt=true)

**Qué hace**: Exporta pesajes filtrados a CSV.

**Estado**: SÍ.

**Diego usa**: "exportá pesajes de Pincore mes pasado" → URL descarga CSV.

### 2.13 daily-digest (v1, verify_jwt=false)

**Qué hace**: Resumen diario sistema (presumiblemente cron). Verificar invocación.

**Estado**: ACTIVA. Cron asociado pendiente identificar.

**Diego usa (futuro)**: "mandame el digest del día" → WhatsApp Dusan/Pablo 9am.

**Prioridad**: MEDIA.

### 2.14 kpi-auto-calcular (v1, verify_jwt=true)

**Qué hace**: Calcula KPIs sistema (margen, cobertura, conversión).

**Estado**: SÍ.

**Diego usa**: "¿cuál es el margen promedio del trimestre?" → invoca.

### 2.15 pc-status (v3, verify_jwt=false)

**Qué hace**: Estado de los 4 PCs del régimen Mayordomo. Lee `mayordomo.heartbeat_pcs`.

**Estado**: SÍ.

**Diego usa**: "¿cómo están los PCs?" (skill `status-pcs`).

### 2.16 pc-watchdog (v6, verify_jwt=false)

**Qué hace**: Watchdog 5min. Libera claims expirados, alerta PC sin heartbeat >2h.

**Estado**: SÍ.

### 2.17 papa-gotas (v7, verify_jwt=false)

**Qué hace**: Endpoint micro para mensajes "gotas" (chat ligero panel). Status check.

**Estado**: SÍ.

### 2.18 mockup-panel-rdo (v4, verify_jwt=false)

**Qué hace**: Mockup data panel. Dev.

**Estado**: SÍ.

### 2.19 upload-mockup-storage (v2, verify_jwt=false)

**Qué hace**: Upload manual a Storage. Dev tool.

### 2.20 binary-upload (v2, verify_jwt=false)

**Qué hace**: Upload binario genérico Storage.

### 2.21 upload-presentacion-handoff (v2, verify_jwt=false)

**Qué hace**: Upload presentaciones handoff entre PCs.

### 2.22 GAPS — Edge Functions que Diego NECESITA y NO existen

| Nombre propuesto | Qué haría | Prioridad |
|---|---|---|
| `diego-cotizar` | Wrapper alto nivel de `f_evaluar_retiro` con NL parsing + validación + respuesta WhatsApp formateada | ALTA |
| `diego-asignar-pesaje` | Asigna pesaje pendiente al peoneta correcto vía geo + carga | ALTA |
| `diego-resumen-diario` | Genera resumen ejecutivo 9am: oportunidades nuevas, cierres, alertas, KPIs. Envía WhatsApp Dusan/Pablo | ALTA |
| `diego-nl-sql` | NL→SQL whitelist sobre vistas curadas con validación AST | ALTA |
| `diego-followup` | Detecta clientes sin contacto >X días → genera tarea seguimiento | MEDIA |
| `diego-margen-alert` | Si cotización < margen meta → alerta WhatsApp ejecutivo | MEDIA |
| `diego-send-message` | Wrapper genérico envío WhatsApp template/texto/media | ALTA |
| `diego-gmail-send` | Wrapper Gmail API send con OAuth `sistemas@gestionrepchile.cl` | ALTA |
| `diego-calendar-event` | Wrapper Google Calendar create event | MEDIA |
| `diego-monday-task` | Wrapper Monday.com create task | BAJA (depende OK Monday) |

---

## 3. APIs externas

### 3.1 WhatsApp Business API (Meta Cloud)

**Endpoint base**: `https://graph.facebook.com/v19.0/{PHONE_ID}/messages`

**Capacidades usadas**:
- POST text message
- POST status read (`{messaging_product:'whatsapp', status:'read', message_id}`)
- Webhook recepción mensajes
- Webhook verify token GET

**Capacidades NO usadas (gap)**:
- Templates aprobados Meta (proactivo fuera 24h window)
- Media upload + send (image, audio, document)
- Interactive messages (buttons, list)
- Flows
- Block/report user
- Profile metadata (display name, business hours)

**ENV**: `WHATSAPP_TOKEN` (System User Token permanente), `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`.

**Rate limits Meta**: 1000 msg/seg (Tier 2). Reciclean lejos de eso (decenas/día).

**Templates a crear**:
- `cotizacion_lista` (cliente | total UF | link entregable HTML | botón "Aceptar/Negociar")
- `factura_emitida` (cliente | folio | total | botón "Ver PDF")
- `recordatorio_pago` (cliente | folio | días vencido | botón "Pagar")
- `pesaje_pendiente_validar` (peoneta | romana | botón "Validar/Reportar error")
- `alerta_margen_bajo` (Dusan/Pablo | negocio | margen actual vs meta | acción)
- `diario_9am` (Dusan | resumen ejecutivo día)

**Estado actual Diego v5.1.0**: SÍ implementado entrada/salida texto. Falta media, templates, interactive.

**Riesgos**: token expira si user owner se inactiva. Mitigación: System User token + rotación trimestral.

**Prioridad**: ALTA.

### 3.2 Gmail API (OAuth `sistemas@gestionrepchile.cl`)

**Capacidades necesarias**:
- `users.messages.send` — enviar cotización formal
- `users.messages.list` — leer correos Pincore "confirmo envío muestra"
- `users.threads.get` — hilo conversación
- `users.labels.list` — etiquetar conversaciones

**Scopes OAuth**: `gmail.send`, `gmail.readonly`, `gmail.modify`.

**ENV pendiente** (P1.5 PENDIENTES.md): `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`.

**Estado**: NO. Pendiente OAuth.

**Diego usa (futuro)**:
- Detectar "confirmo recibí muestra" en inbox → `oportunidad.estado=GANADA`
- Enviar cotización con HTML adjunto
- Buscar histórico conversación cliente

**Prioridad**: ALTA.

### 3.3 Google Calendar API

**Capacidades necesarias**:
- `events.insert` — programar recogida
- `events.list` — agenda del día
- `events.update` — reprogramar

**ENV**: mismo OAuth Gmail (scope adicional `calendar.events`).

**Estado**: NO.

**Diego usa (futuro)**:
- "programá recogida Pincore jueves 9am" → evento + invita peoneta
- "¿qué tengo mañana?" → listado eventos calendario equipo

**Prioridad**: MEDIA.

### 3.4 Google Maps API

**Edge Function existente**: `google-maps-distance`.

**Endpoints usados**:
- Distance Matrix (km + minutos)
- Geocoding (dirección → lat/lng)
- Places (validar dirección)

**ENV pendiente** (P1.4): `GOOGLE_MAPS_API_KEY` (~5 USD/1000 requests).

**Estado**: PARCIAL (EF activa, clave pendiente).

**Diego usa**: "Costanera 1234 → Cerrillos km" → cotización.

**Prioridad**: ALTA.

### 3.5 mindicador.cl (UF, dólar, indicadores macro)

**Endpoint**: `https://mindicador.cl/api/uf` (no auth).

**EF**: `uf-diaria` (cron 13:00 UTC) + `f-uf-hoy`.

**Estado**: SÍ.

**Diego usa**: cotización UF→CLP, reportes financieros.

**Riesgo**: API caída → fallback `vw_precio_diesel_actual` última fila + alerta.

**Prioridad**: ALTA (ya estable).

### 3.6 SII Chile (DTE, RUT)

**Endpoints**: `https://palena.sii.cl/cvc_cgi/dte/of_solicita_folios` + APIs partner (Toku, OpenFactura, Bsale).

**Capacidades necesarias**:
- Validar RUT cliente (formato + verificador)
- Emisión DTE tipo 33 (factura electrónica)
- Emisión DTE tipo 52 (guía despacho — Resolución Exenta 154 chatarra)
- Consulta DTE estado SII
- Recepción acuses cliente

**Estado**: NO. Pendiente decisión Dusan integrador (Bsale vs Toku vs OpenFactura).

**Diego usa (futuro)**:
- "validá RUT 76.123.456-7" → fmt OK + giro SII
- "emití guía despacho viaje X" → DTE 52 + PDF + envío cliente
- "¿está pagada factura 1234?" → SII estado

**Prioridad**: ALTA (cumplimiento Ley REP + Resolución 154).

### 3.7 Monday.com

**Endpoint**: `https://api.monday.com/v2` (GraphQL).

**ENV pendiente Dusan**: `MONDAY_API_TOKEN` + workspace ID.

**Estado**: NO. Pendiente decisión Dusan.

**Diego usa (futuro)**: crear/listar/cerrar tareas equipo en Monday.

**Prioridad**: BAJA (depende uso real equipo).

### 3.8 OpenAI API

**Modelos usados**:
- `gpt-4o` — extracción tareas, vision, NL→SQL futuro
- `whisper-1` — transcripción audio WhatsApp

**ENV**: `OPENAI_API_KEY` (saldo + acceso modelos).

**Estado**: SÍ producción.

**Costos**: ~$0.0025/audio min + ~$0.005/extracción.

**Riesgo**: clave expuesta (Pablo tiene una rotación pendiente). Mitigación: **Supabase Vault + rotación trimestral**.

**Alternativa estratégica**: Anthropic Claude (mejor en español + razonamiento). Migración recomendada para 2026.

**Prioridad**: ALTA (rotar clave + evaluar Claude).

### 3.9 Anthropic Claude API (recomendado 2026)

**Endpoint**: `https://api.anthropic.com/v1/messages` (modelo Sonnet 4.6 o superior).

**Ventajas vs OpenAI**:
- Español chileno más natural
- Razonamiento más confiable en tareas complejas
- Prompt caching (cache writes 1.25x, reads 0.1x base = ahorro 90%)
- Tool use estructurado
- 200k context window

**Estado**: NO. Decisión 2026.

**Prioridad**: ALTA estratégica.

### 3.10 Make.com / Zapier

**Estado**: NO en uso. n8n cubre rol.

**Prioridad**: BAJA.

---

## 4. n8n workflows

**Host**: VPS Pablo (no tocar — solo Pablo opera).

**Workflows existentes** (verificado `reciclean-rdo/n8n/workflows/`):

| Workflow | Qué hace | Estado |
|---|---|---|
| `rdo_builder_entrega_v1` | Construye RDO diario consolidado | activo |
| `rdo_extractor_s1_pesaje_v1` | Extrae pesajes silo 1 → curated | activo |
| `rdo_extractor_s5_facturacion_v1` | Extrae facturación silo 5 → curated | activo |
| `rdo_procesador_claude_v1` | Procesa items con Claude API | activo |

**Workflows propuestos Diego 2026**:

| Workflow | Qué hace | Prioridad |
|---|---|---|
| `Diego-Envios-Entregables` (P1.6 pendiente) | Polea `curated.entregables_envios` cada 30s. estado=pendiente → envía email/WA → estado=enviado | ALTA |
| `Diego-Ingest-Pesajes-WA` | Recibe foto romana Diego → OCR → `pesajes_operacion` → notifica supervisor | ALTA |
| `Diego-Margen-Alert` | Si cotización < margen meta → alerta WhatsApp ejecutivo | MEDIA |
| `Diego-Followup-Frio` | Detecta cliente >30 días sin contacto → genera tarea Cony/Andrea | MEDIA |
| `Diego-CRM-Sync-Diario` | Cada noche corre `f_crm_sugerencias_match` → bandeja Cony | MEDIA |
| `Diego-Cierre-Validador` | Tras `f_cerrar_dia` → valida totales vs facturación SII → alerta si desvío | ALTA |

**Patrón handoff Edge Function → n8n**:
```
Edge Function inserta en curated.entregables_envios (estado=pendiente)
  → n8n cron 30s SELECT WHERE estado='pendiente'
  → n8n envía email (Gmail node) o WhatsApp (HTTP node Meta)
  → n8n UPDATE estado='enviado', enviado_at=now()
```

**Estado actual Diego v5.1.0**: NO. Workflow `Diego-Envios-Entregables` es P1.6 pendiente.

**Prioridad**: ALTA.

---

## 5. Webhooks entrantes

### 5.1 WhatsApp Business API → dieguito-whatsapp

**URL**: `https://eknmtsrtfkzroxnovfqn.supabase.co/functions/v1/dieguito-whatsapp`

**Configurar en**: developers.facebook.com → App → WhatsApp → Configuration → Webhook.

**Verify token**: ENV `WHATSAPP_VERIFY_TOKEN` (default `reciclean2026`).

**Eventos suscritos**: `messages`, `message_status`.

**Validación firma**: header `X-Hub-Signature-256` — HMAC SHA256 con app secret. **GAP**: dieguito-whatsapp v1 NO valida firma actualmente. Es trivial spoofear. Mitigación urgente.

**Estado**: SÍ producción (sin firma).

**Prioridad**: ALTA (agregar validación firma).

### 5.2 GitHub webhooks → Diego notify

**Propuesto**: PRs nuevos, merges main, releases.

**URL**: `https://eknmtsrtfkzroxnovfqn.supabase.co/functions/v1/diego-github-webhook` (no existe).

**Estado**: NO.

**Prioridad**: BAJA.

### 5.3 Vercel deploy webhooks → Diego notify

**Propuesto**: deploy producción exitoso → confirma Dusan WhatsApp.

**Estado**: NO.

**Prioridad**: BAJA.

### 5.4 n8n callback webhooks

**Patrón**: n8n notifica Diego cuando workflow completa.

**Estado**: NO formalizado. Pablo decide URLs ad hoc.

**Prioridad**: MEDIA.

### 5.5 SII webhooks (recepción DTE)

**Estado**: NO. Depende integrador SII elegido.

**Prioridad**: ALTA (cumplimiento).

---

## 6. Webhooks salientes (Diego → otros)

### 6.1 WhatsApp Business API (envío)

**Endpoint**: `POST graph.facebook.com/v19.0/{PHONE_ID}/messages`.

**Tipos**:
- `text` — respuesta natural conversación
- `template` — proactivo fuera 24h window (requiere aprobación Meta)
- `image/audio/document` — entregables, romanas, boletas
- `interactive` — botones/listas

**Estado**: SÍ texto. Falta template, media, interactive.

**Prioridad**: ALTA.

### 6.2 Email (Gmail API)

**Patrón**: Diego redacta → service `sistemas@gestionrepchile.cl` envía.

**Estado**: NO (OAuth pendiente).

**Prioridad**: ALTA.

### 6.3 Slack/Discord (canal interno)

**Estado**: NO. Equipo Reciclean usa WhatsApp principalmente, no Slack.

**Prioridad**: BAJA.

### 6.4 Push notifications panel-rdo

**Patrón**: Service Worker (`public/sw.js` existe) + Push API.

**Estado**: PARCIAL. SW registrado, push no implementado.

**Prioridad**: MEDIA.

### 6.5 SMS fallback

**Patrón**: si WhatsApp no entrega en 30s → SMS Twilio.

**Estado**: NO.

**Prioridad**: BAJA.

---

## 7. Eventos y bus de mensajes

### 7.1 Diego como productor

**Eventos que Diego emite**:
- `panel.diego_bandeja` INSERT → otros workers reaccionan
- `curated.oportunidades` INSERT → trigger `negocios_notificaciones` (33656 filas históricas) avisa cross-área
- `staging.dieguito_tasks` INSERT → panel-rdo refresh Realtime
- `mayordomo.cola_construccion` INSERT con `tipo='diego_propuesta'` → audit flow

### 7.2 Diego como consumidor

**Eventos que Diego escucha**:
- WhatsApp webhook (mensaje entrante)
- Realtime `panel.diego_bandeja` (preguntas 8W)
- Realtime `curated.alertas` (alertas críticas)
- Realtime `mayordomo.cola_construccion` (asignaciones)

### 7.3 Cola de tareas mayordomo

**Tabla**: `mayordomo.cola_construccion` (45 ítems verificados, 28 columnas).

**Patrón Diego como worker**:
```sql
-- Diego reclama siguiente ítem
SELECT mayordomo.f_claim_next_item('diego'::mayordomo.pc, ARRAY['diego_pregunta','diego_cotizacion']);
-- → uuid del ítem o NULL

-- Diego heartbeat cada 60s mientras procesa
SELECT mayordomo.f_heartbeat('diego', sesion_id, 'procesando cotizacion');

-- Diego marca built
UPDATE mayordomo.cola_construccion
SET built_at=now(), auditoria_result=jsonb_build_object('output', ...)
WHERE id=...;
```

**Estado actual Diego v5.1.0**: NO. Diego no participa en cola mayordomo aún.

**Prioridad**: MEDIA.

### 7.4 Patrón handoff Diego → humano → Diego

**Caso**: Diego pide validación humana antes de ejecutar.

**Flujo**:
```
1. Diego INSERT mayordomo.cola_construccion (requiere_firma=true, payload={accion})
2. Panel notifica responsable (Dusan/Pablo)
3. Humano firma (UPDATE signed_at, signed_by)
4. Worker ejecuta acción aprobada
5. Diego notifica resultado al cliente vía WhatsApp
```

**Estado**: NO.

**Prioridad**: ALTA (clave para confianza CEO).

---

## 8. Multi-tenant

### 8.1 Empresas del grupo

**Tabla**: `curated.empresas_grupo` (5 filas):
1. **Reciclean SPA** (Reciclean Cerrillos, Maipú, Talca)
2. **Reciclajes Farex SpA** (Puerto Montt, materiales pesados)
3. **Gestion REP Chile** (gestor Ley REP)
4. **SERCOT** (planilla compartida)
5. **(5ta)** verificar

**Capa branding**: cada empresa tiene logo, paleta, datos legales independientes.

### 8.2 Contexto activo Diego

Diego debe respetar empresa activa del usuario actual:
- Web embedded: `localStorage.rf_sucs_empresa` (uno de reciclean|farex|sercot|gestionrep)
- WhatsApp: derivar de `panel.usuarios_autorizados.empresa_default` del email mapeado

**Patrón filtrado**:
```typescript
const empresa = req.headers['x-empresa'] ?? usuario.empresa_default;
// Todo SELECT debe filtrar:
.eq('empresa', empresa)
// O usar vistas tenant-aware:
.from(`vw_cartera_detalle_${empresa}`)
```

### 8.3 Permisos por usuario

**Tabla**: `panel.usuarios_autorizados` (14 usuarios).

**Roles típicos**:
- `ceo` (Dusan) — todo
- `admin` (Cony) — admin global Reciclean
- `ejecutivo` (Andrea) — sucursal asignada
- `peoneta` — solo registro pesajes
- `valorizador` — solo lectura material destino

**RLS activa post mig 047**: 52+ policies con `security_invoker=on` (mig 047 hizo rename masivo de `USING(true)` para auditoría).

**Estado actual Diego v5.1.0**: PARCIAL. Validación email-activo SÍ. Filtrado por empresa NO.

**Prioridad**: ALTA.

### 8.4 Materiales y sucursales por empresa

- Reciclean: 64 materiales catalogados, 3 sucursales (Cerrillos, Maipú, Talca)
- Farex: subset materiales pesados (chatarra, ferrosos), 1 sucursal (Puerto Montt)
- 113 precios material × sucursal × vigencia (`curated.materiales_sucursal_precios`)

Diego debe usar siempre `materiales_sucursal_precios_vigente` filtrada por empresa+sucursal correcta.

---

## 9. Observability

### 9.1 Logs estructurados

**Propuesto**: `curated.diego_logs` (no existe aún).

**Schema sugerido**:
```sql
CREATE TABLE curated.diego_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  sesion_id UUID,
  user_email TEXT,
  empresa TEXT,
  channel TEXT, -- whatsapp | web | api
  intent TEXT, -- pregunta | cotizar | crear_oportunidad | ...
  input TEXT, -- texto usuario
  output TEXT, -- respuesta Diego
  tools_used TEXT[], -- [f_evaluar_retiro, vw_cartera_detalle]
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  costo_usd NUMERIC(10,4),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_diego_logs_request ON curated.diego_logs(request_id);
CREATE INDEX idx_diego_logs_user_date ON curated.diego_logs(user_email, created_at DESC);
CREATE INDEX idx_diego_logs_intent ON curated.diego_logs(intent);
```

**Estado**: NO.

**Prioridad**: ALTA.

### 9.2 Métricas

KPIs Diego propuestos (panel `panel-rdo.html` silo Diego):
- Tiempo respuesta P50/P95/P99 (objetivo <3s)
- Error rate (<1%)
- Tokens IA/día + costo USD
- Tareas creadas/día por usuario
- Intents top-10
- Falsos positivos (tareas rechazadas por humano / total)

### 9.3 Sentry / Logflare / Posthog

**Estado**: NO integrado.

**Propuesta**: Logflare gratis para Edge Functions logs. Posthog para session replay panel.

**Prioridad**: MEDIA.

### 9.4 Trazabilidad request_id

Cada interacción Diego debe llevar `request_id` (UUID) propagado:
- WhatsApp message_id → request_id
- Logs → request_id
- Insert tablas con `metadata.request_id`
- Errores con request_id en stack

**Estado**: NO.

**Prioridad**: ALTA.

### 9.5 Cron jobs monitoreables

Cron `mayordomo-monitor-5min` ya activo (`f_monitor_5min`). Reporta:
- Items cola sin claim >2h
- PCs sin heartbeat >2h
- Items audited sin firma >24h

Diego debe leer este output y notificar a Dusan si hay anomalía persistente.

---

## 10. Seguridad de integraciones

### 10.1 Almacenamiento secrets

**Capas**:
- Supabase project secrets (Edge Functions ENV) — actual
- Vercel project ENV — frontend
- Pablo dotfiles VPS (n8n) — riesgo si VPS comprometido

**Secrets actuales Edge Functions**:
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`
- `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (built-in)

**Pendientes**:
- `GOOGLE_MAPS_API_KEY` (P1.4)
- `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (P1.5)
- `MONDAY_API_TOKEN` (pendiente Dusan)
- `ANTHROPIC_API_KEY` (si se migra a Claude)
- SII partner credentials (Bsale/Toku/OpenFactura)

**Recomendación**: Supabase Vault (vault.secrets) con rotación trimestral programada.

### 10.2 Rotación de tokens

**Crítico inmediato**: Pablo tiene API key Anthropic expuesta (mencionado contexto) — **rotar YA**.

**Calendario rotación propuesto**:
- WhatsApp Token: cada 60 días
- OpenAI/Anthropic: cada 90 días
- Gmail refresh token: cada 180 días (manualmente)
- Google Maps: cada 180 días (regenerar restricted key)
- SII: según partner

### 10.3 Validación firma webhooks

**Crítico**: dieguito-whatsapp NO valida `X-Hub-Signature-256`. Cualquiera puede POSTear al endpoint y crear tareas.

**Fix**:
```typescript
import { crypto } from 'jsr:@std/crypto';
const signature = req.headers.get('x-hub-signature-256') ?? '';
const appSecret = Deno.env.get('WHATSAPP_APP_SECRET') ?? '';
const expected = await hmacSha256(appSecret, await req.text());
if (signature !== `sha256=${expected}`) return new Response('forbidden', { status: 403 });
```

**Prioridad**: CRÍTICA.

### 10.4 Scope mínimo

**Patrón principio mínimo privilegio**:
- Gmail OAuth: scope `gmail.send` + `gmail.readonly` solo (no `gmail.modify` salvo necesario)
- Google Maps: restringir API key a IPs Supabase Edge + cuotas máximas
- WhatsApp: System User Token (no user token personal)
- Supabase service_role: solo en Edge Functions servidor, NUNCA frontend
- Anon key: solo SELECT vistas curadas + RLS

### 10.5 Tablas con RLS deshabilitada (advisor 22-may)

**5 tablas críticas SIN RLS** (vulnerabilidad activa):
- `panel.config_ui`
- `mayordomo.incidentes`
- `curated.terminologia_rep`
- `curated.contactos_clientes` (1542 filas — leak datos personales)
- `curated.cotizaciones_historico` (1195 filas — leak precios)

**Diego debe abstenerse de leer estas tablas vía anon hasta RLS habilitada**. Solo service_role.

**Prioridad**: CRÍTICA. Avisar a Dusan/Pablo.

### 10.6 Data exfiltration prevención

- Diego NL→SQL: whitelist vistas + LIMIT obligatorio 100
- Logs sin PII (no copiar fuente_texto completa en logs persistentes >30 días)
- Storage signed URLs con expiración corta (5min para entregables sensibles)
- Audit log INSERT/UPDATE/DELETE de Diego en `curated.diego_logs`

### 10.7 Resumen riesgos top

| Riesgo | Severidad | Mitigación | Estado |
|---|---|---|---|
| Webhook WhatsApp sin firma | CRÍTICA | Validar X-Hub-Signature-256 | abierto |
| 5 tablas sin RLS | CRÍTICA | Habilitar RLS + policies | abierto |
| Clave Anthropic expuesta (Pablo) | ALTA | Rotar inmediato | abierto |
| Diego escribiendo prod sin firma | ALTA | mayordomo.cola_construccion | parcial |
| Tokens sin rotación | MEDIA | Calendario rotación trimestral | abierto |
| NL→SQL sin whitelist | MEDIA | AST validation + view whitelist | no impl |

---

## Apéndice — Mapa "Diego como hub"

```
                              ┌──────────────────┐
                              │   WhatsApp Cloud │
                              │      Meta API    │
                              └────────┬─────────┘
                                       │ webhook
                                       ▼
                          ┌────────────────────────┐
                          │  dieguito-whatsapp     │ ◄── X-Hub-Sig256 (GAP)
                          │  (Edge Function)       │
                          └────────┬───────────────┘
                                   │
                                   ▼
                          ┌────────────────────────┐
                          │  dieguito-process      │
                          │  (NLP + OpenAI gpt-4o) │
                          └────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐         ┌────────────────┐         ┌────────────────┐
│  Supabase DB  │         │   Storage      │         │   APIs ext     │
│  (3 schemas)  │         │  10 buckets    │         │                │
├───────────────┤         ├────────────────┤         ├────────────────┤
│ curated.*     │         │ evidencias_    │         │ Gmail (NO)     │
│  47 vw_*      │         │   dieguito     │         │ G.Maps (KEY?)  │
│  25 f_*       │         │ entregables_   │         │ G.Calendar(NO) │
│ panel.*       │         │   html         │         │ SII (NO)       │
│  16 v_*       │         │ audio_         │         │ Monday (NO)    │
│ staging.*     │         │   mensajes     │         │ mindicador OK  │
│  dieguito_*4  │         │ proveedores    │         │ Anthropic(rec) │
│ mayordomo.*   │         │ chatbot-fotos  │         └────────────────┘
│  cola_constr  │         └────────────────┘
└───────┬───────┘
        │
        ▼ Realtime channels
┌─────────────────────┐
│ panel.diego_bandeja │ ◄── INSERTs 8W (lo que humanos preguntan)
│ curated.alertas     │
│ mayordomo.cola_*    │
└─────────────────────┘
        │
        ▼ webhooks salientes
┌─────────────────────┐
│ n8n VPS (Pablo)     │
│  4 workflows activ. │
│  6 propuestos Diego │
└─────────┬───────────┘
          │
          ▼
   ┌──────────────┐
   │ Gmail / WA / │
   │ SII / Monday │
   └──────────────┘
```

---

## Versión y firma

- **Documento**: DIEGO-CAPACIDADES-INTEGRACION.md v1.0
- **Autor**: Agente D (Backend Architect · investigación 22-may-2026)
- **Fuente**: Supabase MCP queries en vivo + lectura código Edge Functions + n8n workflows repo.
- **Próximo paso**: Agente Z consolida con Agentes A/B/C en prompt máximo Diego v6.0.
