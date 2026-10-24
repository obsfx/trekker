import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { decode } from '@toon-format/toon';
import * as v from 'valibot';

export abstract class E2eProject {
  static trekker(args: string[]): string {
    const result = spawnSync('bun', [CLI_ENTRY, ...args], { cwd: E2E_DIR, encoding: 'utf-8' });
    if (result.status !== 0) {
      throw new Error(`trekker ${args.join(' ')} failed: ${result.stderr}`);
    }
    return result.stdout;
  }

  static showTask(id: string) {
    return v.parse(shownTask, decode(E2eProject.trekker(['--toon', 'task', 'show', id])));
  }
}

export const E2E_PORT = 4610;
export const E2E_DIR = join(tmpdir(), 'trekker-e2e-project');
export const CLI_ENTRY = resolve(import.meta.dirname, '../../../src/index.ts');

const shownTask = v.object({ id: v.string(), title: v.string(), status: v.string() });
