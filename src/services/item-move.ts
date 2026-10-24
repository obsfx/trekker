import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { DbClient } from '@/src/db/client';
import { EPIC_STATUSES } from '@/src/types';
import type { EpicStatus, TaskStatus } from '@/src/types';
import { EpicService } from '@/src/services/epic';
import { ConflictError, NotFoundError, ValidationError } from '@/src/services/errors';
import { ItemsService } from '@/src/services/items';
import type { ItemSummary } from '@/src/services/items';
import { TaskService } from '@/src/services/task';

interface StatusParams extends Record<string, string> {
  $status: string;
}

interface BoundParams extends Record<string, string> {
  $status: string;
  $moving: string;
  $bound: string;
}

interface RankParams extends Record<string, string> {
  $status: string;
  $rank: string;
}

export abstract class ItemMoves {
  private static isEpicStatus(status: TaskStatus): status is EpicStatus {
    return EPIC_STATUS_SET.has(status);
  }

  private static requireEpicStatus(status: TaskStatus): EpicStatus {
    if (!ItemMoves.isEpicStatus(status)) {
      throw new ValidationError(
        `Invalid epic status: ${status}. Valid values: ${EPIC_STATUSES.join(', ')}`
      );
    }
    return status;
  }

  private static findRankedItem(id: string): RankedItem | undefined {
    return (
      DbClient.requireSqliteInstance()
        .query<RankedItem, [string, string]>(
          `SELECT 'epics' AS source, id, status, rank FROM epics WHERE id = ?
           UNION ALL
           SELECT 'tasks' AS source, id, status, rank FROM tasks WHERE id = ?`
        )
        .get(id, id) ?? undefined
    );
  }

  private static rankColumnNulls(status: TaskStatus): void {
    const sqlite = DbClient.requireSqliteInstance();
    const unranked = sqlite
      .query<RankedItem, StatusParams>(
        `SELECT 'epics' AS source, id, status, rank FROM epics WHERE status = $status AND ${RANK} = ''
         UNION ALL
         SELECT 'tasks' AS source, id, status, rank FROM tasks WHERE status = $status AND ${RANK} = ''
         ORDER BY id`
      )
      .all({ $status: status });
    if (unranked.length === 0) {
      return;
    }
    const keys = generateNKeysBetween(null, ItemMoves.firstRank(status, null), unranked.length);
    for (const [index, item] of unranked.entries()) {
      sqlite.run(`UPDATE ${item.source} SET rank = ? WHERE id = ?`, [keys[index], item.id]);
    }
  }

  private static edgeRank(
    table: RankedTable,
    status: TaskStatus,
    movingId: string,
    bound: string,
    placement: MovePlacement
  ): string | null {
    let condition = `${RANK} > $bound`;
    let order = 'ASC';
    if (placement === 'before') {
      condition = `${RANK} < $bound AND ${RANK} > ''`;
      order = 'DESC';
    }
    const row = DbClient.requireSqliteInstance()
      .query<RankRow, BoundParams>(
        `SELECT ${RANK} AS rank FROM ${table}
         WHERE status = $status AND id != $moving AND ${condition}
         ORDER BY ${RANK} ${order} LIMIT 1`
      )
      .get({ $status: status, $moving: movingId, $bound: bound });
    return row?.rank ?? null;
  }

  private static neighborRank(
    status: TaskStatus,
    movingId: string,
    bound: string,
    placement: MovePlacement
  ): string | null {
    const ranks = RANKED_TABLES.map((table) => {
      return ItemMoves.edgeRank(table, status, movingId, bound, placement);
    }).filter((rank) => {
      return rank !== null;
    });
    ranks.sort();
    if (placement === 'before') {
      return ranks.at(-1) ?? null;
    }
    return ranks.at(0) ?? null;
  }

  private static spreadTies(status: TaskStatus, rank: string): void {
    const sqlite = DbClient.requireSqliteInstance();
    const tied = sqlite
      .query<RankedItem, RankParams>(
        `SELECT 'epics' AS source, id, status, rank FROM epics WHERE status = $status AND rank = $rank
         UNION ALL
         SELECT 'tasks' AS source, id, status, rank FROM tasks WHERE status = $status AND rank = $rank
         ORDER BY id`
      )
      .all({ $status: status, $rank: rank });
    if (tied.length < MIN_TIED_ITEMS) {
      return;
    }
    const before = ItemMoves.neighborRank(status, '', rank, 'before');
    const after = ItemMoves.neighborRank(status, '', rank, 'after');
    const keys = generateNKeysBetween(before, after, tied.length);
    for (const [index, item] of tied.entries()) {
      sqlite.run(`UPDATE ${item.source} SET rank = ? WHERE id = ?`, [keys[index], item.id]);
    }
  }

  private static firstRank(status: TaskStatus, excludedId: string | null): string | null {
    return ItemMoves.neighborRank(status, excludedId ?? '', '', 'after');
  }

  private static rankFor(input: MoveItemInput, anchor: RankedItem | null): string {
    const anchorRank = anchor?.rank ?? null;
    if (anchorRank === null) {
      return generateKeyBetween(null, ItemMoves.firstRank(input.status, input.id));
    }
    const neighbor = ItemMoves.neighborRank(input.status, input.id, anchorRank, input.placement);
    if (input.placement === 'before') {
      return generateKeyBetween(neighbor, anchorRank);
    }
    return generateKeyBetween(anchorRank, neighbor);
  }

  private static requireAnchor(input: MoveItemInput): RankedItem | null {
    if (input.anchorId === null) {
      return null;
    }
    const anchor = ItemMoves.findRankedItem(input.anchorId);
    if (!anchor) {
      throw new NotFoundError(`Anchor not found: ${input.anchorId}`);
    }
    if (anchor.status !== input.status) {
      throw new ConflictError(
        `Anchor ${anchor.id} is in ${anchor.status}, not in the target status ${input.status}`
      );
    }
    return anchor;
  }

  private static applyMove(item: RankedItem, input: MoveItemInput, rank: string): void {
    if (item.status === input.status) {
      DbClient.requireSqliteInstance().run(`UPDATE ${item.source} SET rank = ? WHERE id = ?`, [
        rank,
        item.id,
      ]);
      return;
    }
    if (item.source === 'tasks') {
      TaskService.updateTask(item.id, { status: input.status, rank });
      return;
    }
    EpicService.updateEpic(item.id, { status: ItemMoves.requireEpicStatus(input.status), rank });
  }

  static moveItem(input: MoveItemInput): ItemSummary {
    const sqlite = DbClient.requireSqliteInstance();
    const move = sqlite.transaction(() => {
      const item = ItemMoves.findRankedItem(input.id);
      if (!item) {
        throw new NotFoundError(`Item not found: ${input.id}`);
      }
      if (item.source === 'epics') {
        ItemMoves.requireEpicStatus(input.status);
      }
      if (input.anchorId === input.id) {
        throw new ValidationError('An item cannot be moved next to itself');
      }
      ItemMoves.rankColumnNulls(input.status);
      let anchor = ItemMoves.requireAnchor(input);
      if (anchor?.rank) {
        ItemMoves.spreadTies(input.status, anchor.rank);
        anchor = ItemMoves.requireAnchor(input);
      }
      ItemMoves.applyMove(item, input, ItemMoves.rankFor(input, anchor));
    });
    move.immediate();

    const summary = ItemsService.getItemSummaries([input.id]).at(0);
    if (!summary) {
      throw new NotFoundError(`Item not found: ${input.id}`);
    }
    return summary;
  }
}

export type MovePlacement = 'before' | 'after';

export interface MoveItemInput {
  id: string;
  status: TaskStatus;
  anchorId: string | null;
  placement: MovePlacement;
}

type RankedTable = 'epics' | 'tasks';

interface RankedItem {
  source: RankedTable;
  id: string;
  status: TaskStatus;
  rank: string | null;
}

interface RankRow {
  rank: string | null;
}

const EPIC_STATUS_SET: ReadonlySet<string> = new Set(EPIC_STATUSES);

const RANKED_TABLES: readonly RankedTable[] = ['epics', 'tasks'];
const RANK = "COALESCE(rank, '')";
const MIN_TIED_ITEMS = 2;
