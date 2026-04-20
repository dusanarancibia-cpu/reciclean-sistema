# Pendientes — Sistema Reciclean-Farex

> Ultima actualizacion: 2026-04-20 tarde (sesion movil Dusan)
> Branch en curso: `claude/continue-diego-mobile-U0cgA`

## Como usar este archivo

Cuando Dusan pregunte "status" o "que hay pendiente", Claude lee este
archivo y responde con lo que esta abierto. Cada tarea tiene:
- Estado (abierta / bloqueada / en revision)
- Que falta (proxima accion concreta)
- Bloqueador (si aplica)

Cerrar una tarea = mover a la seccion "Cerradas" al final con fecha.

---

## Abiertas

### P1. Mergear PR de URLs cortas a `main`
- **Estado:** en revision (push hecho, falta merge)
- **Branch:** `claude/continue-diego-mobile-U0cgA`
- **Commit:** `946b0d6` — `feat(urls): agregar redirects de URLs cortas`
- **Archivo:** `vercel.json` (6 redirects a paginas Diego)
- **Proxima accion:** Dusan aprueba merge a `main` desde GitHub (o pide a
  Claude que abra PR). Tras merge, Vercel despliega automatico y los
  enlaces `reciclean-sistema.vercel.app/conoce-diego` etc. quedan vivos.

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

*(ninguna aun)*
