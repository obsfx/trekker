import type { Page } from '@playwright/test';

export abstract class LivePage {
  static async open(page: Page, path: string) {
    const eventStreamOpened = page.waitForResponse((response) => {
      return new URL(response.url()).pathname === '/api/events';
    });
    await page.goto(path);
    await eventStreamOpened;
  }
}
