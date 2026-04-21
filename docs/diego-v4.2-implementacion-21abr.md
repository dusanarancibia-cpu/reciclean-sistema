# Guía Implementación Diego v4.2 — Paso a Paso

> **Fecha de ejecución prevista:** martes 21-abr-2026, 08:00-10:00 hrs Chile
> **Responsable:** Dusan (con guía Claude Code, sin Pablo presente)
> **Spec maestro:** [docs/diego-v4.2-spec.md en repo](https://github.com/dusanarancibia-cpu/reciclean-sistema/blob/main/docs/diego-v4.2-spec.md)
> **Riesgo:** alto (toca workflow LIVE PWxwI2oyCRejxG82) — implementación en horario laboral, gestionar via aviso al grupo
> **Plan de rollback:** ver Sección F al final
>
> **🔔 ANTES DE EMPEZAR (07:55 hrs) — mandar AVISO al grupo del equipo:**
>
> ```
> Equipo, voy a estar haciendo mantenimiento a Diego entre las
> 08:00 y las 10:00. Puede que no responda durante ese rato.
> Les aviso cuando termine. — Dusan
> ```

---

## 🚦 Pre-vuelo (HACER ANTES DE TOCAR NADA)

- [ ] **Avisar a Pablo por WA** que arranco implementación esta noche, sin interrumpir vacaciones
- [ ] **Backup workflow Diego actual** desde n8n: Workflows → PWxwI2oyCRejxG82 → menú `...` → `Download` → guarda como `backup_diego_v4.1.5.3_pre_v4.2.json`
- [ ] **Snapshot Supabase** (no urgente, las tablas nuevas no afectan las viejas, pero conviene): Supabase Dashboard → Database → Backups → Create new backup
- [ ] **Confirmar que Diego LIVE responde OK ahora** (manda 1 mensaje de prueba a +56 9 6192 6365 antes de empezar)
- [ ] **Tener WhatsApp tuyo abierto** durante todo el proceso para tests

---

## 🟢 FASE 1 — Crear las 5 tablas Supabase (15 min, riesgo BAJO)

> Esta fase NO toca producción. Solo agrega tablas nuevas. Si algo falla acá, cero impacto en Diego LIVE.

### Paso 1.1 — Abrir Supabase SQL Editor

1. Ir a https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new
2. (Si no estás logueado, ingresa con tu cuenta)

### Paso 1.2 — Ejecutar el siguiente SQL completo

Copia este bloque entero y pégalo en el editor → click `Run`:

```sql
-- =====================================================
-- DIEGO v4.2 — Migración tablas modo entrevista
-- Fecha: 2026-04-21
-- =====================================================

-- Tabla 1: Conocimiento curado (RAG que Diego consulta)
CREATE TABLE IF NOT EXISTS procesos_empresa (
  id BIGSERIAL PRIMARY KEY,
  tema TEXT NOT NULL,
  categoria TEXT NOT NULL,
  contenido TEXT NOT NULL,
  rol_aplicable TEXT[],
  validado_por TEXT,
  validado_at TIMESTAMP,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_procesos_tema ON procesos_empresa(tema);
CREATE INDEX IF NOT EXISTS idx_procesos_activo ON procesos_empresa(activo);

-- Tabla 2: Estado de entrevistas en curso
CREATE TABLE IF NOT EXISTS sesiones_entrevista (
  id BIGSERIAL PRIMARY KEY,
  contacto_phone TEXT NOT NULL,
  contacto_nombre TEXT,
  tema TEXT NOT NULL,
  preguntas_completadas INT DEFAULT 0,
  estado TEXT DEFAULT 'activa',
  proximo_recordatorio TIMESTAMP,
  metodo_recordatorio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_phone_estado ON sesiones_entrevista(contacto_phone, estado);

-- Tabla 3: Respuestas crudas del equipo
CREATE TABLE IF NOT EXISTS entrevistas_respuestas (
  id BIGSERIAL PRIMARY KEY,
  sesion_id BIGINT REFERENCES sesiones_entrevista(id) ON DELETE CASCADE,
  pregunta_orden INT,
  pregunta TEXT,
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resp_sesion ON entrevistas_respuestas(sesion_id);

-- Tabla 4: Borradores generados por Diego-Curador
CREATE TABLE IF NOT EXISTS procesos_borrador (
  id BIGSERIAL PRIMARY KEY,
  tema TEXT NOT NULL,
  categoria TEXT,
  contenido_borrador TEXT NOT NULL,
  fuentes_sesion_ids BIGINT[],
  estado TEXT DEFAULT 'pendiente',
  comentarios_dusan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Tabla 5: Vacíos detectados (cada "no sé" loggeado)
CREATE TABLE IF NOT EXISTS vacios_conocimiento (
  id BIGSERIAL PRIMARY KEY,
  contacto_phone TEXT,
  pregunta_original TEXT,
  tema_inferido TEXT,
  resuelto BOOLEAN DEFAULT false,
  sesion_id BIGINT REFERENCES sesiones_entrevista(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS (mismo patrón que tablas v4.1: solo service_role)
ALTER TABLE procesos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_entrevista ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE procesos_borrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacios_conocimiento ENABLE ROW LEVEL SECURITY;
```

### Paso 1.3 — Validar

Ejecuta esta query para confirmar que las 5 tablas existen:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('procesos_empresa', 'sesiones_entrevista', 'entrevistas_respuestas', 'procesos_borrador', 'vacios_conocimiento')
ORDER BY table_name;
```

**Resultado esperado:** 5 filas con los nombres de las tablas.

✅ Si ves 5 filas → FASE 1 OK, continúa Fase 2.
❌ Si ves menos → para acá. Avísame qué dice el error.

---

## 🟡 FASE 2 — Modificar workflow Diego (45 min, riesgo ALTO)

> Acá tocamos el workflow LIVE PWxwI2oyCRejxG82. Si algo se rompe, Diego deja de responder al equipo.

### Paso 2.1 — Backup obligatorio (no avanzar sin esto)

1. n8n → Workflows → abrir `PWxwI2oyCRejxG82`
2. Menú `...` arriba derecha → `Download`
3. Guarda en `7_backup-prompts/backups-workflows/backup_diego_v4.1.5.3_pre_v4.2.json` (crea la carpeta si no existe)

### Paso 2.2 — Duplicar workflow para trabajar en copia (recomendado)

1. n8n → Workflows → click en PWxwI2oyCRejxG82 → menú `...` → `Duplicate`
2. Renombra el duplicado: `Diego v4.2 [STAGING]`
3. Trabaja sobre el duplicado, NO sobre el LIVE

> Solo cuando v4.2 STAGING esté validado, lo activamos como LIVE y desactivamos el viejo.

### Paso 2.3 — Agregar 2 nodos nuevos (en el STAGING)

> Te guiaré paso a paso en n8n editor cuando estés frente a la pantalla mañana. Acá solo va el resumen de QUÉ se inserta.

**Nodo A — "Check Sesion Activa"** (insertar después del nodo "Lookup Contacto Supabase", antes de Claude Haiku):

- **Tipo:** Supabase node
- **Operation:** `Get All`
- **Table:** `sesiones_entrevista`
- **Filters:**
  - `contacto_phone` equals `{{ $json.from }}`
  - `estado` equals `activa`
- **Output:** si hay resultado → flujo "Continuar Entrevista". Si no → seguir.

**Nodo B — "RAG Procesos"** (después del Nodo A, antes de Claude Haiku):

- **Tipo:** Supabase node con SQL custom
- **Query:**
  ```sql
  SELECT contenido, tema, similarity(contenido, $1) AS score
  FROM procesos_empresa
  WHERE activo = true
    AND similarity(contenido, $1) > 0.3
  ORDER BY score DESC
  LIMIT 3;
  ```
- **Parameter:** `$1` = `{{ $json.mensaje_texto }}`
- **Output:** si hay results → inyecta en `context_rag`. Si no → marca `vacio_detectado=true`.

### Paso 2.4 — Modificar el system prompt de Claude Haiku

Agregar al final del prompt actual:

```
Si recibes vacio_detectado=true en el context, NO inventes la respuesta.
Responde EXACTAMENTE con este formato:

"Honestamente, no manejo bien [TEMA] todavía. ¿Me das ~5 min para aprender? Te haría 10 preguntas cortas. Puedes parar cuando quieras.

Responde SI / NO / DESPUES"

Reemplaza [TEMA] con el tema inferido de la pregunta del usuario.

Si recibes context_rag con contenido, úsalo como base autoritativa para responder.
NO contradigas el context_rag bajo ninguna circunstancia.
```

### Paso 2.5 — Crear subworkflow "Modo Entrevista"

Detalle paso a paso te lo guiaré en n8n mañana. Estructura:

1. Si user responde `SI` → INSERT en `sesiones_entrevista` + generar pregunta 1 con Claude
2. Si responde `NO` → INSERT `vacios_conocimiento (resuelto=false)` + sigue conversación normal
3. Si responde `DESPUES` → INSERT `sesiones_entrevista` con `estado='pausada'` + preguntar cuándo
4. Cada respuesta → INSERT en `entrevistas_respuestas` + generar próxima pregunta adaptativa
5. Al llegar a 10 preguntas → mensaje cierre con 3 opciones (A/B/C)

---

## 🟠 FASE 3 — Workflow Diego-Curador (puede quedar para 22-abr noche)

> Si la Fase 2 toma más de lo previsto, dejamos esta fase para mañana 22-abr en la noche.
> Diego-Curador no es bloqueante para el lanzamiento — sin él, las respuestas crudas se acumulan en `entrevistas_respuestas` esperando, no se pierden.

Detalle completo en el spec del repo.

---

## ✅ FASE 4 — Tests post-implementación (15 min, OBLIGATORIO antes de activar)

Pruebas con tu propio WhatsApp (+56 9 6192 6365) sobre el STAGING:

### Test 1 — Diego responde normal cosas que YA sabe
Mensaje: `"Hola Diego, ¿cómo estás?"`
Esperado: Respuesta normal saludo, sin pedir entrevista.

### Test 2 — Diego detecta vacío y pide entrevista
Mensaje: `"Diego, ¿cuál es la ruta del camión RX-2230?"`
Esperado: Respuesta tipo *"Honestamente, no manejo bien rutas de camiones todavía. ¿Me das ~5 min...? Responde SI / NO / DESPUES"*

### Test 3 — Aceptar entrevista
Respuesta: `"SI"`
Esperado: Diego hace pregunta 1 sobre rutas de camiones. Verificar en Supabase que apareció registro en `sesiones_entrevista`.

### Test 4 — Responder pregunta
Respuesta: `"La ruta sale de Talca a las 5 AM por la Ruta 5 Sur..."`
Esperado: Diego hace pregunta 2 (adaptativa). Verificar en Supabase `entrevistas_respuestas` con tu respuesta.

### Test 5 — Pausar
Respuesta: `"pausar"`
Esperado: Diego responde *"OK, te espero cuando puedas"*. Verificar `sesiones_entrevista.estado='pausada'`.

### Test 6 — Rechazar
Mensaje nuevo: `"Diego, ¿cuál es el margen de PET prensado?"`
Diego pide entrevista → Respuesta: `"NO"`
Esperado: Diego sigue conversación normal. Verificar `vacios_conocimiento` con `resuelto=false`.

✅ Si los 6 tests pasan → activar v4.2 como LIVE (paso 4.7).
❌ Si alguno falla → revisar nodos, NO activar.

### Paso 4.7 — Switchear LIVE

1. n8n → Workflows
2. Desactivar `Diego v4.1.5.3 LIVE` (toggle off)
3. Activar `Diego v4.2 [STAGING]`
4. Renombrar: quitar `[STAGING]`, agregar `LIVE` al v4.2
5. Renombrar viejo a `Diego v4.1.5.3 LEGACY`

---

## 🔴 SECCIÓN F — Plan de Rollback (si algo rompe)

### Síntoma 1: Diego deja de responder al equipo
**Acción inmediata:**
1. n8n → desactivar `Diego v4.2 LIVE` (toggle off)
2. n8n → activar `Diego v4.1.5.3 LEGACY` (toggle on)
3. Probar enviando WA a +56 9 6192 6365
4. Si responde → CRISIS RESUELTA, Diego LIVE viejo restaurado
5. Documentar incidente en `7_backup-prompts/incidentes/2026-04-21_diego_v4.2_rollback.md`

### Síntoma 2: Diego responde pero modo entrevista no funciona
**Acción:**
- No urgente, no rollback inmediato
- Documentar exactamente qué pasa
- Esperar a Pablo el 26-abr para diagnóstico

### Síntoma 3: Tablas Supabase corruptas o errores SQL
**Acción:**
- Las tablas nuevas son aisladas, no afectan tablas v4.1 existentes
- DROP TABLE de las 5 tablas nuevas y rehacer (ver Fase 1)

### Síntoma 4: Workflow Diego-Curador falla
**Acción:**
- No urgente, no afecta operación de Diego
- Desactivar el workflow Curador y diagnosticar

---

## 📋 Checklist final de la sesión 21-abr noche

- [ ] Pre-vuelo completado (4 items)
- [ ] FASE 1: 5 tablas creadas y validadas
- [ ] FASE 2: workflow staging con 2 nodos nuevos + prompt modificado + subworkflow entrevista
- [ ] FASE 4: 6 tests OK con WhatsApp propio
- [ ] FASE 4.7: switch LIVE realizado
- [ ] FASE 3 (opcional): Diego-Curador armado, o documentado para 22-abr noche
- [ ] Confirmación final: Diego LIVE responde + monitoreo 30 min antes de cerrar
- [ ] Mensaje WA a Pablo: "v4.2 LIVE OK / v4.2 hubo incidente, revertí a v4.1.5.3"
- [ ] **Si todo OK** → mañana 22-abr mañana mando M2 al grupo

---

## 📞 Si necesito a Pablo

- WhatsApp Pablo: [el número que tengas]
- Solo llamar si **Diego LIVE está caído >30 min** y rollback no funciona
- Documentar antes en `7_backup-prompts/incidentes/`
