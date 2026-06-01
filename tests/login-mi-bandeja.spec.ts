// E2E MVP · Flujo crítico #1 · Login + Mi Bandeja Personal
// SPEC: mayordomo/SPEC-E2E-PLAYWRIGHT-MVP.md
// PC2 Pablo 2026-06-02
//
// CORRECCIONES vs SPEC literal:
// - Tab Mi Bandeja Personal real es data-v4-tab="mi_bandeja" / section#tabMiBandeja
//   (el SPEC mencionaba bandeja_dieg que es "Bandeja Diego" — tab DISTINTO).
// - Selector login botón: "Ingresar" o "Iniciar sesión" (verificar runtime).
import { test, expect } from '@playwright/test';

const QA_EMAIL = process.env.QA_EMAIL || 'qa@reciclean.cl';
const QA_PASSWORD = process.env.QA_PASSWORD || '';

test.describe('Flujo crítico #1 — Login + Mi Bandeja Personal', () => {
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

  test('login QA + carga Mi Bandeja sin errores RPC', async ({ page }) => {
    // Step 1 — Abrir panel
    await page.goto('/panel-rdo.html');
    await expect(page).toHaveTitle(/Panel RDO|Gestión REP/i);

    // Step 2 — Login (selectores actuales del panel-rdo.html)
    await page.fill('input[type="email"]', QA_EMAIL);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button:has-text("Ingresar"), button:has-text("Iniciar")');

    // Step 3 — Esperar sidebar v4 visible (post-login muestra app-container)
    await page.waitForSelector('[data-v4-tab]', { timeout: 15_000 });

    // Step 4 — Navegar a Mi Bandeja Personal (corregido: mi_bandeja, no bandeja_dieg)
    await page.click('[data-v4-tab="mi_bandeja"], button[data-tab="mi_bandeja"]');

    // Step 5 — Verificar section visible
    await page.waitForSelector('section#tabMiBandeja:not(.hidden)', { timeout: 5_000 });

    // Step 6 — Verificar que NO hay error visible de RPC/permission denied en pantalla
    const errorVisible = await page
      .locator('text=/Could not find the function|permission denied|Error: 42501/i')
      .count();
    expect(errorVisible).toBe(0);

    // Step 7 — Verificar no console errors críticos
    const criticosConsole = consoleErrors.filter(e =>
      /Could not find|permission denied|42501|TypeError/i.test(e),
    );
    expect(criticosConsole, `Console errors críticos: ${JSON.stringify(criticosConsole)}`).toEqual([]);

    // Step 8 — Screenshot evidencia
    await page.screenshot({ path: 'test-results/login-mi-bandeja-final.png', fullPage: true });
  });
});
