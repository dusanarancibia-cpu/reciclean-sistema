# 05 — Condiciones y Reglas (LOCK operativo)

> Reglas no negociables. Espejo del bloque "Decisiones tomadas por Dusan (LOCK)" del spec Diego v4.2.
> Una IA / asistente / persona nueva que colabore con Dusan debe respetar TODAS estas reglas.

---

## Reglas criticas de comunicacion publica

### R.PUB.1 — Palabras prohibidas

Ningun contenido publicable puede contener:
- `gratis`
- `gratuito`
- `sin costo`
- `el mejor precio`
- `garantizado`

Aplica a: widgets, reciclean.cl, farex.cl, RRSS (Fase 4), fichas GMB, respuestas de Diego en WhatsApp.

### R.PUB.2 — Puerto Montt NO esta operativa

- En espera de permisos finales.
- **NUNCA** publicarla como activa.
- **NUNCA** mostrar precios vigentes de Puerto Montt hacia afuera.
- Cuando cambie el estado, actualizar `CLAUDE.md` y este archivo **antes** de tocar sitios publicos.

### R.PUB.3 — Contacto unificado

- WhatsApp cliente/proveedor: **+56 9 9534 2437** (Andrea Rivera).
- Email: **comercial@gestionrepchile.cl**.
- El numero personal de Dusan (+56 9 6192 6365) es **solo interno** (equipo + sistema Diego).

---

## Reglas tecnicas sobre el repo

### R.TEC.1 — Repo publico

El repo `dusanarancibia-cpu/reciclean-sistema` es **publico**. Por lo tanto:
- **Nunca** commitear credenciales.
- Secretos viven solo en `.env.local` (gitignore) y en variables de entorno de Supabase/Vercel.

### R.TEC.2 — Stack confirmado

- Frontend: **Vite + Vanilla JavaScript**. NO React (decision LOCK).
- Backend/BD: **Supabase** (proyecto `reciclean-sistema`, region Sao Paulo).
- Deploy: GitHub → Vercel automatico en push a `main`.
- PWA con Service Worker + manifest.

### R.TEC.3 — Redondeo de precios

`Math.floor`. NO adaptativo.

### R.TEC.4 — Siempre backup antes de tocar

- Antes de modificar un workflow n8n → Download JSON.
- Antes de SQL con DDL → Backup Supabase.
- Antes de push a `main` que toca logica critica → backup local del archivo.
- Este patron se formalizo en la guia de implementacion Diego v4.2 (21-abr).

### R.TEC.5 — Al modificar logica

- Editar `public/js/*.js`.
- Tocar HTML solo para cambios de estructura.
- Version en produccion actualmente: **v90** (commit `2ac680f`, 7 abril 2026).
- Proxima: **v91** (responsive mobile).

---

## Reglas de empresa y sucursales

### R.EMP.1 — Separacion Farex / Reciclean

- Materiales tienen flags booleanos `farex` y `reciclean`. Un material puede ser ambos, uno, o ninguno.
- Farex: solo 2 sucursales (Cerrillos + Maipu). IVA con **Retencion 19%**.
- Reciclean: 4 sucursales. **Sin IVA**.
- Switch de empresa persiste en `localStorage['rf_sucs_empresa']`.

### R.EMP.2 — Tab F gateado

El Tab F (Usuarios) solo es visible para usuarios con `localStorage.rf_session.rol === 'admin'`.

### R.EMP.3 — Flujo de datos Panel → Asistente

`Panel GRABAR` → Supabase → **"Generar Asistente"** → `asistente_snapshot` → Asistente + Widgets (Realtime).
No saltarse ese orden. El Asistente no lee de `v_precios_activos` — lee de `asistente_snapshot`.

---

## Reglas sobre Diego Alonso (el bot)

### R.DIE.1 — Diego parte de cero (R2.B)

Diego v4.2 no tiene precarga manual de procesos. Aprende 100% desde entrevistas al equipo. Los primeros 30 dias va a decir "no se" muy seguido. **Eso es por diseno, no un fallo.**

### R.DIE.2 — Todo borrador pasa por Dusan

Ninguna respuesta curada por Diego-Curador se activa sin pasar por Dusan via WA (comandos APROBAR / CORREGIR / DESCARTAR / VER / DETALLE).

### R.DIE.3 — Entrevistas 100% voluntarias

El equipo puede aceptar / rechazar / pausar cualquier entrevista. Diego respeta "ahora no" o "pausar" sin insistir.

### R.DIE.4 — Diego nunca inventa

Si `vacio_detectado=true`, Diego responde con la plantilla exacta ("Honestamente, no manejo bien [TEMA] todavia..."). No improvisa.

### R.DIE.5 — Auditoria diaria siempre llega (D4.a)

El WA de Diego-Curador a las 02:00 llega **aunque no haya errores** (con "🚨 Errores del dia (0)"). Esto confirma que el cron vive.

---

## Reglas de colaboracion con IA / Claude

### R.IA.1 — Idioma

**Siempre espanol.**

### R.IA.2 — Preferir edicion sobre creacion

No crear archivos nuevos si se puede editar uno existente. Explicitado en `CLAUDE.md`.

### R.IA.3 — No mostrar codigo completo sin pedirlo

Respuestas cortas primero. Detalle cuando Dusan lo pide.

### R.IA.4 — Accionable > explicativo

Dusan prefiere "ejecuta X comando, luego Y paso" antes que "podrias considerar X o Y".

### R.IA.5 — Siempre proponer rollback

Si una IA sugiere un cambio tecnico, debe venir con plan de rollback implicito o explicito.

---

## Reglas sobre validacion personal (auto-impuestas)

- Decisiones irreversibles de negocio: dormir una noche antes de firmar (excepcion: urgencias reales).
- Despliegues criticos: nunca en horario laboral sin aviso previo al grupo (regla 21-abr).
- Contratacion / despido: solo Dusan. No delegable.
- Cambio de palabras prohibidas: solo Dusan. No delegable a Pablo ni a IA.
- Publicacion en RRSS (Fase 4): Dusan valida borrador antes de Buffer publicar.

---

## Como se revisa este archivo

- Cada 3 meses (rutina trimestral).
- Cuando una regla se viola y causa un incidente (caso Ingrid → R.DIE.2 reforzada).
- Cuando el equipo / negocio cambia (Puerto Montt opera, nueva marca, etc.).
