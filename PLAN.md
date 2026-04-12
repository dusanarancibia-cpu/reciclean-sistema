# PLAN DE AVANCE — Reciclean-Farex Sistema

**Proyecto:** Sistema Comercial Reciclean-Farex (Asistente + Panel Admin + Chatbot)
**Fecha de actualización:** 2026-04-12
**Versión actual:** v93

---

## RESUMEN EJECUTIVO

Sistema web para gestión comercial de venta de materiales reciclados, compuesto por tres módulos principales: Panel de Administración, Asistente Comercial y Chatbot Widget. Incluye integración con Supabase, generación de PDF, tracking de uso y soporte multi-sucursal (Santiago, Talca, Puerto Montt).

---

## NIVEL DE AVANCE GLOBAL: 75%

```
[========================================----------------]  75%
```

---

## AVANCE POR MODULO

### 1. Panel de Administración (`index.html`) — 85%
```
[===========================================-----------]  85%
```
- Tab A: Precios y configuración de materiales
- Tab B: Alias y parseo de materiales (formato pipe HUAL)
- Tab C: Comisiones y márgenes por sucursal
- Tab F: Gestión de usuarios autorizados
- Tab I: Monitoreo de uso con dashboard y exportación PDF por trabajador
- Revisor de precios panel vs asistente
- Config Empresa
- Botón cerrar sesión
- Responsive mobile (480/414/375 px)

### 2. Asistente Comercial (`asistente.html`) — 80%
```
[==========================================-----------]  80%
```
- Login por teléfono + PIN
- Formulario Datos del Negocio completo
- Búsqueda y selección de materiales con alias
- Cálculo de precios en tiempo real con tramos
- Generación de cotización PDF
- Compartir por WhatsApp
- Scroll horizontal de categorías
- Layout flex height:100vh

### 3. Chatbot Widget (`chatbot-v2.html`) — 70%
```
[=======================================--------------]  70%
```
- Flujo de negociación completo (selección, cotización, cierre)
- Carrito multi-material con tramo por suma total
- Selector de materiales rediseñado (grid multi-select)
- Tablas de precios por familia para metales Farex
- Solicitud de foto con código de verificación
- Captura de RUT y cierre por WhatsApp/email
- Rediseño gráfico v3 "Kraft Eco" (fondo crema, textura papel reciclado)
- Launcher rediseñado (círculo verde + burbuja chat + icono Reciclean)
- Avatar Reciclean con fondo blanco nítido
- Logos reales GRC + Farex

### 4. Sistema de Precios (`precios.js`, `config.js`) — 85%
```
[===========================================-----------]  85%
```
- Precios por sucursal con márgenes compensados
- Factores de ajuste Talca y Puerto Montt corregidos
- Snapshot de precios para publicación
- Comisión ejecutivo (%E) con default 0.25%
- Metales Farex con disponibilidad por sucursal

### 5. Tracking y Monitoreo (`tracking.js`, `tracking-dashboard.js`) — 75%
```
[=========================================-----------]  75%
```
- Registro de 13 tipos de eventos
- Dashboard con semáforo por trabajador
- Resumen numérico de 8 métricas
- Timeline sesión por sesión con eventos y metadata
- Exportación PDF por trabajador
- Tabla `eventos_asistente` en Supabase con RLS e índices

### 6. Autenticación (`auth.js`) — 90%
```
[=============================================---------]  90%
```
- Login email + PIN (panel admin)
- Login teléfono + PIN (asistente comercial)
- Sesión en localStorage con expiración 24h
- Tabla `usuarios_autorizados` en Supabase

### 7. PWA / Mobile — 60%
```
[====================================------------------]  60%
```
- manifest.json configurado
- Service Worker básico (sw.js)
- Responsive para pantallas 375-480px
- Falta: offline completo, push notifications

### 8. Base de Datos (Supabase) — 80%
```
[===========================================-----------]  80%
```
- Tablas de usuarios, precios, eventos
- Row Level Security (RLS)
- Índices optimizados
- Vista `v_precios_activos`
- SQL de migración documentado

---

## DETALLE DE TAREAS POR PERSONA

### DUSAN ARANCIBIA — Desarrollo principal

#### Semana 6-10 Abril 2026 (58 commits totales)

**Dia 10 Abril (viernes):**
| # | Tarea | Estado |
|---|-------|--------|
| 1 | Botón PDF por trabajador en Tab I Monitoreo — genera reporte descargable con header, semáforo, 8 métricas y timeline de sesiones | Completado |

**Dia 9 Abril (jueves):**
| # | Tarea | Estado |
|---|-------|--------|
| 1 | Sistema de monitoreo de uso del Asistente Comercial — nuevo módulo completo (`tracking.js`, `tracking-dashboard.js`, tabla SQL) | Completado |
| 2 | Fix: tracking dashboard usa `_supabase` (nombre correcto del cliente en admin panel) | Completado |
| 3 | Fix: márgenes compensados Talca/Puerto Montt reemplazan SUC_FACTOR | Completado |
| 4 | Fix: factores de ajuste Talca y Puerto Montt corregidos a 1.0 | Completado |
| 5 | Fix: avatar chatbot fondo blanco nítido + bubbles más anchos | Completado |
| 6 | Fix: avatar chatbot sin fondo verde + texto desplazado a la derecha | Completado |
| 7 | Launcher chatbot rediseñado como componente CSS puro | Completado |
| 8 | Nuevo launcher chatbot — círculo verde con burbuja chat + icono Reciclean | Completado |

**Dia 8 Abril (miércoles):**
| # | Tarea | Estado |
|---|-------|--------|
| 1 | Rediseño selector materiales chatbot v2 — grid multi-select + tablas inline kg | Completado |
| 2 | Merge rediseño selector materiales + tabla metales Farex | Completado |
| 3 | Fix + rediseño visual: bug flujo sin opciones + tabla chatbot v2 | Completado |
| 4 | Reemplazar badges texto por logos reales (GRC + Farex) | Completado |
| 5 | Rediseño gráfico v3 según Especificaciones Técnicas PDF | Completado |
| 6 | Concepto Kraft Eco — fondo crema, textura papel reciclado | Completado |
| 7 | 3 ajustes visuales chatbot — launcher, avatar, burbujas | Completado |
| 8 | Avatar Reciclean-icon + overflow-proof en todos los bloques | Completado |
| 9 | Carrito multi-material con tramo por suma total + precios ocultos | Completado |
| 10 | Chatbot v2 pide foto del material con código de verificación | Completado |
| 11 | Fix: guardar cotización antes de abrir WhatsApp | Completado |
| 12 | Fix: parseo local Tab B — soporta formato pipe HUAL | Completado |
| 13 | Fix: metales Farex no disponibles en Talca/Puerto Montt | Completado |
| 14 | Fix UI: badge número 2 visible en botón GRABAR | Completado |
| 15 | Panel: renombrado descargas, pasos numerados, tooltips — v93 | Completado |
| 16 | Fix precios: corregir Aluminio y materiales sin precio en sucursal — v92 | Completado |

**Dias 6-7 Abril (lunes-martes):**
| # | Tarea | Estado |
|---|-------|--------|
| 1 | Chatbot MVP v1 — widget standalone flujo v9 | Completado |
| 2 | Chatbot v2 — flujo negociación, RUT, WhatsApp cierre, email cotización | Completado |
| 3 | v91 — responsive mobile (480/414/375 px) | Completado |
| 4 | Fix: publicar snapshot antes de borrar PRECIO_OVERRIDE | Completado |
| 5 | v90 — Tab Revisor + Tab Config Empresa, gating Usuarios por admin | Completado |
| 6 | Restaurar formulario completo Datos del Negocio de v24 | Completado |
| 7 | Fix: restaurar look visual v24 en Asistente Comercial | Completado |
| 8 | PDF ficha despacho idéntico al formato original | Completado |
| 9 | Botón PDF en Ficha de Despacho | Completado |
| 10 | Restaurar Tab F Usuarios | Completado |
| 11 | v89: verificar precios panel vs asistente | Completado |
| 12 | Varios fixes iniciales (HTML, IDs, precios, guía, ícono PWA) | Completado |

---

### PABLO — (sin commits en repositorio git)

> **Nota:** No se encontraron commits de Pablo en el historial de git.
> Completar esta sección con las tareas realizadas por Pablo.

| # | Tarea | Estado |
|---|-------|--------|
| 1 | *(Pendiente de completar)* | — |
| 2 | *(Pendiente de completar)* | — |
| 3 | *(Pendiente de completar)* | — |

---

## PENDIENTES Y PROXIMOS PASOS

| # | Tarea | Prioridad | Asignado |
|---|-------|-----------|----------|
| 1 | Modo offline completo (PWA) | Media | Por asignar |
| 2 | Push notifications para actualizaciones de precios | Baja | Por asignar |
| 3 | Tests automatizados (unitarios + integración) | Media | Por asignar |
| 4 | README.md con instrucciones de setup y deploy | Baja | Por asignar |
| 5 | Optimización de bundle size (code splitting) | Baja | Por asignar |
| 6 | Validación completa de formularios del asistente | Media | Por asignar |
| 7 | Manejo de errores de red en chatbot | Media | Por asignar |

---

## METRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Total de commits | 58 |
| Días de desarrollo activo | 5 (6-10 Abril) |
| Archivos principales | 16 |
| Líneas de JS (public/js/) | ~4,900 |
| Módulos JS | 13 |
| Versión actual | v93 |
| PRs mergeados | 4 |

---

*Última actualización: 2026-04-12 por Claude Code*
