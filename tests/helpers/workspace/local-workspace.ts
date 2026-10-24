import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Database } from 'bun:sqlite';
import {
  DB_RELATIVE_PATH,
  Workspace,
  spawnAsync,
  toCommandResult,
  type CommandOptions,
  type CommandResult,
  type SqlRow,
} from './workspace';

const CLI_PATH = join(import.meta.dir, '../../../src/index.ts');

export class LocalWorkspace extends Workspace {
  readonly cwd = mkdtempSync(join(tmpdir(), 'trekker-test-'));
  protected readonly trekkerCommand = ['bun', 'run', CLI_PATH];

  exec(command: readonly string[], options: CommandOptions = {}): CommandResult {
    const [program, ...args] = command;
    return toCommandResult(
      spawnSync(program, args, {
        cwd: this.cwd,
        encoding: 'utf-8',
        input: options.input,
        env: { ...process.env, NO_COLOR: '1', ...options.env },
      })
    );
  }

  execAsync(command: readonly string[], options: CommandOptions = {}): Promise<CommandResult> {
    return spawnAsync(command, {
      cwd: this.cwd,
      input: options.input,
      env: { ...process.env, NO_COLOR: '1', ...options.env },
    });
  }

  exists(relativePath: string): boolean {
    return existsSync(join(this.cwd, relativePath));
  }

  query(sql: string): SqlRow[] {
    const db = new Database(join(this.cwd, DB_RELATIVE_PATH));
    try {
      return db.query<SqlRow, []>(sql).all();
    } finally {
      db.close();
    }
  }

  dispose(): void {
    rmSync(this.cwd, { recursive: true, force: true });
  }
}
