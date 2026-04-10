# CLAUDE.md — Reciclean Sistema

## Project Overview

Pricing management and commercial quoting system for **Reciclean-Farex**, a recycling company operating across multiple branches in Chile (Cerrillos, Maipú, Talca, Puerto Montt). Two interfaces: an **Admin Panel** for pricing strategy and a mobile-first **Commercial Assistant** for field sales quotations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Vanilla JavaScript (ES Modules) |
| Build | Vite 8 |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Custom PIN-based (localStorage + Supabase table) |
| State | Global window objects + IndexedDB + localStorage |
| Offline | Service Worker (network-first) + localStorage fallback |
| PDF | jsPDF 2.5.1 (CDN) |
| PWA | manifest.json + sw.js |
| Styling | Custom CSS with CSS variables (no framework) |

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

There are **no tests, linters, or formatters** configured. No CI/CD pipeline.

## Project Structure

```
reciclean-sistema/
├── index.html              # Admin Panel (main entry, ~2100 lines)
├── login.html              # Login page (email or phone auth)
├── asistente.html          # Commercial Assistant (mobile-first)
├── vite.config.js          # Multi-entry build config
├── package.json            # Minimal deps: supabase-js + vite
│
├── src/                    # ES module source (bundled by Vite)
│   ├── lib/
│   │   ├── supabase.js     # Supabase client init (uses VITE_ env vars)
│   │   └── auth.js         # Auth: loginEmail, loginTelefono, getSession, logout
│   ├── supabase-bridge.js  # Admin panel ↔ Supabase integration
│   └── asistente-bridge.js # Assistant ↔ Supabase integration (real-time prices)
│
├── public/                 # Static assets (served as-is)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   ├── js/                 # Core application modules (loaded via <script> in HTML)
│   │   ├── config.js       # API config, Supabase keys, global constants
│   │   ├── utils.js        # Toast notifications, formatters, DOM helpers
│   │   ├── estado.js       # State management, backup/restore, draft persistence
│   │   ├── precios.js      # Price calculation, table rendering, publishing
│   │   ├── alias.js        # Material alias management (multi-source)
│   │   ├── ia.js           # AI/document processing (CSV/Excel parsing)
│   │   ├── idb.js          # IndexedDB wrapper (reciclean_admin database)
│   │   ├── fuentes.js      # Client sources management
│   │   ├── historial.js    # Quotation history
│   │   ├── correccion.js   # Price corrections
│   │   ├── usuarios.js     # User management (admin CRUD)
│   │   ├── tracking.js     # Usage event tracking
│   │   └── tracking-dashboard.js # Tracking analytics UI
│   └── assets/logos/       # Brand logos and icons
│
└── sql/
    └── eventos_asistente.sql # DB migration: eventos_asistente table
```

## Architecture

### Multi-Entry Application

Three HTML entry points, each a self-contained page:

- **`login.html`** — Unified login (email tab for admins, phone tab for field reps). Redirects to `/` or `/asistente.html` based on role.
- **`index.html`** (Admin Panel) — Tab-based SPA with sections: Precios, Alias, Config, Usuarios, Tracking, Público. Heavy business logic for pricing strategies.
- **`asistente.html`** (Commercial Assistant) — Mobile-optimized quotation tool with tabs: Negocio, Cotizador, Historial, Editar, Soporte.

### Two JavaScript Layers

1. **`public/js/*.js`** — Loaded via `<script>` tags in HTML files. Use global `window` objects for inter-module communication. These are NOT ES modules.
2. **`src/*.js`** — ES modules bundled by Vite. Handle Supabase integration and auth. Connected to HTML via `<script type="module">` tags.

The bridge files (`src/supabase-bridge.js`, `src/asistente-bridge.js`) act as glue between the global-scope `public/js/` modules and the ES module Supabase client.

### State Management

State is stored in global `window` objects (set in `config.js` and `estado.js`):

```javascript
window.mats                   // Material list
window.cambios                // Price change tracking
window.FUENTES                // Client sources
window.CLIENTES_PRECIOS       // Client-specific prices {client: {matId: price}}
window.PRECIO_SELECCIONADO    // Selected prices {matId: {suc: {cliente, precio, ts}}}
window.PRECIO_OVERRIDE        // Manual overrides {matId: {suc: price}}
window.FLETE_POR_SUC          // Freight per branch
window.MARGEN_POR_SUC         // Margin per branch
```

Persistence layers (in priority order):
1. **IndexedDB** (`reciclean_admin` DB) — primary local store
2. **localStorage** — backup, session, drafts (`rf_session`, `rf_draft_*`, etc.)
3. **Supabase** — cloud sync for prices, quotations, user data

### Authentication

Two auth flows, both PIN-based against `usuarios_autorizados` table:

| Flow | Credentials | Access Flag | Roles |
|------|------------|-------------|-------|
| Admin Panel | email + PIN | `acceso_panel` | admin, editor, visor |
| Assistant | phone (+56) + PIN | `acceso_asistente` | ejecutivo, admin |

Sessions stored in `localStorage` as `rf_session` with 24-hour TTL.

### Database (Supabase)

Key tables:
- `usuarios_autorizados` — Users, roles, access flags
- `materiales` — Recyclable materials catalog
- `categorias` — Material categories
- `precios_version` — Price version snapshots
- `precios` — Per-material, per-branch pricing
- `precios_cliente` — Client-specific pricing
- `clientes_compradores` — Buyer clients
- `material_aliases` — Multi-source material name aliases
- `cotizaciones` — Field quotations (from assistant)
- `config` — Key-value system config
- `eventos_asistente` — Usage tracking events
- `v_precios_activos` — Active prices view (used by assistant)

RLS (Row Level Security) is enabled. The Supabase anon key is a publishable client key.

### Real-time Features

- Supabase channel `precios-updates` subscribes to `precios_version` INSERT events
- Assistant auto-shows update banner when new prices are published
- Vibration feedback on mobile for price updates

## Environment Variables

```bash
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-publishable-anon-key>
```

Used by `src/lib/supabase.js`. The `public/js/config.js` has its own hardcoded Supabase credentials for the admin panel (non-module context).

## Code Conventions

- **Language**: All comments, UI text, variable names (where descriptive) are in **Spanish**
- **Naming**: `camelCase` for JS variables/functions, `kebab-case` for HTML IDs and CSS classes
- **No framework**: Direct DOM manipulation (`document.getElementById`, `innerHTML`, template literals)
- **Error handling**: `try-catch` with `toast()` for user-facing errors, `console.warn` for dev
- **Commit messages**: Spanish, conventional-commit-style prefixes (`feat:`, `fix:`, `fix+style:`)
- **Functions**: Procedural style with global scope in `public/js/`, ES module exports in `src/`
- **Large files**: Business logic files are large (40-80KB). This is normal for this codebase — do not split unless requested.

## Key Patterns to Follow

1. **Bridge pattern**: When adding Supabase functionality, add it to the appropriate bridge file (`supabase-bridge.js` for admin, `asistente-bridge.js` for assistant), not directly in `public/js/`.
2. **Global state**: New shared state goes on `window` object and is initialized in `config.js` or `estado.js`.
3. **IndexedDB + localStorage**: Always write to both for redundancy. Use `safeLS()` wrapper for localStorage.
4. **Offline-first**: Assume network may be unavailable. Provide fallback behavior.
5. **Batch Supabase operations**: Insert in chunks of 100 rows to avoid timeouts.
6. **Toast notifications**: Use `toast(message, type)` for user feedback (`"ok"`, `"warn"`, `"error"`).

## Things to Avoid

- Do not introduce a JS framework (React, Vue, etc.) — the codebase is intentionally vanilla JS
- Do not refactor large files into smaller modules unless explicitly requested
- Do not add TypeScript — the project uses plain JavaScript
- Do not modify Supabase credentials in `config.js` — they are intentionally client-side publishable keys
- Do not add `.env` files to git (they are in `.gitignore`)
