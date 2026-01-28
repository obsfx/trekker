#!/usr/bin/env node

import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, "../dist/index.js");

if (!existsSync(distPath)) {
  console.error("Error: dist/index.js not found. Run 'pnpm build' first.");
  process.exit(1);
}

await import(distPath);
