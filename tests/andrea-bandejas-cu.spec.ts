// E2E smoke · Bandejas Cliente Único Andrea + Comex
// PC2 Pablo 2026-06-11 PM, gatillado por feedback DeepSeek "smoke con UI real"
// Cubre las 4 tabs construidas en commits 33c7642/6d7a0b7/f7a0c7c
// User: qa@reciclean.cl (Andrea simulada, área Comercial, silo 01)
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = process.env.QA_EMAIL || 'qa@reciclean.cl';
const QA_PASSWORD = process.env.QA_PASSWORD || 'SmokeAndrea2026!';

const consoleErrors: string[] = [];

async function login(page: Page) {
  // Capturar logs de consola desde antes del login
  const logs: string[] = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  await page.goto('/panel-rdo.html');
  await page.waitForSelector('#loginEmail', { timeout: 10_000 });
  await page.fill('#loginEmail', QA_EMAIL);
  await page.fill('#loginPassword', QA_PASSWORD);
  // Llamar window.login() directamente para evitar problemas de click
  await page.evaluate(() => (window as any).login());
  try {
    await page.waitForFunction(() => {
      const el = document.getElementById('appContainer');
      return el && getComputedStyle(el).display !== 'none';
    }, { timeout: 25_000 });
  } catch (e) {
    const errText = await page.locator('#loginError').textContent().catch(() => '');
    const errVisible = await page.locator('#loginError:not(.hidden)').count();
    throw new Error(`Login timeout. loginError visible=${errVisible} text="${errText}". Logs: ${JSON.stringify(logs.slice(-15))}`);
  }
}

async function abrirTab(page: Page, codigo: string, sectionId: string) {
  // Sidebar v4 prioritario; navbar viejo fallback
  const sel = `a[data-v4-tab="${codigo}"], button[data-tab="${codigo}"]`;
  await page.locator(sel).first().click();
  await page.waitForSelector(`section#${sectionId}:not(.hidden)`, { timeout: 6_000 });
}

test.describe('Smoke Bandejas CU Andrea + Comex', () => {
  test.skip(!QA_PASSWORD, 'QA_PASSWORD no seteado');
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  });

  test('Tab Duplicados clientes carga + muestra KPIs', async ({ page }) => {
    await login(page);
    await abrirTab(page, 'andrea_dup_clientes', 'tabAndreaDupClientes');
    // Esperar a que cargue (loader sale)
    await page.waitForSelector('#adup_lista', { timeout: 8_000 });
    await page.waitForFunction(() => {
      const el = document.querySelector('#adup_lista');
      return el && !el.textContent?.includes('Cargando');
    }, { timeout: 10_000 });
    // KPIs deben tener números (no "0" si hay data; pero 0 también es válido si fue limpiado)
    const total = await page.locator('#adup_kpi_total').textContent();
    expect(total).toMatch(/^\d+$/);
    // No debe haber error visible
    const err = await page.locator('#adup_lista').textContent();
    expect(err).not.toMatch(/Error:/i);
    await page.screenshot({ path: 'test-results/dup-clientes.png', fullPage: true });
  });

  test('Tab Nombres opps carga + toggle histórico funciona', async ({ page }) => {
    await login(page);
    await abrirTab(page, 'andrea_drift_libre', 'tabAndreaDriftLibre');
    await page.waitForFunction(() => {
      const el = document.querySelector('#adrift_lista');
      return el && !el.textContent?.includes('Cargando');
    }, { timeout: 10_000 });
    const totalActivo = parseInt(await page.locator('#adrift_kpi_total').textContent() || '0');
    expect(totalActivo).toBeGreaterThanOrEqual(0);
    // Toggle histórico
    await page.locator('#adrift_ver_historico').check();
    await page.waitForFunction(() => {
      const el = document.querySelector('#adrift_lista');
      return el && !el.textContent?.includes('Cargando');
    }, { timeout: 10_000 });
    const totalHist = parseInt(await page.locator('#adrift_kpi_total').textContent() || '0');
    // Histórico debe ser >= activo (es el universo más amplio o igual)
    expect(totalHist).toBeGreaterThanOrEqual(totalActivo);
    await page.screenshot({ path: 'test-results/drift-libre.png', fullPage: true });
  });

  test('Tab RUTs a verificar carga sin error permission denied', async ({ page }) => {
    await login(page);
    await abrirTab(page, 'andrea_ruts_invalidos', 'tabAndreaRutsInvalidos');
    await page.waitForFunction(() => {
      const el = document.querySelector('#aruts_lista');
      return el && !el.textContent?.includes('Cargando');
    }, { timeout: 10_000 });
    const err = await page.locator('#aruts_lista').textContent();
    expect(err).not.toMatch(/permission denied|Could not find|42501/i);
    await page.screenshot({ path: 'test-results/ruts-invalidos.png', fullPage: true });
  });

  test('Tab Comex carga vacío + form alta visible al clickear + cancelar oculta', async ({ page }) => {
    await login(page);
    await abrirTab(page, 'andrea_comex', 'tabAndreaComex');
    await page.waitForFunction(() => {
      const el = document.querySelector('#acomex_lista');
      return el && !el.textContent?.includes('Cargando');
    }, { timeout: 10_000 });
    // Form arranca oculto
    await expect(page.locator('#acomex_form')).toBeHidden();
    // Click + Nueva → form visible
    await page.locator('#acomex_nueva').click();
    await expect(page.locator('#acomex_form')).toBeVisible();
    // Click cancelar → vuelve a oculto
    await page.locator('#acomex_f_cancelar').click();
    await expect(page.locator('#acomex_form')).toBeHidden();
    await page.screenshot({ path: 'test-results/comex.png', fullPage: true });
  });

  test('Sin console errors críticos durante navegación 4 tabs', async ({ page }) => {
    await login(page);
    for (const [codigo, sec] of [
      ['andrea_dup_clientes', 'tabAndreaDupClientes'],
      ['andrea_drift_libre', 'tabAndreaDriftLibre'],
      ['andrea_ruts_invalidos', 'tabAndreaRutsInvalidos'],
      ['andrea_comex', 'tabAndreaComex'],
    ]) {
      await abrirTab(page, codigo, sec);
      await page.waitForTimeout(1500);
    }
    const criticos = consoleErrors.filter(e =>
      /Could not find the function|permission denied|42501|TypeError|ReferenceError/i.test(e)
    );
    expect(criticos, `Console errors críticos: ${JSON.stringify(criticos)}`).toEqual([]);
  });
});
