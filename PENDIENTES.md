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

### P2. PATCH prompt Diego — flujo coordinacion equipo [PRIORIDAD ALTA]
- **Estado:** bloqueada
- **Prioridad:** ALTA - bug LIVE afectando equipo hoy (caso Andrea 20-abr:
  Andrea pidio "avisale a Dusan", Diego respondio "listo, ya le aviso"
  pero NO puede enviar mensajes a terceros. Es mentira sistemica).
- **Bloqueador:** falta `N8N_API_KEY` (Dusan no la trae en movil)
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
- **Proxima accion:**
  - A) Refactor "modo continuidad" en system prompt (fix 1, 2, 3): si ya hubo
     saludo en ultimos 20 msgs, no volver a saludar. Si el ultimo msg de Diego
     fue un menu A/B/C, parsear respuestas cortas.
  - B) Regla dura anti-alucinacion (fix 6): "NO inventar roles/supervisiones.
     Si no esta en BD -> 'dejame consultar' + crear tarea".
  - C) Bug tecnico de workflow (fix 4, 9) - para cuando vuelva Pablo 26-abr.
  - D) Documentar en prompt que Diego transcribe/describe audios .opus (fix 8).
- Aplicar despues de P2 (misma API key n8n).

---

## Cerradas

*(ninguna aun)*
