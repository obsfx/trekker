#!/usr/bin/env node

import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, "../dist/index.js");

// Use built dist if available (production), otherwise use source (development)
if (existsSync(distPath)) {
  await import(distPath);
} else {
  await import("../src/index.ts");
}
