## Qué cambia
<!-- resumen 1-3 líneas: qué problema resolvés / qué feature agregás -->

## Tipo de cambio (label)
- [ ] `risk:low` — texto, color, label, traducción, fix de typo
- [ ] `risk:med` — lógica JS, nueva pestaña, query Supabase, CSS estructural
- [ ] `risk:high` — auth/RLS, schema `curated.*`, deploys, secrets, `vercel.json`, `package.json`, `vite.config.js`

## Checklist técnico
<!-- marcá los que aplican; tachá los que no -->

- [ ] Si toqué `public/panel-rdo.html`: probé login + cambio de silo + responsive mobile (<768px) en el preview Vercel de esta rama
- [ ] Si creé tabla en `curated.*`: ejecuté `GRANT SELECT ON ... TO cesar_readonly` (sin esto, César/PowerBI rompe con `42501`)
- [ ] Si toqué visibilidad por silo o usuario: sincronicé los 4 lugares:
  - [ ] `panel.config_kv`
  - [ ] política RLS
  - [ ] vista `v_panel_silos_visibles`
  - [ ] fallback HTML del panel (constantes `FALLBACK_*`)
- [ ] Si toqué CSS: usé build local `/tailwind.css`, NO `cdn.tailwindcss.com`
- [ ] Si toqué Edge Functions: bumpié versión + corrí `supabase functions deploy <nombre>`
- [ ] Si tocaste schema curated: agregaste migración en `reciclean-rdo/supabase/migrations/` con nombre `YYYY-MM-DD_NNN_descripcion.sql`

## Preview Vercel
<!-- URL del deploy preview de esta rama -->
<URL>

## Riesgo de rollback
<!-- bajo / medio / alto + cómo revertir si rompe -->

## R-AUD-086 · Bloque de auditoría
<!-- obligatorio en TODOS los PRs; este bloque debe vivir en el body del PR, no en comentarios -->
- Qué voy a hacer: [1 línea concreta]
- Archivos que toco: [lista de paths]
- Reglas R-AUD que aplican: [lista]
- Riesgos que veo: [lista corta]
- Evidencia de que no rompo nada: [1 línea]
- Checkbox DeepSeek: [ ] Auditado

## Bitácora paralela
- [ ] Entrada agregada en `reciclean-manifiesto-diego/docs/BITACORA-PARALELO-MAYO-2026.md`
