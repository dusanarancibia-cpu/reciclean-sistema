# 📁 Estructura de Silos — Reciclean-Farex

> **Espejo de Monday.com en el sistema de archivos**  
> Cada carpeta silo (01-10) corresponde a un tablero Monday con iniciativas asignadas

---

## 🎯 Propósito

Esta estructura organiza los 37 temas/iniciativas por departamento, espejando exactamente la organización en Monday.com. Permite:

- ✅ Localizar archivos por silo/responsable sin desorden
- ✅ Vincular archivos a iniciativas Monday
- ✅ Auditoría clara de quién hace qué
- ✅ Escalabilidad: agregar silos sin afectar existentes

---

## 📂 Silos (10 departamentos)

### 01_GERENCIA_GENERAL
**Responsable:** Dusan  
**Iniciativas:** 3 (I-18, I-24, I-25)

- `Estrategia/` — Planes maestros, roadmap
- `Reportes/` — Reportes ejecutivos, análisis
- `KPIs/` — Métricas, dashboards

**Ejemplos:**
- I-18: Análisis Competencia → `Estrategia/Competencia_2026.md`
- I-24: Integración Google Workspace → `Reportes/Workspace_Setup.md`

---

### 02_TECNOLOGIA
**Responsable:** Claude (+ Pablo)  
**Iniciativas:** 10 (I-01, I-04, I-05, I-09, I-12, I-16, I-19, I-20, I-21, I-23)

- `BD_y_Arquitectura/` — Esquema, migraciones, ER diagrams
  - `Mapa_BD_ER.mmd`
  - `Foreign_Keys_v3.sql`
  - `Migrations/` (v1_initial, v2_erratas, v3_diego_mediciones)
  
- `Agente_Diego/` — Código del agente, prompts, validaciones
  - `Manifiesto/` (visión, features)
  - `Prompts/` (sistema, usuario, ejemplos)
  - `Validaciones/` (tests, casos edge)
  - `Monitoreo/` (logs, métricas)
  
- `Infraestructura/` — VPS, n8n, Supabase
  - `VPS/` (configs, SSL, backups)
  - `n8n_workflows/` (automaciones)
  - `Supabase/` (funciones, triggers)
  
- `Tracker_Temas/` — Control de estado
  - `STATUS.md` (estado actual)
  - `PENDIENTES.md` (bloqueadores)
  - `Snapshots_diarios/` (histórico)
  
- `Documentacion/` — Specs, diagramas
  - `API_specs/` (OpenAPI/Swagger)
  - `Mermaid_diagrams/` (flujos, arquitectura)
  - `ECharts_configs/` (visualizaciones)
  
- `Tareas_Diarias/` — Standup, daily logs
  - `2026_05/` (mayo)
  - `Backlog/` (tareas futuras)

**Ejemplos:**
- I-01: Mapa BD → `BD_y_Arquitectura/Mapa_BD_ER.mmd`
- I-12: Diego v5.0 → `Agente_Diego/Manifiesto/v5.0.md`
- I-09: VPS Infra → `Infraestructura/VPS/config.yml`
- I-23: Implementar Monday → `Tareas_Diarias/2026_05/I-23_monday.md`

---

### 03_COMERCIAL
**Responsable:** Dusan / equipo  
**Iniciativas:** 5 (I-02, I-03, I-10, I-11, I-14)

- `Cotizaciones/` — Plantillas, ejemplos
- `Propuestas/` — Comercial, presupuestos
- `Clientes/` — Base clientes, contactos
- `Tareas_Diarias/` — Seguimiento diario

**Ejemplos:**
- I-02: Página Reciclean → `Propuestas/Reciclean_Redesign_v1.md`
- I-10: Sprint Ventas → `Clientes/Clientes_2026_05.csv`
- I-11: ACI Integración → `Cotizaciones/ACI_Integration.md`

---

### 04_OPERACIONES
**Responsable:** Pablo / Dusan  
**Iniciativas:** 2 (I-06, I-22)

- `Procesos/` — Documentación de procesos
- `Logistica_Interna/` — Control de flujos
- `Tareas_Diarias/` — Seguimiento

---

### 05_ABASTECIMIENTO
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 1 (I-07)

- `Proveedores/` — Base proveedores
- `Contratos/` — Acuerdos vigentes
- `Tareas_Diarias/` — Gestión diaria

---

### 06_LOGISTICA
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 1 (I-15)

- `Rutas/` — Planificación
- `Inventario/` — Control stock
- `Tareas_Diarias/` — Daily ops

---

### 07_FINANZAS_ADMIN
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 2 (I-08, I-17)

- `Presupuestos/` — Planificación financiera
- `Estados_Financieros/` — Reportes contables
- `Tareas_Diarias/` — Gestión administrativa

**Ejemplos:**
- I-08: Rotar Keys → `Presupuestos/Keys_Rotation_Plan.md`

---

### 08_RECURSOS_HUMANOS
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 1 (I-13)

- `Nómina/` — Control de salarios
- `Capacitación/` — Entrenamientos, cursos
- `Tareas_Diarias/` — RH operativa

---

### 09_LEGAL_COMPLIANCE
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 2 (P3, P4)

- `Contratos/` — Documentos legales
- `Regulaciones/` — Cumplimiento normativo
- `Tareas_Diarias/` — Legal operativa

---

### 10_SOSTENIBILIDAD
**Responsable:** (Pendiente asignar)  
**Iniciativas:** 2 (P5, P6)

- `Reportes_ESG/` — Reportes ambientales
- `Iniciativas/` — Proyectos sostenibles
- `Tareas_Diarias/` — Sostenibilidad operativa

---

## 🔄 Flujo: Archivo → Monday → Notificación

```
1. Claude edita BD_y_Arquitectura/Foreign_Keys_v3.sql
   ↓
2. Commit con referencia: "I-01: Actualizar Foreign Keys"
   ↓
3. Webhook en Monday (future) → actualiza I-01 % completado
   ↓
4. Notificación automática: "✅ Claude avanzó en I-01"
   ↓
5. Dusan recibe en Slack/email
```

---

## 📋 Mapeo Completo (Silos ↔ Monday ↔ Iniciativas)

| Silo | Responsable | Monday Board | Iniciativas | Total |
|------|-------------|---|---|---|
| 01 Gerencia General | Dusan | [MAESTRO] | I-18, I-24, I-25 | 3 |
| 02 Tecnología | Claude | [MAESTRO] | I-01, I-04, I-05, I-09, I-12, I-16, I-19, I-20, I-21, I-23 | 10 |
| 03 Comercial | Dusan | [MAESTRO] | I-02, I-03, I-10, I-11, I-14 | 5 |
| 04 Operaciones | Pablo | [MAESTRO] | I-06, I-22 | 2 |
| 05 Abastecimiento | ? | [MAESTRO] | I-07 | 1 |
| 06 Logística | ? | [MAESTRO] | I-15 | 1 |
| 07 Finanzas Admin | ? | [MAESTRO] | I-08, I-17 | 2 |
| 08 RRHH | ? | [MAESTRO] | I-13 | 1 |
| 09 Legal Compliance | ? | [MAESTRO] | P3, P4 | 2 |
| 10 Sostenibilidad | ? | [MAESTRO] | P5, P6 | 2 |
| **TOTAL** | — | — | **30 iniciativas** | **30** |

---

## 🔐 Permisos por Silo (Fase 2)

En Monday.com (después de Phase 1), cada silo tendrá:

- **Owner/Edit:** Responsable del silo
- **Comment:** Equipo relacionado
- **View only:** Otros departamentos (visibilidad cross-silo)

Implementación: Groups en Monday + Supabase RLS policies

---

## 📅 Roadmap

### Fase 1 (5-10 mayo)
- ✅ Crear 3 tableros base en Monday
- ✅ Cargar 30 iniciativas (CSV)
- ✅ Configurar automatizaciones básicas
- ✅ Crear estructura de carpetas (HECHO ← aquí)

### Fase 2 (1-14 junio)
- [ ] Crear tableros silo-específicos en Monday
- [ ] Configurar permisos por silo
- [ ] Vincular archivos a iniciativas

### Fase 3 (junio+)
- [ ] Integración Supabase → Monday (webhook)
- [ ] Reportes automáticos por silo
- [ ] Historial de cambios linked a commits

---

## ✅ Checklist de Uso

- [ ] Leer este archivo (5 min)
- [ ] Localizar tu silo (dónde estoy)
- [ ] Identificar tus iniciativas (qué hago)
- [ ] Crear subdirectorio si necesitas
- [ ] Vincular archivos a I-XX en nombres o notas
- [ ] Actualizar en Monday al trabajar

---

**Última actualización:** 2026-05-03  
**Responsable:** Claude Code  
**Versión:** 1.0

