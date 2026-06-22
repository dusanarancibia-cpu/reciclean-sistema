// E2E smoke · Fase A frontend PRECIOS-VIVOS-2026 · PC2 Pablo 2026-06-22
//
// Cubre 5 tabs construidos en sesión 22-jun-2026 (bloqueada por billing GitHub).
// Cada test verifica que el tab abre, su sección se hace visible, NO hay errores
// críticos de RPC o JS en consola, y los elementos esperados están presentes.
//
// Ejecutar:
//   E2E_BASE_URL=https://reciclean-sistema.vercel.app \
//   QA_EMAIL=qa@reciclean.cl QA_PASSWORD=... \
//   npx playwright test tests/frontend-tabs-fase-a.spec.ts
//
// Branches que cubre (todas deben estar mergeadas en main para que pase):
//   - feat/t38cd-geografia-macro
//   - feat/t40-indicadores-adelantados
//   - feat/t41-acelerador-freno
//   - feat/t42-calculadora-precios
//   - feat/t46-boveda-historica
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = process.env.QA_EMAIL || 'qa@reciclean.cl';
const QA_PASSWORD = process.env.QA_PASSWORD || '';

const TABS = [
  {
    name: 'T-38c Geografía',
    tabId: 'analisis_micro',
    sectionId: 'tabAnalisisMicro',
    subTabButtonId: 'amTabGeografiaBtn',
    expectIds: ['amTbodyGeografia', 'amGeoNSuc', 'amGeoCompraProm']
  },
  {
    name: 'T-38d Macro Chile',
    tabId: 'analisis_micro',
    sectionId: 'tabAnalisisMicro',
    subTabButtonId: 'amTabMacroBtn',
    expectIds: ['amVistaMacro']
  },
  {
    name: 'T-40 Anticipación Tendencias',
    tabId: 'indicadores_adel',
    sectionId: 'tabIndicadoresAdel',
    expectIds: ['indI1Valor', 'indI2Valor', 'indI3Valor', 'indI4Valor', 'indResumen']
  },
  {
    name: 'T-41 Acelerador/Freno',
    tabId: 'modo_precios',
    sectionId: 'tabModoPrecios',
    expectIds: ['modoBadge', 'modoTexto', 'modoAccionesLista', 'modoBotones']
  },
  {
    name: 'T-42 Calculadora Precios',
    tabId: 'calculadora_precios',
    sectionId: 'tabCalculadoraPrecios',
    expectIds: ['calcP', 'calcMg', 'calcFl', 'calcPmax', 'calcPlista', 'calcPejec', 'calcPublicar']
  },
  {
    name: 'T-46 Bóveda Histórica',
    tabId: 'boveda_historica',
    sectionId: 'tabBovedaHistorica',
    expectIds: ['bovMaterial', 'bovSucursal', 'bovVentana', 'bovStatN', 'bovAlerta']
  }
];

async function loginIfNeeded(page: Page) {
  await page.goto('/panel-rdo.html');
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await emailInput.fill(QA_EMAIL);
    await page.fill('input[type="password"]', QA_PASSWORD);
    await page.click('button:has-text("Ingresar"), button:has-text("Iniciar")');
    await page.waitForSelector('[data-v4-tab]', { timeout: 15_000 });
  }
}

test.describe('Fase A frontend · 5 tabs PRECIOS-VIVOS-2026', () => {
  test.skip(!QA_PASSWORD, 'QA_PASSWORD env var no configurada');

  for (const tab of TABS) {
    test(`smoke · ${tab.name} (${tab.tabId})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => {
        consoleErrors.push('pageerror: ' + err.message);
      });

      await loginIfNeeded(page);

      // 1. Click en el sidebar o navbar del tab principal
      await page.click(`[data-v4-tab="${tab.tabId}"], button[data-tab="${tab.tabId}"]`);

      // 2. Sección visible (no .hidden)
      await page.waitForSelector(`section#${tab.sectionId}:not(.hidden)`, { timeout: 5_000 });

      // 3. Si es sub-tab (T-38c/T-38d), click adicional
      if (tab.subTabButtonId) {
        await page.click(`#${tab.subTabButtonId}`);
        await page.waitForTimeout(300); // dar tiempo al render
      }

      // 4. IDs esperados visibles en DOM
      for (const id of tab.expectIds) {
        const el = page.locator(`#${id}`);
        await expect(el, `falta el elemento #${id} en ${tab.name}`).toBeAttached();
      }

      // 5. No errores críticos en consola (RPC/permisos/types)
      // Se permite warning, pero NO permission denied, function not found, ni TypeError
      const criticos = consoleErrors.filter(e =>
        /Could not find the function|permission denied|42501|PGRST202|TypeError/i.test(e)
      );
      expect(criticos, `Console errors críticos en ${tab.name}: ${JSON.stringify(criticos)}`).toEqual([]);

      // 6. Screenshot evidencia
      const screenshotName = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await page.screenshot({
        path: `test-results/fase-a-${screenshotName}.png`,
        fullPage: false
      });
    });
  }

  test('regresión · ningún tab Fase A rompe el panel completo', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginIfNeeded(page);

    // Click rápido en los 6 tabs (5 nuevos + 1 ya merged como control)
    const tabIds = TABS.map(t => t.tabId).concat(['errores_bucles']);
    for (const id of tabIds) {
      const selector = `[data-v4-tab="${id}"], button[data-tab="${id}"]`;
      if (await page.locator(selector).first().isVisible({ timeout: 2_000 }).catch(() => false)) {
        await page.locator(selector).first().click();
        await page.waitForTimeout(150);
      }
    }

    const criticos = consoleErrors.filter(e =>
      /TypeError|ReferenceError|Cannot read|undefined is not/i.test(e)
    );
    expect(criticos, `Regresión critic en navegación: ${JSON.stringify(criticos)}`).toEqual([]);
  });
});
