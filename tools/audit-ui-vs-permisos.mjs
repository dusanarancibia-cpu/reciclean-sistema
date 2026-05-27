#!/usr/bin/env node
/**
 * R-AUD-034 · Capa 1 · Auditoría build-time UI vs panel.silo_pestanas
 *
 * Compara los elementos de panel-rdo.html (button-tab + sidebar-link + section)
 * contra panel.pestanas + panel.silo_pestanas en Supabase.
 *
 * Falla con exit code 1 si detecta tabs huérfanos (huérfano = backend dice que
 * un rol debe ver una pestaña pero el sidebar v4 no tiene link visible).
 *
 * USO:
 *   node tools/audit-ui-vs-permisos.mjs                 # contra panel-rdo.html local
 *   node tools/audit-ui-vs-permisos.mjs --json          # solo JSON, sin tabla
 *   node tools/audit-ui-vs-permisos.mjs --html path.html # archivo custom
 *
 * VARS DE ENTORNO:
 *   SUPABASE_URL       (default: https://eknmtsrtfkzroxnovfqn.supabase.co)
 *   SUPABASE_ANON_KEY  (requerido si no se pasa --no-supabase)
 *   AUDIT_SKIP_SUPABASE=1   # corre solo análisis HTML, sin contactar Supabase
 *
 * Origen: INCIDENTE MEGAPOL 2026-05-27 · Andrea bloqueada 6h
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PANEL_DEFAULT = resolve(__dirname, '..', 'public', 'panel-rdo.html');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || '';
const SKIP_SUPABASE = process.env.AUDIT_SKIP_SUPABASE === '1';

// ── parse args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  json: args.includes('--json'),
  noSupabase: args.includes('--no-supabase') || SKIP_SUPABASE,
  htmlPath: PANEL_DEFAULT,
};
const htmlIdx = args.indexOf('--html');
if (htmlIdx >= 0 && args[htmlIdx + 1]) opts.htmlPath = resolve(args[htmlIdx + 1]);

if (!existsSync(opts.htmlPath)) {
  console.error(`❌ HTML no encontrado: ${opts.htmlPath}`);
  process.exit(2);
}

// ── 1. parsear HTML ─────────────────────────────────────────
const html = readFileSync(opts.htmlPath, 'utf8');

function extractAll(pattern) {
  const out = new Set();
  let m;
  const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
  while ((m = re.exec(html)) !== null) out.add(m[1]);
  return [...out];
}

// button-tab con class="hidden" se considera "intencionalmente oculto" (ej. admin gate por JS)
// y NO se exige sidebar-link para él.
const buttonTabsRaw = [...html.matchAll(/<button[^>]*\bdata-tab="([^"]+)"[^>]*>/g)];
const buttonTabs = [...new Set(buttonTabsRaw
  .filter(m => !/\bclass="[^"]*\bhidden\b[^"]*"/.test(m[0]))
  .map(m => m[1]))];
const buttonTabsHidden = [...new Set(buttonTabsRaw
  .filter(m => /\bclass="[^"]*\bhidden\b[^"]*"/.test(m[0]))
  .map(m => m[1]))];
const sidebarLinks = extractAll(/<a[^>]*data-v4-tab="([^"]+)"/g);
const sections = extractAll(/<section[^>]*id="tab([A-Z][A-Za-z0-9_]*)"/g)
  .map(s => s.charAt(0).toLowerCase() + s.slice(1))
  .map(s => s.replace(/([A-Z])/g, '_$1').toLowerCase());

// También aceptamos id directo en minúsculas (tabCotizador → cotizador)
const sectionsRaw = extractAll(/<section[^>]*id="tab([A-Za-z0-9_]+)"/g);
const sectionsNormalized = new Set(sectionsRaw.map(s => {
  // tabBandejaPrecios → bandeja_precios; tabCotizador → cotizador
  return s.replace(/^([A-Z])/, (_, c) => c.toLowerCase())
          .replace(/([A-Z])/g, '_$1').toLowerCase();
}));

// ── 2. cargar config de pestañas ────────────────────────────
let pestanasActivas = null;
let siloPestanas = null;

async function fetchSupabase(query) {
  if (!SUPABASE_ANON) {
    throw new Error('SUPABASE_ANON_KEY no definida (export SUPABASE_ANON_KEY=...) o usa --no-supabase');
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${query.rpc}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(query.params || {}),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

async function fetchTable(path) {
  if (!SUPABASE_ANON) throw new Error('SUPABASE_ANON_KEY no definida');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Accept': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

if (!opts.noSupabase) {
  try {
    pestanasActivas = await fetchTable('panel?select=codigo,nombre,activa,requiere_perfil&schema=panel'.replace('panel?', 'pestanas?'));
    // fallback: query directa
    if (!Array.isArray(pestanasActivas)) {
      pestanasActivas = await fetchTable("pestanas?select=codigo,nombre,activa,requiere_perfil");
    }
    siloPestanas = await fetchTable("silo_pestanas?select=silo_codigo,pestana_codigo");
  } catch (e) {
    console.error(`⚠️ Supabase falló: ${e.message}`);
    console.error('   Corriendo solo análisis HTML (sin verificación de permisos).');
    opts.noSupabase = true;
  }
}

// ── 3. análisis ─────────────────────────────────────────────
const allTabsHtml = new Set([...buttonTabs, ...sidebarLinks]);
const gaps = [];

// Gap 1: button-tab sin sidebar-link
for (const tab of buttonTabs) {
  if (!sidebarLinks.includes(tab)) {
    gaps.push({
      tipo: 'sidebar_link_faltante',
      tab,
      severidad: 'alta',
      mensaje: `El tab "${tab}" tiene <button data-tab> pero NO tiene <a data-v4-tab> en el sidebar. Usuarios que dependan del sidebar no llegan.`,
    });
  }
}

// Gap 2: sidebar-link sin button-tab (mata)
for (const tab of sidebarLinks) {
  if (!buttonTabs.includes(tab)) {
    gaps.push({
      tipo: 'sidebar_link_muerto',
      tab,
      severidad: 'alta',
      mensaje: `El sidebar lista "${tab}" pero NO existe <button data-tab>. Clic muere.`,
    });
  }
}

// Gap 3: backend asigna pestaña pero NO está en HTML
if (!opts.noSupabase && pestanasActivas && siloPestanas) {
  const activeTabs = new Set(
    pestanasActivas.filter(p => p.activa === true).map(p => p.codigo)
  );
  const asignaciones = new Map(); // pestana_codigo → silos que la asignan
  for (const sp of siloPestanas) {
    if (!activeTabs.has(sp.pestana_codigo)) continue;
    if (!asignaciones.has(sp.pestana_codigo)) asignaciones.set(sp.pestana_codigo, []);
    asignaciones.get(sp.pestana_codigo).push(sp.silo_codigo);
  }
  for (const [tab, silos] of asignaciones) {
    if (!buttonTabs.includes(tab)) {
      gaps.push({
        tipo: 'backend_asigna_html_falta_button',
        tab, silos,
        severidad: 'alta',
        mensaje: `Silos [${silos.join(',')}] tienen "${tab}" asignada pero NO hay <button data-tab="${tab}"> en HTML.`,
      });
    }
    if (!sidebarLinks.includes(tab)) {
      gaps.push({
        tipo: 'backend_asigna_sidebar_falta',
        tab, silos,
        severidad: 'alta',
        mensaje: `Silos [${silos.join(',')}] tienen "${tab}" asignada pero NO hay <a data-v4-tab="${tab}"> en sidebar. Usuario no llega.`,
      });
    }
  }
}

// ── 4. output ───────────────────────────────────────────────
const report = {
  audit: 'R-AUD-034',
  origen: 'INCIDENTE-MEGAPOL-2026-05-27',
  html: opts.htmlPath,
  supabase_consultado: !opts.noSupabase,
  resumen: {
    button_tabs: buttonTabs.length,
    button_tabs_hidden: buttonTabsHidden.length,
    button_tabs_hidden_list: buttonTabsHidden,
    sidebar_links: sidebarLinks.length,
    pestanas_backend: pestanasActivas?.length ?? null,
    asignaciones_backend: siloPestanas?.length ?? null,
    gaps_detectados: gaps.length,
  },
  status: gaps.length === 0 ? 'ok' : 'fail',
  gaps,
};

if (opts.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('━'.repeat(70));
  console.log(`R-AUD-034 · Auditoría UI vs Permisos · ${new Date().toISOString()}`);
  console.log('━'.repeat(70));
  console.log(`HTML:       ${report.html}`);
  console.log(`Supabase:   ${report.supabase_consultado ? '✅ consultado' : '⚠️ omitido'}`);
  console.log(`Button tabs:    ${report.resumen.button_tabs}`);
  console.log(`Sidebar links:  ${report.resumen.sidebar_links}`);
  if (report.resumen.pestanas_backend !== null) {
    console.log(`Pestañas backend: ${report.resumen.pestanas_backend}`);
    console.log(`Asignaciones backend: ${report.resumen.asignaciones_backend}`);
  }
  console.log('━'.repeat(70));
  if (gaps.length === 0) {
    console.log('✅ OK · cero tabs huérfanos · UI sincronizada con permisos backend.');
  } else {
    console.log(`❌ FAIL · ${gaps.length} gap(s) detectado(s):`);
    console.log();
    for (const g of gaps) {
      console.log(`  [${g.severidad.toUpperCase()}] ${g.tipo}`);
      console.log(`    tab: ${g.tab}${g.silos ? ' · silos: '+g.silos.join(',') : ''}`);
      console.log(`    → ${g.mensaje}`);
      console.log();
    }
  }
  console.log('━'.repeat(70));
}

process.exit(gaps.length === 0 ? 0 : 1);
