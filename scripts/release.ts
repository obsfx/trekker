import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const PACKAGE_JSON = 'package.json';
const VERSIONED_FILES = [
  PACKAGE_JSON,
  '.claude-plugin/marketplace.json',
  'plugins/claude-code/.claude-plugin/plugin.json',
  'plugins/codex/plugin.json',
];
const BUMPS = ['patch', 'minor', 'major'] as const;
const BUMP_NAMES: ReadonlySet<string> = new Set(BUMPS);
const FIRST_CLI_ARGUMENT = 2;
const REQUIRED_PACKAGE_FILES = ['bin/trekker.js', 'dist/index.js', 'package.json', 'README.md'];

type Bump = (typeof BUMPS)[number];

interface PackageManifest {
  name: string;
  version: string;
}

interface PackedFile {
  path: string;
}

interface PackResult {
  files: PackedFile[];
}

function fail(message: string): never {
  console.error(`release: ${message}`);
  process.exit(1);
}

function run(command: string, args: string[]): void {
  console.log(`\n> ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
}

function output(command: string, args: string[]): string {
  return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function succeeds(command: string, args: string[]): boolean {
  try {
    execFileSync(command, args, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const parseManifest: (json: string) => PackageManifest = JSON.parse;
const parsePackOutput: (json: string) => PackResult[] = JSON.parse;

function isBump(value: string | undefined): value is Bump {
  return value !== undefined && BUMP_NAMES.has(value);
}

function readRootFile(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

function readManifest(): PackageManifest {
  return parseManifest(readRootFile(PACKAGE_JSON));
}

function versionField(version: string): string {
  return `"version": "${version}"`;
}

function snapshotVersionedFiles(current: string): Map<string, string> {
  const snapshot = new Map<string, string>();
  for (const path of VERSIONED_FILES) {
    const text = readRootFile(path);
    if (!text.includes(versionField(current))) {
      fail(`${path} is not at version ${current}; plugin versions must match package.json`);
    }
    snapshot.set(path, text);
  }
  return snapshot;
}

function restoreVersionedFiles(snapshot: Map<string, string>): void {
  for (const [path, text] of snapshot) {
    writeFileSync(join(ROOT, path), text);
  }
}

function nextVersion(current: string, bump: Bump): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) {
    fail(`package.json version ${current} is not a plain major.minor.patch version`);
  }
  const [major, minor, patch] = match.slice(1).map(Number);
  switch (bump) {
    case 'major': {
      return `${major + 1}.0.0`;
    }
    case 'minor': {
      return `${major}.${minor + 1}.0`;
    }
    case 'patch': {
      return `${major}.${minor}.${patch + 1}`;
    }
  }
}

function checkReady(tag: string, dryRun: boolean): void {
  if (!dryRun && output('git', ['status', '--porcelain']) !== '') {
    fail('the working tree has changes, commit or stash them first');
  }
  if (succeeds('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`])) {
    fail(`tag ${tag} already exists`);
  }
  if (!dryRun && !succeeds('npm', ['whoami'])) {
    fail('npm is not logged in, run npm login first');
  }
}

function writeVersion(snapshot: Map<string, string>, current: string, version: string): void {
  for (const [path, text] of snapshot) {
    writeFileSync(join(ROOT, path), text.replaceAll(versionField(current), versionField(version)));
  }
  if (readManifest().version !== version) {
    fail(`could not write version ${version} to package.json`);
  }
}

function build(): void {
  rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
  run('bun', ['run', 'build']);
}

function verifyPackage(version: string): void {
  const builtVersion = output('bun', ['bin/trekker.js', '--version']);
  if (builtVersion !== version) {
    fail(`built CLI reports version ${builtVersion}, expected ${version}`);
  }
  const [pack] = parsePackOutput(output('npm', ['pack', '--dry-run', '--json']));
  const packedPaths = new Set(pack.files.map((file) => file.path));
  const missing = REQUIRED_PACKAGE_FILES.filter((path) => !packedPaths.has(path));
  if (missing.length > 0) {
    fail(`the package is missing ${missing.join(', ')}`);
  }
  console.log(`\npackage contents verified: ${[...packedPaths].sort().join(', ')}`);
}

function publish(name: string, version: string, dryRun: boolean): void {
  const spec = `${name}@${version}`;
  if (succeeds('npm', ['view', spec, 'version'])) {
    console.log(`\n${spec} is already published`);
    return;
  }
  const publishArgs = ['publish', '--access', 'public'];
  if (dryRun) {
    publishArgs.push('--dry-run');
  }
  run('npm', publishArgs);
}

const args = process.argv.slice(FIRST_CLI_ARGUMENT);
const bump = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');

if (!isBump(bump)) {
  fail(`usage: bun run release <${BUMPS.join('|')}> [--dry-run]`);
}

const { name, version: current } = readManifest();
const version = nextVersion(current, bump);
const tag = `v${version}`;
checkReady(tag, dryRun);
const snapshot = snapshotVersionedFiles(current);
let dryRunSuffix = '';
if (dryRun) {
  dryRunSuffix = ' (dry run)';
}
console.log(`releasing ${name} ${current} -> ${version}${dryRunSuffix}`);

run('bun', ['install', '--frozen-lockfile']);
run('bun', ['run', 'test:release']);

writeVersion(snapshot, current, version);
try {
  build();
  verifyPackage(version);
  publish(name, version, dryRun);
} catch (error) {
  restoreVersionedFiles(snapshot);
  throw error;
}

if (dryRun) {
  restoreVersionedFiles(snapshot);
  console.log(
    `\ndry run done: ${version} built and checked, nothing published, committed or tagged`
  );
  process.exit(0);
}

run('git', ['commit', '--message', version, '--', ...VERSIONED_FILES]);
run('git', ['tag', '--annotate', tag, '--message', version]);

console.log(`
${name}@${version} is published on npm, committed and tagged locally. next:
  git push --atomic origin HEAD ${tag}`);
