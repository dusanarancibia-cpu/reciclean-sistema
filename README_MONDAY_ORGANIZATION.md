# 📊 Organización Monday.com — Reciclean-Farex

> **Estado:** Documentación lista para implementación (I-23)  
> **Fecha:** 2026-05-03  
> **Objetivo:** Centralizar 37 temas con control de ejecución, prioridades y comunicación

---

## 🎯 ¿Por qué Monday.com?

**Problema:** 37 temas dispersos en Supabase + STATUS.md + PENDIENTES.md + chats. El equipo no sabe qué es prioritario, quién hace qué, y dónde capturar nuevas ideas.

**Solución:** Una plataforma visual que:
- ✅ Muestre tareas del día cada mañana
- ✅ Controle prioridades y bloqueadores
- ✅ Notifique automáticamente vencimientos
- ✅ Capture nuevas ideas en el lugar correcto
- ✅ Genere reportes sin tocar Excel

---

## 📚 Documentación (4 archivos)

### 1. **[MONDAY_ESTRUCTURA_MAESTRO.md](./MONDAY_ESTRUCTURA_MAESTRO.md)** ← EMPIEZA AQUÍ
   - **Qué es:** Diseño conceptual de la solución
   - **Para quién:** Dusan (decisiones), Equipo (entender el sistema)
   - **Tiempo de lectura:** 15 min
   - **Contiene:**
     - 3 tableros (Maestro, Diarias, Ideas)
     - 37 temas mapeados a iniciativas
     - 17 columnas y sus propósitos
     - 6 automatizaciones
     - Métricas de seguimiento

### 2. **[MONDAY_GUIA_IMPLEMENTACION.md](./MONDAY_GUIA_IMPLEMENTACION.md)**
   - **Qué es:** Paso a paso técnico (como receta)
   - **Para quién:** Claude o Dusan (quien hace la implementación)
   - **Tiempo:** 3-4 horas primera vez
   - **Contiene:**
     - 8 partes (Prep, Crear Tableros, Cargar Datos, Automatizaciones, Entrenar, Integración, Checklist)
     - Scripts y configuraciones exactas
     - Screenshots conceptuales
     - Troubleshooting

### 3. **[MONDAY_GUIA_RAPIDA.md](./MONDAY_GUIA_RAPIDA.md)**
   - **Qué es:** Referencia rápida de 1 página
   - **Para quién:** Dusan, Pablo, equipo (uso diario)
   - **Tiempo de consulta:** 2 min
   - **Contiene:**
     - Qué hacer cada mañana
     - Cómo ver estado en 30 seg
     - Cómo agregar cosas nuevas
     - Protocolos de bloqueadores
     - Notificaciones explícadas

### 4. **[MONDAY_IMPORTAR_37_TEMAS.csv](./MONDAY_IMPORTAR_37_TEMAS.csv)**
   - **Qué es:** Archivo importable directamente a Monday
   - **Para quién:** Herramienta de implementación
   - **Formato:** CSV con columnas mapeadas
   - **Contiene:** 30 filas (25 iniciativas I-01..I-25 + 5 tareas P1..P6)

---

## 🏗️ Estructura de los 3 Tableros

### Tablero 1: [MAESTRO] Iniciativas & Temas
**Propósito:** Visión integral de 25 iniciativas padre + 43 sub-tareas

| Tipo | Cantidad |
|---|---|
| Iniciativas padre | 25 (I-01 a I-25) |
| Tareas especiales | 5 (P1 a P6: Mergear PR, Patch Diego, Difundir página, Monitoreo, Iteración) |
| Sub-tareas | ~43 (creadas dentro de iniciativas) |
| Vistas | 7 (Hoy, Por Prioridad, Por Responsable, Bloqueadas, Calendario, etc.) |

**Columnas clave:**
- `Código` (I-01, P2, etc.)
- `Nombre` (≤50 chars)
- `Prioridad` (CRÍTICA, URGENTE, Alta, Media, Baja)
- `% Completado` (0-100)
- `Fecha Límite` (notificación automática si passed)
- `Bloqueador` (QUÉ bloquea → notificación automática)
- `Siguiente Acción` (texto concreto: qué es lo próximo)
- `Responsable` (Dusan, Pablo, Claude)

**Vistas predefinidas:**
1. **"Hoy"** - Tareas que vencen hoy (standup matutino)
2. **"Semana crítica 22-30 abr"** - Lanzamiento Diego v5.0
3. **"Por Prioridad"** - Primero CRÍTICA
4. **"Por Responsable"** - Qué hace cada quién
5. **"Bloqueadas"** - Qué está atascado
6. **"Calendario"** - Timeline visual
7. **"Este mes"** - Mayo 2026

### Tablero 2: Tareas Diarias del Equipo
**Propósito:** Daily standup: quién hace qué hoy, qué progreso

| Fecha | Persona | Tarea | Horas | Estado | Progreso | Bloqueador |
|---|---|---|---|---|---|---|
| 2026-05-03 | Dusan | I-08 Rotar keys | 1 | 🔴 Bloqueado | 10% | Esperando archivo |
| 2026-05-03 | Pablo | I-09 Infra VPS | 4 | 🟠 En curso | 40% | None |
| 2026-05-03 | Claude | I-23 Monday | 3 | 🟠 En curso | 5% | None |

**Vistas:**
- "Hoy" (Fecha = TODAY)
- "Por Persona" (¿Qué hace Dusan? ¿Qué hace Pablo?)
- "Bloqueadas ahora" (Qué se detiene)
- "Completadas hoy" (Qué se alcanzó)

### Tablero 3: Ideas Nuevas & Roadmap
**Propósito:** Inbox de ideas, evaluación y asignación a iniciativa

| Idea | Quién | Impacto | Esfuerzo | ¿Merece I-NN? | Estado | Asignada a |
|---|---|---|---|---|---|---|
| "Agregar BI dashboard" | Dusan | Alto | 1w+ | Sí → I-05.3 | 👍 Aprobada | Claude |
| "Arreglar bug Diego loops" | Nicolas | Alto | 3d | Sí → P5.2 | 👍 Aprobada | Claude |
| "Documentación API" | Pablo | Medio | 1w | No → I-13.5 | 🔍 Revisión | Pablo |
| "Crear slider precios" | Jair | Bajo | 1d | No → I-11.4 | 📝 Nueva | — |

**Vistas:**
- "Nuevas esta semana"
- "Aprobadas pendientes" (esperar I-XX)
- "Alto impacto"
- "Backlog Q2" (ideas para mayo+)

---

## 🚀 3 Razones por las que esto funciona

### 1️⃣ Centralización
Antes: Status.md + Pendientes.md + Supabase + chats  
Ahora: 1 plataforma, 3 tableros, actualizados en tiempo real

### 2️⃣ Visibilidad
Antes: Dusan no sabe qué está bloqueando a Pablo  
Ahora: Columna "Bloqueador" + notificación automática → Dusan lo ve inmediato

### 3️⃣ Captura de Ideas
Antes: Ideas llegan por WhatsApp, algunos las olvidan  
Ahora: Tablero 3 las captura, Dusan las revisa 10 AM, se asignan o rechazan

---

## 📋 Resumen de Tareas (37 temas)

| Prioridad | Cantidad | Ejemplos |
|---|---|---|
| 🔴 CRÍTICA | 4 | I-08 (Rotar keys), I-12 (Diego v5.0), P2 (Patch Diego), P5 (Bugs v4.3) |
| ⚠️ URGENTE | — | (sub-categoría de Alta) |
| 🔵 Alta | 7 | I-01 (Mapa BD), I-04 (Tracker), I-09 (VPS), I-10 (Sprint ventas), I-11 (ACI), I-19 (Plan), P1 (URLs) |
| 🟢 Media | 14 | I-02, I-03, I-05, I-06, I-14, I-15, I-18, I-22, I-23, I-24, P3, P4, P6 |
| 🔵 Baja | 8 | I-07, I-13, I-16, I-17, I-20, I-21, I-25 |

**Total:** 30 filas cargables (25 iniciativas + 5 tareas)

---

## 📅 Calendario Crítico (integrado en Monday)

```
April 2026                May 2026             June 2026
22-30 aprox (CRÍTICA)     3-10 (I-23 impl)     Todo
├─ I-08: 22-abr 🔴        ├─ I-04: 30-abr 🚀   └─ I-21: 30-jun
├─ I-12: 30-abr 🚀        ├─ I-19: 30-abr      
├─ I-10: 28-abr ⚠️        ├─ I-23: 10-may      
└─ I-09: 28-abr           ├─ I-11: 5-may       
                          └─ I-02/I-03: 10-15  
```

---

## 🔄 Flujo Típico

### Mañana (8 AM)
1. Dusan abre Monday → Vista "Hoy" (tablero 1)
2. Ve: I-08 (Rotar keys) + 2 tareas más que vencen hoy
3. Recibe notificación automática: "3 tareas vencen HOY"
4. Asigna recursos, identifica bloqueadores
5. Avisa al equipo vía WhatsApp

### Durante el día
- Pablo + Claude actualizan % completado cada 2-3 horas
- Si hay bloqueador: rellenan "Bloqueador ahora" → notificación automática
- Ideas nuevas llegan → se crean en Tablero 3

### Tarde (5:30 PM)
1. Dusan recibe resumen automático: "3 completadas, 2 en curso, 1 bloqueada"
2. Revisa Tablero 3: Ideas aprobadas / rechazadas
3. Planifica ajustes para mañana

---

## ✅ Implementación (Semana 1: 5-9 mayo)

**I-23 desglosado:**

| Sub-tarea | Responsable | Día | Tiempo |
|---|---|---|---|
| I-23.1 Crear 3 tableros base | Claude | 5-6 may | 1.5h |
| I-23.2 Cargar 37 temas (CSV) | Claude | 5-6 may | 1.5h |
| I-23.3 Configurar automatizaciones | Claude | 6-7 may | 1h |
| I-23.4 Entrenar equipo (demos) | Dusan | 8-9 may | 1h |
| I-23.5 Integración Supabase+n8n | Pablo+Claude | 9-10 may | 1.5h |
| **TOTAL** | — | **5 días** | **~6h** |

---

## 📞 Próximos Pasos

### HOY (2026-05-03)
- [ ] Leer `MONDAY_ESTRUCTURA_MAESTRO.md` (15 min)
- [ ] Leer `MONDAY_GUIA_RAPIDA.md` (5 min)
- [ ] Decidir: ¿Empezamos implementación 5-may?

### Semana 5-9 mayo
- [ ] Claude: Implementar según `MONDAY_GUIA_IMPLEMENTACION.md`
- [ ] Dusan: Revisar avances, aprobar automatizaciones
- [ ] Pablo: Preparar integración Supabase

### 10 mayo
- ✅ Monday en vivo y operativo
- ✅ Equipo entrenado
- ✅ Primer resumen automático funcional

---

## 📞 Contactos & Documentación

| Necesito | Consulto |
|---|---|
| **Entender la solución** | `MONDAY_ESTRUCTURA_MAESTRO.md` (diseño conceptual) |
| **Implementar** | `MONDAY_GUIA_IMPLEMENTACION.md` (paso a paso) |
| **Usar diariamente** | `MONDAY_GUIA_RAPIDA.md` (1 página) |
| **Importar datos** | `MONDAY_IMPORTAR_37_TEMAS.csv` (listo para cargar) |
| **Ver código de implementación** | `I-23` en Tablero 1 (una vez cargado) |

---

## 🎯 Beneficio Esperado

**Ahora (sin Monday):**
- Dusan pasa 30 min cada mañana leyendo 3-4 documentos
- Pablo no sabe si debe enfocarse en I-09 o I-11
- Ideas nuevas se pierden en chats
- Bloqueadores se resuelven lentamente (comunicación lenta)
- No hay visibilidad de quién hace qué

**Después (con Monday):**
- Dusan ve "Tareas de hoy" en 2 minutos
- Pablo sabe exactamente su prioridad (1. I-09, 2. I-11)
- Ideas llegan a Tablero 3 → evaluadas en 24h
- Bloqueadores → notificación inmediata → resolución rápida
- Equipo ve en tiempo real quién hace qué, cuándo se entrega

---

**Conclusión:** Monday.com es la herramienta que Reciclean-Farex necesitaba para coordinar 37 temas sin pierde contexto. Fácil de implementar, fácil de usar, genera reportes automáticamente.

🚀 **Listo para empezar 5 de mayo.**

