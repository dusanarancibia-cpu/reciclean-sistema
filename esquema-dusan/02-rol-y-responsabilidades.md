# 02 — Rol y Responsabilidades

> Que hace Dusan, de que se hace cargo, que delega.

---

## Rol formal

**Gerente General — Grupo Reciclean-Farex**
Dos marcas, un grupo:
- **Reciclean** — 4 sucursales (Cerrillos, Maipu, Talca, Puerto Montt), sin IVA.
- **Farex** — 2 sucursales (Cerrillos, Maipu), con Retencion IVA 19%.

Total equipo: **14 personas**.
Total materiales gestionados: **65 SKUs**.
Clientes compradores activos: **12** (HUAL, RESIMEX, FPC, ADASME, POLPLAST, Sorepa, CMPC, etc.).

---

## Responsabilidades por capa

### Capa 1 — Comercial (el core del negocio)

- Estrategia de precios (margenes, flete, IVA, retencion).
- Relacion con clientes compradores (12 clientes).
- Relacion con proveedores de material (generadores de reciclaje).
- Decision final sobre que publicar en sitios publicos (reciclean.cl, farex.cl, widgets).

### Capa 2 — Operacion (sucursales + equipo)

- Coordinacion de las 4 sucursales (3 operativas + Puerto Montt en espera de permisos).
- Supervision de los **8 contactos activos** que mueven el dia a dia (Ingrid, Jair, Nicolas, Andrea Rivera y otros).
- Comunicacion maestra con el equipo — mensajes al grupo, anuncios, cambios de reglas.
- Despachos y logistica (coordinacion con Andrea Rivera para transportes).

### Capa 3 — Tecnologia (el sistema comercial)

- Product owner del sistema `reciclean-sistema` (Panel Admin + Asistente + Widgets).
- Colaboracion con **Pablo** (desarrollador) en features, bugs, deploys.
- Ejecucion directa de cambios usando Claude Code cuando Pablo no esta disponible (ej. implementacion Diego v4.2 el 21-abr).
- Validacion final de contenido generado por Diego Alonso (Diego-Curador).

### Capa 4 — Estrategica (fases 2-4 del proyecto)

- **Fase 2 (Mayo/Junio 2026):** Dashboard KPIs, CRM Proveedores, App Terreno PWA mejorada, Google Workspace.
- **Fase 3:** Rediseno de reciclean.cl y farex.cl, precios en Google Maps (8 fichas GMB).
- **Fase 4 (EN CURSO):** RRSS automaticas (Make + Claude Haiku + Canva + Buffer), Chatbot WhatsApp IA (Diego Alonso).

---

## Lo que SI hace personalmente

- Escribe los mensajes M1 / M2 al equipo (con su firma, "Soy Dusan").
- Valida borradores de Diego-Curador (APROBAR / CORREGIR / DESCARTAR / VER / DETALLE).
- Aprueba cambios en palabras prohibidas / lista de sucursales / estados Puerto Montt.
- Corre la implementacion tecnica cuando Pablo no esta (21-abr, 08:00-10:00 con aviso previo al grupo).
- Lee casos de error (`casos-diego/`) y decide prioridades (`PENDIENTES.md`).

## Lo que delega a Pablo

- Implementacion de workflows n8n (Diego v4.1 → v4.2).
- Code review profundo.
- Optimizaciones de performance.
- Migraciones complejas de base de datos.
- Debugging cuando excede su nivel tecnico.

## Lo que delega a Diego Alonso (bot)

- Primera linea de respuesta al equipo en WhatsApp.
- Entrevistas de recopilacion de conocimiento (modo entrevista).
- Busqueda RAG en `procesos_empresa`.

## Lo que delega al Diego-Curador (cron IA)

- Normalizar respuestas crudas en SOPs borrador.
- Auditoria diaria 02:00 AM (7 categorias de error + resumen estadistico).
- Envio de resumen WA a su numero a las 02:00 Chile.

## Lo que delega al equipo de terreno

- Carga de material, pesaje, fardado.
- Coordinacion de camiones con Andrea Rivera.
- Atencion en sucursal (primera linea con cliente).

---

## Patron de decision

| Situacion                              | Quien decide                                         |
|----------------------------------------|------------------------------------------------------|
| Feature nueva en Panel Admin           | Dusan (propone) + Pablo (viabilidad tecnica)         |
| Cambio de precio critico               | Dusan (ejecuta directo)                              |
| Respuesta a cliente / proveedor grande | Dusan                                                |
| Coordinacion diaria camion / sucursal  | Equipo (Andrea + admins sucursal) — Dusan solo si escalan |
| Publicar contenido RRSS                | Dusan valida el borrador automatizado                |
| Rollback de workflow                   | Dusan (si Pablo no responde en 30 min)               |
| Contratar / despedir                   | Dusan solo                                           |

---

## Frontera clara entre roles

- Dusan **no** es desarrollador — usa Claude Code como palanca, no reemplazando a Pablo.
- Pablo **no** toma decisiones comerciales — ejecuta la vision de Dusan.
- Diego Alonso **no** inventa respuestas — responde desde `procesos_empresa` o pide entrevista.
- El equipo de terreno **no** decide precios — los consulta en el Asistente o pregunta a Dusan.
