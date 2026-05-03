# Monday.com — Estructura Maestra de Gestión Reciclean-Farex

> **Propósito:** Control centralizado de ejecución, prioridades, asignaciones y comunicación del equipo.
> **Última actualización:** 2026-05-03
> **Equipo:** Dusan + Pablo + Claude
> **Fuente de verdad:** Esta estructura + Supabase `temas_en_progreso`

---

## 📊 Tableros Principales (3)

### 1. **[MAESTRO] Iniciativas & Temas** ← PRINCIPAL
Visión integral de las 25 iniciativas padre + 43 sub-tareas + ideas nuevas.

**Columnas:**
- `Código` (I-01, I-02, ..., I-25)
- `Nombre` (≤50 chars)
- `Descripción` (100-200 chars)
- `Departamento` (Dropdown: Gerencia, Tecnología, Comercial, Finanzas, Recursos Humanos, Legal, Operaciones, Sostenibilidad)
- `Responsable` (Person: Dusan, Pablo, Claude)
- `Prioridad` (Dropdown: CRÍTICA/URGENTE, Alta, Media, Baja)
- `Estado` (Status: 🟥 Bloqueada, 🟧 En diseño/spec, 🟨 En build, 🟩 Validado, 🟦 En revisión, ✅ Superada)
- `% Completado` (0-100%, automático)
- `Fecha Inicio` (Date)
- `Fecha Límite` (Date) — triggers rojo si pasa
- `Vence Hoy?` (Formula: IF fecha_límite = TODAY, "SÍ", "")
- `Bloqueador` (Text: si hay, qué bloquea)
- `Siguiente Acción` (Text: qué es lo concreto que sigue)
- `Dependencias` (Link a otras iniciativas)
- `Sub-tareas` (Sub-items: ver Tabla II.1 abajo)
- `Última Actualización` (Auto: fecha)
- `Etiquetas` (Multi-select: #spike, #handoff, #n8n, #sql, #api, #ux)
- `Link Documento` (URL: OneDrive / GitHub / Supabase)
- `Notas Equipo` (Updates + comments)

**Vistas incluidas:**
- Vista "Hoy" (filtro: Fecha Límite = HOY)
- Vista "Semana crítica 22-30 abr" (Fecha Límite entre 22-30 abr)
- Vista "Por Responsable" (Agrupar por Responsable)
- Vista "Por Prioridad" (Agrupar por Prioridad: CRÍTICA primero)
- Vista "Por Estado" (Agrupar por Estado)
- Vista "Bloqueadas" (Filtro: Estado = Bloqueada)
- Vista "Este mes" (Fecha Límite en mayo 2026)
- Vista "Ideas nuevas" (sub-sección para capturar nuevas ideas que llegan)

---

### 2. **Tareas Diarias del Equipo**
Desglose diario: qué hace cada quien, qué se espera hoy.

**Columnas:**
- `Fecha` (Date)
- `Persona` (Dropdown: Dusan, Pablo, Claude)
- `Tarea` (Link a Iniciativa padre en Tablero 1)
- `Qué urge` (Text: descripción breve)
- `Horas estimadas` (Number)
- `Estado Hoy` (Status: 🟥 Bloqueado, 🟧 En curso, 🟩 Completado)
- `Progreso` (%)
- `Bloqueador ahora` (Text)
- `Comunicación pendiente` (Link a persona que necesita coordinación)
- `Notas rápidas` (Updates)

**Vistas:**
- Vista "Hoy" (Fecha = TODAY)
- Vista "Por persona" (Agrupar por Persona)
- Vista "Bloqueadas ahora" (Filtro: Estado = Bloqueado)
- Vista "Alcanzados hoy" (Filtro: Estado = Completado)

**Automatizaciones:**
- Si `Estado Hoy` = Completado → notificación a equipo
- Si `Bloqueador ahora` rellenado → notificación a responsable bloqueador

---

### 3. **Ideas Nuevas & Roadmap** ← INBOX DE IDEAS
Captura de nuevas ideas, priorización, asignación a iniciativa.

**Columnas:**
- `Idea` (Text)
- `Quién propone` (Person)
- `Cuándo` (Auto: fecha creación)
- `Categoría` (Dropdown: Feature, Bug, Optimización, Integración, Documentación)
- `Impacto estimado` (Dropdown: Alto, Medio, Bajo)
- `Esfuerzo estimado` (Dropdown: 1d, 3d, 1w, 2w+)
- `¿Merece iniciativa propia?` (Dropdown: Sí → I-NN, No → sub-tarea de I-XX, En revisión)
- `Asignada a` (Person)
- `Estado` (Status: 📝 Nueva, 🔍 En revisión, 👍 Aprobada, ⏸️ En espera, ❌ Rechazada)
- `Link a Iniciativa` (Link a Tablero 1 si corresponde)
- `Notas evaluación` (Text)

**Vistas:**
- Vista "Nuevas esta semana" (Cuándo >= Monday de esta semana)
- Vista "Aprobadas pendientes" (Estado = Aprobada)
- Vista "Alto impacto" (Impacto = Alto)
- Vista "Backlog Q2" (Para ideas post 30-abr)

---

## 📋 Mapeo: 37 Temas → Iniciativas Monday

| Código | Nombre | Prioridad | % | Responsable | Vence | Estado |
|---|---|---|---|---|---|---|
| **I-01** | Mapa BD + Foreign Keys | Alta | 30% | Claude | 29-abr | 📋 En spec |
| **I-02** | Visualización informes | Media | 10% | Dusan | 15-may | 💡 Diseño |
| **I-03** | Evaluación BI tools | Media | 20% | Dusan | 10-may | 📋 Spec |
| **I-04** | Tracker temas (sistema) | Alta | 90% | Claude | 30-abr | 🔨 Build |
| **I-05** | Panel admin temas | Media | 30% | Claude | 10-may | 📋 Spec |
| **I-06** | Ecosistema integrado | Media | 15% | Dusan | 20-may | 💡 Diseño |
| **I-07** | Evaluación diagramas (ECharts) | Baja | 10% | Claude | 20-may | 💡 Diseño |
| **I-08** | Rotación keys (K3+Meta) | 🔴 CRÍTICA | 10% | Dusan | **22-abr** | 🟥 Bloqueada |
| **I-09** | Infra VPS + hub | Alta | 40% | Pablo | 28-abr | 🟧 En build |
| **I-10** | Sprint ventas Q2 | Alta | 40% | Dusan | **28-abr ⚠️** | 🔨 Build (ATRASADO) |
| **I-11** | Asistente Comercial Integrado (ACI) | Alta | 50% | Pablo | 5-may | 🔨 Build |
| **I-12** | Diego v5.0 Live (lanzamiento) | 🔴 CRÍTICA | 30% | Dusan | **🚀 30-abr** | 🟧 En build |
| **I-13** | Deuda técnica | Baja | 5% | Pablo | 20-may | 💡 Diseño |
| **I-14** | Blindaje Diego (PUK+2FA) | Media | 10% | Dusan | — | 💡 Diseño |
| **I-15** | Notion Plus | Media | 0% | Dusan | 25-abr | 💡 Diseño |
| **I-16** | Diego v5.1 (post v5.0) | Media | 0% | Pablo | 15-may | 💡 Diseño |
| **I-17** | Docs Mermaid+ECharts | Baja | 20% | Claude | — | 🟧 En build |
| **I-18** | Contrato Resimple | Media | 0% | Dusan | 10-may | 💡 Diseño |
| **I-19** | Plan 2026-2030 | Alta | 30% | Dusan | 30-abr | 📋 Spec |
| **I-20** | Propuestas comerciales | Media | 10% | Dusan | 15-may | 💡 Diseño |
| **I-21** | Puerto Montt operations | Baja | 20% | Dusan | 30-jun | 💡 Diseño |
| **I-22** | Guía Chatbot | Media | 25% | Dusan | — | 📋 Spec |
| **I-23** | Implementación Monday.com | **👈 HOY** | 0% | Claude | — | 💡 Diseño |
| **I-24** | Descripción de cargos | Baja | 20% | Dusan | — | 💡 Diseño |
| **I-25** | Permisos Talca (vigencia) | Baja | 30% | Dusan | — | 💡 Diseño |

---

## 🎯 Sub-tareas Principales (I-23: Implementación Monday)

### I-23.1 Crear tableros base en Monday.com
- [ ] Tablero 1: [MAESTRO] Iniciativas & Temas (configurar columnas)
- [ ] Tablero 2: Tareas Diarias del Equipo (setup)
- [ ] Tablero 3: Ideas Nuevas & Roadmap (setup)
- **Responsable:** Claude
- **Fecha límite:** 5-may
- **Bloqueador:** Acceso a workspace Monday

### I-23.2 Cargar los 37 temas en Monday
- [ ] Importar iniciativas padre (25)
- [ ] Crear sub-tareas (43)
- [ ] Agregar descripciones y bloqueadores
- [ ] Vincular dependencias
- **Responsable:** Claude
- **Fecha límite:** 6-may
- **Estimado:** 2-3 horas

### I-23.3 Configurar automatizaciones
- [ ] Notificaciones de vencimiento (2 días antes)
- [ ] Actualización automática de estados
- [ ] Alertas de bloqueadores
- [ ] Recordatorio diario a las 8 AM (equipo diario)
- **Responsable:** Claude
- **Fecha límite:** 7-may
- **Requerimientos:** n8n + Monday API

### I-23.4 Entrenar equipo en Monday
- [ ] Sesión demo Dusan (cómo ver tareas del día)
- [ ] Sesión demo Pablo (cómo reportar avances)
- [ ] Documento: "Guía rápida Monday.com"
- **Responsable:** Dusan
- **Fecha límite:** 8-may

### I-23.5 Integración con Supabase & n8n
- [ ] Sincronización bidireccional: Supabase `temas_en_progreso` ↔ Monday
- [ ] Webhook de n8n para alertas críticas
- [ ] Dashboard espejo en Supabase (si falla Monday, BD es backup)
- **Responsable:** Pablo + Claude
- **Fecha límite:** 10-may

---

## 🔔 Automatizaciones & Notificaciones

### Reglas de Notificación Automática

1. **Tarea vence HOY**
   - Trigger: Fecha Límite = TODAY en Tablero 1
   - Action: Notificar a Responsable + Dusan
   - Frecuencia: 8 AM

2. **Tarea 2 días antes de vencer**
   - Trigger: Fecha Límite = TODAY + 2 días
   - Action: Notificar a Responsable (amarillo)
   - Frecuencia: 4 PM

3. **Tarea bloqueada > 3 días**
   - Trigger: Estado = Bloqueada + (Hoy - Última Actualización) > 3
   - Action: Notificar a Responsable + Responsable bloqueador
   - Frecuencia: Cada 12h

4. **Sub-tarea completada**
   - Trigger: Sub-tarea % = 100%
   - Action: Actualizar % padre automático, notificar equipo
   - Frecuencia: Inmediata

5. **Idea aprobada sin asignación**
   - Trigger: Estado = Aprobada en Tablero 3 + (Ahora - Estado cambió) > 1 día
   - Action: Notificar a Dusan para asignar
   - Frecuencia: Diaria a las 10 AM

6. **Tareas diarias incompletas al cierre**
   - Trigger: Fecha = TODAY + 5 PM en Tablero 2 + Estado ≠ Completado
   - Action: Notificar a Persona + Dusan (reporte diario)
   - Frecuencia: 5:30 PM

### Resumen Diario Automático

**A las 8 AM de lunes a viernes:**
- "📋 Tareas de hoy (X personas, Y tareas)"
- Desglose por persona
- Tareas vencidas
- Bloqueadores activos
- Link directo a Tablero 2 vista "Hoy"

**A las 5:30 PM de lunes a viernes:**
- "📊 Cierre de día:"
- Tareas completadas (verde)
- Tareas en curso (amarillo)
- Tareas bloqueadas (rojo)
-% avance del día

---

## 💬 Flujo de Comunicación

### Canales
- **Monday:** Iniciativas, dependencias, bloqueadores, avances
- **WhatsApp (equipo):** Alertas críticas, coordinar desbloqueadores, ideas urgentes
- **Email:** Reportes semanales, documentación importante
- **Supabase:** Fuente de verdad, respaldos, queries analíticas

### Protocolo Bloqueador
Cuando alguien está bloqueado:
1. Rellenar columna "Bloqueador" en Monday
2. Notificación automática a responsable bloqueador
3. Si no se resuelve en 2h: escalada a Dusan vía WhatsApp
4. Dusan prioriza desbloqueo o replantea iniciativa

### Protocolo Nueva Idea
1. Crear en Tablero 3: Ideas Nuevas & Roadmap
2. Dusan revisa diariamente (10 AM)
3. Si "Merece iniciativa propia" → crear I-NN en Tablero 1
4. Si es sub-tarea → agregar a iniciativa existente
5. Asignar responsable + fecha tentativa

---

## 📅 Calendarios & Vistas Clave

### Vista "Hoy" (Daily standup)
- Filtro: Tareas que vencen hoy
- Agrupado por Persona
- Muestra: Tarea, Siguiente Acción, Bloqueador
- Frecuencia de revisión: 8 AM

### Vista "Semana crítica 22-30 abr"
- Filtro: Fecha Límite entre 22-30 abr
- Ordenado por Prioridad
- Muestra: % completado, Responsable, Siguiente Acción
- Actualización: Diaria

### Vista "Calendario" (Timeline)
- Muestra iniciativas en timeline
- Dependencias visuales
- Crítica: ver solapamientos y conflictos
- Actualización: Cuando cambian fechas

### Vista "Roadmap Q2" (Gantt)
- Mayo-junio 2026
- Agrupar por Departamento
- Mostrar % completado
- Identificar cuellos de botella

---

## 🔐 Permisos & Acceso

| Usuario | Acceso | Permisos |
|---|---|---|
| **Dusan** | Todos los tableros | Admin (crear, editar, eliminar) |
| **Pablo** | T1, T2, T3 | Editor (crear sub-tareas, actualizar estado) |
| **Claude** | T1, T2, T3 | Editor (crear sub-tareas, actualizar estado) |
| **Equipo Reciclean** (futuro) | T1 solo lectura | Ver (no editar) |

---

## 📊 Métricas de Seguimiento

Trackear en Tablero 1 (Iniciativas):

- **Burndown semanal:** % promedio completado (22-abr = 15.9%, target 30-abr = 50%+)
- **Bloqueadores activos:** Cuántos y cuánto tiempo llevan bloqueados
- **Cumplimiento de fechas:** % de iniciativas que vencen ON TIME
- **Velocidad por departamento:** Tareas completadas/semana
- **Ideas convertidas:** Cuántas ideas del Tablero 3 se convirtieron en iniciativas (Tablero 1)

---

## 🚀 Plan de Implementación

**Semana 1 (3-7 may):**
- [ ] I-23.1 Crear tableros base (Claude, 3-4 may)
- [ ] I-23.2 Cargar 37 temas (Claude, 5-6 may)
- [ ] I-23.3 Configurar automatizaciones (Claude, 6-7 may)

**Semana 2 (8-10 may):**
- [ ] I-23.4 Entrenar equipo (Dusan, 8-9 may)
- [ ] I-23.5 Integración Supabase+n8n (Pablo+Claude, 9-10 may)
- [ ] Prueba de resumen diario automático (10 may)

**Semana 3+ (post 10-may):**
- Operación en vivo
- Ajustes basados en feedback
- Mejorar vistas y automatizaciones

---

## 📝 Documentación de Referencia

- `PENDIENTES.md` (P1-P6, bloqueadores)
- `STATUS.md` (estado consolidado Supabase)
- `SEGUIMIENTO_OPERATIVO.md` (dashboard estático)
- Este archivo: `MONDAY_ESTRUCTURA_MAESTRO.md`

---

**Propósito final:** Que cada mañana, Dusan y Pablo abran Monday, vean "Tareas de hoy" sin tener que revisar 5 documentos. Control centralizado, comunicación clara, prioridades visibles, nuevas ideas capturadas en el lugar correcto.

