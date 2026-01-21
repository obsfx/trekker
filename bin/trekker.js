#!/usr/bin/env node

import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Check if running in Bun runtime
const isBun = typeof Bun !== "undefined";

if (!isBun) {
  // Not running in Bun - check if Bun is available and re-execute with it
  const bunCheck = spawnSync("bun", ["--version"], { stdio: "ignore" });

  if (bunCheck.status === 0) {
    // Bun is available, re-execute this script with Bun
    const scriptPath = fileURLToPath(import.meta.url);
    const result = spawnSync("bun", [scriptPath, ...process.argv.slice(2)], {
      stdio: "inherit",
    });
    process.exit(result.status ?? 1);
  }

  // Bun is not installed
  console.error(`
Trekker requires Bun runtime.

Bun is not installed on your system.
Trekker uses bun:sqlite for database operations. This is a deliberate choice:
bun:sqlite is significantly faster than Node.js SQLite drivers, making CLI
operations feel instant.

To install Bun:

  macOS/Linux:
    curl -fsSL https://bun.sh/install | bash

  Windows:
    powershell -c "irm bun.sh/install.ps1 | iex"

  Or via npm:
    npm install -g bun

After installing Bun, run trekker again.

Learn more: https://bun.sh
`);
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, "../dist/index.js");

// Use built dist if available (production), otherwise use source (development)
if (existsSync(distPath)) {
  await import(distPath);
} else {
  await import("../src/index.ts");
}
