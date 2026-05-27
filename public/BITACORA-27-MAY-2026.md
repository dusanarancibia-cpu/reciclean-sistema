# Bitacora 27-may-2026 — Resumen del dia

> Generada: 27-may-2026 | Participantes: Dusan + Pablo

---

## Resumen en palabras sencillas

Hoy fue un dia intenso. Se resolvio una emergencia comercial (Andrea no podia cotizar a Megapol porque le faltaban botones en el panel), se agrego seguridad 2FA al sistema, Pablo construyo el formulario para crear y editar clientes, y se integraron mas de 10 mil oportunidades del CRM antiguo en un tablero Kanban visual. Todo quedo promovido a produccion.

---

## Tareas de Dusan

### 1. Emergencia Megapol — sidebar roto (R-AUD-034)
**Que paso:** Andrea estuvo bloqueada 5 horas porque el menu lateral del panel no tenia los links a "Negocios" ni "Cotizador". No podia cotizar al cliente Megapol.

**Que se hizo:**
- Se descubrio que no eran solo 2 botones: habia **8 pestanas invisibles** (fantasma) y **3 links muertos** en el sidebar.
- Se arreglaron todas: ahora el sidebar tiene links a Negocios, Cotizador, Entregables, Reconciliacion, Bandeja Diego, Operaciones Dia, Operativos y Admin.
- Se creo una **auditoria automatica diaria** que revisa que esto no vuelva a pasar. Corre todos los dias a las 14:00 UTC.
- Resultado: Andrea desbloqueada, 14 usuarios del equipo ya ven todas sus pestanas.

**PRs:** #116 (hotfix inicial), #117 (fix definitivo, mergeado)

### 2. Seguridad 2FA — autenticacion de dos pasos (D-PANEL-AUTH-001)
**Que paso:** Se agrego la opcion para que los usuarios del panel puedan activar verificacion en dos pasos con su celular (Google Authenticator, Authy, etc).

**Que se hizo:**
- Nueva seccion "Seguridad de mi cuenta" en la pestana Admin.
- Muestra QR para escanear + clave manual + campo para verificar.
- Los perfiles criticos (gerencia, tech lead) ven un aviso de que deberian activarlo.
- Por ahora es **voluntario** — no bloquea el acceso si no lo activas.

**PR:** #115 (mergeado)

### 3. Permisos reales desde la base de datos (D-PANEL-PERFILES-001 F7)
**Que paso:** Antes, el sistema tenia una lista fija de emails "bypass" escritos directo en el codigo. Ahora lee los permisos reales desde Supabase.

**Que se hizo:**
- El panel ahora consulta la tabla de permisos real (`v_usuario_permisos_efectivos`) para decidir quien tiene acceso admin.
- Si esa consulta falla, tiene 2 redes de seguridad de respaldo para no dejar a nadie afuera.

**PR:** #115 (mismo que 2FA, mergeado)

### 4. Promocion a produccion
**Que paso:** Se junto todo lo del dia (26 commits) y se subio a produccion.

**Que incluye:** sidebar fix + 2FA + form clientes + Kanban V2 + widgets portada + consentimiento IA + bugfixes varios.

**PR:** #118 (main -> prod, mergeado)

### 5. Footer de fuentes de datos (Ola 1)
**Que paso:** Se empezo a construir un pie de pagina que muestra de donde vienen los datos de cada pestana (que tabla, cada cuanto se actualiza, quien es responsable).

**PR:** #119 (abierto, pendiente revision)

---

## Tareas de Pablo

### 1. Tablero Kanban de Oportunidades V2 — CRM Impulsa
**Que paso:** El CRM antiguo (Impulsa) tenia 10,214 oportunidades comerciales guardadas. Pablo las integro en un tablero Kanban visual dentro del panel.

**Que se hizo:**
- Vista que une oportunidades nativas del panel + las 10,214 del CRM Impulsa.
- Filtros por embudo (Reciclean / Farex / Embudo perdido).
- Las tarjetas CRM se ven con punto morado + badge de embudo.
- Las oportunidades propias se pueden arrastrar entre columnas; las de Impulsa son solo lectura.
- Barra de oportunidades cerradas (ganadas/perdidas) con toggle.
- Seccion de adjuntos en el drawer de cada oportunidad.

### 2. Formulario crear/editar cliente en Cartera
**Que paso:** Antes no habia forma de crear un cliente nuevo ni editar los datos completos de uno existente desde el panel. Pablo construyo el formulario completo.

**Que se hizo:**
- Boton "Nuevo cliente" en el header de la pestana Cartera.
- Boton "Editar datos completos" en la ficha de cada cliente existente.
- Modal con 4 secciones colapsables:
  - **Basico:** razon social, RUT, sucursal, estado, segmento, responsable, tags.
  - **Contacto:** telefono, email, direccion, ciudad, region, web, forma de pago, comentarios.
  - **Servicios Reciclean:** retiro, contenedor, certificacion, frecuencia cobro, condiciones pago.
  - **Bancario:** banco, tipo cuenta, numero cuenta.
- Funciona para los 1,975 clientes existentes y para crear nuevos.
- Graba directo en Supabase (`curated.clientes`).

### 3. Fix boton Guardar
**Que paso:** El boton "Guardar" del formulario de clientes quedaba tapado por el widget de chat de Diego.

**Que se hizo:** Se movio el boton a la izquierda para que sea visible siempre.

---

## Numeros del dia

| Metrica | Valor |
|---------|-------|
| Commits en main | 6 |
| PRs mergeados | 3 (#115, #117, #118) |
| PRs abiertos | 2 (#116 superseded, #119 pendiente) |
| Lineas agregadas | ~1,942 |
| Archivos tocados | 4 |
| Usuarios desbloqueados | 14 (sidebar fix) |
| Oportunidades integradas | 10,214 (Kanban Impulsa) |
| Clientes editables | 1,975 (form nuevo) |

---

## Actualizacion de avances en el plan

| Codigo | Titulo | Antes | Ahora | Motivo del cambio |
|--------|--------|-------|-------|-------------------|
| I-10 | Sprint ventas | 40% | 50% | Kanban V2 + form clientes = herramientas comerciales operativas |
| I-13 | Deuda tecnica | 20% | 30% | Auditoria R-AUD-034 + RPC perfiles reemplaza hardcoded |
| I-14 | Blindaje Diego | 75% | 80% | 2FA TOTP enrollment voluntario disponible |
| I-16 | Diego v5.1 LIVE | 85% | 90% | Sidebar v4 completo + widgets portada + auditoria automatica |

---

## Pendiente para manana

1. **Dusan** revisar PR #119 (footer fuentes de datos) y aprobar/pedir cambios.
2. **Pablo** validar form de clientes con dato real en produccion (crear 1 cliente de prueba, editarlo, verificar en Supabase).
3. **Andrea** probar sidebar nuevo — confirmar que ve Negocios + Cotizador + terminar cotizacion Megapol.
4. **Dusan** activar 2FA con su cuenta de gerencia (gerencia@gestionrepchile.cl) como piloto.
