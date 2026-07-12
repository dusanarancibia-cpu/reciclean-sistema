# Validacion Ruta 1 Diego

Fecha: `2026-07-12`

## Alcance

Cierre operativo de la Ruta 1:

1. ciclo de interaccion extraido a modulo externo
2. experiencia revisada en desktop y movil
3. `panel-rdo.html` dejado como shell con fallback observable
4. arquitectura modular documentada

## Validacion tecnica ejecutada

- `node --check public/diego/diego-cases.js`
- `node --check public/diego/diego-context.js`
- `node --check public/diego/diego-interaction.js`
- `node --check public/diego/diego-product.js`
- `node --check public/diego/diego-render.js`
- `node --check public/diego/diego-state.js`
- `node --check public/diego/diego-ui.js`
- `node --check public/diego/diego-voice.js`
- validacion sintactica del bloque inline de Diego extraido temporalmente desde `panel-rdo.html`

## Evidencia visual y estructural

Se validó `http://127.0.0.1:4173/panel-rdo.html` con apertura forzada del FAB Diego en dos viewports.

### Desktop

- viewport: `1440x900`
- chat abierto: `si`
- ancho real del chat: `880px`
- alto real del chat: `666px`
- margen inferior: `24px`
- grid del shell: `589.906px 288.094px`
- contexto lateral visible: `si`
- header conversacional visible: `si`
- chips onboarding visibles: `si`
- formulario visible: `si`

### Movil

- viewport: `376x424`
- chat abierto: `si`
- ancho real del chat: `376px`
- alto real del chat: `356px`
- margen inferior: `0px`
- grid del shell: `374px`
- contexto en stack vertical: `si`
- `max-height` del contexto: `118.72px`
- header conversacional visible: `si`
- chips onboarding visibles: `si`
- formulario visible: `si`

## Estado del fallback

El fallback legado sigue existiendo en `panel-rdo.html`, pero ahora:

- solo entra si falla `window.DIEGO_RENDER` o `window.DIEGO_INTERACTION`
- deja advertencia controlada por consola en `render` o `submit`
- queda explicitamente marcado como transitorio

Esto permite detectar rapido si el shell deja de usar los modulos de `public/diego/`.

## Caso Diego persistente

Se agregó persistencia local en `public/diego/diego-case-store.js`.

También quedó preparado el puente backend:

- modulo `public/diego/diego-case-sync.js`
- migracion `supabase/migrations/diego_casos_shared.sql`
- estrategia `best effort`: si la tabla existe, sincroniza; si no existe, sigue en modo local sin romper el panel

Capacidades verificadas:

- un caso visible sigue existiendo aunque cambie el turno visual
- el dueño puede editarse
- la prioridad puede rotarse
- el estado puede rotarse
- el siguiente paso puede editarse
- el board ahora muestra estado visible de sincronizacion: `Modo compartido`, `Validando sync` o `Modo local`

La persistencia actual queda en `localStorage`, como puente operativo antes de llevar `Caso Diego` a entidad backend.

## Bloqueo de entorno (resuelto 2026-07-12 PM)

La aplicacion remota de la migracion no pudo ejecutarse en la sesion anterior porque la integracion MCP de Supabase usada en ese momento devolvio:

- `supabase_get_project`: command not found
- `supabase_get_tables`: command not found
- `supabase_apply_migration`: command not found

Confirmado: fue un problema de esa integracion puntual, no del SQL. En esta sesion se aplico la migracion con el MCP `plugin_supabase_supabase` (mismo proyecto `eknmtsrtfkzroxnovfqn`) sin cambios al SQL de fondo, mas 1 fix de seguridad (`search_path` mutable en el trigger, hallazgo del linter de Supabase) y 1 fix critico en el frontend (ver abajo).

### Bug real encontrado y corregido: `id` local no era UUID valido

`diego-case-store.js` genera ids locales con formato `dc_<hash>` (no UUID). `diego-case-sync.js` mandaba ese `id` tal cual en cada `upsert` hacia `panel.diego_casos.id` (columna `uuid`). Resultado: **todo intento de escritura al backend fallaba silenciosamente** con `invalid input syntax for type uuid`, atrapado por el `catch` generico y degradando a modo local para siempre — el puente nunca podia cerrar en la practica, aunque el codigo "parecia" correcto.

Fix aplicado (minimo, sin refactor): `caseToRow()` ahora omite `id` cuando no tiene formato UUID (casos locales nunca hidratados) y lo incluye cuando si lo tiene (casos ya hidratados desde el backend, que traen su UUID real). El upsert sigue dedupeando por `source_key` en ambos casos, que es la identidad estable real.

## Cierre de Ruta 1

Ruta 1 queda funcionalmente avanzada y usable con estos entregables:

- producto Diego modularizado por capas
- render principal extraido
- ciclo de submit y respuesta extraido
- `Caso Diego` ya no vive solo como inferencia efimera
- validacion desktop/movil ejecutada
- arquitectura y reglas de crecimiento documentadas
- `panel.diego_casos` vivo en Supabase, con RLS + grants verificados y write path real probado (SQL directo + unit test del payload en navegador)

## Deuda consciente que queda viva

- remover mas fallback legado cuando ya no se necesite rollback corto
- **validar en una sesion autenticada de escritorio el flujo completo contra backend real** — sigue pendiente; esta sesion probo la escritura a nivel SQL directo (mecanica: insert/upsert/trigger/constraint, todos OK) y el shape exacto del payload que arma el frontend (unit test en navegador con `sb` mockeado), pero no un login real de un usuario con sesion `authenticated` de punta a punta. Sin credenciales de prueba a mano en esta sesion.
