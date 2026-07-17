# Deploy Primer Release en Vercel

## Estado actual

Este frontend ya quedó listo para desplegar en Vercel con estas entradas:

- `/primer-release.html`
- `/romanero.html`
- `/pagos.html`
- `/supervision.html`
- `/panel-rdo.html`

También quedaron aliases cortos:

- `/primer-release`
- `/romanero`
- `/pagos`
- `/supervision`

## Qué quedó preparado

1. `vite.config.js` ya builda `primer-release`, `romanero`, `pagos` y `supervision`.
2. `vercel.json` ya agrega aliases amigables y `no-store` para HTML y `_version.json`.
3. `src/lib/supabase.js` ya tolera tres fuentes de configuración:
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   - `window.SUPABASE_URL` y `window.SUPABASE_ANON_KEY`
   - fallback al proyecto público hoy usado por el panel legacy
4. `public/panel-rdo.html` ya incluye un widget vivo del release con enlace directo al Hub Ejecutivo.

## Qué se puede hacer sin claves nuevas

Se puede desplegar preview en Vercel sin esperar credenciales nuevas del usuario si el proyecto Vercel ya está vinculado o la integración remota ya tiene acceso.

## Variables opcionales recomendadas en Vercel

No son obligatorias para que levante este release hoy, pero sí recomendadas para no depender del fallback:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Verificación mínima después del deploy

1. Abrir `/primer-release` y confirmar portada ejecutiva, build visible, botón de demo y foco en `kilos/captura`
2. Abrir `/panel-rdo.html`
3. Confirmar bloque "Primer Release · operación viva"
4. Abrir `/romanero`
5. Abrir `/pagos`
6. Abrir `/supervision`
7. Revisar `/_version.json`

`/supervision` ahora actúa como `Centro de Control`: resume kilos capturados, cobertura de pesaje, alertas de compra/captura, materiales calientes, sucursales activas y luego el tramo financiero secundario.

`/primer-release` ahora actúa como `Hub Ejecutivo`: sirve de portada del release, muestra checklist, accesos rápidos, build, pulso `kilos-first` y permite encender el demo sin credenciales.

`/panel-rdo.html` ahora refleja el mismo criterio operativo: muestra `Kilos hoy`, `Capturas` y `Sin pesaje` antes de la lectura financiera.

## Revisión sin credenciales

Las tres pantallas nuevas ya exponen un modo demo útil para revisar el release en Vercel sin claves reales:

- abrir `/primer-release` o `/romanero?demo=1` para activar demo
- luego visitar `/pagos`, `/supervision` o volver al panel
- el estado demo se comparte entre pantallas en el mismo navegador
- cada pantalla permite `Reiniciar demo` para volver a la semilla base
- el orden recomendado de revisión es `Hub -> Supervisión -> Romanero -> Pagos -> panel`

## Smoke automático disponible

Quedó un smoke público que no requiere credenciales reales y valida:

- render base de `primer-release.html`
- render base de `romanero.html`
- render base de `pagos.html`
- render base de `supervision.html`
- carga mínima de `panel-rdo.html`
- lectura compartida del demo entre hub y panel
- foco operativo visible en hub/panel con métricas de kilos y captura
- presencia de `/_version.json`

Ejecutar:

```bash
npm run test:e2e:primer-release
```

O contra un preview específico:

```bash
E2E_BASE_URL=https://tu-preview.vercel.app npm run test:e2e:primer-release
```

## Pendiente cuando Pablo tenga accesos

1. Probar login real en las tres vistas
2. Ejecutar flujo vivo:
   - Romanero crea o recupera expediente
   - Pagos registra pago y comprobante
   - Supervisión refleja primero kilos/captura y luego el cierre financiero
3. Si corresponde, reemplazar fallback por variables explícitas en Vercel
