import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { GenericContainer } from 'testcontainers';
import { CONTAINER_IMAGE, PREVIOUS_TREKKER_VERSIONS } from '@/tests/container/release-matrix';

abstract class ContainerRun {
  static resolvePublishedVersion(packageName: string): string {
    const result = spawnSync('npm', ['view', packageName, 'version'], { encoding: 'utf-8' });
    if (result.status !== 0) {
      throw new Error(`Cannot resolve ${packageName} version: ${result.stderr}`);
    }
    return result.stdout.trim();
  }

  static buildImage(dashboardVersion: string): void {
    const result = spawnSync(
      'docker',
      [
        'build',
        '--file',
        'tests/container/Dockerfile',
        '--tag',
        CONTAINER_IMAGE,
        '--build-arg',
        `PREVIOUS_TREKKER_VERSIONS=${PREVIOUS_TREKKER_VERSIONS.join(' ')}`,
        '--build-arg',
        `DASHBOARD_VERSION=${dashboardVersion}`,
        '.',
      ],
      { cwd: REPO_ROOT, stdio: 'inherit' }
    );
    if (result.status !== 0) {
      throw new Error('Container image build failed');
    }
  }
}

const REPO_ROOT = join(import.meta.dir, '../..');
const DASHBOARD_PACKAGE = '@obsfx/trekker-dashboard';
const CONTAINER_TEST_TIMEOUT_MS = '60000';

const dashboardVersion =
  process.env.TREKKER_DASHBOARD_VERSION ?? ContainerRun.resolvePublishedVersion(DASHBOARD_PACKAGE);

ContainerRun.buildImage(dashboardVersion);

const container = await new GenericContainer(CONTAINER_IMAGE).start();

let exitCode: number;
try {
  const testRun = spawnSync(
    'bun',
    ['test', '--timeout', CONTAINER_TEST_TIMEOUT_MS, ...process.argv.slice(2)],
    {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        TREKKER_TARGET: 'container',
        TREKKER_CONTAINER_ID: container.getId(),
        TREKKER_IMAGE: CONTAINER_IMAGE,
        TREKKER_DASHBOARD_VERSION: dashboardVersion,
      },
    }
  );
  exitCode = testRun.status ?? 1;
} finally {
  await container.stop();
}

process.exit(exitCode);
