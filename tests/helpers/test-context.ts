import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { decode } from "@toon-format/toon";

export interface TestContext {
  cwd: string;
  run: (args: string) => string;
  runToon: <T = unknown>(args: string) => T;
  runExpectError: (args: string) => string;
  cleanup: () => void;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, "../../src/index.ts");

export function createTestContext(): TestContext {
  const cwd = mkdtempSync(join(tmpdir(), "trekker-test-"));

  function runCommand(args: string[]): { stdout: string; stderr: string; status: number } {
    const result = spawnSync("npx", ["tsx", CLI_PATH, ...args], {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
      env: {
        ...process.env,
        NO_COLOR: "1",
        TREKKER_SKIP_EMBEDDINGS: "1",
      },
    });

    return {
      stdout: result.stdout?.trim() ?? "",
      stderr: result.stderr?.trim() ?? "",
      status: result.status ?? 1,
    };
  }

  function parseArgs(args: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < args.length; i++) {
      const char = args[i];

      if (!inQuote && (char === '"' || char === "'")) {
        inQuote = true;
        quoteChar = char;
      } else if (inQuote && char === quoteChar) {
        inQuote = false;
        quoteChar = "";
      } else if (!inQuote && char === " ") {
        if (current) {
          result.push(current);
          current = "";
        }
      } else {
        current += char;
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  return {
    cwd,

    run(args: string): string {
      const parsedArgs = parseArgs(args);
      const result = runCommand(parsedArgs);

      if (result.status !== 0) {
        throw new Error(`Command failed: ${result.stderr || result.stdout}`);
      }

      return result.stdout;
    },

    runToon<T = unknown>(args: string): T {
      const parsedArgs = ["--toon", ...parseArgs(args)];
      const result = runCommand(parsedArgs);

      if (result.status !== 0) {
        throw new Error(`Command failed: ${result.stderr || result.stdout}`);
      }

      return decode(result.stdout) as T;
    },

    runExpectError(args: string): string {
      const parsedArgs = ["--toon", ...parseArgs(args)];
      const result = runCommand(parsedArgs);

      if (result.status === 0) {
        throw new Error("Expected command to fail but it succeeded");
      }

      try {
        const parsed = decode(result.stderr || result.stdout) as { error?: string };
        if (parsed && typeof parsed === "object" && "error" in parsed) {
          return parsed.error as string;
        }
      } catch {
        // Ignore parse errors
      }

      return result.stderr || result.stdout;
    },

    cleanup(): void {
      rmSync(cwd, { recursive: true, force: true });
    },
  };
}

export function initTrekker(ctx: TestContext): void {
  ctx.run("init");
}
