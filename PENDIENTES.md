# Pendientes — Sistema Reciclean-Farex

> Ultima actualizacion: 2026-04-21 (sesion Dusan + Claude Code)
> Branch en curso: `claude/admiring-heisenberg-cBE8I`

## Como usar este archivo

Cuando Dusan pregunte "status" o "que hay pendiente", Claude lee este
archivo y responde con lo que esta abierto. Cada tarea tiene:
- Estado (abierta / bloqueada / en revision)
- Que falta (proxima accion concreta)
- Bloqueador (si aplica)

Cerrar una tarea = mover a la seccion "Cerradas" al final con fecha.

---

## Resumen de avance — 20 y 21 de abril 2026

### Que hizo Dusan (20-abr tarde/noche + 21-abr)

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Creo la pagina `/diego-coordinar.html` — guia para pedirle a Diego que redacte mensajes al equipo | HECHO |
| 2 | Tomo decisiones de diseno Diego v4.2 (10 decisiones LOCK en spec) | HECHO |
| 3 | Aprobo texto final del anuncio "Diego Alonso" (nombre + homenaje) | HECHO |
| 4 | Aprobo el merge del PR #5 (URLs cortas a main) | HECHO |
| 5 | Documento 3 casos reales de bugs de Diego: Ingrid, Jair, Nicolas (20-abr) | HECHO |
| 6 | Definio auditorias diarias D1-D4 para Diego-Curador | HECHO |
| 7 | Reviso y ajusto guia de implementacion v4.2 (horario 08:00-10:00 + aviso grupo) | HECHO |
| 8 | Sesion de revision de avance y actualizacion de plan (21-abr) | HECHO |

### Que hizo Pablo

Pablo esta de **vacaciones hasta el 26-abr**. No participo directamente
en las sesiones del 20-21 de abril. Su proxima tarea asignada:
- Implementar Diego v4.2 Modo Entrevista (spec listo en `docs/diego-v4.2-spec.md`)
- Corregir bugs tecnicos de workflow (#4 variable sin renderizar, #9 URLs largas)

### Que hizo Claude Code (asistente IA)

| # | Tarea | Commits |
|---|-------|---------|
| 1 | Creo PENDIENTES.md con 6 tareas priorizadas | `efc5dcb` |
| 2 | Documento 28 bugs de Diego desde transcripciones WhatsApp | `62f67ad`, `b03ad40`, `55e6d72`, `959e5e5` |
| 3 | Escribio 3 casos de estudio reales (Jair, Ingrid, Nicolas) | en `casos-diego/` |
| 4 | Cambio nombre "Diego" a "Diego Alonso" en las 6 paginas web | `cdfc2a4` |
| 5 | Agrego redirects de URLs cortas en vercel.json (6 rutas) | `946b0d6` |
| 6 | Redacto borradores de mensajes WhatsApp para difusion al equipo | `29bfa10`, `59843da` |
| 7 | Creo spec completo Diego v4.2 Modo Entrevista (15 KB) | en `docs/diego-v4.2-spec.md` |
| 8 | Creo guia paso-a-paso de implementacion para Dusan | en `docs/diego-v4.2-implementacion-21abr.md` |

### Nivel de avance global

| Area | Avance | Detalle |
|------|--------|---------|
| Documentacion de bugs | **100%** | 28 bugs identificados, 3 casos de estudio escritos |
| Diseno Diego v4.2 | **100%** | Spec + guia implementacion + SQL + tests definidos |
| Paginas web Diego | **100%** | 6 paginas creadas, nombre actualizado, URLs cortas configuradas |
| Difusion al equipo (P3) | **70%** | Borradores listos, falta que Dusan decida cuando enviar |
| Implementacion v4.2 en n8n | **0%** | Bloqueado: falta N8N_API_KEY + Pablo vuelve 26-abr |
| Correccion de bugs (P5) | **0%** | Bloqueado: misma dependencia que v4.2 |
| Humanizacion v4.4 (P6) | **0%** | Diferida hasta que P5 estabilice bugs |

---

## Abiertas

### P1. Mergear PR de URLs cortas a `main`
- **Estado:** CERRADA (mergeado 20-abr noche)
- **Branch:** `claude/continue-diego-mobile-U0cgA`
- **Commit merge:** `76d5cb9` — PR #5 mergeado por Dusan
- **Archivo:** `vercel.json` (6 redirects a paginas Diego)
- **Resultado:** URLs cortas activas en produccion:
  `/conoce-diego`, `/coordinar-equipo`, `/preguntas`, `/ejemplos`,
  `/dar-feedback`, `/videos-diego`

### P2. PATCH prompt Diego Alonso — flujo coordinacion equipo [CRITICO]
- **Estado:** bloqueada
- **Prioridad:** CRITICA - esta destruyendo la confianza del equipo con
  Diego Alonso. Evidencia acumulada:
  - Caso Andrea 20-abr: pidio "avisale a Dusan", Diego dijo "listo, ya
    le aviso" pero NO puede enviar a terceros. Mentira sistemica.
  - Caso Ingrid 20-abr: 2 horas y 35+ mensajes para pedir un camion,
    terminaron sin resultado (ver `casos-diego/20260420-ingrid.md`).
- **Bloqueador:** falta `N8N_API_KEY` (Dusan no la trae en movil)
- **Alcance ampliado (20-abr tarde):**
  - a) Bloque "COORDINACION ENTRE EL EQUIPO" (matriz verde/naranja/rojo
     + plantilla universal de borrador + "Diego redacta, NO envia" +
     link wa.me).
  - b) Cambio de nombre: "Diego" -> "Diego Alonso" en system prompt,
     saludos, firmas, bienvenidas.
  - c) Anuncio one-shot por persona (primera vez que escriba tras el
     patch): prepender al inicio de la respuesta, texto final aprobado
     por Dusan:
     > "Ahora me llamo Diego Alonso, para alivianar los recuerdos
     >  vividos en Talca.
     >  Tambien, Diego Alonso habria sido mi nombre si Almendra hubiese
     >  sido hombre. 🫶"
     - Requiere tracking en BD: agregar columna `anuncio_nombre_visto`
       en tabla `contactos` (Supabase). Default false. Se marca true
       tras enviar el anuncio.
- **Workflow:** n8n `PWxwI2oyCRejxG82`, nodo `claude-api`
- **Que se agrega:** bloque "COORDINACION ENTRE EL EQUIPO" con matriz
  verde/naranja/rojo + plantilla universal de borrador + instruccion
  "Diego redacta, NO envia" + link wa.me + escalamiento a Dusan.
- **Proxima accion:** Dusan entrega `N8N_API_KEY` -> protocolo backup ->
  diff -> OK -> PUT -> smoke test.

### P3. Difundir pagina `/coordinar-equipo` al equipo
- **Estado:** abierta
- **Pagina LIVE (pendiente URL corta):** `/diego-coordinar.html`
- **Proxima accion:** redactar 3 variantes WhatsApp con el link:
  - V1: Andrea / Pablo / Nicolas
  - V2: Dyana / Ingrid / Juan / Cesar
  - Jair (permisologia)
- Dusan decide cuando enviar.

### P4. Monitoreo semanal Diego (opcional)
- **Estado:** abierta
- **Frecuencia:** viernes
- **Proxima accion:** revisar tabla `conversaciones` en Supabase, analizar
  patrones, proponer ajustes al prompt si hay [CALIBRAR] repetidos.

### P5. Iteracion prompt Diego v4.3 (bugs detectados 20-abr tarde)
- **Estado:** bloqueada (misma razon que P2: falta `N8N_API_KEY`)
- **Origen:** analisis de transcripcion WhatsApp 14-20 abr.
- **Bugs detectados (10):**
  1. **Loops de bienvenida** - Diego vuelve a saludar aunque la conversacion
     este en curso.
  2. **No liga opciones al briefing previo** - Dusan responde "A" o "2" a un
     menu que Diego mismo ofrecio y Diego dice "no reconoci la opcion".
  3. **Mensajes duplicados** - mismo texto 2 veces seguidas (ej. 20:48 16-abr).
  4. **Variable sin renderizar** - "Hola {nombre}!" (18-abr 00:53), bug de
     template.
  5. **Memoria contradictoria** - a veces dice que tiene memoria persistente,
     otras que se pierde al cerrar.
  6. **Alucina supervisiones** - inventa areas de Juan/Ingrid sin consultar BD.
  7. **Confusion de destinatarios** - Dusan reenvia un msg a Nicolas y Diego
     responde como si fuera para el.
  8. **No procesa audios .opus** - muchos PTT recibidos -> respuesta generica.
  9. **Sigue usando URLs largas** - links a `/diego-presentacion.html` en vez
     de `/conoce-diego` (dependiente de P1 mergeado).
  10. **ReSimple sin conocimiento** - no sabe que es, sin fallback util.
  11. **Diego miente que "alerta a Dusan"** - caso Andrea 20-abr:
      "voy a alertar a Dusan ahora mismo", "marco para briefing".
      Diego NO envia a terceros.
  12. **No reconoce su propio output previo** - Andrea pide "envia ESTA
      info" pegando el analisis que Diego mismo genero 4 min antes, y
      Diego pide los datos de nuevo como si no los hubiera visto.
  13. **Doble respuesta al mismo input** - Andrea envia ficha PDF -> Diego
      responde 2 mensajes distintos (analisis rentabilidad + resumen ficha).
  14. **Pierde hilo con "urgente"** - Andrea dice "urgente" -> Diego
      responde "que necesitas?" (recien lo dijo).
  15. **"No encontre briefing activo"** - usuario responde "1" al menu que
      Diego ofrecio 10 segundos antes. Variante refinada del bug #2.
  16. **Loops de bienvenida extremos** - caso Ingrid 20-abr: plantilla
      "DIEGO EN 30 SEGUNDOS" enviada 7 veces en 1 hora.
  17. **Inventa reglas de autorizacion falsas** - "Talca no opera como
      sucursal activa", "necesito autorizacion Dusan para comunicar entre
      sucursales". FALSO: todas las sucursales operan (excepto Pto Montt).
  18. **Se contradice en capacidades** - mismo mensaje: "claro le paso el
      mensaje a Andrea" -> 9 min despues "no puedo enviar mensajes".
  19. **Imagen recibida sin progreso** - caso Ingrid: misma foto 8 veces,
      misma respuesta 8 veces, no avanza.
  20. **Pierde contexto al confirmar** - tras 35 msgs Diego ofrece "aviso
      a Dusan?", Ingrid dice "Siiii" -> Diego responde saludo nuevo.
  21. **"Registrado en memoria para Dusan" = mentira** (caso Jair
      20-abr): Jair pide "notifica a Dusan que hay que anular FC 9026",
      Diego responde largo analisis + "Registrado en memoria para
      briefing a Dusan" -> NO envia nada. Patron identico a Andrea e
      Ingrid con tercer usuario. Ver `casos-diego/20260420-jair.md`.
  22. **Inventa URLs gubernamentales** (caso Jair 14:30): Diego da
      `retc.mma.gob.cl` (inventado) tras que Jair a las 14:22 le
      enseno el correcto `portalvu.mma.gob.cl`. Ignora lo que acaba
      de aprender.
  23. **Promete integraciones inexistentes** - ofrece a Jair "integracion
      n8n en desarrollo para monitorizar Google Sheets/Airtable". No
      existe tal proyecto.
  24. **No parsea opciones (caso Jair)** - 14:12 Jair responde `2` al
      menu A-F de Diego -> "no encontre briefing activo". Luego `B`,
      mismo error. Variante del bug #2 confirmada con tercer usuario.
  25. **Contradiccion de capacidades en el mismo hilo** (caso Nicolas
      20-abr 15:07): "no tengo acceso directo a esa info" -> 30 segundos
      despues "si tengo acceso a las listas de precios, estan en tabla
      `precios`" -> pide el precio -> nunca lo da.
  26. **Pregunta lo mismo 5 veces antes de no responder** (caso Nicolas
      cobre tercera Cerrillos): "cuantos kg? - que material? - cliente?
      - oferta o compra?" -> Nicolas responde todo -> no da precio.
  27. **Interpreta "echar petroleo" = residuos peligrosos** (caso
      Nicolas 15:29): Nicolas pregunto sobre combustible para vehiculos,
      Diego respondio con normativa RES, residuos peligrosos, SGA.
  28. **Inconsistencia de identidad** - mismo hilo: nombre contacto
      registrado "Asistente Arancibia", se presenta como "Agente
      Director", usuario le dice "Diego". Tres nombres en una
      conversacion. Refuerza urgencia del cambio a "Diego Alonso"
      unificado (P2 alcance b).
- **Bug #2 / #15 / #24 ya confirmado con CUATRO usuarios distintos:**
  Dusan, Jair, Ingrid, Nicolas. Sistemico.
- **Proxima accion:**
  - A) Refactor "modo continuidad" en system prompt (fix 1, 2, 3): si ya hubo
     saludo en ultimos 20 msgs, no volver a saludar. Si el ultimo msg de Diego
     fue un menu A/B/C, parsear respuestas cortas.
  - B) Regla dura anti-alucinacion (fix 6): "NO inventar roles/supervisiones.
     Si no esta en BD -> 'dejame consultar' + crear tarea".
  - C) Bug tecnico de workflow (fix 4, 9) - para cuando vuelva Pablo 26-abr.
  - D) Documentar en prompt que Diego transcribe/describe audios .opus (fix 8).
- Aplicar despues de P2 (misma API key n8n).

### P6. Humanizacion Diego Alonso v4.4 (calidez + comentarios ligeros)
- **Estado:** diferida - esperar que P5 v4.3 estabilice bugs basicos
- **Razon del diferimiento:** si Diego miente sobre "avisar a Dusan" y
  encima tira chistes, el equipo se frustra mas. Primero honestidad,
  despues calidez.
- **Que incluye (cuando se retome):**
  - Comentarios ligeros de contexto (clima, dia cansado, cierre calido)
  - Max 1 comentario ligero por dia por persona
  - Chistes MUY esporadicos (1 cada varios dias, nunca forzado)
- **Reglas propuestas:**
  - SI: saludo tras 3h+ sin chat, conversacion casual, cierre tras
    resolver bien algo.
  - NO: primer saludo del dia, cuando hay [CALIBRAR] o frustracion,
    operacion urgente (camion/despacho/factura), tras respuesta fallida.
- **Ejemplos aceptables:**
  - "Que frio esta Talca hoy, no?"
  - "Dale, me avisas como te va con Cinthia. Exito 🍀"
- **Ejemplos a evitar:**
  - Chistes de reciclaje
  - Dobles sentidos
  - Referencias culturales dudosas

---

## Cerradas

### P1. Mergear PR de URLs cortas a `main` — CERRADA 20-abr
- PR #5 mergeado (`76d5cb9`). 6 URLs cortas activas en produccion.
