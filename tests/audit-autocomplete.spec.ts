// Validación 2.3 DeepSeek: autocomplete cliente en Cotizador
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = 'qa@reciclean.cl';
const QA_PASSWORD = 'SmokeAndrea2026!';

async function loginAndCotizador(page: Page) {
  await page.goto('/panel-rdo.html');
  await page.fill('#loginEmail', QA_EMAIL);
  await page.fill('#loginPassword', QA_PASSWORD);
  await page.evaluate(() => (window as any).login());
  await page.waitForFunction(() => {
    const el = document.getElementById('appContainer');
    return el && getComputedStyle(el).display !== 'none';
  }, { timeout: 30_000 });
  await page.locator('a[data-v4-tab="cotizador"], button[data-tab="cotizador"]').first().click();
  await page.waitForSelector('#cotClienteBuscar', { timeout: 10_000 });
}

test.describe('Audit 2.3 autocomplete Cotizador', () => {
  test.setTimeout(60_000);

  test('Autocomplete Emerson: aparece dropdown con resultados', async ({ page }) => {
    await loginAndCotizador(page);
    await page.fill('#cotClienteBuscar', 'Emerson');
    // Debounce 300ms + RPC; espero a que sugerencias dejen de ser hidden
    await page.waitForFunction(() => {
      const el = document.getElementById('cotClienteSugerencias');
      return el && !el.classList.contains('hidden');
    }, { timeout: 5_000 });
    const items = await page.locator('#cotClienteSugerencias > div').count();
    expect(items).toBeGreaterThan(0);
    const textos = await page.locator('#cotClienteSugerencias > div').allTextContents();
    expect(textos.some(t => /emerson/i.test(t))).toBeTruthy();
    await page.screenshot({ path: 'test-results/audit-autocomplete-emerson.png', fullPage: true });
  });

  test('Autocomplete texto inexistente: dropdown queda oculto', async ({ page }) => {
    await loginAndCotizador(page);
    await page.fill('#cotClienteBuscar', 'ZZZ_CLIENTE_INEXISTENTE_XYZ_999');
    await page.waitForTimeout(800); // debounce + RPC
    const oculto = await page.locator('#cotClienteSugerencias').evaluate(el => el.classList.contains('hidden'));
    expect(oculto).toBe(true);
  });
});
