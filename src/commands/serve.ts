import { Command } from 'commander';
import { DbClient } from '@/src/db/client';
import { Output } from '@/src/utils/output';
import { RADIX_DECIMAL } from '@/src/utils/constants';
import { DEFAULT_PORT, MAX_PORT } from '@/src/server/constants';

abstract class ServeOptions {
  static parsePort(value: string): number {
    const port = Number.parseInt(value, RADIX_DECIMAL);
    if (!/^\d+$/.test(value) || port > MAX_PORT) {
      throw new Error(`Invalid port: ${value}. Use a number between 0 and ${MAX_PORT}.`);
    }
    return port;
  }
}

interface ServeCommandOptions {
  port: string;
  open?: boolean;
  dev?: boolean;
}

export const serveCommand = new Command('serve')
  .description('Serve the web UI and its API for this project')
  .option('-p, --port <port>', 'Port to listen on, 0 picks any free port', String(DEFAULT_PORT))
  .option('--open', 'Open the web UI in the browser')
  .option('--dev', 'Accept API writes from local dev servers on any localhost port')
  .action(async (options: ServeCommandOptions) => {
    try {
      const port = ServeOptions.parsePort(options.port);
      if (!DbClient.isTrekkerInitialized()) {
        throw new Error("Trekker not initialized. Run 'trekker init' first.");
      }
      const { ServerApp } = await import('../server/app');
      const running = ServerApp.startServer({
        port,
        dev: options.dev === true,
        cwd: process.cwd(),
      });

      if (running.fellBack) {
        console.log(`port ${running.requestedPort} is unavailable, using port ${running.port}`);
      }
      console.log(`trekker serving ${running.url}`);
      console.log(`database ${running.dbPath}`);
      if (!running.uiBuilt) {
        console.log('web UI is not built, run `bun run build:ui` (the API is available)');
      }
      if (options.open) {
        const { BrowserOpener } = await import('../server/open-browser');
        BrowserOpener.openBrowser(running.url);
      }

      const shutdown = (): void => {
        void running.stop().finally(() => {
          return process.exit(0);
        });
      };
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
    } catch (err) {
      Output.handleCommandError(err);
    }
  });
