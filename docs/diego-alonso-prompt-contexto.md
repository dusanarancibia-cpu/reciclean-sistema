# Prompt de contexto Diego Alonso (para otra IA)

> Copiar este bloque entero al inicio de la conversacion con Claude.ai,
> ChatGPT, Gemini u otra IA externa, antes de pedir ayuda con Diego Alonso.
> Fecha de corte: 2026-04-22.

---

## 1. Quien soy y para que necesito tu ayuda

Soy Dusan Arancibia, Gerente General de Grupo Reciclean-Farex (reciclaje
de materiales, 4 sucursales en Chile, equipo de 14 personas).

Estoy desarrollando **Diego Alonso**, un asistente IA por WhatsApp para
mi equipo. Quiero conversar contigo sobre el proyecto. Necesito que
respondas en espanol, corto y directo, sin inventar.

Si te pregunto algo que no esta en este prompt, dime "no lo se" o
"no esta en el contexto que me pasaste", NO inventes.

---

## 2. Que es Diego Alonso

Asistente IA conectado a WhatsApp Business (+56 9 6192 6365) que el
equipo usa desde sus celulares en terreno.

| Campo | Valor |
|---|---|
| Version actual LIVE | v4.2 (con 5 patches del 20-abr) |
| Proxima version | v4.3 (28 bugs por corregir) |
| Lanzamiento oficial al equipo | 30-abr-2026 (con mensaje M2) |
| Workflow n8n | `PWxwI2oyCRejxG82` (24 nodos) |
| LLM principal | Claude Haiku (en nodo `claude-api`) |
| BD | Supabase `eknmtsrtfkzroxnovfqn` (Sao Paulo) |
| VPS n8n | `137.184.203.15` |
| Modelo de cobro | Diego REDACTA borradores, NO envia a terceros |

**Arquitectura del flujo:**
```
WhatsApp -> Meta Cloud API -> n8n webhook
  -> supabase-whitelist -> parsear -> es-mensaje-autorizado
  -> supabase-contactos-get -> pre-claude-lookup -> claude-api
  -> preparar-respuesta -> enviar-whatsapp -> log-conversacion-supabase
-> Supabase
```

---

## 3. Equipo autorizado (9 contactos activos en Diego)

| Nombre | WhatsApp | Rol | Sucursal |
|---|---|---|---|
| Dusan Arancibia | 56963069065 | CEO (nivel 3) | Remoto |
| Andrea Rivera | 56961596938 | Comercial (n2) | Remota |
| Pablo Arancibia | 56923962018 | Tech (n2) | Remoto, vacaciones hasta 26-abr |
| Ingrid Cancino | 56961908322 | Operaciones (n2) | Talca |
| Juan Mendoza | 56990552591 | Operaciones (n2) | Cerrillos |
| Nicolas Arancibia | 56923704441 | Operaciones (n2) | Cerrillos |
| Dyana | 56967280603 | Admin/Pagos (n2) | Cerrillos |
| Cesar Mora | 56994541662 | Operaciones (n2) | Remoto |
| Jair Sanmartin | 56986558236 | Permisologia (n2) | Transversal |

Total empresa: 14 personas. Activos en Diego: 9.

---

## 4. Alcance: LO QUE DIEGO YA HACE (LIVE)

### Funciones operativas
- Responder consultas de precios, materiales y sucursales (vista
  `v_precios_activos` en Supabase, 65 SKUs).
- Whitelist dinamica de contactos autorizados (tabla `contactos`).
- Logging completo de conversaciones (tabla `conversaciones`).
- Modo Permisologia para Jair (patch 1 del 20-abr).
- Variantes de prompt por persona V1/V2/Permisologia (patch 3).
- FAQ del equipo embebida en system prompt (patch 5).
- Bloque "MODO APRENDIZAJE Y CALIBRACION" (patch 2).

### Paginas web de soporte (Vercel)
- `/conoce-diego` -> presentacion publica
- `/coordinar-equipo` -> matriz coordinacion (en PR #5, pendiente merge)
- `/preguntas` -> FAQ
- `/ejemplos` -> casos de uso
- `/dar-feedback` -> formulario feedback
- `/videos-diego` -> guion video

### Artefactos del repo (en `dusanarancibia-cpu/reciclean-sistema`)
- `docs/diego-v4.2-spec.md` -> diseno Modo Entrevista v4.2
- `docs/diego-v4.2-implementacion-21abr.md` -> guia para Pablo
- `casos-diego/20260420-{ingrid,jair,nicolas}.md` -> evidencia de bugs
- `mensajes-equipo/difusion-coordinar-equipo.md` -> 8 mensajes WA
- `PENDIENTES.md` -> tareas vivas P1-P6
- `CONTINUAR_SESION_DIEGO.txt` -> resumen ejecutivo
- `vercel.json` -> 6 redirects URLs cortas

### Decisiones LOCK (no modificar sin OK de Dusan)
- C3 = Diego-Curador IA pre-procesa, Dusan valida
- M2 = mensaje al equipo combo (problema + invitacion)
- M1.C = Dusan abre con autoridad, Diego cierra con humildad
- D1 = Diego consulta `procesos_empresa` ANTES de responder
- P1.b = preguntas adaptativas en vivo (no guion fijo)
- P3 = arranque con 8 contactos activos primero
- R2.B = Diego parte de CERO, aprende del equipo
- R1 = mensaje M2 incluye frase "30 dias de aprendizaje"

### Matriz de coordinacion (Diego redacta, NO envia)
- **Verde operativo**: camion, despacho, inventario -> redacta libre
- **Naranja mixto**: finanzas, RRHH, legal -> redacta + copia Dusan
- **Rojo sensible**: sueldos, despidos, conflictos -> SOLO Dusan

---

## 5. Brechas: LO QUE FALTA O ESTA ROTO

### Bloqueado por falta de `N8N_API_KEY`
- **P2 (CRITICO)**: PATCH del prompt para
  - (a) bloque "COORDINACION ENTRE EL EQUIPO"
  - (b) rename "Diego" -> "Diego Alonso" en system prompt
  - (c) anuncio one-shot por persona (texto aprobado por Dusan)
  - Requiere columna `anuncio_nombre_visto` en tabla `contactos`
- **P5**: Iteracion v4.3 con 28 bugs documentados

### Bugs sistemicos detectados (28 en total, los 5 mas graves)

1. **Bug #2/#15/#24** — No parsea opciones (A/B/C/1/2/3) cuando
   responden a un menu que el mismo Diego ofrecio. Confirmado con
   4 usuarios (Dusan, Jair, Ingrid, Nicolas). Sistemico.

2. **Bug #11/#21** — Diego MIENTE: dice "voy a alertar a Dusan",
   "registrado en memoria para briefing", pero NO tiene capacidad
   de enviar a terceros. Detectado en 3 casos en un dia (Andrea,
   Ingrid, Jair). Destruye confianza.

3. **Bug #16** — Loops extremos: caso Ingrid 20-abr, plantilla
   "DIEGO EN 30 SEGUNDOS" enviada 7 veces en 1 hora, 35+ mensajes
   sin resolver pedir un camion.

4. **Bug #26** — Pregunta lo mismo 5 veces y nunca responde
   (caso Nicolas pidiendo precio cobre tercera Cerrillos).

5. **Bug #22** — Inventa URLs gubernamentales falsas
   (`retc.mma.gob.cl` cuando el real es `portalvu.mma.gob.cl`).

### Otras brechas relevantes
- No procesa audios `.opus` (PTT de WhatsApp) -> respuesta generica
- Identidad inconsistente (3 nombres en 1 hilo: "Asistente
  Arancibia" / "Agente Director" / "Diego")
- Memoria contradictoria (a veces dice que persiste, a veces no)
- Confusion de destinatarios al reenviar mensajes
- No reconoce su propio output previo (Andrea pego analisis que
  Diego mismo genero 4 min antes -> Diego pidio los datos de nuevo)
- Inventa supervisiones, areas y reglas de autorizacion falsas
  ("Talca no opera como sucursal activa" -> FALSO)
- Promete integraciones inexistentes (n8n monitorea Sheets/Airtable)
- Interpreta mal contextos: "echar petroleo" = combustible para
  vehiculos, Diego lo interpreto como residuo peligroso

### Pendientes abiertos (no bloqueados)
- **P1**: Mergear PR #5 (URLs cortas) -> Vercel deploy
- **P3**: Difundir `/coordinar-equipo` al equipo (8 mensajes WA
  ya redactados, falta enviarlos)
- **P4**: Monitoreo semanal Diego (revisar `conversaciones` los
  viernes, detectar `[CALIBRAR]` repetidos)
- **P6**: Humanizacion v4.4 (DIFERIDA hasta estabilizar v4.3 —
  primero honestidad, despues calidez)

### Pendientes tecnicos para Pablo (vuelve 26-abr)
- Crear 5 tablas Supabase: `procesos_empresa`,
  `sesiones_entrevista`, `entrevistas_respuestas`,
  `procesos_borrador`, `vacios_conocimiento`
- Modificar workflow Diego v4.2: agregar nodo "Check Sesion Activa"
  + nodo "RAG Procesos" antes de Claude
- Crear nuevo workflow `Diego-Curador` (cron 02:00 AM):
  curaduria de borradores + auditoria diaria + WA resumen a Dusan

### Credenciales pendientes
- `N8N_API_KEY` (Pablo lo trae el 26-abr o se saca del VPS
  `/opt/n8n/.env`)
- `SUPABASE_SERVICE_KEY` (para nueva columna `anuncio_nombre_visto`)
- `GITHUB_PAT` (vence 27-abr)

---

## 6. Cronograma de aqui al lanzamiento

| Fecha | Hito | Responsable |
|---|---|---|
| 22-25 abr | Dusan usa Diego con frases completas (evita bug #2) | Dusan |
| 26-abr | Pablo regresa, entrega N8N_API_KEY, ejecuta SQL tablas | Pablo |
| 27-abr | Aplicar P2 + P5 al workflow (PUT con backup previo) | Pablo + Dusan |
| 28-abr | Workflow Diego-Curador + cron 02:00 activado | Pablo |
| 29-abr | Pruebas con 8 contactos activos. Dusan recibe primer WA Curador | Pablo + Dusan |
| 30-abr | LANZAMIENTO + envio mensaje M2 al grupo | Dusan |

---

## 7. Reglas para conversar conmigo

1. Respondeme **en espanol**, corto y directo.
2. Si te propongo algo, dame opciones **A/B/C/D** + slot **Z**
   (otra cosa) o **N** (nada).
3. Si vas a sugerir tocar Diego LIVE, **avisa primero** y espera
   mi OK explicito (no asumas autorizacion).
4. **No inventes** archivos, fechas, scores, "peer reviews",
   metricas. Si no esta en este prompt, no existe.
5. Antes de proponer un fix, **verifica** si el bug ya esta
   listado arriba. Si esta, referencia el numero (#2, #11, etc.).
6. **No me ofrezcas** crear documentacion nueva si la informacion
   ya esta en el repo (`docs/`, `PENDIENTES.md`,
   `CONTINUAR_SESION_DIEGO.txt`, `casos-diego/`).
7. Si necesitas mas contexto, **pidemelo** antes de responder.
8. Para tocar Diego LIVE el protocolo es: backup workflow ->
   diff exacto -> mi OK -> PUT -> smoke test -> rollback si falla.

---

## 8. Que NO esta resuelto (preguntas abiertas)

- Como detectar automaticamente que un contacto necesita el
  anuncio one-shot del rename
- Como medir objetivamente la "frustracion" del equipo en
  conversaciones (consulta `g` de auditoria diaria)
- Que umbral de similarity usar en RAG `procesos_empresa` para
  decidir si el conocimiento existe vs se debe activar Modo
  Entrevista
- Como gestionar la fase R2.B (parte de cero) sin que el equipo
  se frustre los primeros 7 dias
- Cuando retomar P6 (humanizacion v4.4) — depende de estabilidad
  de v4.3

---

## 9. Que NO debes hacer

- No me trates como desarrollador (soy CEO, no dev)
- No metas tecnicismos sin pedir permiso
- No me ofrezcas hacer "auditorias generales" o "planes
  estrategicos" — quiero acciones concretas
- No inventes versiones (no existe v5.0, no hay "7 partes
  LOCKED de 420 rasgos", no hay "peer review IA externa con
  score 72->83%")
- No crees archivos nuevos en el repo sin que yo lo pida
- No toques produccion (Vercel, Supabase, n8n) sin OK explicito
