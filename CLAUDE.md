# Sistema Comercial Reciclean-Farex

## ⚠️ Este repo aloja DOS sistemas (leer antes de tocar nada)

1. **Sistema Comercial** (descrito abajo) — gestión de precios materiales reciclables. Archivos: `index.html`, `asistente.html`, `login.html`, `public/js/*.js`.
2. **Panel RDO** — desde 7-may-2026. **`public/panel-rdo.html` es la fuente de verdad ÚNICA**. El "espejo" en `reciclean-rdo/panel-html/` quedó archivado el 14-may-2026 tras desactualizarse en 1025 líneas. Ver sección "Panel RDO" más abajo.

## ⚠️ Reglas operativas — TODOS los agentes IA leer primero

1. **NUNCA pushear directo a `main`** desde un agente IA. `main` **ES production** desde 2026-07-01: cada merge a main auto-deploya al panel productivo (Vercel Production Branch = main). La rama `prod` fue deprecada (ver `D-DEPLOY-ANTIFRAGIL-001` en `reciclean-rdo/mayordomo/DECISIONES.md`). Cero PRs main→prod manuales.
2. **Toda sesión Replit** trabaja en su rama propia (`replit/<descripcion>`). Si no existe, crearla: `git checkout -b replit/<sprint>`. Vercel auto-genera preview deploy por rama feature.
3. **Cambios a `public/panel-rdo.html`** requieren PR con checklist: bypass 4 lugares (`config_kv` + RLS + `v_panel_silos_visibles` + fallback HTML)? GRANTs `cesar_readonly` aplicados a tablas nuevas en `curated.*`? Mobile responsive verificado en preview?
4. **El espejo a `reciclean-rdo` está MUERTO** desde 14-may-2026. NO copies `panel-rdo.html` a otro lugar. Fuente de verdad única: `public/panel-rdo.html`.
5. **No tocar `package.json`, `vercel.json`, `vite.config.js`** sin aviso explícito a Pablo (sistemas@gestionrepchile.cl).
6. **Bitácora diaria obligatoria** al cerrar el día: `reciclean-manifiesto-diego/docs/BITACORA-PARALELO-MAYO-2026.md`.
7. **Observabilidad deploy (activa desde 2026-07-01)**: cada page tiene chip `v: <sha7>` en sidebar bottom · fetch `/_version.json` para diagnóstico · `window.appVersion()` global · banner "Nueva versión disponible" auto-detecta SW updates. Ver PR #581 sistema para implementación.

## ⭐ DOCUMENTO MAESTRO — leer antes que nada

**Diagnóstico Organizacional Grupo Arancibia-Pinto v2** (05-may-2026 · 2da sesión)
Ubicación: `../reciclean-manifiesto-diego/Bitacora_Estrategica_Grupo/2026-05/2026-05-05_Diagnostico_Organizacional_Grupo_v2.md`
Formatos disponibles: md · txt · docx · pdf · pptx (13 slides)

Contiene la fotografía completa del grupo:
- 9 empresas + brazo digital DOSI
- 13 personas + 4 nodos externos
- 13 sistemas descolgados mapeados (S1-S13)
- 88 hallazgos · 60 acciones · 20 flags · 11 decisiones selladas
- Sección DOSI integrada con auditoría Manus

**v2 reemplaza a v1.** Sustituye cualquier asunción anterior sobre Reciclean-Farex.

Carpetas relacionadas:
- `../reciclean-manifiesto-diego/Proyectos/Ubergreen/` — Plan Integral v1 (apuesta a "millonario sin trabajar", 8 lentes sintetizados)
- `../reciclean-manifiesto-diego/Proyectos/DOSI_2si/` — proyecto DOSI (MVP listo, beta privada 19-may-2026)
- `../reciclean-manifiesto-diego/Bitacora_Estrategica_Grupo/2026-05/` — documento maestro grupo 5 formatos

## Trayectoria del founder corregida

**Dusan Arancibia: 31 años en industria reciclaje** (no 14 como decía mi memoria interna previa). Inició en Sorepa/CMPC en 1995 (depto comercial → Jefe Marketing y Comercial joven · directorio CMPC · análisis Perú · proyecto sorting CMPC). Cambio empresa industria abriendo 4 sucursales. 2012 independencia → Reciclean + Farex.

## Contexto del usuario

**Dusan Arancibia** — CEO Grupo Arancibia-Pinto (8 empresas activas: Reciclean, Farex, Ubergreen, Inmobiliaria Beto, Transporte 5R, Transportes Diego, Importadora/Exportadora Farex, SERCOT 50%).
**Pablo Arancibia** — Hijo de Dusan, Sistemas + ejecuta pagos del grupo.
**Dyana Pinto** — Esposa de Dusan, dueña operativa de SERCOT (50%), asesoría tributaria del grupo.
- 4 sucursales: Cerrillos, Maipu, Talca, Puerto Montt (PM bloqueada por SEREMI)
- 14 personas en el equipo + 3 externos clave (Dyana, Connie SERCOT, Reinaldo programador)
- Comunicacion siempre en **espanol**

## Que es este sistema

Sistema comercial web para gestion de precios de materiales reciclables con dos interfaces:

| Interfaz | Ruta | Acceso |
|----------|------|--------|
| Panel Admin | `/` (index.html) | Dusan + Pablo (email + clave) |
| Asistente Comercial | `/asistente.html` | Equipo en terreno (WhatsApp + PIN) |
| Login unificado | `/login.html` | Redirige segun rol |
| Widgets publicos | Widget en reciclean.cl y farex.cl | Publico |

**URL produccion**: `reciclean-sistema.vercel.app`

## Stack tecnico

- **Frontend**: Vite + Vanilla JavaScript (NO React — decision confirmada)
- **Backend/BD**: Supabase (proyecto `reciclean-sistema`, region Sao Paulo)
  - URL: `https://eknmtsrtfkzroxnovfqn.supabase.co`
  - 17 tablas, 65 materiales, 6 usuarios autorizados
  - Vista principal: `v_precios_activos`
  - Tabla auth: `usuarios_autorizados`
  - Tabla sync: `asistente_snapshot` (Panel -> Asistente en tiempo real)
- **Deploy**: GitHub -> Vercel (automatico en push a `main`)
- **Repo**: github.com/dusanarancibia-cpu/reciclean-sistema (publico — sin secretos en codigo)
- **PWA**: Service Worker + manifest, instalable en celulares del equipo

## Estructura del repo

```
reciclean-sistema/
  index.html          # Panel Admin (produccion) — equivale a admin_panel_vXX.html
  asistente.html      # Asistente Comercial
  login.html          # Login unificado
  vite.config.js      # Build config
  package.json        # @supabase/supabase-js + vite
  .env.local          # Credenciales Supabase (NO commitear)
  public/
    js/               # 11 modulos JS (logica principal)
      config.js       # 65 materiales, 4 sucursales, categorias
      estado.js       # State management (82 KB, el mas grande)
      alias.js        # Aliases de materiales por fuente
      precios.js      # Calculos de precios, margenes, fletes
      ia.js           # Integracion Claude API + automatizacion
      usuarios.js     # Sistema de auth y roles
      idb.js          # Cache IndexedDB offline
      fuentes.js      # Fuentes de precios (clientes compradores)
      historial.js    # Logging de cambios
      correccion.js   # Correcciones de datos
      utils.js        # Utilidades generales
    manifest.json     # PWA manifest
    sw.js             # Service Worker
    chatbot.html      # Chatbot v1
    chatbot-v2.html   # Chatbot v2
    assets/logos/     # Logos de ambas marcas
  src/lib/
    auth.js           # Logica de autenticacion
    supabase.js       # Bridge Supabase
  dist/               # Build output (Vite)
```

## Panel Admin — 8 tabs

| Tab | Nombre | Funcion |
|-----|--------|---------|
| A | Carga | Carga masiva de precios desde fuentes |
| B | Alias | Mapeo de nombres alternativos de materiales |
| C | Precios | Edicion manual de precios por sucursal |
| D | Historial | Log de cambios de precios |
| E | Publico | Vista previa de precios publicados |
| F | Usuarios | Gestion de usuarios (solo visible para rol `admin`) |
| G | Revisor | Compara Panel vs Snapshot vs sitios web publicos |
| H | Empresa | Toggle materiales/sucursales por empresa (Reciclean/Farex) |

## Modelo de datos clave

- **Materiales**: 65 SKUs con flags `farex` y `reciclean` (boolean), `iva`, margenes, flete
- **Sucursales**: 4 (Cerrillos, Maipu, Talca, Puerto Montt)
- **Clientes compradores**: 12 (HUAL, RESIMEX, FPC, ADASME, POLPLAST, etc.)
- **Tabla `precios_cliente`**: cliente x material
- **Tabla `precios_version`**: Control de versiones para releases atomicos
- **Tabla `asistente_snapshot`**: Sync en tiempo real Panel -> Asistente
- **Tabla `cotizaciones`**: Cotizaciones guardadas desde el Asistente

**Flujo de datos**: Panel GRABAR -> Supabase -> "Generar Asistente" -> `asistente_snapshot` -> Asistente + Widgets (Realtime)

## Decisiones tecnicas confirmadas

- Vite + vanilla JS (NO React)
- Redondeo: `Math.floor` (no adaptativo)
- Repo publico — credenciales solo en `.env.local` o variables Supabase/Vercel
- Switch empresa/sucursales persiste en `localStorage['rf_sucs_empresa']`
- Tab F gateado por `localStorage.rf_session.rol === 'admin'`
- Farex = solo 2 sucursales (Cerrillos + Maipu)
- Reciclean = 4 sucursales
- IVA: Farex con Retencion 19% / Reciclean sin IVA

## Reglas criticas de contenido

### Puerto Montt NO esta operativa
- En espera de permisos finales
- NUNCA publicar como activa ni mostrar precios vigentes
- Actualizar esta seccion cuando cambie el estado

### Palabras prohibidas en comunicacion publica
`gratis`, `gratuito`, `sin costo`, `el mejor precio`, `garantizado`

### Contacto unificado
- WhatsApp: +56 9 9534 2437 (Andrea Rivera)
- Email: comercial@gestionrepchile.cl

## Versionado

- **Version actual en produccion**: v90 (commit `2ac680f`, deploy 7 abril 2026)
- **Proxima version**: v91 (responsive mobile)
- Siempre hacer backup antes de modificar
- Al modificar logica: editar `public/js/*.js`, solo tocar HTML para cambios de estructura

## Directorio hermano: Claude Code/

Existe un directorio `Claude Code/` al mismo nivel que este repo con:
- Espejos de los archivos (`admin_panel_vXX.html` = `index.html` del repo)
- `TAREAS.md` con estado de tareas detallado
- `Respaldos/` con versiones v83-v90
- `ChatBot/` con flujos y documentacion del chatbot
- `Repositorio Template/` con 14 templates RRSS
- `supabase_schema.sql` con esquema completo de BD

**Antes de subir cambios al repo**: comparar contra `Claude Code/` para no perder features.

## Fases del proyecto

**Fase 2 (Mayo/Junio 2026)**: Dashboard KPIs, CRM Proveedores, App Terreno PWA mejorada, Google Workspace
**Fase 3**: Rediseno reciclean.cl + farex.cl, precios en Google Maps (8 fichas GMB)
**Fase 4 (EN CURSO)**: RRSS automaticas (Make.com + Claude haiku + Canva + Buffer), Chatbot WhatsApp IA

## Instrucciones para Claude

- Responder siempre en espanol
- No crear archivos innecesarios
- El repo es publico — nunca incluir credenciales en codigo
- Preferir editar archivos existentes antes de crear nuevos
- Al modificar logica: editar `public/js/*.js`
- "empresa" en contexto de materiales = flags `farex`/`reciclean` en `mats`
- Skill disponible: `reciclean-farex-comercial` para actualizacion de precios
