/**
 * R-AUD-034 · Capa 3 (Playwright) · Sidebar vs panel.silo_pestanas por rol
 *
 * Para cada rol, valida que el sidebar v4 lista todas las pestañas que el
 * backend dice que ese rol debe ver. Bloquea merge a prod si falla.
 *
 * Origen: INCIDENTE-MEGAPOL-2026-05-27 — Andrea (comercial) no veía Negocios+Cotizador.
 *
 * VARS DE ENTORNO REQUERIDAS:
 *   PANEL_URL                  URL preview o prod (def: https://reciclean-sistema.vercel.app/panel-rdo.html)
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   TEST_USER_<ROL>_EMAIL      ej. TEST_USER_COMERCIAL_EMAIL=qa.comercial@gestionrepchile.cl
 *   TEST_USER_<ROL>_PASSWORD
 *
 * Si las cuentas QA no están creadas, el test usa `test.skip()` para ese rol.
 *
 * Ejecutar:   npx playwright test tests/sidebar-vs-permisos.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";

const PANEL_URL = process.env.PANEL_URL || "https://reciclean-sistema.vercel.app/panel-rdo.html";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://eknmtsrtfkzroxnovfqn.supabase.co";
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || "";

// Rol → silos que el rol pertenece. Coherente con panel.silo_acceso.
// Estos son los silos esperados por defecto para cada perfil.
const ROL_SILOS: Record<string, string[]> = {
  comercial:   ["01"],            // Andrea = comercial · silo 01
  operaciones: ["02", "03"],
  finanzas:    ["07"],
  planta:      ["03"],
  admin:       ["01","02","03","04","05","06","07","08","09","10","11"],
};

async function fetchEsperadas(silos: string[]): Promise<string[]> {
  if (!SUPABASE_ANON) return [];
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/silo_pestanas?select=pestana_codigo&silo_codigo=in.(${silos.join(",")})`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
  );
  if (!r.ok) return [];
  const rows: { pestana_codigo: string }[] = await r.json();
  return [...new Set(rows.map(x => x.pestana_codigo))];
}

async function loginAs(page: Page, email: string, password: string) {
  // El flujo de login real depende del panel; aquí asumimos el inputbox de login en panel-rdo.html
  // o un /login.html. Pablo ajusta si difiere.
  await page.goto(PANEL_URL.replace("/panel-rdo.html", "/login.html"));
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/panel-rdo\.html/, { timeout: 10000 });
}

for (const [rol, silos] of Object.entries(ROL_SILOS)) {
  test(`sidebar v4 muestra todas las pestañas asignadas al rol '${rol}'`, async ({ page }) => {
    const email = process.env[`TEST_USER_${rol.toUpperCase()}_EMAIL`];
    const password = process.env[`TEST_USER_${rol.toUpperCase()}_PASSWORD`];
    test.skip(!email || !password, `Cuenta QA TEST_USER_${rol.toUpperCase()}_* no configurada`);
    test.skip(!SUPABASE_ANON, `SUPABASE_ANON_KEY no configurada`);

    const esperadas = await fetchEsperadas(silos);
    expect(esperadas.length).toBeGreaterThan(0);

    await loginAs(page, email!, password!);
    await page.waitForSelector('#v4-sidebar', { timeout: 10000 });

    const sidebarLinks = await page.$$eval(
      '#v4-sidebar a[data-v4-tab]',
      els => els.map(e => (e as HTMLElement).dataset.v4Tab!)
    );

    const faltantes: string[] = [];
    for (const esp of esperadas) {
      if (!sidebarLinks.includes(esp)) faltantes.push(esp);
    }

    // Mensaje rico para failure
    if (faltantes.length > 0) {
      await page.screenshot({
        path: `test-results/sidebar-fail-${rol}.png`,
        fullPage: true,
      });
    }
    expect(faltantes, `[ROL=${rol}] sidebar v4 NO incluye estas pestañas asignadas: ${faltantes.join(", ")}`).toEqual([]);

    // Cada link en sidebar debe abrir efectivamente la sección
    for (const t of esperadas.slice(0, 3)) {
      await page.click(`#v4-sidebar a[data-v4-tab="${t}"]`);
      await page.waitForTimeout(300);
      const visible = await page.$(`section#tab${t.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase())}:not(.hidden)`);
      expect(visible, `[ROL=${rol}] click en sidebar "${t}" no abrió ninguna section visible`).not.toBeNull();
    }
  });
}
