import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { decode } from '@toon-format/toon';

export interface TestContext {
  cwd: string;
  run: (args: string) => string;
  runToon: <T = unknown>(args: string) => T;
  runExpectError: (args: string) => string;
  cleanup: () => void;
}

const CLI_PATH = join(import.meta.dir, '../../src/index.ts');

// Typed decode wrapper — function type annotation (not assertion) satisfies assertionStyle: 'never'
function typedDecode<T>(input: string): T {
  const result: T = decode(input);
  return result;
}

export function createTestContext(): TestContext {
  const cwd = mkdtempSync(join(tmpdir(), 'trekker-test-'));

  function runCommand(args: string[]): { stdout: string; stderr: string; status: number } {
    const result = spawnSync('bun', ['run', CLI_PATH, ...args], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
    });

    return {
      stdout: result.stdout?.trim() ?? '',
      stderr: result.stderr?.trim() ?? '',
      status: result.status ?? 1,
    };
  }

  function parseArgs(args: string): string[] {
    // Simple argument parser that handles quoted strings
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const char of args) {
      if (!inQuote && (char === '"' || char === "'")) {
        inQuote = true;
        quoteChar = char;
      } else if (inQuote && char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      } else if (!inQuote && char === ' ') {
        if (current) {
          result.push(current);
          current = '';
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
      const parsedArgs = ['--toon', ...parseArgs(args)];
      const result = runCommand(parsedArgs);

      if (result.status !== 0) {
        throw new Error(`Command failed: ${result.stderr || result.stdout}`);
      }

      // Parse TOON format
      return typedDecode<T>(result.stdout);
    },

    runExpectError(args: string): string {
      const parsedArgs = ['--toon', ...parseArgs(args)];
      const result = runCommand(parsedArgs);

      if (result.status === 0) {
        throw new Error('Expected command to fail but it succeeded');
      }

      // Try to parse TOON error format, otherwise return raw output
      try {
        const parsed = typedDecode<Record<string, unknown>>(result.stderr || result.stdout);
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          return String(parsed.error);
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
  ctx.run('init');
}
