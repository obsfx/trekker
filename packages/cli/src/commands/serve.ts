import { Command } from "commander";
import { spawn, spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { existsSync } from "fs";
import { getDbPath, isTrekkerInitialized } from "../db/client";
import { error, success } from "../utils/output";

function findWebappDir(): { path: string; isBundled: boolean } | null {
  const scriptDir = dirname(import.meta.url.replace("file://", ""));

  // CLI root (handles both src/commands and dist/)
  // src/commands/serve.ts -> go up 3 levels
  // dist/index.js -> go up 1 level
  const cliRoot = scriptDir.includes("/src/")
    ? dirname(dirname(dirname(scriptDir)))
    : dirname(scriptDir);

  // Check bundled webapp first
  const bundled = resolve(cliRoot, "webapp-dist");
  if (existsSync(resolve(bundled, "server.js"))) {
    return { path: bundled, isBundled: true };
  }

  // Check monorepo dev mode
  const dev = resolve(dirname(cliRoot), "webapp");
  if (existsSync(dev)) {
    return { path: dev, isBundled: false };
  }

  return null;
}

export const serveCommand = new Command("serve")
  .description("Start the Trekker web interface")
  .option("-p, --port <port>", "Port to run on", "3000")
  .option("--dev", "Run in development mode")
  .action(async (options) => {
    if (!isTrekkerInitialized()) {
      error("Trekker is not initialized. Run 'trekker init' first.");
      process.exit(1);
    }

    const webapp = findWebappDir();
    if (!webapp) {
      error("Webapp not found. Please reinstall Trekker.");
      process.exit(1);
    }

    const env = {
      ...process.env,
      TREKKER_DB_PATH: getDbPath(),
      PORT: options.port,
    };

    success(`Starting Trekker web interface on http://localhost:${options.port}`);
    console.log("Press Ctrl+C to stop\n");

    // Bundled mode - run pre-built server
    if (webapp.isBundled) {
      const server = spawn("bun", ["run", "server.js"], {
        cwd: webapp.path,
        stdio: "inherit",
        env,
      });
      setupSignalHandlers(server);
      return;
    }

    // Dev mode - install deps if needed
    if (!existsSync(resolve(webapp.path, "node_modules"))) {
      console.log("Installing webapp dependencies...");
      spawnSync("bun", ["install"], { cwd: webapp.path, stdio: "inherit" });
    }

    if (options.dev) {
      const dev = spawn("bun", ["run", "dev", "--", "-p", options.port], {
        cwd: webapp.path,
        stdio: "inherit",
        env,
      });
      setupSignalHandlers(dev);
      return;
    }

    // Build and run standalone
    const standalone = resolve(webapp.path, ".next/standalone");
    if (!existsSync(standalone)) {
      console.log("Building webapp...");
      spawnSync("bun", ["run", "build"], { cwd: webapp.path, stdio: "inherit" });

      // Copy static assets
      spawnSync("cp", ["-r", resolve(webapp.path, ".next/static"), resolve(standalone, ".next")]);
      if (existsSync(resolve(webapp.path, "public"))) {
        spawnSync("cp", ["-r", resolve(webapp.path, "public"), standalone]);
      }
    }

    const server = spawn("bun", ["run", "server.js"], {
      cwd: standalone,
      stdio: "inherit",
      env,
    });
    setupSignalHandlers(server);
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
