# 08 — Decisiones LOCK

> Decisiones tomadas por Dusan que NO se re-abren sin razon fuerte.
> Espejo de la tabla "Decisiones tomadas por Dusan (LOCK)" del spec Diego v4.2.
> Formato: codigo, fecha, decision, razon.

---

## Tecnologia y arquitectura

| Codigo | Fecha      | Decision                                                  | Razon                                     |
|--------|------------|-----------------------------------------------------------|-------------------------------------------|
| T.01   | 2025-2026  | Stack: **Vite + Vanilla JS**, NO React                    | Simplicidad, velocidad, sin build pesado  |
| T.02   | 2025-2026  | BD: **Supabase** (proyecto Sao Paulo)                     | Auth + Realtime + bajo costo              |
| T.03   | 2025-2026  | Deploy: GitHub → Vercel automatico en push a `main`       | CI/CD simple sin infraestructura propia   |
| T.04   | 2025-2026  | Redondeo de precios con `Math.floor`, NO adaptativo       | Predictibilidad y evitar bugs             |
| T.05   | 2025-2026  | Credenciales solo en `.env.local` o Supabase/Vercel vars  | Repo publico                              |
| T.06   | 2025-2026  | `localStorage['rf_sucs_empresa']` persiste switch empresa | UX consistente entre sesiones             |

## Empresa / operacion

| Codigo | Fecha      | Decision                                                  | Razon                                     |
|--------|------------|-----------------------------------------------------------|-------------------------------------------|
| E.01   | 2025       | Farex = solo Cerrillos + Maipu                            | Alcance legal de la marca                 |
| E.02   | 2025       | Reciclean = 4 sucursales (PM pendiente permisos)          | Cobertura nacional objetivo               |
| E.03   | 2025       | Farex con Retencion IVA 19% / Reciclean sin IVA           | Estructura fiscal de cada empresa         |
| E.04   | 2026-04-22 | Puerto Montt NO se muestra como activa hasta permisos finales | Riesgo legal y reputacional            |
| E.05   | —          | Palabras prohibidas: `gratis`, `gratuito`, `sin costo`, `el mejor precio`, `garantizado` | Cumplimiento publicitario / tono de marca |
| E.06   | —          | Contacto publico unificado: WA +56 9 9534 2437 + `comercial@gestionrepchile.cl` | Centralizar relacion con cliente        |

## Diego Alonso (bot) — tomadas 2026-04-20

| Codigo | Fecha      | Decision                                                  | Ref origen                               |
|--------|------------|-----------------------------------------------------------|------------------------------------------|
| C3     | 2026-04-20 | Diego-Curador IA pre-procesa respuestas, Dusan valida     | `docs/diego-v4.2-spec.md`                |
| M2     | 2026-04-20 | Mensaje al equipo explica problema + invita a entrevistas | `docs/diego-v4.2-spec.md`                |
| M1.C   | 2026-04-20 | Firma combo: Dusan abre autoridad + Diego cierra humildad | `docs/diego-v4.2-spec.md`                |
| D1     | 2026-04-20 | Diego consulta `procesos_empresa` ANTES de responder      | `docs/diego-v4.2-spec.md`                |
| P1.b   | 2026-04-20 | Preguntas de entrevista adaptativas, no guion fijo        | `docs/diego-v4.2-spec.md`                |
| P3     | 2026-04-20 | Arranque con 8 contactos activos primero, luego ola 2     | `docs/diego-v4.2-spec.md`                |
| R2.B   | 2026-04-20 | Diego parte de CERO — aprende 100% del equipo             | `docs/diego-v4.2-spec.md`                |
| R1     | 2026-04-20 | M2 incluye frase "Diego es nuevo... 30 dias... pedira ayuda" | `docs/diego-v4.2-spec.md`             |
| D2.a   | 2026-04-20 | Resumen estadistico incluido en WA Curador                | `docs/diego-v4.2-spec.md`                |
| D3.a   | 2026-04-20 | Diego-Curador arranca 28-abr                              | `docs/diego-v4.2-spec.md`                |
| D4.a   | 2026-04-20 | WA Curador llega siempre, aunque "0 errores"              | `docs/diego-v4.2-spec.md`                |

## Personales / metodologia

| Codigo | Fecha      | Decision                                                  | Razon                                     |
|--------|------------|-----------------------------------------------------------|-------------------------------------------|
| P.01   | 2026-04-22 | Comunicacion con Claude / IAs siempre en espanol          | Idioma operativo                          |
| P.02   | 2026-04-22 | Preferir editar archivos existentes antes de crear nuevos | Evitar dispersion                         |
| P.03   | 2026-04-22 | Despliegues criticos SIEMPRE con aviso previo al grupo    | Aprendizaje de la ventana 21-abr 08-10h   |
| P.04   | 2026-04-22 | Siempre backup antes de tocar workflow / BD / logica      | Aprendizaje implementacion Diego v4.2     |
| P.05   | 2026-04-22 | Todo contenido generado por IA para publicar pasa por Dusan | Patron Diego-Curador aplicado a todo    |
| P.06   | 2026-04-22 | Decisiones irreversibles de negocio: dormir 1 noche antes | Higiene de decisiones                     |

---

## Como agregar una decision nueva

1. Elegir codigo proximo disponible en la familia correcta (T.07, E.07, P.07, etc.).
2. Fecha en formato `YYYY-MM-DD`.
3. Redactar la decision en una linea.
4. Agregar razon corta (1 frase).
5. Si la decision viene de un documento externo, enlazarlo.
6. Commitear con mensaje: `docs: LOCK [codigo] — descripcion corta`.

---

## Como se re-abre una decision LOCK

Una decision LOCK solo se re-discute si:
1. Un **incidente** la evidencia como incorrecta (ejemplo: caso Ingrid reforzo R.DIE.2).
2. Un **cambio de contexto** mayor la invalida (ejemplo: Puerto Montt obtiene permisos → E.04 cambia).
3. Una **decision superior** la obsoletiza (ejemplo: cambio de stack en Fase 3).

Al reabrir:
- Mover la fila a una seccion `## Decisiones obsoletas` al final del archivo.
- Agregar fila nueva con el codigo siguiente y fecha de hoy.
- Nunca borrar — mantener historial trazable.
