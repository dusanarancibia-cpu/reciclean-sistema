# Catalogo de tablas — Supabase `eknmtsrtfkzroxnovfqn`

> Fuente de verdad: Supabase (17 tablas operativas + 5 en creacion para Diego v4.2).
> Region: Sao Paulo. URL: `https://eknmtsrtfkzroxnovfqn.supabase.co`.
> Antes de crear un archivo estructurado, revisar este catalogo.

---

## 1. Tablas existentes en Supabase (verificadas en codigo)

Tablas referenciadas desde `src/supabase-bridge.js`, `src/lib/auth.js` y `public/js/*.js`:

| Tabla | Proposito | Consumidores |
|---|---|---|
| `materiales` | 65 SKUs, flags `farex`/`reciclean`, iva, margenes, flete | Panel, Asistente, Widgets |
| `sucursales` | 4 (Cerrillos, Maipu, Talca, Pto Montt) — Farex solo 2 primeras | Panel, Asistente |
| `precios` | Precios por material x sucursal | Panel tab C, Asistente |
| `precios_cliente` | Precios cliente x material | Panel, calculos |
| `precios_version` | Releases atomicos de precios (`es_activa` bool) | Panel GRABAR |
| `v_precios_activos` | **Vista** principal de precios vigentes | Todo |
| `config` | Configuracion global del sistema | Panel |
| `clientes_compradores` | 12 clientes (HUAL, RESIMEX, FPC, ADASME, POLPLAST, etc.) | Panel, calculos |
| `proveedores` | Proveedores | Panel |
| `material_aliases` | Aliases por fuente (mapeo nombres alternativos) | Panel tab B, carga masiva |
| `usuarios_autorizados` | 6 usuarios del Panel Admin (email + clave + rol) | Login unificado |
| `asistente_snapshot` | Sync Panel -> Asistente (Realtime) | Asistente, Widgets |
| `cotizaciones` | Cotizaciones guardadas desde el Asistente | Asistente |
| `eventos` | Eventos generales | Panel |
| `eventos_asistente` | Tracking de uso Asistente (14 tipos de evento) | Asistente |
| `nurturing_queue` | Cola de nurturing (leads) | Panel |
| `viajes_terreno` | Viajes del equipo en terreno | Fase 2 |
| `tramos_viaje` | Tramos de viajes | Fase 2 |
| `rutas_asignadas` | Rutas asignadas a equipo | Fase 2 |

### Tablas usadas por workflow n8n Diego (no desde codigo web)

| Tabla | Proposito |
|---|---|
| `contactos` | Whitelist del equipo (9 personas). Columnas: `phone`, `nombre`, `nivel`, `rol`, `sucursal`, `activo`. **Pendiente agregar** `anuncio_nombre_visto BOOLEAN DEFAULT false` (P2). |
| `conversaciones` | Log de mensajes Diego <-> equipo (in/out, parsing, tiempos). |

---

## 2. Tablas en creacion (Diego v4.2, ejecutar 21-abr 08:00)

SQL completo en `docs/diego-v4.2-implementacion-21abr.md` Fase 1. Migracion no corrida aun.

| Tabla | Proposito |
|---|---|
| `procesos_empresa` | Conocimiento curado — RAG que Diego consulta |
| `sesiones_entrevista` | Estado de entrevistas (activa/pausada/completada/rechazada) |
| `entrevistas_respuestas` | Respuestas crudas del equipo a las 10 preguntas |
| `procesos_borrador` | Borradores Diego-Curador esperando validacion Dusan |
| `vacios_conocimiento` | Cada "no se" loggeado (para priorizar entrevistas) |

---

## 3. Tablas PROPUESTAS — aun no existen (a crear)

Estas tablas NO existen. Hoy la informacion vive en archivos sueltos. **Antes de agregar una fila nueva a esos archivos, proponer crear la tabla.**

### 3.1. `tareas` — reemplaza `PENDIENTES.md`

**Origen:** hoy son 6 items (P1-P6) en `PENDIENTES.md`.

```sql
CREATE TABLE tareas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,            -- P1, P2, P3...
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT CHECK (prioridad IN ('critica','alta','media','baja','diferida')),
  estado TEXT CHECK (estado IN ('abierta','bloqueada','en_revision','cerrada')) DEFAULT 'abierta',
  proxima_accion TEXT,
  bloqueador TEXT,
  branch TEXT,
  commit_sha TEXT,
  pr_numero INT,
  depende_de BIGINT[],            -- otras tareas.id
  creada_por TEXT,
  asignada_a TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
```

### 3.2. `casos_asistente` — reemplaza `casos-diego/*.md`

**Origen:** hoy son 3 archivos con estructura identica.

```sql
CREATE TABLE casos_asistente (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  contacto_phone TEXT,
  contacto_nombre TEXT,
  asistente TEXT DEFAULT 'diego_alonso', -- escalable a otros bots
  duracion_min INT,
  mensajes_total INT,
  resultado TEXT CHECK (resultado IN ('resuelto','sin_resolver','parcial','abandonado')),
  resumen TEXT NOT NULL,
  diego_hizo_mal TEXT,      -- lista en JSON o texto
  diego_debio_hacer TEXT,
  bugs_vinculados BIGINT[], -- FK a bugs_asistente
  evidencia_url TEXT,        -- link a chat/pdf/captura
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3. `bugs_asistente` — reemplaza la lista de 28 bugs en P5

**Origen:** 28 bugs anidados dentro de `PENDIENTES.md` P5. Imposible filtrar, priorizar, cerrar individualmente.

```sql
CREATE TABLE bugs_asistente (
  id BIGSERIAL PRIMARY KEY,
  numero INT UNIQUE,            -- #1 a #28+
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,               -- 'loop', 'mentira', 'alucinacion', 'parsing', 'identidad'
  severidad TEXT CHECK (severidad IN ('critica','alta','media','baja')),
  usuarios_confirmados TEXT[],  -- ['dusan','jair','ingrid','nicolas']
  casos_evidencia BIGINT[],     -- FK a casos_asistente
  version_detectada TEXT,       -- v4.1.5.3
  version_fix TEXT,             -- v4.2 o v4.3
  estado TEXT CHECK (estado IN ('abierto','en_progreso','fix_aplicado','verificado','cerrado')) DEFAULT 'abierto',
  workaround TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
```

### 3.4. `plantillas_mensajes` — reemplaza `mensajes-equipo/*.md`

**Origen:** 8 mensajes personalizados por persona en `mensajes-equipo/difusion-coordinar-equipo.md`.

```sql
CREATE TABLE plantillas_mensajes (
  id BIGSERIAL PRIMARY KEY,
  campana TEXT NOT NULL,         -- 'difusion-coordinar-equipo'
  destinatario_phone TEXT,
  destinatario_nombre TEXT,
  contexto TEXT,                 -- 'caso bolsas Metecno'
  texto TEXT NOT NULL,
  canal TEXT DEFAULT 'whatsapp',
  estado TEXT CHECK (estado IN ('borrador','aprobado','enviado','respondido')) DEFAULT 'borrador',
  enviado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5. `workflow_patches` — historial de cambios a Diego LIVE

**Origen:** hoy disperso en `7_backup-prompts/incidentes/` + `PENDIENTES.md` + memoria.

```sql
CREATE TABLE workflow_patches (
  id BIGSERIAL PRIMARY KEY,
  workflow_id TEXT NOT NULL,        -- 'PWxwI2oyCRejxG82'
  workflow_nombre TEXT,
  version_from TEXT,                -- v4.1.5.3
  version_to TEXT,                  -- v4.2
  fecha DATE NOT NULL,
  autor TEXT,                       -- Dusan / Pablo
  resumen TEXT NOT NULL,
  diff_url TEXT,                    -- link al commit o gist
  backup_path TEXT,                 -- '7_backup-prompts/incidentes/diego_workflow_backup_...'
  smoke_test_resultado TEXT CHECK (smoke_test_resultado IN ('ok','parcial','fallo','rollback')),
  bugs_resueltos BIGINT[],           -- FK bugs_asistente
  tareas_vinculadas BIGINT[],        -- FK tareas
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6. `decisiones_lock` — decisiones bloqueadas por Dusan

**Origen:** tabla en `docs/diego-v4.2-spec.md` con codigos C3/M2/M1.C/D1/P1.b/P3/R2.B/R1.

```sql
CREATE TABLE decisiones_lock (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE,            -- C3, M2, M1.C, D1
  tema TEXT NOT NULL,
  decision TEXT NOT NULL,
  contexto TEXT,                 -- en que sesion/spec se decidio
  fecha DATE NOT NULL,
  decidida_por TEXT DEFAULT 'Dusan',
  revertible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7. `credenciales_requeridas` — tracker de credenciales faltantes

**Origen:** seccion "CREDENCIALES NECESARIAS" en `CONTINUAR_SESION_DIEGO.txt`.

```sql
CREATE TABLE credenciales_requeridas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT UNIQUE,            -- 'N8N_API_KEY', 'GITHUB_PAT'
  desbloquea TEXT[],             -- ['P2', 'P5']
  urgencia TEXT CHECK (urgencia IN ('critica','alta','media','baja')),
  vence DATE,
  obtenida BOOLEAN DEFAULT false,
  obtenida_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.8. `clasificacion_informacion` — niveles de acceso (Diego SI / Diego NO)

**Origen:** principio "Diego solo accede a lo que sirve para operacion. Lo reservado NO". Hoy disperso en CLAUDE.md y memoria.

```sql
CREATE TABLE clasificacion_informacion (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,         -- 'publico','operativo','restringido','confidencial'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  diego_puede_leer BOOLEAN DEFAULT false,
  diego_puede_compartir BOOLEAN DEFAULT false,
  roles_acceso TEXT[],
  ejemplo TEXT,
  color_hex TEXT,
  orden INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**4 niveles seed:**

| Codigo | Diego lee | Diego comparte | Ejemplo |
|---|---|---|---|
| `publico` | si | si | Precios publicados, telefono comercial |
| `operativo` | si | no | Procesos, contactos equipo, FAQs internas |
| `restringido` | no | no | Margenes, costos, datos clientes |
| `confidencial` | no | no | Sueldos, despidos, conflictos, estrategia |

### 3.9. `conocimiento_documentos` — inventario de info que entra al sistema

**Origen:** carpetas/archivos/tablas que entran al sistema. Indica que es, como se clasifica, si Diego lo lee, si esta indexado en RAG.

```sql
CREATE TABLE conocimiento_documentos (
  id BIGSERIAL PRIMARY KEY,
  origen_tipo TEXT CHECK (origen_tipo IN ('archivo','carpeta','tabla','vista','url','mensaje','workflow')) NOT NULL,
  origen_path TEXT,                    -- 'casos-diego/', 'PENDIENTES.md', 'tabla:precios'
  titulo TEXT NOT NULL,
  resumen TEXT,
  categoria_tematica TEXT,             -- 'precios','operacion','rrhh','finanzas','permisologia','incidente_asistente','difusion','spec_tecnico','sesion_claude'
  clasificacion_id BIGINT REFERENCES clasificacion_informacion(id) NOT NULL,
  fuente_carga TEXT,
  fecha_carga DATE NOT NULL DEFAULT CURRENT_DATE,
  visible_para_diego BOOLEAN DEFAULT false,   -- override puntual
  indexado_rag BOOLEAN DEFAULT false,         -- esta en procesos_empresa?
  rol_aplicable TEXT[],
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vista derivada:** `v_diego_puede_leer` filtra solo lo autorizado para Diego.

**Seeds incluidos en migracion:** carpetas nuevas del 20-abr (`casos-diego/`, `mensajes-equipo/`, `docs/`) + archivos clave + tablas operativas existentes (`precios`, `precios_cliente`, `contactos`).

**SQL completo:** `sql/20260422_clasificacion_acceso_diego.sql`.

### 3.10. `empresas` — Grupo + Reciclean + Farex

**Origen:** hoy son flags `farex`/`reciclean` en `materiales`. No hay tabla raiz.

```sql
CREATE TABLE empresas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,         -- 'grupo','reciclean','farex'
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sucursales_codigos TEXT[],
  iva_regla TEXT,                       -- 'retencion_19','sin_iva'
  dominio TEXT,                         -- 'reciclean.cl','farex.cl'
  color_hex TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Seeds: `grupo` + `reciclean` (4 sucursales) + `farex` (2 sucursales, IVA 19%).

### 3.11. `areas` — Direccion, Tech, Comercial, Operaciones, Admin, Permisologia, RRHH

```sql
CREATE TABLE areas (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  responsable_phone TEXT,
  color_hex TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

7 seeds con responsable y color.

### 3.12. `objetivos` — general / particular, por grupo / empresa / area

```sql
CREATE TABLE objetivos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('general','particular')) NOT NULL,
  alcance TEXT CHECK (alcance IN ('grupo','empresa','area')) NOT NULL,
  empresa_id BIGINT REFERENCES empresas(id),
  area_id BIGINT REFERENCES areas(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  periodo TEXT,
  meta_cuantitativa TEXT,
  prioridad TEXT CHECK (prioridad IN ('critica','alta','media','baja')),
  estado TEXT CHECK (estado IN ('propuesto','activo','en_pausa','cumplido','descartado')),
  objetivo_padre_id BIGINT REFERENCES objetivos(id),  -- particular -> general
  porcentaje_avance INT CHECK (porcentaje_avance BETWEEN 0 AND 100),
  fecha_inicio DATE,
  fecha_objetivo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
```

Seeds propuestos (18): 4 generales `G-01..G-04` + 5 empresa `REC-0x`/`FAR-0x` + 9 area `TECH/COM/OPS/ADM/PER/DIR/RRHH`. Todos encadenados via `objetivo_padre_id`.

### 3.13. `kpis` — indicadores cuantitativos por objetivo

```sql
CREATE TABLE kpis (
  id BIGSERIAL PRIMARY KEY,
  objetivo_id BIGINT REFERENCES objetivos(id) NOT NULL,
  codigo TEXT,
  nombre TEXT NOT NULL,
  unidad TEXT,                         -- '%','bugs','cotizaciones/semana'
  meta_valor NUMERIC,
  valor_actual NUMERIC,
  frecuencia_medicion TEXT,
  fuente_medicion TEXT,                -- 'supabase:SELECT COUNT(*) ...' o 'manual'
  ultima_medicion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.14. ALTER `tareas` + vistas `v_tareas_evolucion` y `v_objetivos_estado`

```sql
-- Enganche de tareas con empresa/area/objetivo
ALTER TABLE tareas ADD COLUMN empresa_id BIGINT REFERENCES empresas(id);
ALTER TABLE tareas ADD COLUMN area_id BIGINT REFERENCES areas(id);
ALTER TABLE tareas ADD COLUMN objetivo_id BIGINT REFERENCES objetivos(id);
ALTER TABLE tareas ADD COLUMN porcentaje_avance INT DEFAULT 0;
```

**Vista `v_tareas_evolucion`** — una fila por tarea, con columnas:

| Columna | Descripcion |
|---|---|
| `codigo` | P1, P2... |
| `titulo` | resumen |
| `pct` | '80%' |
| `barra` | `########--` (10 bloques) |
| `color` | `verde`/`amarillo`/`rojo`/`naranja`/`azul` (mapear a CSS) |
| `prioridad` | critica/alta/media/baja/diferida |
| `peso` | 1..5 (para ordenar) |
| `estado` | abierta/bloqueada/en_revision/cerrada |
| `objetivo_codigo` + `objetivo_titulo` + `objetivo_padre_codigo` | encadenamiento |
| `area` / `empresa` | contexto organizacional |
| `proxima_accion` / `bloqueador` / `branch` | operacional |

Ordenada por estado (abiertas primero) -> peso prioridad -> codigo.

**Vista `v_objetivos_estado`** — una fila por objetivo con: `tareas_abiertas`, `tareas_bloqueadas`, `tareas_cerradas`, `pct_avance_tareas` (promedio), `pct_declarado` (manual), `empresa`, `area`, `objetivo_padre`. Detecta desalineacion (objetivo con 0 tareas = sin bajada, o 50% declarado vs 10% real).

### 3.15. `reels_inspiracion` — biblioteca de reels / contenido externo

**Origen:** reels, videos o posts externos que nos ensenan algo aplicable. Con transcripcion y matriz "donde se podria usar".

```sql
CREATE TABLE reels_inspiracion (
  id BIGSERIAL PRIMARY KEY,
  nombre_tema TEXT NOT NULL,              -- max 2 palabras
  url TEXT,
  plataforma TEXT CHECK (plataforma IN ('instagram','tiktok','youtube','x','linkedin','whatsapp','otro')),
  autor_handle TEXT,
  autor_nombre TEXT,
  duracion_seg INT,
  fecha_publicacion DATE,
  transcripcion TEXT,
  resumen TEXT,
  idea_central TEXT,
  incorporada TEXT CHECK (incorporada IN ('pendiente_evaluar','evaluando','adoptada','parcial','descartada')) DEFAULT 'pendiente_evaluar',
  como_se_incorporo TEXT,
  incorporada_fecha DATE,
  -- LUGARES del sistema (boolean por cada uno)
  aplica_panel_admin          BOOLEAN DEFAULT false,
  aplica_asistente            BOOLEAN DEFAULT false,
  aplica_diego_alonso         BOOLEAN DEFAULT false,
  aplica_widgets_publicos     BOOLEAN DEFAULT false,
  aplica_sitio_reciclean      BOOLEAN DEFAULT false,
  aplica_sitio_farex          BOOLEAN DEFAULT false,
  aplica_rrss_automaticas     BOOLEAN DEFAULT false,
  aplica_chatbot_whatsapp     BOOLEAN DEFAULT false,
  aplica_cotizaciones         BOOLEAN DEFAULT false,
  aplica_onboarding_equipo    BOOLEAN DEFAULT false,
  aplica_auditoria            BOOLEAN DEFAULT false,
  aplica_comunicacion_interna BOOLEAN DEFAULT false,
  aplica_presentacion_externa BOOLEAN DEFAULT false,
  aplica_fichas_gmb           BOOLEAN DEFAULT false,
  -- FK a taxonomia
  tarea_ids BIGINT[],
  objetivo_ids BIGINT[],
  area_ids BIGINT[],
  empresa_ids BIGINT[],
  -- Extras
  tono TEXT,                              -- educativo|humoristico|emotivo|tecnico|ventas
  formato TEXT,                           -- tutorial|testimonio|comparativa|storytelling|ugc
  duplicable BOOLEAN DEFAULT false,       -- se puede replicar con Canva+Buffer?
  costo_estimado_replica TEXT,            -- bajo|medio|alto
  prioridad_implementacion TEXT CHECK (prioridad_implementacion IN ('critica','alta','media','baja')) DEFAULT 'media',
  clasificacion_id BIGINT REFERENCES clasificacion_informacion(id),
  cargado_por TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vistas incluidas:**
- `v_reels_por_evaluar` — pendientes/evaluando ordenados por prioridad.
- `v_reels_adoptados` — los ya implementados, cuenta tareas y objetivos vinculados.
- `v_reels_por_lugar` — resumen: cuantos reels por cada lugar del sistema y cuantos ya adoptados.

**Uso tipico:**
1. Ves un reel interesante -> INSERT con nombre_tema + url + transcripcion + marcar aplicaciones.
2. Estado inicial `incorporada='pendiente_evaluar'`.
3. Cuando decidis implementarlo -> UPDATE `incorporada='evaluando'` + crear tarea + linkear `tarea_ids`.
4. Cuando esta en produccion -> `incorporada='adoptada'` + `como_se_incorporo` + `incorporada_fecha`.

**SQL:** `sql/20260422_reels_inspiracion.sql`.

### 3.16. `sesiones_claude` — registro de sesiones de trabajo con Claude Code

**Origen:** hoy son archivos `CONTINUAR_SESION_*.txt` tipo "prompt de continuidad".

```sql
CREATE TABLE sesiones_claude (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  usuario TEXT NOT NULL,
  modo TEXT,                     -- 'desktop','movil','web'
  branch TEXT,
  commits_sha TEXT[],
  pr_numero INT,
  resumen TEXT,
  tareas_creadas BIGINT[],
  tareas_cerradas BIGINT[],
  duracion_min INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Mapeo archivo -> tabla (MIGRAR)

| Archivo actual | Tabla destino | Criterio de migracion |
|---|---|---|
| `PENDIENTES.md` seccion "Abiertas" | `tareas` | Una fila por P*. Campos explicitos. |
| `PENDIENTES.md` P5 bugs 1-28 | `bugs_asistente` | Una fila por bug. Enlazar a casos. |
| `casos-diego/20260420-*.md` | `casos_asistente` | Una fila por caso. Resumen en contenido, linkear bugs. |
| `mensajes-equipo/difusion-coordinar-equipo.md` | `plantillas_mensajes` | Una fila por destinatario. |
| `docs/diego-v4.2-spec.md` tabla decisiones LOCK | `decisiones_lock` | Una fila por codigo. |
| `CONTINUAR_SESION_DIEGO.txt` seccion credenciales | `credenciales_requeridas` | Una fila por credencial. |
| `7_backup-prompts/incidentes/*.json` | `workflow_patches` | Una fila por patch aplicado, backup_path apunta al JSON. |

Archivos que **NO** migran (son narrativa, no tabla):
- `CLAUDE.md` — instrucciones del proyecto.
- `docs/diego-v4.2-spec.md` (texto del spec) — queda como doc.
- `docs/diego-v4.2-implementacion-21abr.md` — guia de implementacion.
- Archivos HTML (`diego-*.html`, `index.html`, etc.).

---

## 5. Como consultar este catalogo

- Antes de registrar info: `grep -l "<palabra_clave>" TABLAS.md`.
- Para ver columnas de una tabla existente: Supabase Dashboard > Database > Tables.
- Para ver SQL de una tabla propuesta: buscar en seccion 3 de este archivo.
- SQL de creacion consolidado:
  - `sql/20260422_tablas_base_protocolo.sql` (7 tablas operacion: tareas, bugs, casos, plantillas, patches, decisiones, credenciales).
  - `sql/20260422_clasificacion_acceso_diego.sql` (2 tablas + vista: clasificacion_informacion, conocimiento_documentos, v_diego_puede_leer).
  - `sql/20260422_empresa_objetivos_evolucion.sql` (4 tablas + ALTER tareas + 2 vistas: empresas, areas, objetivos, kpis, v_tareas_evolucion, v_objetivos_estado).
  - `sql/20260422_reels_inspiracion.sql` (1 tabla + 3 vistas: reels_inspiracion, v_reels_por_evaluar, v_reels_adoptados, v_reels_por_lugar).
