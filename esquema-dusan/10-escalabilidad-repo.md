# 10 — Escalabilidad del repositorio

> Analisis hecho 2026-04-22 tras consolidar esquema-dusan + skill protocolo-datos-unificado.
> Objetivo: que la estructura aguante crecer a empresa (Fase 2/3/4 + areas nuevas) Y
> a temas personales (finanzas, aprendizaje, salud) sin que el repo se vuelva un caos.

---

## 1. Diagnostico actual

Hoy el repo `reciclean-sistema` mezcla 7 dominios en el root:

| Dominio                 | Archivos hoy                                                       | Crecimiento esperado (12m) |
|-------------------------|--------------------------------------------------------------------|----------------------------|
| App produccion          | `index.html`, `asistente.html`, `login.html`, `public/`, `src/`    | +Fase 2 dashboard, +CRM UI, +widgets GMB Fase 3 |
| Bot Diego Alonso        | `casos-diego/`, `mensajes-equipo/`, `docs/diego-*.md`              | +v4.3, +v5, +nuevos bots Fase 4 |
| Personal Dusan          | `esquema-dusan/`                                                   | +finanzas, +aprendizaje, +salud |
| Ops / pendientes        | `PENDIENTES.md`, `CONTINUAR_SESION_DIEGO.txt`                      | migra a tablas (skill)     |
| SQL / datos             | `sql/`, `esquema-dusan/tablas/`                                    | +migraciones Fase 2-4      |
| Skill Claude            | `.claude/skills/protocolo-datos-unificado/`                        | +skills nuevas             |
| Config deploy           | `vercel.json`, `.gitignore`, `package.json`                        | estable                     |

**Sintomas de que el root se va a saturar:**
- Ya hay 4 carpetas que empiezan por `casos-*`, `mensajes-*`, `esquema-*`, `docs` sin jerarquia.
- `docs/` se usa tanto para specs tecnicos (Diego v4.2) como para guias operativas — mezcla.
- Cualquier area nueva (RRSS Fase 4, CRM proveedores, finanzas personales) pelea por un nombre top-level nuevo.

---

## 2. Opciones de arquitectura

### Opcion A — Mono-repo con top-level por dominio (RECOMENDADA)

Mantener UN solo repo, pero reorganizar el root en carpetas claras por dominio. Un solo sitio para buscar, git history unificado, skill se activa igual.

```
reciclean-sistema/
  app/                          # codigo de produccion (lo que vive en Vercel)
    public/                     #   = ex public/
    src/                        #   = ex src/
    index.html, asistente.html, login.html, vite.config.js, package.json
  diego/                        # todo lo del bot
    docs/                       #   = ex docs/diego-*
    casos/                      #   = ex casos-diego/
    mensajes/                   #   = ex mensajes-equipo/
    html/                       #   = ex public/diego-*.html (links desde app/)
  dusan/                        # personal (ex esquema-dusan/)
  empresa/                      # NUEVO: procesos, SOPs, CRM proveedores, Fase 2
    procesos/
    proveedores/
    clientes/
    reportes/
  claude/                       # todo lo de metaherramienta Claude
    skills/                     #   = ex .claude/skills/
    briefs/                     #   = ex CONTINUAR_SESION_DIEGO.txt, BRIEF_*
  data/                         # SQL y migraciones cross-dominio
    migraciones/                #   = ex sql/ + *.sql dispersos
    seeds/
    queries/
  rrss/                         # NUEVO Fase 4
    plantillas/
    calendario/
    assets/
  infra/                        # deploy, CI, secretos redacted
    vercel.json
    .github/
  CLAUDE.md, README.md, PENDIENTES.md (histórico, post-skill)
```

**Ventajas:**
- Un solo git history, un solo Vercel, un solo repo publico (con reglas de secretos).
- Claude Code puede seguir operando con la misma skill.
- Cada dominio tiene su sub-README y sub-docs sin chocar con el resto.
- Escala: sumar `finanzas-personal/`, `salud-personal/`, `aprendizaje/` es agregar una carpeta — no un repo nuevo.
- La skill `protocolo-datos-unificado` se adapta trivialmente: sus tablas son cross-dominio.

**Desventajas:**
- Un rebase inicial grande (mover 20+ archivos).
- Rompe los paths hardcoded en Vercel — hay que ajustar `vite.config.js` y `vercel.json`.
- PRs en curso (P1) se hacen mas complicados mientras dure la migracion.

### Opcion B — Multi-repo separado por dominio

- `reciclean-app` → solo codigo Vercel
- `reciclean-ops` → diego, empresa, procesos, pendientes
- `dusan-personal` → esquema personal + finanzas + aprendizaje
- `reciclean-claude` → skills, briefs, prompts

**Ventajas:**
- Separacion total de contextos, cada repo con permisos distintos.
- Publicar `reciclean-app` publico y `dusan-personal` privado sin problema.
- Cada repo tiene su CI/CD independiente.

**Desventajas:**
- Claude Code abre 1 repo a la vez — cambiar de contexto cada rato.
- Duplicar skill en cada repo o cargar desde URL.
- PRs cross-repo son manuales.
- Supabase sigue siendo unico — las tablas no se fragmentan, solo los docs.

### Opcion C — Dos repos (practico)

- `reciclean-sistema` → Opcion A completa (empresa + Diego + app + claude + data).
- `dusan-vault` → privado, solo lo personal (esquema-dusan + finanzas + salud + aprendizaje).

**Ventajas:**
- Separacion publico/privado clara (el repo actual es PUBLICO — regla T.05 LOCK).
- Lo personal no vive donde cualquiera puede leerlo.
- Claude Code sigue operando con 1 repo a la vez sin fragmentacion operativa.

**Desventajas:**
- Primera migracion: mover `esquema-dusan/` a `dusan-vault`.
- La tabla `documentos` de la skill pasa a apuntar a 2 repos (requiere columna `repo`).

---

## 3. Recomendacion

**Migrar a Opcion C (2 repos), en 3 fases, sin prisa:**

### Fase 1 — Reorganizar root del repo actual (Opcion A interna)

- Crear carpetas `app/`, `diego/`, `empresa/`, `claude/`, `data/`, `infra/`.
- Mover sub-arboles existentes (respetando paths de Vercel).
- Dejar `dusan/` temporal (hasta crear el repo privado).
- Duracion: 1-2 horas. Riesgo: medio (paths Vercel). Hacer en ventana 18-22 con aviso.

### Fase 2 — Crear `dusan-vault` privado

- Nuevo repo privado en github.com/dusanarancibia-cpu.
- Migrar `esquema-dusan/` → `dusan-vault/personal/`.
- Carpetas hermanas listas: `finanzas/`, `salud/`, `aprendizaje/`, `vida/`.
- La tabla `documentos` del protocolo unificado agrega columna `repo TEXT`.
- Duracion: 1 hora. Riesgo: bajo.

### Fase 3 — Hardening del mono-repo publico

- Revisar que no queden referencias personales en `reciclean-sistema`.
- Actualizar `CLAUDE.md` para que mencione el esquema en `dusan-vault`.
- Agregar `.github/CODEOWNERS` por dominio cuando entre mas gente.
- Duracion: 30 min.

---

## 4. Reglas para que cada nueva area respete la jerarquia

### Regla 1 — Toda carpeta top-level nueva es un dominio, no una feature

- ✅ `empresa/proveedores/crm/` (feature dentro del dominio empresa)
- ❌ `crm-proveedores/` en root (confunde con otros crm si entran mas)

### Regla 2 — Si una feature cruza dominios, vive en `data/` o en docs cross

- Ejemplo: `data/migraciones/2026-05-01-add-proveedores.sql` (SQL cross-dominio).
- Ejemplo: `docs/cross/integracion-diego-x-crm.md`.

### Regla 3 — Skill `protocolo-datos-unificado` aplica a TODOS los dominios

- Empresa, Diego, personal, RRSS — todos usan las mismas tablas skill.
- Nueva tabla por dominio: solo si repite forma de fila que no cabe en las tablas existentes.

### Regla 4 — Cada dominio top-level tiene su sub-README

- `empresa/README.md`, `diego/README.md`, `dusan/README.md`, etc.
- Sub-README es NARRATIVA. Los items estructurales van a tablas (sigue la skill).

### Regla 5 — Lo que es personal va al repo privado

- Nada personal en `reciclean-sistema` (regla T.05 LOCK — repo publico).
- Regla de verificacion antes de commit: `grep -r "rut\|telefono_personal\|contrasena\|finanza\|salud" .` en cada push.

### Regla 6 — Ventana de reorganizacion es un evento, no continuo

- Mover carpetas cada mes es peor que tenerlas medio desordenadas.
- Reorganizar 1 vez por semestre si crece. Si no crece, no tocar.

---

## 5. Plan de cero dolor

Hoy NO hay que migrar. Solo:

1. Confirmar Opcion C como LOCK (`11. decisiones_lock` codigo `T.07`).
2. Al crear la proxima carpeta top-level, hacerlo YA dentro del dominio correcto:
   - No `crm-proveedores/` → crear `empresa/proveedores/`.
   - No `finanzas/` en este repo → crear en `dusan-vault`.
3. Dejar la migracion real para cuando el repo duela (senal: > 10 carpetas top-level).

---

## 6. Como afecta la skill `protocolo-datos-unificado`

**Pocos cambios:**

| Tabla skill          | Cambio necesario                                                  |
|----------------------|--------------------------------------------------------------------|
| `documentos`         | Agregar columna `repo TEXT DEFAULT 'reciclean-sistema'` para soportar multi-repo. |
| `tareas`             | Columna `dominio` opcional (`'app'`, `'diego'`, `'empresa'`, `'personal'`). |
| `objetivos`          | Idem `dominio`.                                                    |
| `sesiones_trabajo`   | Idem `dominio`.                                                    |
| `decisiones_lock`    | Columna `familia` ya existe — mapea 1:1 con dominio.               |

Migracion: `ALTER TABLE ... ADD COLUMN dominio TEXT;`. 5 min.

---

## 7. Resumen ejecutivo

- **Hoy:** root del repo ya empieza a mezclar dominios.
- **Recomendacion:** Opcion C (mono-repo reorganizado + vault privado personal).
- **Ejecucion:** 3 fases, solo cuando empiece a doler. No urgente.
- **Regla de oro para crecer:** toda carpeta top-level nueva = 1 dominio. Feature nueva = sub-carpeta dentro del dominio. Personal = vault privado.
