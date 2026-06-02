#!/usr/bin/env node
// R-AUD-064 · pre-merge JS syntax check para panel-rdo.html y asistente.html
// Extrae todos los <script>...</script> y valida con new Function().
// Sale con 0 si todo OK, 1 si hay error sintactico.
//
// Uso: node scripts/js-parse-check.mjs

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TARGETS = [
  'public/panel-rdo.html',
  'public/index.html',
  'asistente.html',
];

const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const SRC_RE = /\bsrc\s*=\s*["'][^"']+["']/i;
const TYPE_RE = /\btype\s*=\s*["']([^"']+)["']/i;

let totalErrors = 0;
let totalScripts = 0;

for (const target of TARGETS) {
  const path = resolve(target);
  let html;
  try {
    html = readFileSync(path, 'utf8');
  } catch (e) {
    console.log(`[skip] ${target} (no existe)`);
    continue;
  }

  let m;
  let idx = 0;
  let archivoErrs = 0;
  while ((m = SCRIPT_RE.exec(html)) !== null) {
    idx++;
    const fullTag = m[0];
    const body = m[1];
    // skip externos (src=...)
    if (SRC_RE.test(fullTag)) continue;
    // skip types no-JS (modulos JSON, importmap, application/ld+json)
    const typeMatch = fullTag.match(TYPE_RE);
    if (typeMatch) {
      const t = typeMatch[1].toLowerCase();
      if (!['', 'text/javascript', 'application/javascript', 'module'].includes(t)) continue;
    }
    if (!body.trim()) continue;
    totalScripts++;
    try {
      // new Function valida sintaxis sin ejecutar nada
      new Function(body);
    } catch (e) {
      archivoErrs++;
      totalErrors++;
      const lineApprox = html.slice(0, m.index).split('\n').length;
      console.error(`\n❌ ${target} · script #${idx} (~linea ${lineApprox}):`);
      console.error(`   ${e.name}: ${e.message}`);
    }
  }
  if (archivoErrs === 0) {
    console.log(`✓ ${target} · ${idx} scripts OK`);
  } else {
    console.log(`✗ ${target} · ${archivoErrs} error(es)`);
  }
}

console.log(`\nTotal scripts validados: ${totalScripts}`);
if (totalErrors > 0) {
  console.error(`\nFalla: ${totalErrors} script(s) con error sintactico.`);
  process.exit(1);
}
console.log('OK · sin errores sintacticos.');
