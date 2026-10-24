import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, type TestContext } from '../helpers/test-context';

export interface CommandSpec {
  path: string;
  options: OptionSpec[];
}

export interface OptionSpec {
  long: string;
  short: string | null;
}

const HELP_FLAGS = new Set(['--help', '--version']);
const COMMAND_LINE = /^ {2}(\S+)/;
const OPTION_LINE = /^ {2}(?:(-\w), )?(--[\w-]+)/;
const STRING_LITERAL = /'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g;
const TEST_ROOT = join(import.meta.dir, '..');

function section(help: string, title: string): string[] {
  const lines = help.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`${title}:`));
  if (start === -1) {
    return [];
  }
  const body = lines.slice(start + 1);
  const end = body.findIndex((line) => line.trim() === '');
  if (end === -1) {
    return body;
  }
  return body.slice(0, end);
}

function parseOptions(help: string): OptionSpec[] {
  return section(help, 'Options').flatMap((line) => {
    const match = OPTION_LINE.exec(line);
    if (!match || HELP_FLAGS.has(match[2])) {
      return [];
    }
    return [{ long: match[2], short: match[1] ?? null }];
  });
}

function parseSubcommands(help: string): string[] {
  return section(help, 'Commands').flatMap((line) => {
    const match = COMMAND_LINE.exec(line);
    if (!match || match[1] === 'help') {
      return [];
    }
    return [match[1]];
  });
}

function helpFor(ctx: TestContext, path: string[]): string {
  return ctx.run([...path, '--help'].join(' '));
}

export function discoverCommands(ctx: TestContext): {
  global: OptionSpec[];
  commands: CommandSpec[];
} {
  const rootHelp = helpFor(ctx, []);
  const commands: CommandSpec[] = [];

  for (const top of parseSubcommands(rootHelp)) {
    const topHelp = helpFor(ctx, [top]);
    const subcommands = parseSubcommands(topHelp);
    if (subcommands.length === 0) {
      commands.push({ path: top, options: parseOptions(topHelp) });
      continue;
    }
    for (const sub of subcommands) {
      commands.push({ path: `${top} ${sub}`, options: parseOptions(helpFor(ctx, [top, sub])) });
    }
  }

  return { global: parseOptions(rootHelp), commands };
}

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return testFiles(fullPath);
    }
    if (entry.name.endsWith('.test.ts')) {
      return [fullPath];
    }
    return [];
  });
}

export function collectInvocations(commands: CommandSpec[]): string[][] {
  const topLevel = new Set(commands.map((command) => command.path.split(' ')[0]));
  return testFiles(TEST_ROOT).flatMap((file) =>
    Array.from(readFileSync(file, 'utf-8').matchAll(STRING_LITERAL), (match) =>
      parseArgs((match[1] ?? match[2] ?? match[3]).replaceAll(/\$\{[^}]*\}/g, 'X'))
    ).filter((tokens) => tokens.length > 0 && topLevel.has(tokens[0]))
  );
}

export function uncoveredEntries(commands: CommandSpec[], invocations: string[][]): string[] {
  const missing: string[] = [];

  for (const command of commands) {
    const words = command.path.split(' ');
    const matching = invocations.filter((tokens) =>
      words.every((word, index) => tokens[index] === word)
    );
    if (matching.length === 0) {
      missing.push(command.path);
      continue;
    }
    const usedFlags = new Set(matching.flat().map((token) => token.split('=')[0]));
    for (const option of command.options) {
      const covered =
        usedFlags.has(option.long) || (option.short !== null && usedFlags.has(option.short));
      if (!covered) {
        missing.push(`${command.path} ${option.long}`);
      }
    }
  }

  return missing;
}
