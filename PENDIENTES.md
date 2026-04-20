# Pendientes — Sistema Reciclean-Farex

> Ultima actualizacion: 2026-04-20 (sesion movil Dusan)
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

### P2. PATCH prompt Diego — flujo coordinacion equipo
- **Estado:** bloqueada
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

---

## Cerradas

*(ninguna aun)*
