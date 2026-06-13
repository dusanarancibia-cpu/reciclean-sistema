# Bitácora 13 de Junio 2026 — Resumen en Palabras Sencillas

**Fecha:** Viernes 13 de junio 2026
**Participantes:** Dusan + Pablo (sesión nocturna 12-jun hasta tarde + jornada 13-jun)
**PRs mergeados hoy:** 16 (PR #284 al #299)
**Commits en main:** 11 | **Deploys a prod:** 8

---

## Qué se hizo hoy (en palabras sencillas)

Se terminó de construir y poner en producción el **Embudo Comercial Antifrágil** — la herramienta visual tipo tablero (kanban) donde Andrea y el equipo de ventas ven todas las oportunidades de negocio organizadas en 11 columnas, desde que un prospecto llega hasta que se paga o se pierde. También se hizo una auditoría de seguridad del panel.

---

## Tareas de DUSAN

| # | Qué hizo | Para qué sirve | Estado |
|---|----------|-----------------|--------|
| 1 | **Definió las 11 columnas del embudo** (Prospección → Contacto → Cotización → Negociación → DTE → Facturar → Cobranza → Ganada → Pagado → Perdida) | Estandarizar el proceso de venta para que todo el equipo hable el mismo idioma | Listo |
| 2 | **Aprobó el despliegue del Embudo Capa 2 a producción** | Sin su firma no sube a prod. Revisó los 20 tests de backend (todos OK) | Listo |
| 3 | **Creó la guía "Cómo funciona"** (PR #298) | Un modal con instrucciones para Andrea y el equipo: qué significa cada columna, quién puede mover tarjetas, qué se necesita para avanzar | Listo |
| 4 | **Ejecutó auditoría R-AUD-080** del sidebar del panel | Verificar que los datos del panel (RUT, datos sensibles) cumplen la Ley 19628 + 21719 de protección de datos | En ejecución (8 verificaciones planificadas) |
| 5 | **Aprobó 9 specs de cirugía estética FAB Diego** (PR #283) | Mejorar la apariencia del chatbot Diego: más ancho, centrado, mejor para celulares | PR abierto, pendiente merge |
| 6 | **Dirigió las iteraciones del diseño del kanban** (5 rondas de ajuste) | Lograr que las 11 columnas se vean bien en pantalla sin que se compriman | Listo |

## Tareas de PABLO

| # | Qué hizo | Para qué sirve | Estado |
|---|----------|-----------------|--------|
| 1 | **Co-desarrolló los 16 PRs del kanban** (#284-#299) | Implementación técnica de todas las mejoras visuales del embudo | Listo |
| 2 | **Detectó bug del diseño 160px** y pidió rollback (PR #286) | Las columnas quedaban aplastadas con 160px. Pablo lo vio, pidió revertir, y se buscó otra solución | Listo |
| 3 | **Pidió "elevador horizontal escalable"** (scrollbar) | Necesitaba una barra de scroll visible con botones ← → para navegar las 11 columnas fácilmente | Implementado (PR #292) |
| 4 | **Promovió 8 cambios a producción** (firma delegada D12) | Cada fix que quedaba OK en main lo subía a prod para que Andrea y el equipo lo tuvieran al tiro | Listo |
| 5 | **Resolvió conflictos en panel-rdo.html** | Al llevar los cambios de main a prod hubo choques de código. Pablo los resolvió manualmente | Listo |
| 6 | **Verificó en navegador** cada iteración del kanban | Antes de subir a prod, abría el panel y comprobaba que las columnas se veían bien en pantalla real | Listo |
| 7 | **Arregló filtrado sidebar v4** (PR #281) | Andrea veía 54 tabs cuando solo debía ver 6. El filtro no estaba conectado al sidebar nuevo | Listo |

---

## Qué quedó funcionando en producción

1. **Tablero Kanban con 11 columnas** — cada oportunidad se arrastra de una columna a otra
2. **Tab "Mi Día"** — lo primero que ve Andrea al entrar: cuántas opps tiene estancadas, visitas del día, pendientes
3. **Sidebar simplificada** — de 18 opciones confusas a 6 claras (Mi Día, Cartera, Oportunidades, Cotizador, Cobranza, Actas)
4. **Drawer de oportunidad** — al hacer clic en una tarjeta: documentos adjuntos, historial de movimientos, cambiar estado
5. **Modal DTE al facturar** — al arrastrar a "Facturar" pregunta si es venta (factura 33) o compra (factura 46), cumplimiento SII
6. **Filtros por persona** — "Mías", "Mi sucursal" o "Todo el silo"
7. **Scrollbar horizontal verde** con botones ← → para navegar las columnas
8. **Guía "Cómo funciona"** — referencia rápida con las reglas del embudo
9. **Auditoría R-AUD-080** — documento de 8 verificaciones de seguridad del sidebar (en ejecución)

---

## Métricas del día

- **16 PRs** mergeados (récord de velocidad para un día)
- **11 commits** a main
- **8 deploys** a producción
- **5 iteraciones** de diseño del ancho de columnas (hasta encontrar la solución correcta)
- **1 rollback** controlado (160px → 200px → solución final con style inline)
- **264 líneas** de auditoría de seguridad documentada

---

## Nivel de avance actualizado

| Iniciativa | Antes | Ahora | Cambio |
|------------|-------|-------|--------|
| I-10 Sprint ventas | 55% | 70% | +15% (embudo comercial es la herramienta clave del sprint) |
| I-13 Deuda técnica | 35% | 45% | +10% (fix sidebar v4 + auditoría R-AUD-080) |
| I-27 Cumplimiento RDO | 90% | 93% | +3% (auditoría R-AUD-080 documentada) |

---

*Generado automáticamente — 13 de junio 2026*
