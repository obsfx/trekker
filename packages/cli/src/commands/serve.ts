import { Command } from "commander";
import { spawn, spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { existsSync } from "fs";
import { getDbPath, isTrekkerInitialized } from "../db/client";
import { error, success } from "../utils/output";

interface WebappLocation {
  path: string;
  isBundled: boolean;
}

function findWebappDir(): WebappLocation | null {
  // Get the directory of this script
  const scriptPath = import.meta.url.replace("file://", "");
  const scriptDir = dirname(scriptPath);

  // Check 1: Bundled webapp (npm package mode)
  // When published, webapp-dist is at packages/cli/webapp-dist
  // scriptPath could be in src/commands or dist/
  const cliRoot = scriptDir.includes("/src/")
    ? dirname(dirname(dirname(scriptPath))) // src/commands/serve.ts -> cli
    : dirname(dirname(scriptPath)); // dist/index.js -> cli
  const bundledWebapp = resolve(cliRoot, "webapp-dist");

  if (existsSync(bundledWebapp)) {
    return { path: bundledWebapp, isBundled: true };
  }

  // Check 2: Monorepo development mode
  // Navigate from packages/cli to packages/webapp
  const packagesDir = dirname(cliRoot);
  const webappDir = resolve(packagesDir, "webapp");

  if (existsSync(webappDir)) {
    return { path: webappDir, isBundled: false };
  }

  return null;
}

export const serveCommand = new Command("serve")
  .description("Start the Trekker web interface")
  .option("-p, --port <port>", "Port to run on", "3000")
  .option("--dev", "Run in development mode")
  .action(async (options) => {
    try {
      if (!isTrekkerInitialized()) {
        error("Trekker is not initialized. Run 'trekker init' first.");
        process.exit(1);
      }

      const dbPath = getDbPath();
      const port = options.port;

      // Find the webapp directory
      const webapp = findWebappDir();

      if (!webapp) {
        error("Webapp not found. Please reinstall Trekker.");
        process.exit(1);
      }

      const { path: webappDir, isBundled } = webapp;

      const env = {
        ...process.env,
        TREKKER_DB_PATH: dbPath,
        PORT: port,
      };

      // Bundled mode (npm package) - webapp is pre-built
      if (isBundled) {
        success(`Starting Trekker web interface on http://localhost:${port}`);
        console.log("Press Ctrl+C to stop\n");

        // Run the standalone server directly
        const server = spawn("bun", ["run", "server.js"], {
          cwd: webappDir,
          stdio: "inherit",
          env,
        });

        setupSignalHandlers(server);
        return;
      }

      // Monorepo development mode - may need to install deps and build

      // Check if node_modules exists
      const nodeModulesPath = resolve(webappDir, "node_modules");
      if (!existsSync(nodeModulesPath)) {
        console.log("Installing webapp dependencies...");
        const result = spawnSync("bun", ["install"], {
          cwd: webappDir,
          stdio: "inherit",
        });
        if (result.status !== 0) {
          error("Failed to install dependencies");
          process.exit(1);
        }
      }

      // Development mode
      if (options.dev) {
        success(`Starting Trekker web interface (dev) on http://localhost:${port}`);
        console.log("Press Ctrl+C to stop\n");

        const dev = spawn("bun", ["run", "dev", "--", "-p", port], {
          cwd: webappDir,
          stdio: "inherit",
          env,
        });

        setupSignalHandlers(dev);
        return;
      }

      // Production mode - build if needed
      const standalonePath = resolve(webappDir, ".next", "standalone");
      const buildMarker = resolve(webappDir, ".next", "BUILD_ID");

      if (!existsSync(standalonePath) || !existsSync(buildMarker)) {
        console.log("Building webapp...");
        const result = spawnSync("bun", ["run", "build"], {
          cwd: webappDir,
          stdio: "inherit",
          env,
        });
        if (result.status !== 0) {
          error("Failed to build webapp");
          process.exit(1);
        }
      }

      // Copy static files to standalone if needed
      const staticSrc = resolve(webappDir, ".next", "static");
      const staticDest = resolve(standalonePath, ".next", "static");
      if (existsSync(staticSrc) && !existsSync(staticDest)) {
        spawnSync("cp", ["-r", staticSrc, resolve(standalonePath, ".next")], {
          stdio: "inherit",
        });
      }

      // Copy public folder if exists
      const publicSrc = resolve(webappDir, "public");
      const publicDest = resolve(standalonePath, "public");
      if (existsSync(publicSrc) && !existsSync(publicDest)) {
        spawnSync("cp", ["-r", publicSrc, standalonePath], {
          stdio: "inherit",
        });
      }

      success(`Starting Trekker web interface on http://localhost:${port}`);
      console.log("Press Ctrl+C to stop\n");

      // Run the standalone server with bun
      const server = spawn("bun", ["run", "server.js"], {
        cwd: standalonePath,
        stdio: "inherit",
        env,
      });

      setupSignalHandlers(server);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

function setupSignalHandlers(child: ReturnType<typeof spawn>) {
  child.on("error", (err) => {
    error(`Failed to start webapp: ${err.message}`);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    child.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
    process.exit(0);
  });
}
