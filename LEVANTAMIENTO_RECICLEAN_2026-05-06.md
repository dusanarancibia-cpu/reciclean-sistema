# LEVANTAMIENTO COMPLETO — ECOSISTEMA RECICLEAN-FAREX
**Generado:** 2026-05-06 por Claude Code (Sonnet 4.6)
**Fuentes:** Supabase MCP + GitHub MCP (repos autorizados)
**Propósito:** Documento de traspaso para otra IA — no omitir detalles

---

## ÍNDICE

1. [CONTEXTO DEL GRUPO](#1-contexto-del-grupo)
2. [SUPABASE — PROYECTO RECICLEAN-SISTEMA](#2-supabase--proyecto-reciclean-sistema)
3. [GITHUB — reciclean-sistema](#3-github--reciclean-sistema)
4. [GITHUB — reciclean-manifiesto-diego](#4-github--reciclean-manifiesto-diego)
5. [AGENTE DIEGO ALONSO](#5-agente-diego-alonso)
6. [ESTADO ACTUAL Y PENDIENTES CRÍTICOS](#6-estado-actual-y-pendientes-críticos)
7. [ALERTAS DE SEGURIDAD](#7-alertas-de-seguridad)

---

## 1. CONTEXTO DEL GRUPO

### 1.1 Founder
**Dusan Arancibia** — CEO Grupo Arancibia-Pinto
- 31 años en industria reciclaje (desde Sorepa/CMPC 1995)
- Trayectoria: depto comercial → Jefe Marketing y Comercial → directorio CMPC → análisis Perú → proyecto sorting CMPC → abrió 4 sucursales en empresa industria → 2012 independencia → Reciclean + Farex
- NO dev, comunicación siempre en español, corto y directo
- Estilo: códigos A/B/C/D + slot Z abierto en cada propuesta

### 1.2 Estructura del Grupo (8 empresas activas)
| Empresa | Tipo | Notas |
|---|---|---|
| Reciclean | Reciclaje | Core, 4 sucursales |
| Farex | Materiales/Ferralla | Solo Cerrillos + Maipú |
| Ubergreen | Digital/SaaS | En desarrollo — brazo digital |
| Inmobiliaria Beto | Inmobiliaria | — |
| Transporte 5R | Transporte | — |
| Transportes Diego | Transporte | — |
| Importadora/Exportadora Farex | Comercio exterior | — |
| SERCOT | Servicios (50%) | Dyana dueña operativa |

### 1.3 Equipo (14 personas + 3 externos clave)
| Nombre | Rol | Nivel | Teléfono | Sucursal |
|---|---|---|---|---|
| Dusan Arancibia | CEO / GM | N3 | 56963069065 | — |
| Pablo Arancibia | Tech Lead (hijo de Dusan) | N2 | 56923962018 | Remoto |
| Andrea Rivera | Comercial | N2 | 56961596938 | Remota |
| Ingrid Cancino | Operaciones | N2 | 56961908322 | Talca |
| Juan Mendoza | Operaciones | N2 | 56990552591 | Cerrillos |
| Nicolas Arancibia | Operaciones | N2 | 56923704441 | Cerrillos |
| Dyana Pinto | Admin / pagos (esposa Dusan) | N2 | 56967280603 | Cerrillos |
| Cesar Mora | Remoto | N2 | 56994541662 | Remoto |
| Jair Sanmartin | Permisología | N2 | 56986558236 | Transversal |
| Connie | SERCOT | Externo clave | — | — |
| Reinaldo | Programador | Externo clave | — | — |

### 1.4 Sucursales
| Sucursal | Estado |
|---|---|
| Cerrillos | Operativa |
| Maipú | Operativa |
| Talca | Operativa |
| Puerto Montt | BLOQUEADA — permisos SEREMI pendientes |

### 1.5 Contacto unificado
- WhatsApp: +56 9 9534 2437 (Andrea Rivera)
- Email: comercial@gestionrepchile.cl

### 1.6 Regla de oro
> NO tocar sistema en producción sin OK explícito de Dusan

---

## 2. SUPABASE — PROYECTO RECICLEAN-SISTEMA

### 2.1 Datos del proyecto
| Campo | Valor |
|---|---|
| **ID** | `eknmtsrtfkzroxnovfqn` |
| **Nombre** | reciclean-sistema |
| **URL** | `https://eknmtsrtfkzroxnovfqn.supabase.co` |
| **Región** | sa-east-1 (Sao Paulo) |
| **Estado** | ACTIVE_HEALTHY |
| **PostgreSQL** | 17.6.1.104 (engine 17, channel ga) |
| **Organización** | yfrkchasmubrxtwqfmgi |
| **Creado** | 2026-04-05 |
| **Dashboard** | supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn |

### 2.2 Tablas públicas (87 tablas)

#### Tablas con datos activos (rows > 0):
| Tabla | Rows | RLS | Descripción |
|---|---|---|---|
| conversaciones | 1,202 | ✅ | Buffer WhatsApp Diego — mensajes entrantes/salientes |
| precios | 246 | ✅ | Precios por material + sucursal + versión |
| materiales | 95 | ✅ | Catálogo 95 SKUs con flags farex/reciclean |
| metas_comerciales | 116 | ✅ | KPIs comerciales |
| temas_en_progreso | 68 | ✅ | Source of truth status cross-surface (25 parents + 43 subs) |
| temas_snapshot_diario | 204 | ✅ | Capturas % completitud por fecha |
| proveedores | 73 | ✅ | 73 proveedores registrados |
| eventos_asistente | 150 | ✅ | Eventos del asistente comercial |
| clasificacion_automatica | 22 | ✅ | — |
| briefing_log | 21 | ✅ | Cada briefing matutino enviado al CEO |
| expertos_fallback | 14 | ✅ | — |
| contactos | 9 | ✅ | Whitelist WhatsApp Diego (equipo) |
| usuarios_autorizados | 9 | ✅ | Auth panel admin + asistente |
| estado_nodos | 7 | ✅ | — |
| agentes_estado | 7 | ✅ | Health de cada agente n8n + canal mensaje CEO |
| delegaciones_matriz | 8 | ✅ | Matriz delegación humana (Diego consulta antes de responder) |
| sucursales | 4 | ✅ | 4 sucursales |
| cotizaciones | 3 | ✅ | Cotizaciones guardadas |
| eventos | 3 | ✅ | — |
| alertas_enviadas | 1 | ✅ | — |
| asistente_snapshot | 1 | ✅ | Sync Panel → Asistente en tiempo real |
| cotizaciones_chatbot | 1 | ✅ | — |
| diego_correcciones | 1 | ✅ | Erratas runtime de Diego |
| precios_version | 1 | ✅ | Control versiones precios |
| comisiones_config | 2 | ✅ | — |

#### Tablas vacías con RLS:
agentes_estado (7 rows), alertas_tecnicas, alertas_vigilancia, archivos_procesados, cambios_historico, canary_deployments, checkins_agenda, clientes_compradores, comandos_log, compromisos, config (3 rows), configuracion (9 rows), data_ingesta_log, diego_archivos_pendientes, diego_mediciones_conversacion, entrevistas_respuestas, evaluaciones, flete_margen_suc, historial, intentos_manipulacion, kpi_equipo, leads, leads_chatbot, logs_acciones, material_aliases, memoria_diego, metricas_operacion, minutas, nurturing_queue, opciones_pendientes, oportunidades, precio_override, precio_seleccionado, precios_cliente, preguntas_pendientes, procesos_borrador, procesos_empresa, queue_agente, regression_tests, relaciones_personales, reportes_diarios, respuestas_oro, rutas_asignadas, sesiones_entrevista, session_context, sucursal_fuente, terceros, terceros_direcciones, tramos_precios, tramos_viaje, user_profiles, vacios_conocimiento, ventas, viajes_terreno

#### ALERTA CRÍTICA — Tablas SIN RLS (expuestas al público):
```sql
-- Las siguientes 6 tablas NO tienen RLS — CUALQUIERA con anon key puede leer/escribir:
public.compras_2025  (0 rows)
public.compras_2026  (0 rows)
public.compras_2027  (0 rows)
public.ventas_2025   (0 rows)
public.ventas_2026   (0 rows)
public.ventas_2027   (0 rows)

-- Para habilitar RLS (ejecutar con cuidado — bloquea acceso hasta agregar policies):
ALTER TABLE public.compras_2027 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_2027 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_2026 ENABLE ROW LEVEL SECURITY;
```

### 2.3 Esquemas de tablas clave

#### `temas_en_progreso` (tracker cross-surface):
```
id, codigo (PK textual), titulo, descripcion_corta, estado, pct_completitud,
banda, origen, origen_referencia, responsable_linea, tablas_relacionadas[],
sesiones_relacionadas[], proximas_acciones, bloqueadores, fecha_creacion,
fecha_ultimo_update, actualizado_por, area, tiempo_estimado, listo_para_ejecutar,
predecesores[], delegar_a, delegar_activo, delegar_enviado_at, delegar_canal[],
fecha_limite, parent_codigo (FK self), nombre_historico (jsonb), ruta_archivo[],
categoria_archivo
```

#### `conversaciones` (buffer WhatsApp Diego):
```
id (bigint), persona, telefono, direccion (entrante/saliente),
mensaje, respuesta, tipo (texto/audio/imagen), intencion,
agente (director), metadata (jsonb), created_at, bundle_id
```

#### `materiales` (catálogo):
```
id (int), nombre, categoria_id, farex (bool), reciclean (bool),
iva (bool), margen_default (0.15), flete_default (15),
meta_kg (int), activo (bool), created_at
```

#### `precios` (pricing):
```
id (int), version_id, material_id, sucursal_id,
precio_compra, precio_lista, precio_ejecutivo, precio_maximo,
flete_aplicado, margen_aplicado, iva_aplicado (bool)
```

#### `contactos` (whitelist WhatsApp):
```
id (bigint seq), nombre, rol, telefono, nivel_acceso (int, default 1),
sucursal, activo (bool), silenciado (bool), notas,
created_at, updated_at, anuncio_nombre_visto (bool),
anuncio_diego_alonso_visto (bool)
```

#### `usuarios_autorizados` (auth panel):
```
id (int seq), nombre, telefono, email, pin (default '1234'),
rol (default 'ejecutivo'), acceso_panel (bool),
acceso_asistente (bool), activo (bool), created_at, sucursal
```

#### `diego_correcciones` (erratas runtime):
```
id (bigint seq), activa (bool), error_detectado, correccion,
tipo, scope (default 'general'), issue_url, created_by,
created_at, updated_at
```

#### `delegaciones_matriz` (matriz coordinación):
```
id (bigint seq), dominio, encargado_nombre, encargado_telefono,
encargado_email, keywords (text[]), patterns (text[]),
prioridad (int), activo (bool), notas, created_at, updated_at
```

#### `agentes_estado` (health de agentes):
```
id (uuid), agente, version, activo (bool), ultima_ejecucion,
ultima_ejecucion_estado, ultimo_error, mensajes_procesados_24h (int),
errores_24h (int), latencia_p95_ms, costo_usd_mes_actual,
necesita_atencion_ceo (bool), mensaje_pendiente,
mensaje_pendiente_creado_at, updated_at
```

### 2.4 Vistas públicas (22 vistas)

| Vista | Propósito |
|---|---|
| `v_precios_activos` | Vista principal de precios — join materiales + categorías + sucursales + versión activa |
| `v_status_consolidado` | Query canónica "status" — temas jerarquizados con bandas |
| `v_temas_jerarquia` | Parent-hijo visualización de temas |
| `v_temas_activos` | Temas no superados/descartados/pausados |
| `v_temas_bloqueados` | Temas con bloqueadores activos |
| `v_renames_historial` | Auditoría de renombres de temas |
| `v_delegaciones_propuestas` | Temas con delegar_a + datos del delegado |
| `v_directorio_tablas` | Meta-tabla de todas las tablas + iniciativas relacionadas |
| `v_progreso_temporal` | Evolución % por día por tema |
| `v_progreso_diario_global` | Agregado diario global de avance |
| `v_briefing_metricas_ayer` | Ventas, cotizaciones, reportes, consultas bot del día anterior |
| `v_briefing_alertas_agentes` | Agentes que necesitan atención CEO |
| `v_briefing_cotizaciones_urgentes` | Cotizaciones >48h sin actividad |
| `v_briefing_reportes_faltantes` | Sucursales que no enviaron reporte ayer |
| `v_briefing_evaluaciones_proximas` | Evaluaciones programadas próximos 7 días |
| `v_comercial_cotizaciones_48h` | Cotizaciones abiertas >48h |
| `v_comercial_cotizaciones_15d` | Cotizaciones abiertas >15 días |
| `v_proveedores_riesgo` | Proveedores activos sin compra >20 días |
| `v_marketing_clientes_inactivos` | Proveedores sin compra >60 días |
| `v_marketing_conversion_leads` | Tasa conversión leads por mes |
| `v_marketing_material_crecimiento` | Materiales con crecimiento >15% semana a semana |
| `v_actividad_equipo` | Actividad por ejecutivo y fecha |
| `v_nurturing_efectividad` | Efectividad por tipo + canal de nurturing |

### 2.5 Edge Functions (1)
| Nombre | Slug | Versión | Estado | JWT |
|---|---|---|---|---|
| ocr-tablero | `ocr-tablero` | v2 | ACTIVE | No (verify_jwt: false) |

### 2.6 Migraciones (33 en total)
```
20260414 — create_proveedores_table
20260414 — create_eventos_rutas_viajes_nurturing
20260414 — update_cotizaciones_add_columns
20260414 — add_sucursal_to_usuarios_and_create_views
20260414 — enable_rls_new_tables
20260416 — create_agente_director_tables
20260417 — create_tramos_precios_metas
20260417 — comisiones_y_habilitado_v2
20260417 — hub_001_reportes_diarios
20260417 — hub_002_evaluaciones
20260417 — hub_003_cotizaciones_extender_aditivo
20260417 — hub_004_agentes_estado_briefing_opciones
20260417 — hub_005_resolver_opcion_briefing
20260417 — hub_006_leads_metricas_alertar_gg
20260417 — hub_007_vistas_briefing_y_agentes
20260417 — hub_008_fix_alertar_gg_tipo
20260417 — hub_009_fix_security_advisors
20260418 — diego_v4_1_pasos_1_2_3_7
20260421 — add_anuncio_nombre_visto_diego_alonso
20260421 — diego_v4_4_schema_delegaciones_bundle_trigger
20260421 — diego_v5_0_unificacion_consolidada
20260422 — v2_chunk_a_terceros_con_trigger
20260422 — v2_chunk_b_ventas_compras_ingesta
20260422 — v2_chunk_c_respuestas_oro_canary_rls
20260422 — v2_chunk_d_diego_mediciones_parte_7
20260422 — add_anuncio_diego_alonso_visto_to_contactos
20260422 — create_temas_en_progreso
20260422 — create_temas_views
20260422 — expand_temas_en_progreso_11_cols
20260422 — recreate_status_views_11cols
20260422 — add_fecha_limite_parent_codigo_rename_trigger
20260422 — recreate_views_with_hierarchy
20260422 — add_ruta_archivo_progreso_diario
20260502 — crear_tabla_diego_correcciones
```

---

## 3. GITHUB — reciclean-sistema

### 3.1 Datos del repositorio
| Campo | Valor |
|---|---|
| **URL** | github.com/dusanarancibia-cpu/reciclean-sistema |
| **Visibilidad** | Público |
| **Descripción** | Admin Panel Reciclean-Farex con Supabase |
| **Branch main SHA** | 365e8f201a3d06b3215ca511c47f20aea5b40f83 |
| **Deploy** | Vercel — reciclean-sistema.vercel.app |
| **CI/CD** | GitHub → Vercel (auto en push a main) |

### 3.2 Stack técnico
- **Frontend:** Vite + Vanilla JavaScript (NO React — decisión confirmada y definitiva)
- **Backend/BD:** Supabase (proyecto eknmtsrtfkzroxnovfqn, región Sao Paulo)
- **Deploy:** Vercel (auto en push a main)
- **PWA:** Service Worker + manifest, instalable en celulares del equipo
- **Versión en producción:** v90 (commit 2ac680f, deploy 7 abril 2026)
- **Redondeo:** Math.floor (no adaptativo)

### 3.3 Estructura de archivos raíz
```
reciclean-sistema/
├── index.html          # Panel Admin (aprox admin_panel_vXX.html) — Tab principal
├── asistente.html      # Asistente Comercial (85KB)
├── login.html          # Login unificado
├── CLAUDE.md           # Instrucciones para Claude Code (8.2KB)
├── STATUS.md           # Snapshot temas_en_progreso (7.7KB)
├── PENDIENTES.md       # Tareas abiertas con estado y bloqueadores (9.7KB)
├── CONTINUAR_SESION_DIEGO.txt  # Prompt continuidad sesiones (12.1KB)
├── vercel.json         # 6 redirects URLs cortas Diego
├── vite.config.js      # Build config
├── package.json        # @supabase/supabase-js + vite
├── .gitignore
├── package-lock.json
│
├── public/             # Archivos estáticos
│   ├── chatbot.html        # Chatbot v1 (43.8KB)
│   ├── chatbot-v2.html     # Chatbot v2 (43.6KB) — LIVE en reciclean.cl + farex.cl
│   ├── status.html         # Viewer STATUS.md con filtros (26.8KB)
│   ├── agregar-tema.html   # Form público agregar tema (7.3KB)
│   ├── usar-asistente.html # Guía asistente (8.8KB)
│   ├── procedimiento.html  # Procedimientos (6.5KB)
│   ├── publicar-precios.html (7.1KB)
│   ├── diego-presentacion.html (13.8KB)
│   ├── diego-coordinar.html (8.6KB)   # /coordinar-equipo
│   ├── diego-ejemplos.html (6.7KB)    # /ejemplos
│   ├── diego-faq.html (5.8KB)         # /preguntas
│   ├── diego-feedback.html (6.3KB)    # /dar-feedback
│   ├── diego-video-script.html (5.9KB) # /videos-diego
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   ├── icon-192.png/svg, icon-512.png/svg, icon.png
│   ├── js/                # 11 módulos JavaScript (lógica principal)
│   └── assets/            # Logos
│
├── src/
│   ├── asistente-bridge.js   # Bridge asistente (12.9KB)
│   ├── supabase-bridge.js    # Bridge Supabase (15.2KB)
│   └── lib/
│       ├── auth.js
│       └── supabase.js
│
├── docs/
│   ├── diego-v4.2-spec.md                  # Spec técnica v4.2 (15KB)
│   ├── diego-v4.2-implementacion-21abr.md  # Implementación v4.2 (12KB)
│   └── integracion-erratas-canonico.md     # Spec workflow n8n erratas (9.3KB)
│
├── sql/                    # Scripts SQL (no aplicados desde repo)
├── scripts/                # Scripts utilidades
├── casos-diego/            # Evidencia bugs por usuario (ingrid, jair, nicolas)
└── mensajes-equipo/        # Mensajes personalizados difusión equipo
```

### 3.4 Módulos JS (public/js/)
| Módulo | Propósito | Tamaño aprox |
|---|---|---|
| config.js | 65 materiales, 4 sucursales, categorías | — |
| estado.js | State management | 82KB (el más grande) |
| alias.js | Aliases de materiales por fuente | — |
| precios.js | Cálculos precios, márgenes, fletes | — |
| ia.js | Integración Claude API + automatización | — |
| usuarios.js | Sistema auth y roles | — |
| idb.js | Cache IndexedDB offline | — |
| fuentes.js | Fuentes precios (clientes compradores) | — |
| historial.js | Logging de cambios | — |
| correccion.js | Correcciones de datos | — |
| utils.js | Utilidades generales | — |
| erratas.js | CRUD erratas Diego (tab I panel admin) | — |

### 3.5 Panel Admin — 9 tabs
| Tab | Nombre | Función |
|---|---|---|
| A | Carga | Carga masiva de precios desde fuentes |
| B | Alias | Mapeo nombres alternativos de materiales |
| C | Precios & Márgenes | Edición manual de precios por sucursal |
| D | Historial | Log de cambios de precios |
| E | Público | Vista previa precios publicados |
| F | Usuarios | Gestión usuarios (solo rol `admin`) |
| G | Revisor | Compara Panel vs Snapshot vs sitios web |
| H | Empresa | Toggle materiales/sucursales por empresa |
| I | Erratas Diego | CRUD erratas runtime Diego (tab nuevo) |

### 3.6 Modelo de datos crítico
- **Materiales:** 65 SKUs activos (de 95 en tabla) con flags `farex` y `reciclean` (boolean), `iva`, márgenes, flete
- **Sucursales:** 4 (Cerrillos, Maipú, Talca, Puerto Montt)
- **Clientes compradores:** 12 (HUAL, RESIMEX, FPC, ADASME, POLPLAST, etc.)
- **Flujo de datos:** Panel GRABAR → Supabase → "Generar Asistente" → `asistente_snapshot` → Asistente + Widgets (Realtime)
- **IVA:** Farex con Retención 19% / Reciclean sin IVA
- **Farex:** solo 2 sucursales (Cerrillos + Maipú)
- **Reciclean:** 4 sucursales

### 3.7 Decisiones técnicas selladas
- Vite + Vanilla JS (NO React — definitivo)
- Redondeo: Math.floor
- Repo público — credenciales solo en .env.local o variables Supabase/Vercel
- Switch empresa/sucursales persiste en localStorage['rf_sucs_empresa']
- Tab F gateado por localStorage.rf_session.rol === 'admin'
- Puerto Montt NUNCA mostrar como activa ni mostrar precios

### 3.8 URLs cortas (vercel.json)
| URL corta | Destino |
|---|---|
| /conoce-diego | /diego-presentacion.html |
| /coordinar-equipo | /diego-coordinar.html |
| /preguntas | /diego-faq.html |
| /ejemplos | /diego-ejemplos.html |
| /dar-feedback | /diego-feedback.html |
| /videos-diego | /diego-video-script.html |

### 3.9 Ramas activas (43 total)
- **main** — producción
- **claude/monday-user-assignment-MmlXP** — rama más activa (sesión 06-may)
- **feat/v90-revisor-config-tabs** — Tab Revisor + Tab Config
- **feat/v91-responsive-mobile** — responsive mobile
- **fix/status-html-v2** — status.html con 68 temas
- 38 ramas claude/* adicionales (históricas)

### 3.10 Pull Requests (18 total, todos cerrados/mergeados)
| PR | Título | Estado | Fecha |
|---|---|---|---|
| #18 | CLAUDE.md: Ubergreen + trayectoria 31 años | Mergeado | 2026-05-06 |
| #17 | CLAUDE.md: apunta a v2 + mueve DOSI | Mergeado | 2026-05-05 |
| #16 | CLAUDE.md: documento maestro grupo | Mergeado | 2026-05-05 |
| #14 | Panel erratas Diego + tabla Supabase + spec n8n | Mergeado | 2026-05-02 |
| #13 | status.html rebuild 68 tasks + sort + filter | Mergeado | 2026-04-22 |
| #12 | STATUS.md: 25 parents + ruta_archivo + snapshot diario | Mergeado | 2026-04-22 |
| #11 | status.html live viewer | Mergeado | 2026-04-22 |
| #10 | STATUS.md: 17 parents + 43 subtasks + agregar-tema form | Mergeado | 2026-04-22 |
| #9 | STATUS.md: I-07 + Mermaid diagrams | Mergeado | 2026-04-22 |
| #8 | STATUS.md: I-06 Ecosistema int. | Mergeado | 2026-04-22 |
| #7 | STATUS.md v2: 11 columns + I-05 Panel temas | Mergeado | 2026-04-22 |
| #6 | STATUS.md cross-surface tracking | Mergeado | 2026-04-22 |
| #5 | URLs cortas Diego + rename Diego Alonso + docs sesión móvil | Mergeado | 2026-04-20 |
| #4 | fix: %E comisión ejecutivo default 0.25% | Mergeado | 2026-04-07 |
| #3 | fix: publicar snapshot antes de borrar PRECIO_OVERRIDE | Mergeado | 2026-04-07 |
| #2 | v91: responsive mobile | Mergeado | 2026-04-07 |
| #1 | v90: Tab Revisor + Tab Config + gating Usuarios | Mergeado | 2026-04-07 |

### 3.11 Issues
| # | Título | Estado | Etiqueta |
|---|---|---|---|
| #15 | **URGENTE: Restaurar Diego v5.0 (workflow n8n) + completar integración erratas** | **ABIERTO** | bug |

**Detalle issue #15:** Diego dejó de responder WhatsApp el 3-may-2026. El nodo `claude-api` del workflow Diego v5.0 en https://n8n.reciclean.cl tiene JSON body corrupto (`invalid syntax`). El plan free de n8n solo guarda 1 día de historial y todas las versiones disponibles ya están post-corrupción. Requiere acceso SSH al VPS (137.184.203.15) para restaurar desde backup del filesystem/DB.

---

## 4. GITHUB — reciclean-manifiesto-diego

### 4.1 Datos del repositorio
| Campo | Valor |
|---|---|
| **URL** | github.com/dusanarancibia-cpu/reciclean-manifiesto-diego |
| **Descripción** | Manifiesto Diego Alonso v1 - corpus canónico identidad + medición + arquitectura datos + peer reviews. Score 86%. |
| **Branch main SHA** | d31807bbe9ae0b640e26e7dea40615daa6ec8b3f |
| **Naturaleza** | Solo-documentación, sin build/tests |
| **Idioma** | Español (Chile) |
| **Espejo** | Versionado de OneDrive local |

### 4.2 Estructura completa del repo

```
reciclean-manifiesto-diego/
│
├── INDICE_MAESTRO.md           # Punto de entrada único del corpus (7.8KB)
├── INDICE_CHATS.md             # 24 chats indexados 14-19 abr + apuntadores doc maestro (19.2KB)
├── SEGUIMIENTO_OPERATIVO.md    # Tabla maestra de tareas D/P/M (9.9KB)
├── ERRATAS_DIEGO.md            # Tabla canónica erratas — LEER SIEMPRE PRIMERO
├── README.md                   # README general (2.3KB)
├── README_ERRATAS.md           # Guía del sistema de erratas (5.2KB)
├── Prompt_Evaluacion_IA_Externa.md (17.3KB)
├── n8n_spec_erratas.md         # Spec workflow erratas (4.9KB)
├── 01_REGISTRO_LITERAL_105_OBS.md (20.3KB)
│
├── [30+ archivos chat exportados]
│   ├── 2026-04-14_chat_agente-director-whatsapp-deploy-completo.md (25.8KB)
│   ├── 2026-04-14_chat_asistente-comercial-integrado-fases-completas.md (27.9KB)
│   ├── 2026-04-14_chat_avances-chatbot-rrss-farex-mobile.md (23.6KB)
│   ├── 2026-04-14_chat_diagnostico-bloqueo-sprint.md (13.1KB)
│   ├── 2026-04-16_chat_calibracion-ecosistema-agente-director.md (50.8KB)
│   ├── 2026-04-16_chat_resimple-zona-centro-cotizacion.md (6.3KB)
│   ├── 2026-04-17_chat_reciclean-hub-deploy-supabase.md (37.2KB)
│   ├── 2026-04-18_chat_agente-director-v3.3-deploy-y-roadmap.md (29.9KB)
│   ├── 2026-04-18_chat_antigravity-skills-consulta.md (5.4KB)
│   ├── 2026-04-18_chat_blindaje-seguridad-diego.md (26.9KB)
│   ├── 2026-04-18_chat_comandos-tooltip-multilang.md (5.3KB)
│   ├── 2026-04-18_chat_export-sesion-taskkill-bloqueado.md (9.6KB)
│   ├── 2026-04-18_chat_exportacion-chat-md.md (5.9KB)
│   ├── 2026-04-18_chat_hub-v4-cierre-pablo.md (24.4KB)
│   ├── 2026-04-18_chat_levantar-n8n-docker-ngrok-pablo.md (4.8KB)
│   ├── 2026-04-18_chat_levantar-n8n-ngrok-handoff.md (25.5KB)
│   ├── 2026-04-18_chat_memoria-agente-director-peer-review.md (11.7KB)
│   ├── 2026-04-18_chat_organizacion-sistemas-reciclean.md (10KB)
│   ├── 2026-04-18_chat_plan-ejecutable.md (5.9KB)
│   ├── 2026-04-18_chat_revision-estatus-bloqueada.md (6.2KB)
│   ├── 2026-04-19_chat_agente-comercial-v2-chatbot-v9-analisis.md (36.5KB)
│   ├── 2026-04-19_chat_blindaje-seguridad-diego.md (33.2KB)
│   ├── 2026-04-19_chat_exportacion-verificacion.md (4.5KB)
│   ├── 2026-04-19_chat_reorganizacion-carpetas-y-skill-guardar-sesion.md (21KB)
│   ├── 2026-04-19_chat_revision-avances-handoff-pablo.md (10.3KB)
│   └── 2026-04-19_respuesta_a_clau_sistema_orden_conversaciones.md (21.7KB)
│
├── Identidad_Diego_Alonso/         [LOCKED sin OK Dusan]
│   ├── Manifiesto_Diego_140_Rasgos.md          [PARTE 1] 140 rasgos base (11.7KB)
│   ├── Manifiesto_Diego_Parte_2_140_Rasgos.md  [PARTE 2] 140 rasgos complementarios (10.4KB)
│   ├── Manifiesto_Diego_Parte_3_Personalidad.md [PARTE 3] 140 rasgos personalidad (7.8KB)
│   ├── Manifiesto_Diego_Parte_4_Definicion_5_Palabras.md [PARTE 4] "Colega digital chileno" (6KB)
│   ├── Manifiesto_Diego_Parte_5_Respuesta_Perfecta.md [PARTE 5] Decálogo + Relámpago (12.4KB)
│   ├── Manifiesto_Diego_Parte_6_Protocolo_Agenda.md [PARTE 6] 20 funciones Google Calendar (9.2KB)
│   ├── Estado_Actual_Google_Calendar_Diego_v5_0.md (5.2KB)
│   ├── Medicion_Calidad_Diego/
│   │   └── Manifiesto_Diego_Parte_7_Sistema_Medicion_Calidad.md [PARTE 7] 12 dim + 4 bandas
│   └── historico/              # Versiones archivadas
│
├── Arquitectura_Datos_Diego/       [contiene Parte 8]
│   ├── Manifiesto_Diego_Parte_8_Arquitectura_Datos.md [PARTE 8] 10 tablas, 4 sistemas fuente
│   ├── migration_supabase_v1.sql   (NO aplicar — tiene bugs)
│   ├── migration_supabase_v2_corregida.sql (APLICAR — bugs corregidos)
│   ├── schema/
│   │   ├── reporte_venta_erp.schema.json
│   │   ├── cartola_bancaria.schema.json
│   │   ├── vales_balanza.schema.json
│   │   └── diccionario_campos.md
│   └── pendientes.md
│
├── Arquitectura_Integrada_Diego/   [contiene Parte 9 + documentos de deploy]
│   ├── Manifiesto_Diego_Parte_9_Arquitectura_Integrada.md [PARTE 9] 4 loops + runbook (22.8KB)
│   ├── Peer_Review_IA_Externa_20260421.md         (72% — pasada 1)
│   ├── Peer_Review_Apelacion_Respuesta.md
│   ├── Peer_Review_Apelacion_Veredicto_20260421.md (83% — pasada 2)
│   ├── Peer_Review_Tercera_Pasada_20260422.md      (86% — pasada 3 — ACTUAL)
│   ├── Scope_v5.0_Release_30_abril.md              (scope firmado, 5.8KB)
│   ├── Handoff_Otro_Chat_Implementacion_20260422.md (para chat actual, 8.9KB)
│   ├── Handoff_Pablo_Deploy_26abr2026.md           (checklist Pablo, 12.4KB)
│   ├── System_Prompt_v5_1_0_Delta.md               (9 parches, 15.9KB)
│   ├── Payload_PUT_v5_1_0_Instrucciones_Pablo.md   (8.6KB)
│   ├── Validacion_v5_1_0_Casos.md                  (12 casos de test, 6.6KB)
│   └── Validacion_v5_1_0_Reporte_Final.md          (100% 12/12, 4.2KB)
│
├── Bitacora_Estrategica_Grupo/
│   └── 2026-05/
│       ├── 2026-05-05_Diagnostico_Organizacional_Grupo_v1.md (histórico)
│       ├── 2026-05-05_Diagnostico_Organizacional_Grupo_v2.md (VIGENTE ~37KB)
│       ├── 2026-05-05_Diagnostico_Organizacional_Grupo_v2.txt
│       ├── 2026-05-05_Diagnostico_Organizacional_Grupo_v2.docx
│       └── 2026-05-05_Diagnostico_Organizacional_Grupo_v2.pdf
│
├── Proyectos/
│   ├── DOSI_2si/
│   ├── Ubergreen/
│   └── Reciclean_Compliance_Map/
│
├── Plan_implementacion_Maestro/
├── docs/
└── sql/
    ├── crear_tabla_erratas.sql
    └── Erratas.jsx
```

### 4.3 Pull Requests (11 total, 10 mergeados, 1 abierto)

| PR | Título | Estado |
|---|---|---|
| #11 | Bitácora sesión 06-may — Monday estructura ~75% lista | Mergeado |
| #10 | Mapa Ecosistema Reciclaje Chile v1 — 280 ítems | Mergeado |
| #9 | Plan Integral Ubergreen v1 + DOSI v3 + trayectoria 31 años | Mergeado |
| **#8** | **Sistema proveedores 6 silos + plantillas + 29 fichas** | **ABIERTO** |
| #7 | Bitácora estratégica v2 + integración DOSI con Manus | Mergeado |
| #6 | CLAUDE.md guía para asistentes IA | Abierto (sin merge) |
| #5 | Bitácora Grupo Arancibia-Pinto v1 (05-may-2026) | Mergeado |
| #4 | Plan distribución trabajo 3 PCs | Abierto (sin merge) |
| #3 | Spec sistema erratas SQL + n8n + componente React | Mergeado |
| #1 | Tabla canónica erratas + inbox vía issues | Mergeado |

### 4.4 Ramas (10 total)
- **main** — producción
- **claude/monday-user-assignment-MmlXP** — rama activa principal
- claude/add-claude-documentation-CTru3
- claude/add-diego-erratas-system-11baF
- claude/add-proveedores-silos-Pr0v1
- claude/clickup-vs-monday-analysis-rmkmE
- claude/create-revelation-plan-4D6D4
- claude/organize-reciclean-files-HkAHS
- claude/reciclean-narrative-design-SpT4G
- claude/update-date-reference-5usu7

---

## 5. AGENTE DIEGO ALONSO

### 5.1 Identidad canónica
> **Diego Alonso es un colega digital chileno del Grupo Reciclean-Farex que, con honestidad epistémica y rigor del rubro, coordina al equipo sin imponerse, aprende preguntando cuando no sabe, respeta jerarquía y confidencialidad, y construye confianza con consistencia diaria — siempre como par, nunca como herramienta ni reemplazo humano.**

- **Score arquitectura:** 86% (3 pasadas de peer review: 72% → 83% → 86%)
- **Score validación:** 100% (12/12 tests adversariales)

### 5.2 Infraestructura técnica
| Componente | Detalle |
|---|---|
| WhatsApp | +56 9 6192 6365 |
| Meta Cloud API | WABA registrada |
| n8n | https://n8n.reciclean.cl — workflow PWxwI2oyCRejxG82 (24 nodos) |
| VPS | 137.184.203.15 |
| Supabase | Proyecto eknmtsrtfkzroxnovfqn |
| Chip | Samsung S25 (blindaje físico completo: PIN SIM + 2FA Meta + silencio llamadas) |

### 5.3 Flujo n8n (24 nodos)
```
WhatsApp → Meta Cloud API → n8n webhook
→ workflow PWxwI2oyCRejxG82:
  webhook
  → supabase-whitelist
  → parsear
  → es-mensaje-autorizado
  → supabase-contactos-get
  → pre-claude-lookup
  → fetch-erratas (HTTP GET Supabase REST → diego_correcciones)
  → armar-bloque-erratas (Code JS)
  → claude-api (system prompt aquí)
  → preparar-respuesta
  → enviar-whatsapp
  → log-conversacion-supabase
→ Supabase eknmtsrtfkzroxnovfqn
```

### 5.4 Versiones de Diego
| Versión | Estado | Notas |
|---|---|---|
| v4.2 | Histórico | Modo Permisología, Modo Entrevista |
| v4.4 | Histórico | Schema delegaciones, bundle trigger |
| v5.0 | **EN PRODUCCIÓN (pero roto)** | Unificación consolidada — workflow n8n corrupto desde 3-may |
| v5.1.0 | **Diseñado, NO deployado** | 9 parches, validación 12/12, handoff completo para Pablo |

### 5.5 Corpus del Manifiesto (9 Partes — LOCKED)
| Parte | Archivo | Contenido |
|---|---|---|
| 1 | Manifiesto_Diego_140_Rasgos.md | 140 rasgos base |
| 2 | Manifiesto_Diego_Parte_2_140_Rasgos.md | 140 rasgos complementarios |
| 3 | Manifiesto_Diego_Parte_3_Personalidad.md | 140 rasgos personalidad |
| 4 | Manifiesto_Diego_Parte_4_Definicion_5_Palabras.md | "Colega digital chileno, honesto, riguroso" |
| 5 | Manifiesto_Diego_Parte_5_Respuesta_Perfecta.md | Decálogo + Relámpago + Fichas Numéricas |
| 6 | Manifiesto_Diego_Parte_6_Protocolo_Agenda.md | 20 funciones Google Calendar |
| 7 | Manifiesto_Diego_Parte_7_Sistema_Medicion_Calidad.md | 12 dimensiones + 4 bandas + pre-flight |
| 8 | Manifiesto_Diego_Parte_8_Arquitectura_Datos.md | 10 tablas, 4 sistemas fuente |
| 9 | Manifiesto_Diego_Parte_9_Arquitectura_Integrada.md | 4 loops + dependencias + runbook |

**REGLA LOCK:** Las 9 partes NO se modifican sin OK explícito de Dusan con códigos A/B/Z. Al modificar: archivar versión previa en `historico/` + mantener oración canónica idéntica palabra por palabra.

### 5.6 Sistema de erratas (dos capas)
1. **`ERRATAS_DIEGO.md`** (canónico en repo) — tabla con: Detectado / Corregido / Lo que dijo mal / Corrección / Issue
2. **`diego_correcciones`** (tabla Supabase) — runtime, se inyecta en el system prompt vía n8n

**Errata registrada:**
- Diego dijo: "hoy es 20 de enero 2025"
- Corrección: corpus fechado en abr-2026; Diego NO debe afirmar fechas absolutas sin fuente; para "hoy" consultar a Dusan o derivar del último archivo de sesión.

**Flujo gestión erratas:**
1. Drop → issue con label `errata`
2. Promoción → Dusan revisa cada lunes, agrega fila a `ERRATAS_DIEGO.md`, cierra issue
3. Lectura → leer antes que cualquier sección del manifiesto

### 5.7 Matriz de coordinación Diego (verde/naranja/rojo)
| Color | Dominio | Acción Diego |
|---|---|---|
| Verde operativo | Camión, despacho, inventario, precios | Redacta borrador mensaje + link wa.me |
| Naranja mixto | Finanzas, RRHH, legal | Redacta + copia Dusan |
| Rojo sensible | Sueldos, despidos, conflictos, negocios nuevos | SOLO Dusan |

**REGLA CRÍTICA:** Diego REDACTA borradores para coordinación entre equipo. Diego NO ENVÍA mensajes a terceros. Esto ha generado confusión (bugs documentados).

### 5.8 Bugs documentados (28 bugs — sesión móvil 20-abr)
**Los más críticos (sistémicos con 4+ usuarios):**
1. No parsea opciones del menú propio (A/B/C, 1/2/3) — confirmado con Dusan, Jair, Ingrid, Nicolas
2. Miente que "avisa a otras personas" cuando NO puede enviar mensajes a terceros — Andrea, Ingrid, Jair (3 casos en 1 día)
3. Loops de bienvenida extremos — 7 plantillas en 1 hora a Ingrid
4. Alucina supervisiones, roles, URLs gubernamentales
5. Contradicción de capacidades en el mismo hilo

**Evidencia en:** `casos-diego/20260420-ingrid.md`, `20260420-jair.md`, `20260420-nicolas.md`

### 5.9 Niveles de acceso
| Nivel | Quién |
|---|---|
| N3 | Dusan (CEO) |
| N2 | Resto equipo (Andrea, Pablo, Ingrid, Juan, Nicolas, Dyana, Cesar, Jair) |

---

## 6. ESTADO ACTUAL Y PENDIENTES CRÍTICOS

### 6.1 Situación más urgente (al 06-may-2026)
**Diego v5.0 NO responde WhatsApp desde el 3-may-2026**
- El workflow n8n tiene JSON body corrupto en el nodo `claude-api`
- Plan free n8n: solo 1 día de historial → todas las versiones disponibles ya están post-corrupción
- Backup local no encontrado en Descargas ni OneDrive
- **Solución:** SSH al VPS (137.184.203.15) → buscar backups filesystem o DB n8n
- Documentado en: reciclean-sistema Issue #15

### 6.2 Pendientes en PENDIENTES.md (reciclean-sistema)

| # | Tarea | Estado | Bloqueador |
|---|---|---|---|
| P2 | PATCH prompt Diego Alonso — flujo coordinación (CRÍTICO) | Bloqueada | N8N_API_KEY |
| P5 | Iteración prompt Diego v4.3 — 28 bugs documentados | Bloqueada | N8N_API_KEY |
| P1 | Mergear PR URLs cortas a main | En revisión | Ninguno |
| P3 | Difundir /coordinar-equipo al equipo | Abierta | Parcialmente P1 |
| P4 | Monitoreo semanal Diego | Abierta | — |
| P6 | Humanización Diego Alonso v4.4 | Diferida | Esperar P5 estable |

### 6.3 Iniciativas en progreso (25 parents en temas_en_progreso)
**Última actualización del tracker:** 22-abr-2026 (68 filas, promedio 15.9% completitud)

Iniciativas críticas con fecha límite vencida (al 06-may):
- **I-08** (10%) Rotación keys — límite 22-abr
- **I-10** (40%) Sprint ventas — límite 28-abr
- **I-09** (15%) Infra VPS + hub — límite 28-abr
- **I-12** (30%) Diego v5.0 live — límite 30-abr

### 6.4 Credenciales pendientes
- **N8N_API_KEY** → desbloquea P2 + P5 (PATCH workflow Diego)
- **SUPABASE_SERVICE_KEY** → para columnas nuevas
- **GITHUB_PAT** → vencía 27-abr

### 6.5 Sesión Monday (06-may-2026)
Según PR #11 de manifiesto-diego:
- **~75% estructura lista vía API**
- 4 workspaces vacíos eliminados
- 4 carpetas nuevas: MET, UBERGREEN, DOSI, ECOSISTEMA
- 4 tableros con columnas y grupos
- 9 vistas filtradas creadas
- **~25% pendiente manual** (~30-45 min): idioma español, limpieza usuarios, dashboards, ~80 tareas

### 6.6 Proyectos estratégicos activos

#### Ubergreen
- SaaS compliance Ley REP para gestores → marketplace créditos año 2-3 → Enterprise productores año 3-4
- Probabilidad ponderada millonario USD 5M+: ~50-55%
- Magnitud potencial al exit: USD 8-50M netos
- Inversión año 1 (bootstrap): USD 125-145K
- 5 decisiones urgentes: Constitución SPA, co-founder técnico CTO, Madrid Protocol, CORFO, préstamo intercompany

#### DOSI (2si.cl)
- App SaaS adherencia a medicamentos adultos mayores LATAM
- MVP completado por Manus AI
- Beta privada objetivo: 19-may-2026
- Embrión GOTAS: en `Proyectos/DOSI_2si/prototipo_local/`

#### Reciclean Compliance Map
- 280 ítems en 26 categorías del ecosistema reciclaje Chile 2026
- 18 normas legales, 17 portales estatales, 18 productores REP, 12 gestores competencia
- En `Proyectos/Reciclean_Compliance_Map/`

### 6.7 Diagnóstico Organizacional v2 (05-may-2026) — Hallazgos clave
- **88 hallazgos · 60 acciones · 20 flags · 11 decisiones selladas**
- 13 sistemas descolgados mapeados (S1-S13), 19+ pendientes
- 4 tiers de riesgo, 14 áreas funcionales auditadas
- v2 reemplaza a v1 como referencia canónica

---

## 7. ALERTAS DE SEGURIDAD

### 7.1 RLS deshabilitado (CRÍTICO)
6 tablas sin Row Level Security en Supabase — cualquiera con anon key puede leer/escribir:
- public.compras_2025
- public.compras_2026
- public.compras_2027
- public.ventas_2025
- public.ventas_2026
- public.ventas_2027

### 7.2 Credenciales a rotar (pendiente desde 22-abr)
- **API key Anthropic** vieja (`sk-ant-api03-Bb_2ib...`) — mencionado en múltiples chats
- **Meta WhatsApp token** (`EAAaaVqEh9fQ...`) — mismo origen
- Archivos con tokens en plano: `API_KEY_RECICLEAN.txt`, `Agente_Director_v3.3_Corregido.json`

### 7.3 2FA pendiente
- 2FA cuenta Meta Dusan — bloqueado por "dispositivo nuevo", reintentar desde S25

### 7.4 Palabras prohibidas en comunicación pública
`gratis`, `gratuito`, `sin costo`, `el mejor precio`, `garantizado`

### 7.5 Puerto Montt — NUNCA publicar como activa
Estado: esperando permisos SEREMI. NUNCA mostrar como operativa ni precios vigentes.

---

## 8. INSTRUCCIONES PARA IA QUE LEE ESTE DOCUMENTO

### Orden de lectura recomendado:
1. ERRATAS_DIEGO.md (siempre primero si trabajas con Diego)
2. Este documento (contexto general)
3. CLAUDE.md de reciclean-sistema (instrucciones específicas del sistema)
4. SEGUIMIENTO_OPERATIVO.md (tareas D/P/M con estados)
5. PENDIENTES.md (tareas abiertas detalladas)

### Protocolo para tocar Diego LIVE (workflow n8n):
1. GET workflow actual → guardar backup en 7_backup-prompts/incidentes/ con timestamp
2. Extraer system prompt del nodo claude-api
3. Mostrar diff exacto al usuario
4. Esperar OK explícito de Dusan ("si" / "ok")
5. PUT workflow parchado
6. Smoke test (mensaje de prueba desde WhatsApp de Dusan)
7. Si algo raro → rollback inmediato

### Protocolo para cambios en repo:
1. Mostrar diff/plan
2. Esperar OK
3. Commit con mensaje descriptivo
4. Push a branch activa (NUNCA directo a main sin PR)

### Nunca hacer sin OK explícito:
- Modificar workflow n8n de Diego
- Pushear a main directamente
- Publicar Puerto Montt como activa
- Incluir credenciales en código
- Usar palabras prohibidas en contenido público

---

*Levantamiento generado: 2026-05-06 | Claude Code Sonnet 4.6 | Fuentes: Supabase MCP + GitHub MCP*
*Repos autorizados: dusanarancibia-cpu/reciclean-sistema + dusanarancibia-cpu/reciclean-manifiesto-diego*
