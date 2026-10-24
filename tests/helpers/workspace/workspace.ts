export interface CommandResult {
  stdout: string;
  stderr: string;
  status: number;
}

export interface CommandOptions {
  input?: string;
  env?: Record<string, string>;
}

export type SqlRow = Record<string, unknown>;

export const DB_RELATIVE_PATH = '.trekker/trekker.db';

export abstract class Workspace {
  abstract readonly cwd: string;
  protected abstract readonly trekkerCommand: readonly string[];

  abstract exec(command: readonly string[], options?: CommandOptions): CommandResult;
  abstract execAsync(command: readonly string[], options?: CommandOptions): Promise<CommandResult>;
  abstract exists(relativePath: string): boolean;
  abstract query(sql: string): SqlRow[];
  abstract dispose(): void;

  trekker(args: readonly string[], options?: CommandOptions): CommandResult {
    return this.exec([...this.trekkerCommand, ...args], options);
  }

  trekkerAsync(args: readonly string[], options?: CommandOptions): Promise<CommandResult> {
    return this.execAsync([...this.trekkerCommand, ...args], options);
  }
}

export async function spawnAsync(
  command: readonly string[],
  options: { cwd?: string; input?: string; env?: Record<string, string | undefined> }
): Promise<CommandResult> {
  const child = Bun.spawn([...command], {
    cwd: options.cwd,
    env: options.env,
    stdin: new Blob([options.input ?? '']),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, status] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return toCommandResult({ stdout, stderr, status });
}

export function toCommandResult(result: {
  stdout: string | null;
  stderr: string | null;
  status: number | null;
}): CommandResult {
  return {
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    status: result.status ?? 1,
  };
}
