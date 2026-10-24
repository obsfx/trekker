import { decode } from '@toon-format/toon';
import {
  TestTarget,
  type CommandOptions,
  type CommandResult,
  type SqlRow,
  type Workspace,
} from './workspace';

export interface TestContext {
  cwd: string;
  workspace: Workspace;
  run: (args: string) => string;
  runToon: <T = unknown>(args: string) => T;
  runExpectError: (args: string) => string;
  runRaw: (args: string, options?: CommandOptions) => CommandResult;
  exists: (relativePath: string) => boolean;
  query: (sql: string) => SqlRow[];
  cleanup: () => void;
}

// TOON values are JSON-compatible; round-tripping through JSON keeps the unsafe cast inside test code.
function typedDecode<T>(input: string): T {
  return JSON.parse(JSON.stringify(decode(input)));
}

export function parseArgs(args: string): string[] {
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

export function createTestContext(
  workspace: Workspace = TestTarget.createWorkspace()
): TestContext {
  function runSuccessfully(args: string[]): string {
    const result = workspace.trekker(args);
    if (result.status !== 0) {
      throw new Error(`Command failed: ${result.stderr || result.stdout}`);
    }
    return result.stdout;
  }

  return {
    cwd: workspace.cwd,
    workspace,

    run(args: string): string {
      return runSuccessfully(parseArgs(args));
    },

    runToon<T = unknown>(args: string): T {
      return typedDecode<T>(runSuccessfully(['--toon', ...parseArgs(args)]));
    },

    runExpectError(args: string): string {
      const result = workspace.trekker(['--toon', ...parseArgs(args)]);

      if (result.status === 0) {
        throw new Error('Expected command to fail but it succeeded');
      }

      try {
        const parsed = decode(result.stderr || result.stdout);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'error' in parsed) {
          return String(parsed.error);
        }
      } catch {
        // Non-TOON output is returned verbatim below.
      }

      return result.stderr || result.stdout;
    },

    runRaw(args: string, options?: CommandOptions): CommandResult {
      return workspace.trekker(parseArgs(args), options);
    },

    exists(relativePath: string): boolean {
      return workspace.exists(relativePath);
    },

    query(sql: string): SqlRow[] {
      return workspace.query(sql);
    },

    cleanup(): void {
      workspace.dispose();
    },
  };
}

export function initTrekker(ctx: TestContext): void {
  ctx.run('init');
}
