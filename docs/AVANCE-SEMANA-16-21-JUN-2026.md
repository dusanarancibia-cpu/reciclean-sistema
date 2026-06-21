# Avance Semanal — 16 al 21 de junio 2026

> Resumen en palabras sencillas de lo que hicieron Dusan y Pablo esta semana.
> Generado: 21-jun-2026

---

## Dusan — 14 tareas completadas

### 1. Flujo de precios con Diego (chatbot)
**Que se hizo:** Se arreglo y mejoro el sistema donde Diego (el chatbot) ayuda a cargar precios de clientes compradores.

- Se creo el flujo completo de precios por cliente (`D-DIEGO-PRECIOS-CLIENTE-001`)
- Se arreglo un error donde los precios cargados "a mano" por Dusan quedaban marcados como `manual` en vez de `dusan`, lo que trababa el sistema
- Se mejoro la pantalla para que muestre el nivel de confianza de cada precio (H3), detecte duplicados (H4) y no pierda lineas de datos (H6)
- Se simplifico el codigo: ahora el frontend le delega todo a Diego LLM en vez de intentar procesar los precios por su cuenta

**En simple:** Antes Diego se confundia al recibir precios. Ahora funciona mejor: muestra que tan seguro esta del precio, avisa si ya existe, y no pierde informacion.

### 2. Seguridad y calidad del codigo (CI/CD)
**Que se hizo:** Se blindaron los procesos automaticos que vigilan el codigo cada vez que se sube un cambio.

- Se migraron 5 workflows de guardia del Panel RDO al sistema principal
- Se borro el scanner CodeQL personalizado (causaba conflictos) y se dejo el nativo de GitHub
- Se arreglaron las rutas de los tests de rendimiento (k6) y de seguridad (OWASP ZAP)
- Se crearon 3 scripts de prueba automatica nuevos: chat de Diego, estatus CEO y login
- Se implemento un validador de calidad de PRs con 4 verificaciones automaticas (R-GIT-002)

**En simple:** Ahora cada vez que alguien sube codigo, el sistema automaticamente revisa que no se rompa nada, que sea seguro y que cumpla las reglas del equipo.

### 3. Nuevas pestanas del Panel Admin
**Que se hizo:** Se agregaron 3 pestanas nuevas al panel de administracion:

- **Tab Errores y Bucles** — Muestra los 10 problemas de precios detectados automaticamente (H1 a H10). Consume `panel.hallazgos_precios`
- **Tab Cronograma 24h** — Muestra los 14 hitos del dia (desde las 7am hasta las 8pm). Permite ver que deberia estar pasando a cada hora
- **Tab Analisis Micro/Macro** — Dos sub-pestanas: una para analizar un material especifico y otra para ver el sector completo

**En simple:** El panel ahora tiene 3 pantallas nuevas: una que muestra errores de precios, otra que muestra el calendario del dia, y otra para analizar materiales y el mercado.

### 4. Arreglo del chatbot de precios
- Se corrigio que las propuestas de precios en el chatbot quedaban con ruta `manual` en vez de la correcta

---

## Pablo — 5 tareas completadas

### 1. Tests de rendimiento (k6)
**Que se hizo:** Creo los scripts base para probar que el Panel RDO aguante carga.

- Scripts esqueleto de smoke test y load test para panel-rdo
- Esto cierra parcialmente el requerimiento R1 del Plan 99-99

**En simple:** Pablo preparo las pruebas para verificar que el panel no se caiga cuando muchos usuarios entren al mismo tiempo.

### 2. Arreglo de seguridad (OWASP ZAP)
**Que se hizo:** Configuro correctamente el escaner de seguridad para que no bloquee el pipeline cuando encuentra alertas menores.

- `fail_action=false` ahora se respeta correctamente
- Esto cierra el requerimiento R2

**En simple:** El escaner de seguridad estaba frenando todo el proceso por alertas que no eran criticas. Pablo lo arreglo para que avise pero no bloquee.

### 3. Arreglos de CI/CD
**Que se hizo:** Destrabo un bloqueo donde tres procesos automaticos se trababan entre si.

- Arreglo el trigger de OWASP para que se active en PRs
- Arreglo el parser de tests end-to-end
- Destrabo un deadlock del linter (las reglas de estilo del codigo)

**En simple:** Tres herramientas automaticas estaban peleando entre si y no dejaban avanzar. Pablo las separo para que funcionen bien.

### 4. Merges de actualizaciones
**Que se hizo:** Reviso y aprobo 6 PRs incluyendo:

- Actualizacion de Vite (8.0.3 → 8.0.16)
- Actualizacion de PostCSS (8.5.8 → 8.5.15)
- Actualizacion de WebSockets (8.20.0 → 8.21.0)
- PRs de features y fixes del equipo

**En simple:** Pablo mantuvo las librerias del proyecto actualizadas y aprobo los cambios que estaban listos.

---

## Pendientes abiertos

| # | Que falta | Quien | Urgencia |
|---|-----------|-------|----------|
| 1 | PR #349 — Promocion `main` a `prod` (24 commits) | Pablo (revisar) | Alta |
| 2 | PR #378 — Tab KPIs Precios Home (7 cards) | Revision pendiente | Media |
| 3 | 10+ issues de post-merge smoke fallando (CI) | Dusan/Pablo | Alta |
| 4 | PR #354 — Smoke test verificacion (NO mergear, solo observar) | — | Baja |

---

## Numeros de la semana

- **Commits en main:** 18 (sin contar merges de dependabot)
- **PRs mergeados:** 14
- **PRs abiertos:** 3
- **Issues automaticos de smoke:** 10+ (requieren diagnostico)
- **Dias activos:** lunes 16, martes 17, jueves 19

---

## Estado general

El sistema avanzo fuerte en tres frentes:
1. **Diego (chatbot)** ya maneja precios de forma mas confiable
2. **CI/CD** esta mas robusto con tests automaticos y validador de PRs
3. **Panel Admin** tiene 3 tabs nuevos de analisis

Lo que necesita atencion urgente: los smoke tests post-merge estan fallando sistematicamente (10+ issues abiertos). Hay que diagnosticar si son falsos positivos o regresiones reales antes de promover a `prod`.
