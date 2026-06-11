// Smoke crear cliente desde Cotizador (deuda Fase 5 cerrada hoy)
// Flujo: autocomplete vacío → click "Crear nuevo" → modal Cartera prefill → guardar → autoselecciona en Cotizador
import { test, expect, Page } from '@playwright/test';

const QA_EMAIL = 'qa@reciclean.cl';
const QA_PASSWORD = 'SmokeAndrea2026!';
const MARCADOR = 'SMOKE_COTIZADOR_CREATE_' + Date.now();

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

test.describe('Cotizador · crear cliente nuevo', () => {
  test.setTimeout(90_000);

  test('Flujo completo: autocomplete vacío → modal → guardar → autoseleccionado', async ({ page }) => {
    page.on('console', m => console.log('[browser]', m.type(), m.text()));
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    page.on('dialog', d => { console.log('[DIALOG]', d.message()); d.dismiss(); });
    await loginAndCotizador(page);
    // Tipear nombre inexistente
    await page.fill('#cotClienteBuscar', MARCADOR);
    // Esperar a que botón "+ Crear nuevo" aparezca (debounce 300ms + RPC)
    await page.waitForFunction(() => {
      const b = document.getElementById('cotClienteCrearBtn');
      return b && !b.classList.contains('hidden');
    }, { timeout: 5_000 });
    // Verificar pre-condiciones
    const tienen = await page.evaluate(() => ({
      cotAbrir: typeof (window as any).cotAbrirCrearCliente,
      carAbrir: typeof (window as any).carAbrirCrear,
      modal: !!document.getElementById('clienteEditModal'),
    }));
    console.log('pre-click funcs:', JSON.stringify(tienen));
    // Capturar alerts (si carAbrirCrear no existe, sale alert)
    page.on('dialog', d => { console.log('DIALOG:', d.message()); d.dismiss(); });
    // Click botón
    await page.locator('#cotClienteCrearBtn').click();
    // Modal abierto con razón social prellenada
    await page.waitForSelector('#clienteEditModal:not(.hidden)', { timeout: 5_000 });
    const razon = await page.locator('#cliRazonSocial').inputValue();
    expect(razon).toBe(MARCADOR);
    // Título del modal
    const titulo = await page.locator('#clienteEditModalTitulo').textContent();
    expect(titulo).toMatch(/Crear/i);
    // Guardar
    await page.locator('#clienteEditGuardarBtn').click();
    // Esperar a que modal se cierre y cliente_id se setee
    await page.waitForFunction(() => {
      const h = document.getElementById('cotClienteId') as HTMLInputElement;
      return h && h.value && h.value.length > 0;
    }, { timeout: 10_000 });
    const cliId = await page.locator('#cotClienteId').inputValue();
    expect(cliId).toMatch(/^cli_\d+|^c\d+$/);
    // Confirmación visible
    const sel = await page.locator('#cotClienteSeleccionado').textContent();
    expect(sel).toContain(MARCADOR);
    await page.screenshot({ path: 'test-results/cotizador-crear-cliente.png', fullPage: true });
  });
});
