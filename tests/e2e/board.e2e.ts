import { expect, type Page, test } from '@playwright/test';

import { E2eProject } from '@/tests/e2e/support/e2e-project';
import { LivePage } from '@/tests/e2e/support/live-page';

abstract class BoardE2eFixture {
  static readonly column = (page: Page, status: string) => {
    return page.locator(`section[aria-label="${status}"]`);
  };
}

test.describe('board', () => {
  test('shows seeded items in their columns', async ({ page }) => {
    await page.goto('/');
    await expect(BoardE2eFixture.column(page, 'todo').getByText('Seeded todo task')).toBeVisible();
    await expect(
      BoardE2eFixture.column(page, 'in_progress').getByText('Dashboard rewrite')
    ).toBeVisible();
    await expect(BoardE2eFixture.column(page, 'completed').getByText('Already done')).toBeVisible();
  });

  test('shows a task created by the CLI without a reload', async ({ page }) => {
    await LivePage.open(page, '/');
    E2eProject.trekker(['task', 'create', '-t', 'Created by an agent']);
    await expect(
      BoardE2eFixture.column(page, 'todo').getByText('Created by an agent')
    ).toBeVisible();
  });

  test('moves a card to another column and the CLI sees the new status', async ({ page }) => {
    await page.goto('/');
    const card = BoardE2eFixture.column(page, 'todo').getByRole('link', {
      name: /Second todo task/,
    });
    await expect(card).toBeVisible();
    await card.dragTo(BoardE2eFixture.column(page, 'completed').getByText('Already done'));
    await expect(
      BoardE2eFixture.column(page, 'completed').getByText('Second todo task')
    ).toBeVisible();
    await expect
      .poll(() => {
        return E2eProject.showTask('TREK-2').status;
      })
      .toBe('completed');
  });

  test('keeps a card in place when it is dropped on itself', async ({ page }) => {
    await page.goto('/');
    const todo = BoardE2eFixture.column(page, 'todo');
    const cards = todo.getByRole('link');
    await expect(cards.first()).toBeVisible();
    const before = await cards.allInnerTexts();
    const first = cards.first();
    const box = await first.boundingBox();
    if (!box) {
      throw new Error('card has no box');
    }
    await first.dragTo(first, { targetPosition: { x: box.width / 2, y: box.height - 2 } });
    await page.waitForTimeout(300);
    const texts = await cards.allInnerTexts();
    expect(texts).toEqual(before);
  });
});
