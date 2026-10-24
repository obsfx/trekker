import { ContainerWorkspace } from '@/tests/helpers/workspace/container-workspace';
import { LocalWorkspace } from '@/tests/helpers/workspace/local-workspace';
import type { Workspace } from '@/tests/helpers/workspace/workspace';

export * from './workspace';
export { ContainerWorkspace } from './container-workspace';

export abstract class TestTarget {
  static readonly kind = process.env.TREKKER_TARGET ?? 'local';

  static get isContainer(): boolean {
    return TestTarget.kind === 'container';
  }

  static get containerId(): string {
    const id = process.env.TREKKER_CONTAINER_ID;
    if (!id) {
      throw new Error(
        'TREKKER_CONTAINER_ID is not set. Run the suite with `bun run test:container`.'
      );
    }
    return id;
  }

  static get image(): string {
    const image = process.env.TREKKER_IMAGE;
    if (!image) {
      throw new Error('TREKKER_IMAGE is not set. Run the suite with `bun run test:container`.');
    }
    return image;
  }

  static createWorkspace(): Workspace {
    if (TestTarget.isContainer) {
      return new ContainerWorkspace(TestTarget.containerId);
    }
    return new LocalWorkspace();
  }
}
