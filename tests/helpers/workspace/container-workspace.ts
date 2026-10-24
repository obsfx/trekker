import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  DB_RELATIVE_PATH,
  Workspace,
  type CommandOptions,
  type CommandResult,
  type SqlRow,
  WorkspaceProcesses,
} from '@/tests/helpers/workspace/workspace';

const QUERY_SCRIPT = `
import { Database } from 'bun:sqlite';
const db = new Database(process.env.TREKKER_IT_DB);
console.log(JSON.stringify(db.query(process.env.TREKKER_IT_SQL).all()));
db.close();
`;

export class ContainerWorkspace extends Workspace {
  protected readonly trekkerCommand = ['trekker'];

  constructor(
    private readonly containerId: string,
    readonly cwd = `/work/ws-${randomUUID()}`
  ) {
    super();
    this.dockerExec(['mkdir', '-p', this.cwd], {}, '/');
  }

  exec(command: readonly string[], options: CommandOptions = {}): CommandResult {
    return this.dockerExec(command, options, this.cwd);
  }

  execAsync(command: readonly string[], options: CommandOptions = {}): Promise<CommandResult> {
    return WorkspaceProcesses.spawnAsync(this.dockerExecArgs(command, options, this.cwd), {
      input: options.input,
    });
  }

  exists(relativePath: string): boolean {
    return this.exec(['test', '-e', relativePath]).status === 0;
  }

  query(sql: string): SqlRow[] {
    const result = this.exec(['bun', '-e', QUERY_SCRIPT], {
      env: { TREKKER_IT_DB: DB_RELATIVE_PATH, TREKKER_IT_SQL: sql },
    });
    if (result.status !== 0) {
      throw new Error(`Query failed: ${result.stderr}`);
    }
    const rows: SqlRow[] = JSON.parse(result.stdout);
    return rows;
  }

  dispose(): void {
    this.dockerExec(['rm', '-rf', this.cwd], {}, '/');
  }

  private dockerExec(
    command: readonly string[],
    options: CommandOptions,
    workdir: string
  ): CommandResult {
    const [program, ...args] = this.dockerExecArgs(command, options, workdir);
    return WorkspaceProcesses.toCommandResult(
      spawnSync(program, args, { encoding: 'utf-8', input: options.input ?? '' })
    );
  }

  private dockerExecArgs(
    command: readonly string[],
    options: CommandOptions,
    workdir: string
  ): string[] {
    const envFlags = Object.entries({ NO_COLOR: '1', ...options.env }).flatMap(([key, value]) => {
      return ['-e', `${key}=${value}`];
    });
    return ['docker', 'exec', '-i', '-w', workdir, ...envFlags, this.containerId, ...command];
  }
}
