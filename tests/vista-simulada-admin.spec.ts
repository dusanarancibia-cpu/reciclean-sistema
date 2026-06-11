// Vista simulada "Ver como X" cosmética (admin/dusan only)
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = 'qa@reciclean.cl';
const QA_PASSWORD = 'SmokeAndrea2026!';

async function login(page: Page) {
  await page.goto('/panel-rdo.html');
  await page.fill('#loginEmail', QA_EMAIL);
  await page.fill('#loginPassword', QA_PASSWORD);
  await page.evaluate(() => (window as any).login());
  await page.waitForFunction(() => {
    const el = document.getElementById('appContainer');
    return el && getComputedStyle(el).display !== 'none';
  }, { timeout: 30_000 });
}

test.describe('Vista simulada admin', () => {
  test.setTimeout(60_000);

  test('Como admin: selector visible, cambia a Andrea, banner aparece, restaura', async ({ page }) => {
    await login(page);
    // Esperar que setupVistaSimulada haya corrido
    await page.waitForTimeout(1500);
    // Selector debe estar visible (perfil admin)
    await expect(page.locator('#vistaSimContainer')).toBeVisible();
    // Banner default oculto
    await expect(page.locator('#vistaSimBanner')).toBeHidden();
    // Cambiar a Andrea
    await page.selectOption('#vistaSimSelector', 'andrea');
    // Banner visible
    await expect(page.locator('#vistaSimBanner')).toBeVisible();
    const nombre = await page.locator('#vistaSimNombre').textContent();
    expect(nombre).toMatch(/Andrea/);
    // currentProfile cambió a comercial
    const prof = await page.evaluate(() => (window as any).currentProfile);
    expect(prof).toBe('comercial');
    // currentSilo cambió a 01
    const silo = await page.evaluate(() => (window as any).currentSilo);
    expect(silo).toBe('01');
    // userProfileDisplay con badge amber
    const badge = await page.locator('#userProfileDisplay').textContent();
    expect(badge).toMatch(/sim/i);
    // Click "Volver a mi vista"
    await page.locator('#vistaSimBanner button').click();
    await expect(page.locator('#vistaSimBanner')).toBeHidden();
    // currentProfile restaurado
    const profRestaurado = await page.evaluate(() => (window as any).currentProfile);
    expect(profRestaurado).toBe('admin');
  });
});
