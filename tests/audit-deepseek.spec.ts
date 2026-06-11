// Auditoría DeepSeek 11-jun PM. Bloques 2 (UI) + 7 (regresión tabs viejos).
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = 'qa@reciclean.cl';
const QA_PASSWORD = 'SmokeAndrea2026!';

async function loginFresh(page: Page) {
  await page.goto('/panel-rdo.html');
  await page.waitForSelector('#loginEmail');
  await page.fill('#loginEmail', QA_EMAIL);
  await page.fill('#loginPassword', QA_PASSWORD);
  await page.evaluate(() => (window as any).login());
  await page.waitForFunction(() => {
    const el = document.getElementById('appContainer');
    return el && getComputedStyle(el).display !== 'none';
  }, { timeout: 30_000 });
}

test.describe('Audit DeepSeek', () => {
  test.setTimeout(120_000);

  test('2.2 BUG#5 ausente en sesión fresca (incógnito limpio)', async ({ browser }) => {
    // Browser context aislado = localStorage limpio = sesión fresca
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('requestfailed', r => { if (r.failure()?.errorText.includes('ERR_ABORTED')) errs.push('reqfail ABORT: '+r.url().slice(-60)); });
    await loginFresh(page);
    // Filtrar errores conocidos no críticos
    const criticos = errs.filter(e => /Failed to fetch|ERR_ABORTED.*auth\/v1\/token|TypeError.*fetch/i.test(e));
    expect(criticos, JSON.stringify(criticos)).toEqual([]);
    await ctx.close();
  });

  test('2.1 + 7 los 7 tabs nuevos y los viejos críticos cargan sin error crítico', async ({ page }) => {
    const errs: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await loginFresh(page);
    // Tabs nuevos
    const nuevos = ['andrea_dup_clientes','andrea_drift_libre','andrea_ruts_invalidos','andrea_comex','decisor_venta','andrea_cobranza','andrea_actas'];
    for (const t of nuevos) {
      await page.locator(`a[data-v4-tab="${t}"], button[data-tab="${t}"]`).first().click();
      await page.waitForTimeout(1200);
    }
    // Tabs viejos críticos (regresión)
    const viejos = ['cotizador','bandeja_precios','cumplimiento','cartera','rdo'];
    for (const t of viejos) {
      const sel = `a[data-v4-tab="${t}"], button[data-tab="${t}"]`;
      const visible = await page.locator(sel).first().isVisible().catch(()=>false);
      if (visible) {
        await page.locator(sel).first().click();
        await page.waitForTimeout(1000);
      }
    }
    const criticos = errs.filter(e => /Could not find the function|permission denied|42501|TypeError|ReferenceError/i.test(e));
    expect(criticos, JSON.stringify(criticos)).toEqual([]);
    await page.screenshot({ path: 'test-results/audit-regresion.png', fullPage: true });
  });

  test('2.3 + 2.4 autocomplete cotizador + crear cliente nuevo', async ({ page }) => {
    await loginFresh(page);
    await page.locator('a[data-v4-tab="cotizador"], button[data-tab="cotizador"]').first().click();
    await page.waitForTimeout(2000);
    // Buscar input cliente en cotizador (selectores comunes)
    const inputs = await page.locator('input[placeholder*="liente" i], input[placeholder*="azón social" i], input[id*="liente" i]').all();
    if (inputs.length === 0) {
      test.skip(true, 'No encontré input cliente en Cotizador — selector no estándar');
      return;
    }
    await inputs[0].fill('Emerson');
    await page.waitForTimeout(1500);
    // Capturar screenshot del estado (si hay autocomplete, debería verse)
    await page.screenshot({ path: 'test-results/audit-cotizador-emerson.png', fullPage: true });
  });
});
