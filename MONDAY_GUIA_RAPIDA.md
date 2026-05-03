# ⚡ Monday.com — Guía Rápida (1 página)

## 🌅 CADA MAÑANA (8 AM)

**Dusan:**
1. Abre Monday → Tablero `[MAESTRO] Iniciativas & Temas`
2. Haz click en vista **"Hoy"** (arriba a la izquierda)
3. ¿Qué ves? Tareas que vencen HOY + su siguiente acción
4. ¿Hay bloqueadores? Actualiza columna "Bloqueador" con lo que falta
5. ¿Recibiste notificación automática a las 8 AM? Si no, revisa que Slack esté conectado
6. ☕ Listo — tomas café con lista clara de prioridades

**Pablo:**
1. Abre Monday → Tablero `Tareas Diarias del Equipo`
2. Haz click en vista **"Hoy"** → filtra por TU nombre
3. Rellena: Qué hiciste ayer (✅ Completado), qué haces hoy (🟠 En curso)
4. Si algo está bloqueado (🔴), describe en "Bloqueador ahora"
5. Done — el equipo ve tu progreso automáticamente

---

## 📊 VER ESTADO EN 30 SEGUNDOS

| Quiero ver | Voy a | Hago clic |
|---|---|---|
| **Tareas de hoy** | Tablero 1 | Vista "Hoy" |
| **Qué hace cada quién** | Tablero 1 | Vista "Por Responsable" |
| **Tareas críticas** | Tablero 1 | Vista "Por Prioridad" |
| **Qué está bloqueado** | Tablero 1 | Vista "Bloqueadas" |
| **Cronograma mes** | Tablero 1 | Vista "Calendario" |
| **Progreso de hoy** | Tablero 2 | Vista "Hoy" |
| **Ideas nuevas** | Tablero 3 | — |

---

## ➕ AGREGAR ALGO NUEVO

### Tengo una nueva idea
1. Abre Tablero 3: `Ideas Nuevas & Roadmap`
2. Click "Add item"
3. Rellena: Idea, Categoría, Impacto, Esfuerzo
4. Dusan la revisa diariamente a las 10 AM
5. Si aprueba → se crea iniciativa I-XX en Tablero 1

### Mi tarea se bloquea
1. Ve a tu iniciativa en Tablero 1
2. Rellena columna "Bloqueador": "Esperando [quién/qué]"
3. **AUTOMÁTICO:** Notificación a responsable del bloqueador
4. Si no se resuelve en 2h → avisa a Dusan por WhatsApp

### Mi tarea tiene sub-tareas
1. Haz click en la iniciativa → "Add sub-item"
2. Crea sub-tareas (ej: "Mapear FKs", "Crear ER diagram")
3. Tu % completado se actualiza automáticamente
4. El responsable ve progreso en tiempo real

---

## 🔔 NOTIFICACIONES (automáticas)

| Cuándo | Quién recibe | Qué dice |
|---|---|---|
| **8 AM lunes-viernes** | Dusan + equipo | Tareas de hoy (Slack) |
| **Tarea vence HOY** | Responsable | "⏰ {Tarea} VENCE HOY" |
| **Tarea vence en 2 días** | Responsable | "⚠️ {Tarea} vence en 2d" |
| **Tarea bloqueada > 3 días** | Responsable + Dusan | "🔴 Bloqueada desde {fecha}" |
| **Sub-tarea completada** | Responsable padre | "✅ {Sub-tarea} hecha" |
| **5:30 PM diario** | Dusan | Resumen: completadas + en curso + bloqueadas |

> Si NO recibes notificaciones: verificar que tu Slack esté conectado (Settings → Integrations)

---

## 📋 CAMPOS IMPORTANTES

Cuando actualices una tarea, NO olvides:

### "% Completado" (0-100)
- 0% = no empezé
- 25% = diseño/spec listo
- 50% = en build
- 75% = casi listo
- 100% = ✅ done

### "Siguiente Acción" (texto concreto)
- ❌ MAL: "Trabajar en BD"
- ✅ BIEN: "Mapear 12 foreign keys y crear ER diagram"

### "Bloqueador" (si hay)
- Describe QUÉ bloquea
- Quién puede desbloquearlo
- AUTOMÁTICO: notificación al responsable

### "Notas Equipo" (comentarios)
- Actualización importante → escríbelo aquí
- El equipo recibe notificación
- Historial para revisión posterior

---

## 🚨 PROTOCOLOS

### Si está bloqueado (🔴)
1. **0-2h:** Describe bloqueador + espera
2. **2h+:** Avisa a Dusan por WhatsApp
3. **Próxima acción:** Replantearse iniciativa o conseguir recurso

### Si no va a alcanzar fecha (rojo)
1. Haz click en "Fecha Límite" → drag para extender
2. Comenta en "Notas Equipo": por qué se extiende
3. Avisa a Dusan para replanificación

### Si completas algo (✅)
1. Actualiza "% Completado" → 100%
2. Cambia "Estado" (si aplica) → "Validado"
3. **AUTOMÁTICO:** Notificación al equipo

---

## 🔗 LINKS RÁPIDOS

- **Tablero Maestro:** [monday.com/workspace/.../board/...](link)
- **Tareas Diarias:** [monday.com/workspace/.../board/...](link)
- **Ideas Nuevas:** [monday.com/workspace/.../board/...](link)
- **Documentación completa:** `MONDAY_ESTRUCTURA_MAESTRO.md`
- **¿Dudas?** Revisa `MONDAY_GUIA_IMPLEMENTACION.md`

---

## ⏱️ TIEMPO DEDICADO A MONDAY

- **Actualizar tu progreso:** 5 min (mañana + tarde)
- **Ver tareas de hoy:** 2 min
- **Reportar bloqueador:** 2 min
- **Revisar ideas nuevas (Dusan):** 10 min (1x día)
- **Total/día:** ~20 minutos

> Una tarea no reportada en Monday = el equipo no lo sabe. Actualiza siempre.

---

**Última actualización:** 2026-05-03 | **Responsable:** Claude Code | **Versión:** 1.0
