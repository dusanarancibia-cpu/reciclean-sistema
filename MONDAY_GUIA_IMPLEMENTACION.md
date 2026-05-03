# Guía de Implementación Monday.com — Reciclean-Farex

> **Objetivo:** Cargar los 37 temas en Monday.com con control de ejecución, prioridades y comunicación.
> **Tiempo estimado:** 3-4 horas (primera vez)
> **Quién:** Claude o Dusan (admin)
> **Prerequisitos:** Acceso a Monday.com workspace, CSV importable

---

## PARTE I: Preparación (30 min)

### Paso 1.1: Validar acceso a Monday.com
- [ ] Ir a [monday.com](https://monday.com)
- [ ] Login con cuenta Reciclean-Farex
- [ ] Verificar que tienes permisos de Admin (crear/editar tableros)
- [ ] Anotar: `workspace_id` y `board_api_key` (Settings → API)

### Paso 1.2: Descargar archivo de importación
- [ ] Archivo: `MONDAY_IMPORTAR_37_TEMAS.csv` (en este repo)
- [ ] Verificar que todos los campos estén completos (especialmente Código, Nombre, Responsable)
- [ ] Abrir en Excel o Google Sheets para validar formato

### Paso 1.3: Revisar estructura de tableros
- [ ] Leer `MONDAY_ESTRUCTURA_MAESTRO.md` (especialmente sección "Tableros Principales")
- [ ] Tener a mano la lista de columnas para cada tablero
- [ ] Anotar qué tipos de campo usar (Text, Dropdown, Date, Status, etc.)

---

## PARTE II: Crear Tableros Base (1 hora)

### Paso 2.1: Crear Tablero 1 — [MAESTRO] Iniciativas & Temas

1. **Ir a workspace → Click "Create board"**
   - Nombre: `[MAESTRO] Iniciativas & Temas`
   - Descripción: "Control centralizado de 25 iniciativas + 43 sub-tareas"
   - Icono: 📊

2. **Agregar columnas (en este orden):**

| # | Nombre Columna | Tipo | Propiedades |
|---|---|---|---|
| 1 | Código | Text | Requerido, Único |
| 2 | Nombre | Text | Requerido, ≤50 chars |
| 3 | Descripción | Text | Largo, ≤200 chars |
| 4 | Departamento | Dropdown | Opciones: Gerencia General, Tecnología, Comercial, Finanzas y Administración, Logística, Operaciones, Recursos Humanos, Legal y Compliance, Sostenibilidad |
| 5 | Responsable | Person | Seleccionar usuarios |
| 6 | Prioridad | Dropdown | 🔴 CRÍTICA, ⚠️ URGENTE, 🔵 Alta, 🟢 Media, 🔵 Baja |
| 7 | % Completado | Number | 0-100, mostrar % |
| 8 | Fecha Inicio | Date | Formato: DD-MM-YYYY |
| 9 | Fecha Límite | Date | Formato: DD-MM-YYYY, condicional rojo si passed |
| 10 | Vence Hoy? | Formula | `=IF(TODAY()={Fecha Límite},"🔴 HOY","")` |
| 11 | Bloqueador | Text | Largo, describir qué bloquea |
| 12 | Siguiente Acción | Text | Largo, texto concreto |
| 13 | Sub-tareas | Sub-items | Crear sub-items aquí |
| 14 | Última Actualización | Auto Update | Actualiza cuando se cambia row |
| 15 | Etiquetas | Tags/Labels | Multi-select |
| 16 | Link Documento | Link | URL a OneDrive/GitHub/Supabase |
| 17 | Notas Equipo | Updates | Activar comentarios |

3. **Configurar vistas:**
   - [ ] Vista "Hoy" (Filtro: Vence Hoy? = "🔴 HOY")
   - [ ] Vista "Semana crítica 22-30 abr" (Filtro: Fecha Límite entre 22-30 abr)
   - [ ] Vista "Por Prioridad" (Agrupar por Prioridad)
   - [ ] Vista "Por Responsable" (Agrupar por Responsable)
   - [ ] Vista "Por Estado" (Agrupar por Status/Prioridad)
   - [ ] Vista "Bloqueadas" (Filtro: Bloqueador NOT EMPTY)
   - [ ] Vista "Calendario" (Timeline: Fecha Inicio → Fecha Límite)

### Paso 2.2: Crear Tablero 2 — Tareas Diarias del Equipo

1. **Crear board:**
   - Nombre: `Tareas Diarias del Equipo`
   - Descripción: "Daily standup: qué hace cada quien hoy"
   - Icono: 📅

2. **Agregar columnas:**

| # | Nombre | Tipo | Props |
|---|---|---|---|
| 1 | Fecha | Date | Requerido |
| 2 | Persona | Person | Dropdown de usuarios |
| 3 | Tarea | Link | Link a Board 1 |
| 4 | Qué urge | Text | Largo |
| 5 | Horas estimadas | Number | |
| 6 | Estado Hoy | Status | 🔴 Bloqueado, 🟠 En curso, 🟢 Completado |
| 7 | Progreso | Number | 0-100% |
| 8 | Bloqueador ahora | Text | Quién/qué bloquea |
| 9 | Comunicación pendiente | Link | Link a persona responsable |
| 10 | Notas rápidas | Updates | Comentarios |

3. **Configurar vistas:**
   - [ ] Vista "Hoy" (Filtro: Fecha = TODAY)
   - [ ] Vista "Por Persona" (Agrupar por Persona)
   - [ ] Vista "Bloqueadas ahora" (Filtro: Estado = 🔴 Bloqueado)
   - [ ] Vista "Completadas hoy" (Filtro: Estado = 🟢 Completado)

### Paso 2.3: Crear Tablero 3 — Ideas Nuevas & Roadmap

1. **Crear board:**
   - Nombre: `Ideas Nuevas & Roadmap`
   - Descripción: "Inbox de ideas, priorización y asignación"
   - Icono: 💡

2. **Agregar columnas:**

| # | Nombre | Tipo | Props |
|---|---|---|---|
| 1 | Idea | Text | Requerido, largo |
| 2 | Quién propone | Person | |
| 3 | Cuándo | Auto Timestamp | Fecha creación |
| 4 | Categoría | Dropdown | Feature, Bug, Optimización, Integración, Documentación |
| 5 | Impacto estimado | Dropdown | Alto, Medio, Bajo |
| 6 | Esfuerzo estimado | Dropdown | 1d, 3d, 1w, 2w+ |
| 7 | ¿Merece iniciativa? | Dropdown | Sí → I-NN, No → sub-tarea, En revisión |
| 8 | Asignada a | Person | |
| 9 | Estado | Status | 📝 Nueva, 🔍 Revisión, 👍 Aprobada, ⏸️ Espera, ❌ Rechazada |
| 10 | Link a Iniciativa | Link | Link a I-XX en Board 1 |
| 11 | Notas evaluación | Text | Largo |

3. **Configurar vistas:**
   - [ ] Vista "Nuevas esta semana" (Filtro: Cuándo >= Monday)
   - [ ] Vista "Aprobadas pendientes" (Filtro: Estado = 👍)
   - [ ] Vista "Alto impacto" (Filtro: Impacto = Alto)
   - [ ] Vista "Backlog Q2" (Filtro: Cuándo >= 2026-05-01)

---

## PARTE III: Cargar los 37 Temas (1-1.5 horas)

### Paso 3.1: Opción A — Importar CSV (RECOMENDADO)

1. **En Tablero 1:**
   - [ ] Click menu "⋮" (esquina superior derecha)
   - [ ] Seleccionar "Import from CSV"
   - [ ] Cargar archivo: `MONDAY_IMPORTAR_37_TEMAS.csv`
   - [ ] Mapear columnas (CSV → Monday):
     - `Código` → Código
     - `Nombre` → Nombre
     - `Descripción` → Descripción
     - (etc., seguir el patrón)
   - [ ] Click "Import"
   - [ ] Verificar que se importaron 30 filas (25 iniciativas + 5 P's)

2. **Validar datos importados:**
   - [ ] Expandir vista "Por Responsable" → verificar asignaciones
   - [ ] Filtrar Prioridad = 🔴 CRÍTICA → debe mostrar I-08, I-12, P2, P5
   - [ ] Buscar "I-23" → debe estar visible (Implementación Monday)
   - [ ] Verificar fechas límite (especialmente 22-abr, 30-abr)

### Paso 3.2: Opción B — Manual (si CSV no funciona)

1. **Crear iniciativas padre manualmente:**
   - [ ] Click "Add item" en Tablero 1
   - [ ] Rellenar fila 1 con I-01:
     - Código: `I-01`
     - Nombre: `Mapa BD + Foreign Keys`
     - Departamento: Tecnología
     - Responsable: Claude
     - Prioridad: Alta
     - % Completado: 30
     - Fecha Límite: 2026-04-29
     - Siguiente Acción: `Mapear FKs+ER+RLS`
   - [ ] Crear 24 filas más (I-02 → I-25)
   - [ ] Crear 5 filas adicionales (P1 → P6)

2. **Tiempo:** ~30 minutos (tedioso pero posible)

### Paso 3.3: Validación Post-Importación

- [ ] Total de filas: 30 (25 iniciativas + 5 P's)
- [ ] Campos requeridos NO vacíos: Código, Nombre, Responsable, Fecha Límite
- [ ] Prioridades distribuidas: 4 CRÍTICA, 7 URGENTE, 8 Alta, 6 Media, 5 Baja
- [ ] % Completado: suma total ~22% (es un baseline realista)
- [ ] Todas las fechas en formato correcto (DD-MM-YYYY)

---

## PARTE IV: Configurar Automatizaciones (1 hora)

### Paso 4.1: Notificación Vencimiento Hoy

1. **En Tablero 1 → Automations (⚙️)**
2. **Click "Create automation"**
3. **Configurar:**
   - Trigger: "When column Fecha Límite changes"
   - Condition: Fecha Límite = TODAY
   - Action: "Send notification to Responsable"
   - Mensaje: "⏰ {Nombre} VENCE HOY. Siguiente: {Siguiente Acción}"
   - Frecuencia: Diaria a las 8 AM

### Paso 4.2: Notificación -2 Días

1. **Crear otra automatización:**
   - Trigger: "On Monday at 4 PM"
   - Condition: Fecha Límite = TODAY + 2
   - Action: "Send notification to Responsable"
   - Mensaje: "⚠️ {Nombre} vence en 2 días"

### Paso 4.3: Alerta Bloqueadas > 3 Días

1. **Crear automatización:**
   - Trigger: "Daily at 12 PM"
   - Condition: Bloqueador NOT EMPTY AND (TODAY - Última Actualización) > 3
   - Action: "Send notification to Responsable + Dusan"
   - Mensaje: "🔴 {Nombre} bloqueada por: {Bloqueador} (desde hace {días})"

### Paso 4.4: Resumen Diario Automático (si Monday tiene integración Slack)

1. **Settings → Integrations → Slack**
2. **Conectar workspace Slack**
3. **Create automation:**
   - Trigger: "Weekdays at 8 AM"
   - Action: "Post to Slack #general"
   - Mensaje template:
     ```
     📋 TAREAS DE HOY ({fecha})
     
     {lista de tareas Fecha Límite = TODAY}
     
     🔴 Bloqueadores activos: {count}
     
     Link rápido: {link a vista "Hoy"}
     ```

---

## PARTE V: Entrenar Equipo (30 min)

### Paso 5.1: Sesión Demo para Dusan

**Qué mostrar (15 min):**
1. Abrir Tablero 1 → Vista "Hoy"
2. Explicar qué ve: tareas que vencen hoy, siguiente acción, bloqueadores
3. Abrir vista "Por Prioridad" → ver críticas primero
4. Mostrar cómo rellenar "Siguiente Acción" (importante)
5. Mostrar columna "Bloqueador" y cómo dispara notificación
6. Demo: Cambiar estado de una tarea → notificación automática
7. Mostrar Tablero 3: Ideas Nuevas (cómo capturar ideas)

**Handoff:**
- Dusan revisa "Hoy" cada mañana a las 8 AM
- Actualiza bloqueadores cuando aparezcan
- Aprueba nuevas ideas en Tablero 3

### Paso 5.2: Sesión Demo para Pablo

**Qué mostrar (15 min):**
1. Tablero 1 → mostrar iniciativas asignadas a él
2. Explicar "% Completado" (automático con sub-tareas)
3. Cómo crear sub-tareas dentro de una iniciativa
4. Tablero 2: Tareas Diarias → cómo reportar avances
5. Demo: Cambiar "Estado Hoy" de "En curso" a "Completado"
6. Mostrar notificaciones automáticas en acción

**Handoff:**
- Pablo actualiza % completado regularmente
- Reporta bloqueadores en columna "Bloqueador"
- Usa Tablero 2 para standup diario

### Paso 5.3: Crear "Guía Rápida" en Docusaurus o PDF

Archivo: `MONDAY_GUIA_RAPIDA_1PAGE.md`
- Qué hacer cada mañana
- Cómo reportar avances
- Cómo escalar bloqueadores
- Links rápidos

---

## PARTE VI: Integración Supabase (opcional, 30 min)

### Paso 6.1: Webhook Monday → Supabase (n8n)

Si quieres sincronizar Monday ↔ Supabase:

1. **En n8n:**
   - Crear workflow: "Monday to Supabase Sync"
   - Trigger: Webhook de Monday (cuando se crea/actualiza item)
   - Action: INSERT/UPDATE en tabla `temas_en_progreso` (Supabase)
   - Mapeo de campos:
     - Monday `Código` → Supabase `codigo`
     - Monday `% Completado` → Supabase `porcentaje`
     - Monday `Fecha Límite` → Supabase `fecha_limite`
     - etc.

2. **Webhook inverso:** Supabase → Monday (si cambios en BD)
   - Trigger: Supabase `on_update` en tabla
   - Action: Update item en Monday

### Paso 6.2: Dashboard espejo en Supabase

- Supabase = respaldo si Monday cae
- Query: `SELECT * FROM temas_en_progreso ORDER BY prioridad DESC`
- Visualización: misma que Monday

---

## PARTE VII: Checklist Post-Implementación

- [ ] ✅ 3 tableros creados (Maestro, Diarias, Ideas)
- [ ] ✅ 30 iniciativas + 5 P's cargadas
- [ ] ✅ Todas las columnas configuradas
- [ ] ✅ Vistas básicas funcionales (Hoy, Por Prioridad, etc.)
- [ ] ✅ 4 automatizaciones activas (notificaciones)
- [ ] ✅ Dusan + Pablo entrenados
- [ ] ✅ Primer resumen automático enviado (test)
- [ ] ✅ Documentación actualizada en GitHub
- [ ] ✅ Links Monday guardados en CLAUDE.md

---

## PARTE VIII: Troubleshooting

### Problema: Import CSV falla
**Solución:** Validar que no haya comas dentro de campos. Usar CSV bien formado. Si persiste, hacer manual (Paso 3.2).

### Problema: Automatización no dispara
**Solución:** Verificar que Slack/Email esté conectado. Revisar "Automation history" para ver logs.

### Problema: Vista "Por Prioridad" está vacía
**Solución:** Verificar que todas las filas tengan valor en columna "Prioridad". Rellenar vacíos.

### Problema: Sub-tareas no aparecen en % automático
**Solución:** Habilitar "Roll-up" en columna "% Completado": Settings → Show sub-item % en padre.

---

## CONTACTO & SOPORTE

- **Documentación maestra:** `MONDAY_ESTRUCTURA_MAESTRO.md`
- **CSV de importación:** `MONDAY_IMPORTAR_37_TEMAS.csv`
- **Preguntas:** Revisar `MONDAY_ESTRUCTURA_MAESTRO.md` sección "Automatizaciones"
- **Bugs Monday:** Reportar a Monday support o al equipo Reciclean

---

**Próximo paso:** Una vez completada esta guía, Monday estará operativo para el equipo. Revisar resultados y ajustar después de 1 semana de uso.

