import type { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';

export abstract class TaskStorySeed {
  static readonly taskId = 'TREK-2';

  static readonly prepare = (trekker: InMemoryTrekker) => {
    trekker.link('TREK-2', 'TREK-1');
    trekker.link('TREK-2', 'TREK-5');
    trekker.link('TREK-6', 'TREK-2');
    trekker.addComment(
      'TREK-2',
      'agent',
      'Started with a 250ms `data_version` check. Idle cost is 0.02ms on the 10k sandbox.'
    );
    trekker.addComment(
      'TREK-2',
      'omercan',
      'Make sure a laptop waking from sleep gets the missed events, not a full reload.'
    );
    trekker.addComment(
      'TREK-2',
      'agent',
      'Added `?after=<id>` replay capped at 2000 rows; beyond that the stream sends `reset`.'
    );
    trekker.updateItem('TREK-2', { status: 'in_progress', priority: 1, tags: ['backend', 'sse'] });
  };
}
