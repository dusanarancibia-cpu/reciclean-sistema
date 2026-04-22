# Sistema Comercial Reciclean-Farex

## Contexto del usuario

**Dusan Arancibia** — Gerente General de Grupo Reciclean-Farex (reciclaje de materiales).
**Pablo** — Desarrollador que trabaja con Claude Code en este sistema.
- 4 sucursales: Cerrillos, Maipu, Talca, Puerto Montt
- 14 personas en el equipo
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
- Skill disponible: `protocolo-datos-unificado` (en `.claude/skills/`) — se
  activa automaticamente al registrar info estructural (tareas, bugs, casos,
  mensajes, patches). Catalogo de tablas Supabase + herramientas + protocolos
  + plan de migracion archivos->tablas. Leer `SKILL.md` + `TABLAS.md` al
  iniciar sesion.
