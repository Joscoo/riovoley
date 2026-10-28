const { test, expect } = require('@playwright/test');

const { loginAsAdmin, openAdminSection } = require('./helpers/adminNavigation');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function ensureQuickMode(page) {
  await expect(page.getByRole('heading', { name: /control de asistencias/i })).toBeVisible();
  await page.getByRole('button', { name: /registro r.pido/i }).click();
}

async function collectAsistenciasMetrics(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-row"]'));
    const names = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-name"]'));
    const actionGroups = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-actions"]'));

    const rowWidths = rows.map((el) => Math.round(el.getBoundingClientRect().width));
    const nameWidths = names.map((el) => Math.round(el.getBoundingClientRect().width));
    const actionWidths = actionGroups.map((el) => Math.round(el.getBoundingClientRect().width));

    const minRow = rowWidths.length ? Math.min(...rowWidths) : 0;
    const maxRow = rowWidths.length ? Math.max(...rowWidths) : 0;
    const minName = nameWidths.length ? Math.min(...nameWidths) : 0;
    const maxName = nameWidths.length ? Math.max(...nameWidths) : 0;
    const maxActions = actionWidths.length ? Math.max(...actionWidths) : 0;

    const root = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
    const viewport = window.innerWidth;

    return {
      rowCount: rows.length,
      nameCount: names.length,
      actionGroupCount: actionGroups.length,
      minRow,
      maxRow,
      minName,
      maxName,
      maxActions,
      hasHorizontalOverflow: scrollWidth > viewport + 1,
      scrollWidth,
      viewport,
    };
  });
}

test('guided review: admin asistencias quick mode per viewport', async ({ page }, testInfo) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openAdminSection(page, 'asistencias');
  await ensureQuickMode(page);

  await expect(page.getByTestId('attendance-athlete-row').first()).toBeVisible();

  const screenshotPath = testInfo.outputPath(`asistencias-quick-${testInfo.project.name}.png`);
  const isMobileProject = /mobile/i.test(testInfo.project.name);
  const pageHeight = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
  });

  // Chromium cannot capture full-page images above 32767px in either dimension.
  if (isMobileProject || pageHeight >= 32000) {
    await page.screenshot({ path: screenshotPath, fullPage: false });
  } else {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }

  const metrics = await collectAsistenciasMetrics(page);
  console.log(`GUIDED_REVIEW_METRICS[${testInfo.project.name}]: ${JSON.stringify(metrics)}`);

  // Soft checks to avoid blocking the run while still flagging bad layouts.
  expect.soft(metrics.hasHorizontalOverflow, `Overflow in ${testInfo.project.name}`).toBeFalsy();

  expect(metrics.rowCount).toBeGreaterThan(0);
  expect(metrics.nameCount).toBe(metrics.rowCount);
  expect(metrics.actionGroupCount).toBe(metrics.rowCount);
  expect.soft(metrics.minName, `Name width too small in ${testInfo.project.name}`).toBeGreaterThan(90);
  expect.soft(metrics.maxActions, `Actions consuming too much width in ${testInfo.project.name}`).toBeLessThanOrEqual(metrics.viewport);
});

