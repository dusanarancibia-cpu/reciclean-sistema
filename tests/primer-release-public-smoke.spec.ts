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
    title: /Supervisi[oó]n MVP/i,
    heading: /Supervisi[oó]n MVP/i,
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

  test('panel-rdo publica acceso al release desde login/panel sin romper carga base', async ({ page }) => {
    const consoleErrors: string[] = [];
    attachConsoleCollectors(page, consoleErrors);

    await page.goto('/panel-rdo.html');
    await expect(page).toHaveTitle(/Panel RDO|Gesti[oó]n REP|Gestion REP/i);

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
