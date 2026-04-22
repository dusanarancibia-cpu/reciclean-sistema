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

### 3.8. `sesiones_claude` — registro de sesiones de trabajo con Claude Code

**Origen:** hoy son archivos `CONTINUAR_SESION_DIEGO.txt` tipo "prompt de continuidad".

```sql
CREATE TABLE sesiones_claude (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  usuario TEXT NOT NULL,         -- dusan, pablo
  modo TEXT,                     -- 'desktop', 'movil', 'web'
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
- SQL de creacion consolidado (7 tablas propuestas): `.claude/skills/protocolo-datos-unificado/sql/20260422_tablas_base_protocolo.sql`.
