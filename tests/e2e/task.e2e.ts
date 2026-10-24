import { expect, test } from '@playwright/test';

import { E2eProject } from '@/tests/e2e/support/e2e-project';

test.describe('task page', () => {
  test('creates a task from the dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Title').fill('Made in the dialog');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Create/ })
      .last()
      .click();
    await expect(page.getByRole('heading', { name: 'Made in the dialog' })).toBeVisible();
    expect(E2eProject.trekker(['task', 'list'])).toContain('Made in the dialog');
  });

  test('edits the title inline', async ({ page }) => {
    await page.goto('/tasks/TREK-1');
    await page.getByRole('heading', { name: 'Seeded todo task' }).click();
    const input = page.getByLabel('Title');
    await input.fill('Renamed in the UI');
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'Renamed in the UI' })).toBeVisible();
    await expect
      .poll(() => {
        return E2eProject.showTask('TREK-1').title;
      })
      .toBe('Renamed in the UI');
  });

  test('posts a comment the CLI can read', async ({ page }) => {
    await page.goto('/tasks/TREK-1');
    await page.getByLabel('New comment').fill('Looks good from the UI');
    await page.getByLabel('New comment').press('Control+Enter');
    await expect(page.getByText('Looks good from the UI')).toBeVisible();
    expect(E2eProject.trekker(['comment', 'list', 'TREK-1'])).toContain('Looks good from the UI');
  });
});
