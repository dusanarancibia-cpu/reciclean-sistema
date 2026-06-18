# Resumen de Avance — 18 junio 2026

## Estado general del Plan

| Indicador | Valor |
|-----------|-------|
| Avance real | **34.1%** |
| Avance planificado | 14.8% |
| Hitos cumplidos | 15 de 216 |
| KPIs con valor | 0 |
| Inputs con datos | 7 de 7 (100%) |
| Bloqueantes abiertos | 6 (1 urgente) |

El avance real (34.1%) va **muy por encima** del planificado (14.8%), lo cual es positivo. El plan se adelanta en 19.3 puntos.

---

## Lo que hizo Dusan (16-17 junio)

### Diego IA — Sistema de Precios (lo mas grande del sprint)
- **Refactorizacion mayor de Diego-Precios**: Ahora el frontend delega toda la logica de precios a Diego como LLM (Opcion C). Esto simplifica mucho el codigo y centraliza la inteligencia en un solo lugar.
- **Mejoras de calidad**: Se agrego un "score de confianza" para que Diego diga que tan seguro esta de cada precio. Tambien detecta duplicados automaticamente y recupera lineas que se perdian antes.
- **Arreglo critico**: El sistema mostraba "manual" como origen de los precios cuando en realidad los cargaba Dusan. Corregido a "dusan" para trazabilidad correcta.
- **Chatbot de precios**: Corregido un bug donde las propuestas de precio aparecian como "manuales" en vez del origen real.
- **Flujo precios cliente**: Nuevo flujo completo para que Diego procese precios por cliente (D-DIEGO-PRECIOS-CLIENTE-001).

### Blindaje CI/CD (seguridad del codigo)
- **Tests automaticos post-despliegue**: Creo pruebas E2E tipo "smoke" que verifican que el sistema funcione despues de cada cambio.
- **3 scripts de carga**: Nuevos tests automaticos para el chat de Diego, el estatus CEO, y el login.
- **Migracion de 5 workflows**: Trajo los flujos de seguridad del repo RDO al repo principal del sistema, centralizandolos.
- **Limpieza**: Borro el CodeQL personalizado (dejando el nativo de GitHub que es mejor) y archivos temporales ya usados.

---

## Lo que hizo Pablo (17 junio)

### Seguridad y estabilidad
- **ZAP Security Scanner**: Arreglo la configuracion para que el scanner de seguridad OWASP respete la opcion de no fallar el build (cierra R2). Importante para que los deploys no se bloqueen por alertas menores.
- **Scripts de carga k6**: Creo los esqueletos de tests de rendimiento para el panel RDO (smoke + load). Esto cierra parcialmente R1.
- **Actualizaciones de seguridad**: Mergeo 3 actualizaciones criticas de dependencias:
  - `vite` 8.0.3 → 8.0.16 (build tool)
  - `postcss` 8.5.8 → 8.5.15 (CSS)
  - `ws` 8.20.0 → 8.21.0 (WebSockets)
- **Destrabe de pipeline**: Arreglo un deadlock (bloqueo circular) entre OWASP, el parser E2E, y el linter que impedia que los PRs pasaran CI.
- **6 PRs mergeados**: Revision y merge de PRs #310, #311, #312, #319, #331, #333.

---

## Alerta: 20+ issues de smoke abiertos

GitHub Actions genero automaticamente 20+ issues tipo "Post-merge smoke FAILED" (issues #337 a #364). Esto se debe a que los nuevos tests smoke se activaron y estan detectando que el deploy de produccion no responde como esperan los tests.

**Accion requerida**: Revisar si son falsos positivos (los tests esperan algo que aun no existe) o regresiones reales. Probablemente son falsos positivos por la config nueva de los smoke tests.

---

## Progreso por objetivo (actualizado)

| Objetivo | Descripcion | Avance | Cambio |
|----------|-------------|--------|--------|
| PL2 | Diego IA | **75%** | +8% (era 67%) |
| PL6 | Visualizacion | 80% | = (estable) |
| PL4 | Cumplimiento Legal | 62% | = (estable) |
| PL1 | Gobernanza y Reglas | **60%** | +5% (era 55%) |
| PL3 | Trazabilidad PCs | **58%** | +3% (era 55%) |
| PL5 | Esquema 20x Guard | **42%** | +10% (era 32%) |

---

## Proximos pasos sugeridos

1. **Triaje de issues smoke** (#337-#364): Determinar si son falsos positivos o regresiones reales.
2. **Cargar KPIs**: Hay 138 KPIs definidos pero 0 con valor. Esto frena el avance medible del plan.
3. **Resolver bloqueante urgente**: Hay 1 bloqueante marcado como urgente pendiente de atencion.
4. **Completar hitos de baseline**: Los objetivos de negocio (C1-C6, O1-O6, etc.) aun no tienen hitos completados — requieren datos operativos reales.
