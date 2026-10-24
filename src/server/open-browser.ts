export abstract class BrowserOpener {
  private static openerCommand(url: string): string[] {
    const browser = process.env.BROWSER;
    if (browser) {
      return [browser, url];
    }
    if (process.platform === 'darwin') {
      return ['open', url];
    }
    if (process.platform === 'win32') {
      return ['cmd', '/c', 'start', '', url];
    }
    return ['xdg-open', url];
  }

  static openBrowser(url: string): void {
    try {
      Bun.spawn(BrowserOpener.openerCommand(url), {
        stdio: ['ignore', 'ignore', 'ignore'],
      }).unref();
    } catch (error) {
      console.error(`Could not open the browser, visit ${url}`, error);
    }
  }
}
