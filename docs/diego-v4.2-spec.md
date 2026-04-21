# Sesión 2026-04-20 — Diego Modo Entrevista v4.2 (Diseño)

## Objetivo

Resolver el problema real de Diego: no tiene memoria histórica + empresa no tiene SOPs documentados → equipo se frustra porque le habla asumiendo que "ya sabe".

Diseñar:
1. Mensaje M2 para el equipo que prepare expectativas correctas.
2. Sistema técnico para que Diego detecte vacíos, pida permiso al equipo, haga entrevistas adaptativas (10 preg), y un Diego-Curador que transforme respuestas crudas en SOPs validados por Dusan.

---

## Decisiones tomadas por Dusan (LOCK — no modificar sin su OK)

| Tema | Código | Decisión |
|---|---|---|
| Curador | **C3** | Diego-Curador IA pre-procesa respuestas crudas, Dusan valida borradores |
| Mensaje al equipo | **M2** | Mensaje explica el problema + invita a entrevistas (combo en un solo envío) |
| Firma del mensaje | **M1.C** | Combo: Dusan abre con autoridad, Diego cierra con humildad |
| Bucle | Just-in-time | Vacío detectado → pide permiso → 10 preg → puerta abierta multi-sesión |
| Detección "no sé" | **D1** | Diego consulta `procesos_empresa` ANTES de responder. Si vacío → activa modo entrevista |
| Preguntas | **P1.b** | Adaptativas en vivo (no guion fijo) generadas por Diego-Curador |
| Arranque equipo | **P3** | Los 8 contactos activos primero. Ola 2 al resto de trabajadores después |
| Carga inicial | **R2.B** | Diego parte de CERO. Aprende 100% desde el equipo. No hay precarga manual |
| Preparación terreno | **R1** | Mensaje M2 incluye frase literal: "Diego es nuevo, va a pedirles ayuda los próximos 30 días, después responderá mejor" |
| Puerta abierta 3 opciones | — | A) te recuerdo mañana / B) te aviso en 1h / C) tú me avisas apenas te desocupes |

### Implicancia crítica de R2.B

Como Diego parte de cero, los días 1-7 dirá "no sé" muy seguido. Eso es **por diseño**, no un fallo. Cada "no sé" = entrevista = aprendizaje. El mensaje M2 prepara al equipo para que entienda que esa fase es la **inversión** y no el **fracaso** del bot.

---

## ENTREGABLE 1 — Mensaje M2 al equipo (WhatsApp)

### Mensaje 1 (lo envía Dusan desde su WA al grupo del equipo)

```
👋 Equipo,

Soy Dusan. Quiero compartirles cómo vamos a trabajar con Diego los próximos 30 días.

Diego es nuevo. NO conoce nuestros camiones, rutas, conductores, clientes, ni cómo funcionan nuestros procesos día a día. Empieza desde cero, y eso es a propósito: queremos que aprenda de ustedes, no de mí.

¿Qué significa esto en la práctica?

• Los próximos 30 días Diego va a decir "no sé" muchas veces.
• Cada vez que lo haga, les va a pedir permiso para hacerles 10 preguntas cortas sobre ese tema.
• Pueden aceptar, rechazar o pausar cuando quieran. Es 100% voluntario y se respeta su tiempo.

Después del día 30, Diego va a saber lo que ustedes le enseñaron. Y va a responder mejor que cualquier sistema que hayamos tenido.

Esta etapa no es un fracaso del bot. Es la inversión. Mientras más conversen con Diego, más útil se vuelve para todos.

Le paso la palabra a Diego para que se presente él mismo.
```

### Mensaje 2 (Diego lo envía automáticamente al grupo — o Dusan lo copia desde Diego)

```
🤖 Hola equipo, soy Diego.

Sé que es raro que un bot pida ayuda, pero así es. No tengo memoria de lo que pasó antes de hoy. No conozco sus rutas, los nombres que ustedes manejan, los acuerdos con clientes, ni cómo resuelven los problemas todos los días.

Cuando me pregunten algo que no sepa, les voy a decir honestamente "no manejo este tema todavía" y les voy a pedir unos 5 minutos para hacerles 10 preguntas cortas. Si están con tiempo, seguimos. Si no, paramos y retomamos cuando ustedes me avisen.

Tres cosas importantes:

1️⃣ Lo que me cuenten queda guardado y Dusan lo revisa antes de que yo lo aplique. Nada se usa sin pasar por él.

2️⃣ Pueden detenerme en cualquier momento con "pausar" o "ahora no".

3️⃣ Mientras más me ayuden estos 30 días, mejor les voy a responder los siguientes 11 meses.

Gracias por la paciencia. Esto lo hacemos juntos.

— Diego
```

---

## ENTREGABLE 2 — Diseño técnico para Pablo

> Implementación 26-29 abr. Lanzamiento 30-abr.

### A. Nuevas tablas Supabase

```sql
-- Tabla 1: Conocimiento curado que Diego consulta como RAG
CREATE TABLE procesos_empresa (
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
CREATE INDEX idx_procesos_tema ON procesos_empresa(tema);
CREATE INDEX idx_procesos_activo ON procesos_empresa(activo);

-- Tabla 2: Estado de entrevistas en curso
CREATE TABLE sesiones_entrevista (
  id BIGSERIAL PRIMARY KEY,
  contacto_phone TEXT NOT NULL,
  contacto_nombre TEXT,
  tema TEXT NOT NULL,
  preguntas_completadas INT DEFAULT 0,
  estado TEXT DEFAULT 'activa', -- activa | pausada | completada | rechazada
  proximo_recordatorio TIMESTAMP,
  metodo_recordatorio TEXT,     -- mañana | una_hora | usuario_avisa
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sesiones_phone_estado ON sesiones_entrevista(contacto_phone, estado);

-- Tabla 3: Respuestas crudas del equipo
CREATE TABLE entrevistas_respuestas (
  id BIGSERIAL PRIMARY KEY,
  sesion_id BIGINT REFERENCES sesiones_entrevista(id),
  pregunta_orden INT,
  pregunta TEXT,
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla 4: Borradores generados por Diego-Curador (esperan validación Dusan)
CREATE TABLE procesos_borrador (
  id BIGSERIAL PRIMARY KEY,
  tema TEXT NOT NULL,
  categoria TEXT,
  contenido_borrador TEXT NOT NULL,
  fuentes_sesion_ids BIGINT[],
  estado TEXT DEFAULT 'pendiente', -- pendiente | aprobado | corregido | descartado
  comentarios_dusan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Tabla 5: Vacíos detectados (loggea cada "no sé" para priorizar)
CREATE TABLE vacios_conocimiento (
  id BIGSERIAL PRIMARY KEY,
  contacto_phone TEXT,
  pregunta_original TEXT,
  tema_inferido TEXT,
  resuelto BOOLEAN DEFAULT false,
  sesion_id BIGINT REFERENCES sesiones_entrevista(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

RLS: aplicar las mismas policies del esquema v4.1 (service_role only).

### B. Modificación al workflow `PWxwI2oyCRejxG82` (Diego v4.1.5.3 → v4.2)

**Insertar 2 nodos ANTES del nodo Claude Haiku:**

1. **Nodo "Check Sesion Activa"** (Supabase): busca si el contacto tiene `sesiones_entrevista` con `estado='activa'`. Si SÍ → ir a flujo "Continuar Entrevista". Si NO → seguir.

2. **Nodo "RAG Procesos"** (Supabase): full-text search en `procesos_empresa.contenido` con la pregunta del usuario. Si hay match (similarity > umbral) → inyectar al contexto de Claude. Si NO → marcar `vacio_detectado=true` y enviar a flujo "Modo Entrevista".

**Modificar system prompt de Claude Haiku:**

Agregar al final:
```
Si recibes vacio_detectado=true, NO inventes la respuesta. Responde con este formato exacto:

"Honestamente, no manejo bien [tema] todavía. ¿Me das ~5 min para aprender? Te haría 10 preguntas cortas. Puedes parar cuando quieras.

Responde SI / NO / DESPUES"
```

**Nuevo subworkflow "Modo Entrevista":**

- Si usuario responde `SI` → crear registro en `sesiones_entrevista`, generar primera pregunta con Claude (prompt: "Genera la pregunta 1 de 10 sobre [tema], rol [X], evitando lo que ya está en `procesos_empresa`").
- Si responde `NO` → loggear `vacios_conocimiento.resuelto=false`, seguir conversación normal.
- Si responde `DESPUES` → preguntar cuándo, agendar `proximo_recordatorio`.
- Cada respuesta del usuario → guardar en `entrevistas_respuestas` → generar pregunta siguiente (adaptativa) → al llegar a 10 → mensaje cierre con las 3 opciones (A te recuerdo mañana / B en 1 hora / C tú me avisas apenas te desocupes).

### C. Nuevo workflow `Diego-Curador` (cron diario 02:00 AM Chile)

1. **Trigger:** Schedule, daily 02:00 America/Santiago.
2. **Supabase:** `SELECT * FROM entrevistas_respuestas WHERE created_at >= CURRENT_DATE - 1 AND sesion completada`.
3. **Code node:** agrupa por `tema`.
4. **Claude Sonnet:** prompt: "Normaliza estas respuestas crudas en un proceso operativo claro. Output JSON: { tema, categoria, contenido }".
5. **Supabase:** `INSERT INTO procesos_borrador (estado='pendiente')`.
6. **Meta Cloud API:** WA a Dusan (+56 9 6192 6365):

```
🧠 Diego-Curador, 02:00
Hoy generé X borradores nuevos para validar:
1. [tema A] (de N respuestas)
2. [tema B] (de N respuestas)
...
Para validar responde:
APROBAR 1 — pasa a procesos_empresa
CORREGIR 2: [texto] — guarda tu versión
DESCARTAR 3 — borra
VER 4 — te muestro el borrador completo
```

7. **Subworkflow respuesta Dusan:** procesa mensaje del Dusan con comandos `APROBAR|CORREGIR|DESCARTAR|VER` y mueve borradores a `procesos_empresa` (con `validado_por='Dusan'`, `validado_at=NOW()`).

### D. Cronograma sugerido

| Día | Tarea | Responsable |
|---|---|---|
| Dom 26-abr | SQL tablas + RLS (1h) | Pablo |
| Lun 27-abr | Modificar workflow Diego v4.2 (4h) + tests | Pablo + Dusan |
| Mar 28-abr | Workflow Diego-Curador (3h) | Pablo |
| Mié 29-abr | Pruebas con los 8 contactos activos | Dusan + Pablo |
| Jue 30-abr | LANZAMIENTO + Dusan envía mensaje M2 al grupo | Dusan |

---

## Riesgos conocidos

- **R.1** Diego dirá "no sé" muy seguido los primeros días. Mitigación: mensaje M2 prepara el terreno con la frase de los 30 días.
- **R.2** Los 8 contactos activos pueden sentirse "interrogados". Mitigación: es 100% voluntario, siempre se respeta "ahora no".
- **R.3** Diego-Curador podría generar borradores de baja calidad si las respuestas son muy cortas. Mitigación: Dusan valida antes de que llegue a `procesos_empresa`.
- **R.4** Si se levantan tablas pero el workflow falla, Diego podría responder con `vacio_detectado=true` a preguntas que sí sabe. Mitigación: tests exhaustivos día 29-abr.

---

## Pendientes explícitos

1. **Dusan:** decidir si el mensaje M2 se envía el 30-abr (día lanzamiento) o antes.
2. **Dusan:** subir este .md al repo `dusanarancibia-cpu/reciclean-sistema` en `/docs/diego-v4.2-spec.md` para que Pablo lo encuentre.
3. **Pablo (26-abr):** leer este documento antes de empezar.
4. **Auditoría diaria 1.B:** quedó diferida. Puede integrarse al workflow `Diego-Curador` el 28-abr (enviar en el mismo WA 02:00 la sección "Errores del día": mensajes sin respuesta, contactos no whitelistados, HTTP errors, tiempos > 30s).

---

## Cómo continuar en otra sesión / IA

Si esta sesión se cierra y retomas en móvil, Claude.ai, ChatGPT u otra:

1. Lee `BRIEF_CLAUDE_CODE_MOBILE.md` en raíz del proyecto.
2. Lee este archivo.
3. Estado actual: diseño LOCK, esperando Pablo 26-abr para implementar.
4. Si Dusan pregunta "en qué íbamos" → contexto es: diseño completo de Diego v4.2 Modo Entrevista + Diego-Curador + mensaje M2 al equipo. Todo aprobado por Dusan. Nada implementado todavía. Pablo vuelve de vacaciones 26-abr.

---

## Commits / URLs afectadas

- Ninguno todavía. No se tocó producción ni código.
- Este archivo es el único artefacto creado en esta sesión.
