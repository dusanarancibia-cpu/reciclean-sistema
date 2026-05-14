# TEST DE AISLAMIENTO — clon Dusan vs prod

**Fecha:** 14-may-2026 tarde
**Propósito:** Demostrar que un commit en `replit/plan-dusan` NO afecta a `main` ni a `prod`.

## Estado antes de este commit

- `main` HEAD: `ab1af44` (fix Tailwind, PR #22)
- `prod` HEAD: `fe40cdc` (fix Tailwind, PR #23 — mismo cambio mergeado a prod)
- `replit/plan-dusan` HEAD: `68ab926` (config Vite + .replit)
- URL pública `reciclean-sistema.vercel.app/panel-rdo.html`: form de login funcional (deploy desde `prod`)

## Qué prueba este commit

Este archivo `docs/_TEST-AISLAMIENTO-DUSAN-14MAY.md` se agrega a la rama
`replit/plan-dusan` con un push directo. Después se verifica:

1. **`main` en GitHub NO debe cambiar** — sigue en `ab1af44`
2. **`prod` en GitHub NO debe cambiar** — sigue en `fe40cdc`
3. **`reciclean-sistema.vercel.app/panel-rdo.html` NO debe cambiar** — sigue
   sirviendo el mismo contenido (Vercel deploya solo desde `prod`)
4. **Branch protection en `prod` activa** — confirmado por API
   `"protected": true` en `/repos/.../branches/prod`
5. **Vercel debe generar un preview de `replit/plan-dusan` con este archivo**,
   pero esa URL preview es separada de prod

## Resultado esperado

Dusan puede trabajar libremente en `replit/plan-dusan` (con su agente Replit)
sin riesgo de afectar prod. Para que un cambio suyo llegue a prod, necesita:

1. PR de `replit/plan-dusan` → `main` (rama suave, sin approval)
2. Review en main
3. PR de `main` → `prod` (rama estricta, requiere 1 approval que NO sea
   el autor)
4. Merge a `prod`
5. Vercel rebuilda desde `prod` y publica

## Cleanup post-prueba

Este archivo se puede borrar en cualquier momento cuando se valide el flujo.
No tiene contenido funcional, solo es marca de la demostración.

---

*Generado durante sesión de 14-may-2026 para responder a Dusan
"¿es seguro trabajar en el clon sin manchar el principal?"*
