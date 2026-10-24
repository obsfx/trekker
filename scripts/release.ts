import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

abstract class Release {
  static fail(message: string): never {
    console.error(`release: ${message}`);
    process.exit(1);
  }

  static run(command: string, args: string[]): void {
    console.log(`\n> ${command} ${args.join(' ')}`);
    execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  }

  private static output(command: string, args: string[]): string {
    return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8' }).trim();
  }

  private static succeeds(command: string, args: string[]): boolean {
    try {
      execFileSync(command, args, { cwd: ROOT, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  static isBump(value: string | undefined): value is Bump {
    return value !== undefined && BUMP_NAMES.has(value);
  }

  private static readRootFile(path: string): string {
    return readFileSync(join(ROOT, path), 'utf8');
  }

  static readManifest(): PackageManifest {
    return parseManifest(Release.readRootFile(PACKAGE_JSON));
  }

  private static versionField(version: string): string {
    return `"version": "${version}"`;
  }

  static snapshotVersionedFiles(current: string): Map<string, string> {
    const snapshot = new Map<string, string>();
    for (const path of VERSIONED_FILES) {
      const text = Release.readRootFile(path);
      if (!text.includes(Release.versionField(current))) {
        Release.fail(
          `${path} is not at version ${current}; plugin versions must match package.json`
        );
      }
      snapshot.set(path, text);
    }
    return snapshot;
  }

  static restoreVersionedFiles(snapshot: Map<string, string>): void {
    for (const [path, text] of snapshot) {
      writeFileSync(join(ROOT, path), text);
    }
  }

  static nextVersion(current: string, bump: Bump): string {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
    if (!match) {
      Release.fail(`package.json version ${current} is not a plain major.minor.patch version`);
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

  static checkReady(tag: string, dryRun: boolean): void {
    if (!dryRun && Release.output('git', ['status', '--porcelain']) !== '') {
      Release.fail('the working tree has changes, commit or stash them first');
    }
    if (Release.succeeds('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`])) {
      Release.fail(`tag ${tag} already exists`);
    }
    if (!dryRun && !Release.succeeds('npm', ['whoami'])) {
      Release.fail('npm is not logged in, run npm login first');
    }
  }

  static writeVersion(snapshot: Map<string, string>, current: string, version: string): void {
    for (const [path, text] of snapshot) {
      writeFileSync(
        join(ROOT, path),
        text.replaceAll(Release.versionField(current), Release.versionField(version))
      );
    }
    if (Release.readManifest().version !== version) {
      Release.fail(`could not write version ${version} to package.json`);
    }
  }

  static cleanInstall(): void {
    rmSync(join(ROOT, 'node_modules'), { recursive: true, force: true });
    Release.run('bun', ['install', '--frozen-lockfile']);
  }

  static build(): void {
    rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
    Release.run('bun', ['run', 'build']);
  }

  static verifyPackage(version: string): void {
    const builtVersion = Release.output('bun', ['bin/trekker.js', '--version']);
    if (builtVersion !== version) {
      Release.fail(`built CLI reports version ${builtVersion}, expected ${version}`);
    }
    const [pack] = parsePackOutput(Release.output('npm', ['pack', '--dry-run', '--json']));
    const packedPaths = new Set(
      pack.files.map((file) => {
        return file.path;
      })
    );
    const missing = REQUIRED_PACKAGE_FILES.filter((path) => {
      return !packedPaths.has(path);
    });
    if (missing.length > 0) {
      Release.fail(`the package is missing ${missing.join(', ')}`);
    }
    console.log(`\npackage contents verified: ${[...packedPaths].sort().join(', ')}`);
  }

  static publish(name: string, version: string, dryRun: boolean): void {
    const spec = `${name}@${version}`;
    if (Release.succeeds('npm', ['view', spec, 'version'])) {
      console.log(`\n${spec} is already published`);
      return;
    }
    const publishArgs = ['publish', '--access', 'public'];
    if (dryRun) {
      publishArgs.push('--dry-run');
    }
    Release.run('npm', publishArgs);
  }
}

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
const REQUIRED_PACKAGE_FILES = [
  'bin/trekker.js',
  'dist/index.js',
  'dist/webui/index.html.gz',
  'package.json',
  'README.md',
];

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

const parseManifest: (json: string) => PackageManifest = JSON.parse;
const parsePackOutput: (json: string) => PackResult[] = JSON.parse;

const args = process.argv.slice(FIRST_CLI_ARGUMENT);
const bump = args.find((arg) => {
  return !arg.startsWith('--');
});
const dryRun = args.includes('--dry-run');

if (!Release.isBump(bump)) {
  Release.fail(`usage: bun run release <${BUMPS.join('|')}> [--dry-run]`);
}

const { name, version: current } = Release.readManifest();
const version = Release.nextVersion(current, bump);
const tag = `v${version}`;
Release.checkReady(tag, dryRun);
const snapshot = Release.snapshotVersionedFiles(current);
let dryRunSuffix = '';
if (dryRun) {
  dryRunSuffix = ' (dry run)';
}
console.log(`releasing ${name} ${current} -> ${version}${dryRunSuffix}`);

Release.cleanInstall();
Release.run('bun', ['run', 'test:release']);

Release.writeVersion(snapshot, current, version);
try {
  Release.build();
  Release.verifyPackage(version);
  Release.publish(name, version, dryRun);
} catch (error) {
  Release.restoreVersionedFiles(snapshot);
  throw error;
}

if (dryRun) {
  Release.restoreVersionedFiles(snapshot);
  console.log(
    `\ndry run done: ${version} built and checked, nothing published, committed or tagged`
  );
  process.exit(0);
}

Release.run('git', ['commit', '--message', version, '--', ...VERSIONED_FILES]);
Release.run('git', ['tag', '--annotate', tag, '--message', version]);

console.log(`
${name}@${version} is published on npm, committed and tagged locally. next:
  git push --atomic origin HEAD ${tag}`);
