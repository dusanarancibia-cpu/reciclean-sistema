// E2E smoke · Cotizador V1 estructural
// Cubre item DoD "Smoke E2E pegar texto -> extraer Diego -> guardar -> ver Negocios"
// VERSION SMOKE: render-only sin flujo de guardado (que requiere catalogo de
// cliente/sucursal y modificaria state real). Cierra el FAIL "no hay spec E2E del cotizador".
//
// SPEC: mayordomo/SPEC-REDISENO-COTIZADOR-V1.md
// PC2 Pablo 2026-06-02
import { test, expect } from '@playwright/test';

const QA_EMAIL = process.env.QA_EMAIL || 'qa@reciclean.cl';
const QA_PASSWORD = process.env.QA_PASSWORD || '';

test.describe('Cotizador V1 smoke estructural', () => {
  test.skip(!QA_PASSWORD, 'QA_PASSWORD env var no configurada (set GitHub Secret)');

  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push('pageerror: ' + err.message);
    });
  });

  test('cotizador carga con estructura V1 + RPC F4', async ({ page }) => {
    // 1 — Abrir panel + login
    await page.goto('/panel-rdo.html');
    await expect(page).toHaveTitle(/Panel RDO|Gestion REP|Gestión REP/i);
    await page.fill('input[type="email"]', QA_EMAIL);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button:has-text("Ingresar"), button:has-text("Iniciar")');

    // 2 — Sidebar v4 visible
    await page.waitForSelector('[data-v4-tab], [data-tab]', { timeout: 15_000 });

    // 3 — Navegar a Cotizador
    await page.click('[data-tab="cotizador"], [data-v4-tab="cotizador"]');
    await page.waitForSelector('section#tabCotizador:not(.hidden)', { timeout: 5_000 });

    // 4 — Verificar estructura clave del cotizador V1
    await expect(page.locator('h2:has-text("Cotizador")')).toBeVisible();
    await expect(page.locator('#cotTitulo')).toBeVisible();
    await expect(page.locator('#cotClienteBuscar')).toBeVisible();
    await expect(page.locator('#cotSucursal')).toBeVisible();
    await expect(page.locator('#cotLineas')).toBeAttached();
    await expect(page.locator('#cotClienteTraeMaterial')).toBeVisible();

    // 5 — R-AUD-013 · Pizarra colapsada por default
    const pizarraBody = page.locator('#cotPizarraBody');
    await expect(pizarraBody).toHaveClass(/hidden/);
    await expect(page.locator('#cotPizarraToggle')).toHaveText(/mostrar/i);

    // 6 — F2 R-AUD-035 · Boton Editar cliente disabled por default (sin cliente_id)
    const editBtn = page.locator('#cotClienteEditarBtn');
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeDisabled();

    // 7 — Expandir pizarra al click + verificar textarea
    await page.click('#cotPizarraToggle');
    await expect(pizarraBody).not.toHaveClass(/hidden/);
    await expect(page.locator('#cotPizarraTexto')).toBeVisible();

    // 8 — Verificar que el HTML contiene referencia a RPC F4 (server-side guard)
    const html = await page.content();
    expect(html).toContain('cotizador_guardar_v1');

    // 9 — Sin errores consola criticos
    const criticos = consoleErrors.filter(e =>
      /Could not find|permission denied|42501|TypeError/i.test(e),
    );
    expect(criticos, `Console errors criticos: ${JSON.stringify(criticos)}`).toEqual([]);

    // 10 — Screenshot evidencia
    await page.screenshot({ path: 'test-results/cotizador-smoke.png', fullPage: true });
  });
});
