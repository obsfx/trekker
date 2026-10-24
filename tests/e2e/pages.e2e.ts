import { expect, test } from '@playwright/test';

import { E2eProject } from '@/tests/e2e/support/e2e-project';

test.describe('list and history', () => {
  test('lists items and opens one', async ({ page }) => {
    await page.goto('/list');
    await expect(page.getByRole('row', { name: /Dashboard rewrite/ }).first()).toBeVisible();
    await page.getByText('Already done').click();
    await expect(page).toHaveURL(/\/tasks\/TREK-3$/);
  });

  test('shows CLI changes in the history feed live', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByRole('status').getByText('Live')).toBeVisible();
    E2eProject.trekker(['task', 'update', 'TREK-3', '-s', 'wont_fix']);
    await expect(page.getByText("Won't fix").first()).toBeVisible();
  });

  test('opens the epic page with its tasks', async ({ page }) => {
    await page.goto('/epics/EPIC-1');
    await expect(page.getByRole('heading', { name: 'Dashboard rewrite' })).toBeVisible();
  });

  test('filters the list by date', async ({ page }) => {
    await page.goto('/list');
    await page.getByRole('button', { name: 'Date', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Today' }).click();
    await expect(page.getByRole('button', { name: 'Date', exact: true })).toContainText('Today');
    await expect(page.getByRole('row', { name: /Already done/ })).toBeVisible();
  });
});
