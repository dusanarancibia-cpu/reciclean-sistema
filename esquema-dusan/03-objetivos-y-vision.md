# 03 — Objetivos y Vision

> Que busca Dusan, que quiere mostrar, que quiere ver.

---

## Vision a 12 meses (hasta abril 2027)

Un grupo Reciclean-Farex donde:

1. **Las 4 sucursales operan en piloto automatico** (Puerto Montt incluida, ya con permisos finales).
2. **Diego Alonso responde bien el 90% de las consultas del equipo** sin intervencion de Dusan.
3. **El dashboard de KPIs vive** (Fase 2) y Dusan lo revisa al inicio y cierre de cada dia.
4. **Los sitios publicos (reciclean.cl, farex.cl) estan rediseñados** (Fase 3) con precios en Google Maps (8 fichas GMB).
5. **RRSS corren automaticas** via Make.com + Claude Haiku + Canva + Buffer (Fase 4) — Dusan solo valida.
6. **CRM de Proveedores activo** (Fase 2) — no se pierden contactos de generadores de material.

---

## Objetivos por horizonte

### Corto plazo (30 dias — hasta 22 mayo 2026)

- **O1.** Diego v4.2 operativo y los 8 contactos activos ya hicieron al menos 3 entrevistas cada uno.
- **O2.** Primer ciclo completo Diego-Curador: borradores validados y escritos a `procesos_empresa`.
- **O3.** Mensaje M2 enviado y equipo entiende que los 30 dias de "no se" son inversion, no fracaso.
- **O4.** Cero incidentes criticos en Diego LIVE (rollback no usado).

### Medio plazo (3-6 meses — hasta octubre 2026)

- **O5.** Dashboard KPIs en produccion (Fase 2).
- **O6.** CRM Proveedores vivo con 50+ contactos indexados.
- **O7.** App Terreno PWA mejorada (la que usa el equipo en sucursal).
- **O8.** Google Workspace migrado y estandarizado para los 14 miembros del equipo.

### Largo plazo (6-12 meses)

- **O9.** Fase 3 desplegada (web redisenada + GMB con precios).
- **O10.** Fase 4 corriendo sin supervision diaria (RRSS + Chatbot WhatsApp).
- **O11.** Puerto Montt operativa al 100%.
- **O12.** Diego Alonso version post-v4.2 con 200+ procesos documentados en `procesos_empresa`.

---

## Que quiere mostrar (externo / publico)

**Hacia clientes compradores (HUAL, RESIMEX, Sorepa, CMPC, etc.):**
- Un proveedor serio, con precios claros, volumenes confirmados, logistica que cumple.
- Comunicacion unificada: WhatsApp +56 9 9534 2437 (Andrea) + email `comercial@gestionrepchile.cl`.

**Hacia proveedores / generadores de material:**
- Un grupo que paga bien, retira rapido, no improvisa.
- Precios publicos transparentes (widgets en reciclean.cl y farex.cl).

**Hacia el equipo interno (14 personas):**
- Un lider que documenta, que respeta su tiempo, que construye herramientas que hacen mas facil su trabajo.
- Diego como *asistente que aprende de ellos*, no como jefe que los supervisa.

**Hacia Pablo (socio tecnico):**
- Un product owner claro, que documenta bien (`docs/*.md`, `PENDIENTES.md`), que respeta sus vacaciones.

**Hacia IAs / asistentes nuevos:**
- Contexto autosuficiente (este esquema) + repo publico + `CLAUDE.md` + `BRIEF_CLAUDE_CODE_MOBILE.md`.

---

## Que quiere ver (tablero personal diario)

Al inicio del dia (~08:00 Chile):

1. **Resumen Diego-Curador 02:00** — mensaje WA del cron con errores y borradores para validar.
2. **Bandeja de aprobaciones pendientes** — borradores `procesos_borrador.estado='pendiente'`.
3. **Pendientes del dia** (`PENDIENTES.md`) — priorizados por criticidad.
4. **Estado de Diego LIVE** — si esta activo, cuantos mensajes atendio ultimas 24h.
5. **KPIs comerciales basicos** (cuando exista Fase 2) — toneladas pesadas hoy, ventas cerradas semana, deudas 30d+.

Al cierre del dia (~20:00 Chile):

1. **Check casos del dia** — algun caso como Ingrid/Jair/Nicolas que deba documentarse en `casos-diego/` o `casos-dusan/`.
2. **Decisiones tomadas hoy** que deban ir a `08-decisiones-lock.md`.
3. **Mensajes enviados al equipo** que deban archivarse en `mensajes-equipo/`.

---

## Que NO quiere ver (filtros)

- **Interrupciones sin contexto** — si alguien lo pinga por WA sin enlace ni resumen, lo pospone.
- **Respuestas genericas de IA** — "una opcion seria..." — prefiere recomendaciones concretas.
- **Alertas falsas** — por eso Diego-Curador envia WA solo si hay cambios reales (aunque D4.a pidio siempre enviar, con "0 errores" explicito para confirmar que el cron vive).
- **Dashboards con 100 metricas** — prefiere 5 metricas accionables.

---

## Anti-objetivos (lo que explicitamente NO busca)

- Crecer en sucursales antes de consolidar las 4 actuales.
- Reemplazar al equipo humano con bots. Diego es *asistente*, no *reemplazo*.
- Publicar precios con palabras prohibidas (`gratis`, `gratuito`, `sin costo`, `el mejor precio`, `garantizado`).
- Mostrar Puerto Montt como activa antes de tener permisos finales.
- Tomar decisiones tecnicas criticas sin backup + rollback planificado.
