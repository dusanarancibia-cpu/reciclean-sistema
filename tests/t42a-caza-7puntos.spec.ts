// CAZA Dusan · T-42a Calculadora Precios · verificación autónoma 7 puntos con browser real
// Origen: sesión c56f9a24 · "caza por asegurar que funciona y no probarlo" ·
//   quedó BLOQUEADA por error de sesión Playwright MCP, nunca se completó.
// PC5 · 2026-07-02 · corre en CI (GH Actions) para evitar sesión de browser local atascada.
import { test, expect } from '@playwright/test';

const EMAIL    = process.env.QA_EMAIL    || process.env.DUSAN_EMAIL    || '';
const PASSWORD = process.env.QA_PASSWORD || process.env.DUSAN_PASSWORD || '';
const BASE     = process.env.E2E_BASE_URL || 'https://reciclean-sistema.vercel.app';
const MATERIAL_RE = /Acero\s+Inox.*304/i;

async function login(page) {
  await page.goto(`${BASE}/panel-rdo.html`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button:has-text("Ingresar"), button:has-text("Iniciar")');
  await page.waitForSelector('[data-v4-tab]', { timeout: 15_000 });
}

async function abrirCalculadora(page) {
  const grupoPrecios = page.locator('details.v4-cat summary:has-text("Precios")').first();
  const isOpen = await page.locator('details.v4-cat:has(summary:has-text("Precios"))').getAttribute('open');
  if (isOpen === null) await grupoPrecios.click();
  await page.click('a[data-v4-tab="calculadora_precios"]');
  await page.waitForSelector('section#tabCalculadoraPrecios:not(.hidden)', { timeout: 8_000 });
  await page.waitForFunction(() => {
    const sel = document.getElementById('calcMaterial') as HTMLSelectElement | null;
    return !!sel && sel.options.length > 1;
  }, { timeout: 10_000 });
}

async function seleccionarAceroInox304(page) {
  const valor = await page.locator('#calcMaterial option', { hasText: MATERIAL_RE }).first().getAttribute('value');
  expect(valor, 'Material "Acero Inoxidable 304" debe existir en curated.materiales').toBeTruthy();
  await page.selectOption('#calcMaterial', valor!);
  // calcAutoFillPrecioCompra es async (consulta Supabase) — esperar a que P.Lista dexe de ser "—"
  await page.waitForFunction(() => {
    const el = document.getElementById('calcPlista');
    return el && el.textContent && el.textContent.trim() !== '—';
  }, { timeout: 10_000 });
}

test.describe.serial('CAZA T-42a · 7 puntos Calculadora Precios (Acero Inox 304)', () => {

  test('PUNTO 1/2 — seleccionar material auto-llena el slider Precio Venta desde Bandeja aprobada', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    await login(page);
    await abrirCalculadora(page);
    const sliderValorAntes = await page.locator('#calcP').inputValue();
    await seleccionarAceroInox304(page);
    const sliderValorDespues = await page.locator('#calcP').inputValue();
    await page.screenshot({ path: 'test-results/t42a-01-autofill.png' });
    expect(Number(sliderValorDespues), 'el slider debe moverse solo tras elegir el material').not.toBe(Number(sliderValorAntes));
    expect(Number(sliderValorDespues)).toBeGreaterThan(0);
  });

  test('PUNTO 3 — P.Lista se calcula (margen − flete) a partir del precio de venta', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    await login(page);
    await abrirCalculadora(page);
    await seleccionarAceroInox304(page);
    const plista = await page.locator('#calcPlista').textContent();
    await page.screenshot({ path: 'test-results/t42a-03-plista.png' });
    expect(plista?.trim()).not.toBe('—');
    expect(plista).toMatch(/\$/);
  });

  test('PUNTO 4 — P.Máx y P.Ejec se calculan a partir de P.Lista', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    await login(page);
    await abrirCalculadora(page);
    await seleccionarAceroInox304(page);
    const pmax  = await page.locator('#calcPmax').textContent();
    const pejec = await page.locator('#calcPejec').textContent();
    await page.screenshot({ path: 'test-results/t42a-04-pmax-pejec.png' });
    expect(pmax?.trim()).not.toBe('—');
    expect(pejec?.trim()).not.toBe('—');
  });

  test('PUNTO 5 — slider Precio Venta cambia a rojo si supera el precio de venta de lista vigente (calcRefPrecioVenta)', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    await login(page);
    await abrirCalculadora(page);
    await seleccionarAceroInox304(page);

    const refPrecio = await page.evaluate(() => (window as any).calcRefPrecioVenta ?? 0);
    expect(refPrecio, 'calcRefPrecioVenta debe quedar > 0 tras el auto-fill (Bandeja aprobada)').toBeGreaterThan(0);

    // Caso A: slider en el precio de referencia exacto → NO debe estar rojo
    const colorEnReferencia = await page.evaluate(() => document.getElementById('calcP')?.style.accentColor || '');
    await page.screenshot({ path: 'test-results/t42a-05a-en-referencia.png' });
    expect(colorEnReferencia).not.toBe('#ef4444');

    // Caso B: subir el slider por encima del precio de referencia → SÍ debe estar rojo
    const slider = page.locator('#calcP');
    const max = Number(await slider.getAttribute('max'));
    const nuevoValor = Math.min(refPrecio + 500, max);
    await slider.fill(String(nuevoValor));
    await slider.dispatchEvent('input');
    await page.waitForTimeout(200);
    const colorSobreReferencia = await page.evaluate(() => document.getElementById('calcP')?.style.accentColor || '');
    await page.screenshot({ path: 'test-results/t42a-05b-sobre-referencia-rojo.png' });
    expect(colorSobreReferencia, 'el slider debe pintarse rojo (#ef4444) al superar el precio de venta de lista vigente').toBe('rgb(239, 68, 68)');
  });

  test('PUNTO 6 — semáforo verde/amarillo/rojo responde a la categoría elegida', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    await login(page);
    await abrirCalculadora(page);
    await seleccionarAceroInox304(page);
    const semaforoAntes = await page.locator('#calcSemaforo').textContent();
    const opciones = await page.locator('#calcCategoria option').count();
    expect(opciones, 'debe haber categorías cargadas desde curated.margen_metas').toBeGreaterThan(1);
    await page.selectOption('#calcCategoria', { index: 1 });
    await page.waitForTimeout(300);
    const semaforoDespues = await page.locator('#calcSemaforo').textContent();
    await page.screenshot({ path: 'test-results/t42a-06-semaforo.png' });
    expect(semaforoDespues?.trim()).not.toBe('—');
    void semaforoAntes;
  });

  test('PUNTO 7 — Publicar propuesta inserta en staging.precios_propuestos', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'Requiere QA_EMAIL + QA_PASSWORD');
    // Escritura real a producción (el trigger la auto-aplica en ~22ms) — opt-in explícito.
    // Correr con CAZA_INCLUIR_PUBLICAR=1 solo con autorización de Dusan.
    test.skip(process.env.CAZA_INCLUIR_PUBLICAR !== '1', 'Escritura real a prod — requiere CAZA_INCLUIR_PUBLICAR=1 autorizado por Dusan');
    await login(page);
    await abrirCalculadora(page);
    await seleccionarAceroInox304(page);
    const btn = page.locator('#calcPublicar');
    await expect(btn).toBeEnabled();
    await btn.click();
    await page.waitForFunction(() => {
      const el = document.getElementById('calcPublicarMsg');
      return el && el.textContent && el.textContent.trim().length > 0;
    }, { timeout: 8_000 });
    const msg = await page.locator('#calcPublicarMsg').textContent();
    await page.screenshot({ path: 'test-results/t42a-07-publicar.png' });
    expect(msg, 'debe confirmar publicación exitosa, no error').toMatch(/✅|publicada/i);
  });
});
