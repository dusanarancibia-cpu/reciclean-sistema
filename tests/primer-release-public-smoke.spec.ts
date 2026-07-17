import { test, expect, Page } from '@playwright/test';

type SmokePage = {
  path: string;
  title: RegExp;
  heading: RegExp;
  eyebrow?: RegExp;
};

const PAGES: SmokePage[] = [
  {
    path: '/romanero.html',
    title: /Romanero MVP/i,
    heading: /Romanero MVP/i,
    eyebrow: /Primer Release/i,
  },
  {
    path: '/pagos.html',
    title: /Pagos MVP/i,
    heading: /Pagos MVP/i,
    eyebrow: /Primer Release/i,
  },
  {
    path: '/supervision.html',
    title: /Centro de Control/i,
    heading: /Centro de Control/i,
    eyebrow: /Primer Release/i,
  },
];

function attachConsoleCollectors(page: Page, errors: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
}

test.describe('Primer Release público smoke', () => {
  for (const smokePage of PAGES) {
    test(`render base · ${smokePage.path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      attachConsoleCollectors(page, consoleErrors);

      await page.goto(smokePage.path);
      await expect(page).toHaveTitle(smokePage.title);
      await expect(page.locator('h1')).toHaveText(smokePage.heading);
      await expect(page.locator('.eyebrow')).toContainText(smokePage.eyebrow || /Primer Release/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      const criticos = consoleErrors.filter((entry) =>
        /TypeError|ReferenceError|Failed to fetch|Unexpected token|Cannot read/i.test(entry),
      );
      expect(criticos, `errores críticos en ${smokePage.path}: ${JSON.stringify(criticos)}`).toEqual([]);
    });
  }

  test('hub ejecutivo renderiza en entrypoint y alias público', async ({ page }) => {
    const consoleErrors: string[] = [];
    attachConsoleCollectors(page, consoleErrors);

    await page.goto('/primer-release.html');
    await expect(page).toHaveTitle(/Primer Release Hub/i);
    await expect(page.locator('h1')).toHaveText(/Primer Release Hub/i);
    await expect(page.locator('.eyebrow')).toContainText(/Hub Ejecutivo/i);
    await expect(page.getByRole('button', { name: /Abrir demo/i })).toBeVisible();
    await expect(page.getByText(/Kilos y captura/i)).toBeVisible();
    await expect(page.getByText('/supervision?demo=1')).toBeVisible();
    await expect(page.getByText('Marco del arranque')).toBeVisible();

    const criticos = consoleErrors.filter((entry) =>
      /TypeError|ReferenceError|Failed to fetch|Unexpected token|Cannot read/i.test(entry),
    );
    expect(criticos, `errores críticos en hub: ${JSON.stringify(criticos)}`).toEqual([]);
  });

  test('panel-rdo publica acceso al release desde login/panel sin romper carga base', async ({ page }) => {
    const consoleErrors: string[] = [];
    attachConsoleCollectors(page, consoleErrors);

    await page.goto('/panel-rdo.html');
    await expect(page).toHaveTitle(/Panel RDO|Gesti[oó]n REP|Gestion REP/i);
    await expect(page.locator('#primer-release-panel-card')).toHaveCount(1);
    await expect(page.locator('#primer-release-panel-hub-link')).toHaveAttribute('href', '/primer-release');

    const tieneLogin = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
    const tieneAccesosRelease = await page.getByText('Romanero MVP').first().isVisible().catch(() => false);

    expect(tieneLogin || tieneAccesosRelease).toBeTruthy();

    const criticos = consoleErrors.filter((entry) =>
      /TypeError|ReferenceError|Unexpected token|Cannot read/i.test(entry),
    );
    expect(criticos, `errores críticos en panel-rdo: ${JSON.stringify(criticos)}`).toEqual([]);
  });

  test('modo demo comparte flujo entre Romanero, Pagos y Supervisión', async ({ page }) => {
    const consoleErrors: string[] = [];
    attachConsoleCollectors(page, consoleErrors);
    const demoPill = page.locator('.session-pill').filter({ hasText: 'Modo demo' });

    await page.goto('/romanero.html?demo=1');
    await expect(demoPill).toBeVisible();
    await expect(page.locator('select[name="cliente_id"]')).toBeVisible();
    await expect(page.getByText(/la misma verdad no se captura dos veces/i)).toBeVisible();
    await expect(page.locator('select[name="origen_handoff"]')).toBeVisible();
    await page.locator('select[name="cliente_id"]').selectOption('cli_demo_farex');
    await expect(page.getByText('Handoff comercial')).toBeVisible();
    await expect(page.getByRole('button', { name: /Usar como handoff/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Usar como handoff/i }).first().click();
    await expect(page.locator('input[name="oportunidad_id"]')).not.toHaveValue('');

    await page.goto('/pagos.html');
    await expect(demoPill).toBeVisible();
    await expect(page.locator('.list-item strong').first()).toContainText('Transportes Demo Ltda.');

    await page.goto('/supervision.html');
    await expect(demoPill).toBeVisible();
    await expect(page.locator('.list-item strong').first()).toContainText('EXP-DEMO-001');

    const criticos = consoleErrors.filter((entry) =>
      /TypeError|ReferenceError|Failed to fetch|Unexpected token|Cannot read/i.test(entry),
    );
    expect(criticos, `errores críticos en modo demo: ${JSON.stringify(criticos)}`).toEqual([]);
  });

  test('hub y panel leen el demo compartido del release', async ({ page }) => {
    const consoleErrors: string[] = [];
    attachConsoleCollectors(page, consoleErrors);

    await page.goto('/primer-release.html');
    await page.getByRole('button', { name: /Abrir demo/i }).click();
    await expect(page.locator('.session-pill').filter({ hasText: 'Modo demo' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reiniciar demo/i })).toBeVisible();
    await expect(page.getByText('Kilos hoy')).toBeVisible();
    await expect(page.getByText('Alertas de origen')).toBeVisible();

    await page.goto('/panel-rdo.html');
    await expect(page.locator('#primer-release-panel-badge')).toContainText(/Demo activo|Release estable|Vigilancia activa|Riesgo operativo/i);
    await expect(page.locator('#primer-release-panel-total')).not.toHaveText('—');
    await expect(page.locator('#primer-release-panel-summary')).toContainText(/kg|capturas|sin pesaje/i);
    await expect(page.locator('#primer-release-panel-detail')).toContainText(/Pulso visible|cola pago/i);

    const criticos = consoleErrors.filter((entry) =>
      /TypeError|ReferenceError|Failed to fetch|Unexpected token|Cannot read/i.test(entry),
    );
    expect(criticos, `errores críticos en hub/panel demo: ${JSON.stringify(criticos)}`).toEqual([]);
  });

  test('version pública expone metadata de build', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/_version.json`);
    expect(response.ok()).toBeTruthy();

    const payload = await response.json();
    expect(payload).toMatchObject({
      sha: expect.any(String),
      branch: expect.any(String),
      buildTime: expect.any(String),
      env: expect.any(String),
    });
    expect(String(payload.sha).length).toBeGreaterThanOrEqual(3);
  });
});
