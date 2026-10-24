import { describe, expect, it } from 'vitest';

import type { Page } from '@/ui/lib/item-shapes.ts';
import { PagedList } from '@/ui/lib/paged-list.ts';

interface Row {
  id: string;
}

const FIRST_PAGE: Page<Row> = { items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'second', total: 3 };
const SECOND_PAGE: Page<Row> = { items: [{ id: 'b' }, { id: 'c' }], nextCursor: null, total: 3 };

abstract class PagedListFixture {
  static readonly idOf = (row: Row) => {
    return row.id;
  };

  static createList() {
    return new PagedList<Row>((cursor) => {
      return Promise.resolve(cursor === 'second' ? SECOND_PAGE : FIRST_PAGE);
    }, PagedListFixture.idOf);
  }
}

describe('PagedList', () => {
  it('loads the first page and appends the next one without duplicates', async () => {
    const list = PagedListFixture.createList();
    await list.load();
    expect(list.state.items).toHaveLength(2);
    await list.loadMore();
    expect(list.state.items.map(PagedListFixture.idOf)).toEqual(['a', 'b', 'c']);
    expect(list.state.nextCursor).toBeNull();
  });

  it('keeps the total at least as large as the loaded rows after a patch', async () => {
    const list = PagedListFixture.createList();
    await list.load();
    list.patch(({ items }) => {
      return { items: [...items, { id: 'x' }, { id: 'y' }], total: 1 };
    });
    expect(list.state.total).toBe(4);
  });

  it('fails the first load and recovers on reload', async () => {
    let attempts = 0;
    const list = new PagedList<Row>(() => {
      attempts += 1;
      if (attempts === 1) {
        return Promise.reject(new Error('offline'));
      }
      return Promise.resolve(FIRST_PAGE);
    }, PagedListFixture.idOf);
    await list.load();
    expect(list.state.status).toBe('failed');
    await list.reload();
    expect(list.state.status).toBe('ready');
  });

  it('refreshes every loaded page instead of collapsing to the first', async () => {
    const list = PagedListFixture.createList();
    await list.load();
    await list.loadMore();
    await list.refreshLoaded();
    expect(list.state.items.map(PagedListFixture.idOf)).toEqual(['a', 'b', 'c']);
    expect(list.boundary).toEqual({ id: 'c' });
  });
});
