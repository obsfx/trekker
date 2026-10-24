import { DbClient } from '@/src/db/client';
import { idCounters } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { type EntityType, ENTITY_CONFIG_KEY_MAP } from '@/src/types';
import { ConfigService } from '@/src/services/config';

export abstract class IdGenerator {
  static generateId(entityType: EntityType): string {
    const db = DbClient.getDb();
    const prefix = ConfigService.getProjectConfigValue(ENTITY_CONFIG_KEY_MAP[entityType]);

    const result = db
      .update(idCounters)
      .set({ counter: sql`${idCounters.counter} + 1` })
      .where(eq(idCounters.entityType, entityType))
      .returning({ counter: idCounters.counter })
      .all()
      .at(0);

    if (!result) {
      throw new Error(`Counter not found for entity type: ${entityType}`);
    }

    return `${prefix}-${result.counter}`;
  }

  static generateUuid(): string {
    return crypto.randomUUID();
  }
}
