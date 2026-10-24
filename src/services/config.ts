import { eq } from 'drizzle-orm';
import { DbClient } from '@/src/db/client';
import { projectConfig } from '@/src/db/schema';
import {
  type ProjectConfig,
  type ProjectConfigEntry,
  type ProjectConfigKey,
  PROJECT_CONFIG_DEFAULTS,
  PROJECT_CONFIG_KEYS,
} from '@/src/types';

export abstract class ConfigService {
  static assertProjectConfigKey(key: string): asserts key is ProjectConfigKey {
    if (!PROJECT_CONFIG_KEY_SET.has(key)) {
      throw new Error(
        `Unsupported config key: ${key}. Valid keys: ${PROJECT_CONFIG_KEYS.join(', ')}`
      );
    }
  }

  private static normalizePrefixValue(value: string): string {
    const normalized = value.trim().toUpperCase();

    if (!normalized) {
      throw new Error('Prefix value is required.');
    }

    if (!PREFIX_PATTERN.test(normalized)) {
      throw new Error(
        'Invalid prefix value. Use uppercase letters and numbers only, and start with a letter.'
      );
    }

    return normalized;
  }

  private static validateUniquePrefixes(config: ProjectConfig): void {
    const seen = new Map<string, ProjectConfigKey>();

    for (const key of PROJECT_CONFIG_KEYS) {
      const prefix = config[key];
      const existingKey = seen.get(prefix);
      if (existingKey) {
        throw new Error(
          `Prefix values must be unique. ${existingKey} and ${key} cannot both use ${prefix}.`
        );
      }
      seen.set(prefix, key);
    }
  }

  static resolveProjectConfig(
    updates?: Partial<Record<ProjectConfigKey, string | undefined>>,
    baseConfig: ProjectConfig = PROJECT_CONFIG_DEFAULTS
  ): ProjectConfig {
    const normalizedUpdates: Partial<ProjectConfig> = {};

    if (updates) {
      for (const rawKey of PROJECT_CONFIG_KEYS) {
        const rawValue = updates[rawKey];

        if (rawValue === undefined) {
          continue;
        }
        normalizedUpdates[rawKey] = ConfigService.normalizePrefixValue(rawValue);
      }
    }

    const nextConfig: ProjectConfig = {
      ...baseConfig,
      ...normalizedUpdates,
    };

    ConfigService.validateUniquePrefixes(nextConfig);

    return nextConfig;
  }

  static listProjectConfig(): ProjectConfig {
    const db = DbClient.getDb();
    const rows = db.select().from(projectConfig).all();

    const config: ProjectConfig = { ...PROJECT_CONFIG_DEFAULTS };

    for (const row of rows) {
      if (!PROJECT_CONFIG_KEY_SET.has(row.key)) {
        continue;
      }

      ConfigService.assertProjectConfigKey(row.key);
      config[row.key] = row.value;
    }

    return config;
  }

  static listProjectConfigEntries(): ProjectConfigEntry[] {
    const config = ConfigService.listProjectConfig();
    return PROJECT_CONFIG_KEYS.map((key) => {
      return { key, value: config[key] };
    });
  }

  static getProjectConfigValue(key: ProjectConfigKey): string {
    return ConfigService.listProjectConfig()[key];
  }

  private static upsertProjectConfigValue(key: ProjectConfigKey, value: string): void {
    const db = DbClient.getDb();
    const existing = db.select().from(projectConfig).where(eq(projectConfig.key, key)).get();

    if (existing) {
      db.update(projectConfig).set({ value }).where(eq(projectConfig.key, key)).run();
      return;
    }

    db.insert(projectConfig).values({ key, value }).run();
  }

  static setProjectConfigValues(
    updates: Partial<Record<ProjectConfigKey, string | undefined>>
  ): ProjectConfig {
    const currentConfig = ConfigService.listProjectConfig();
    const nextConfig = ConfigService.resolveProjectConfig(updates, currentConfig);

    for (const key of PROJECT_CONFIG_KEYS) {
      const nextValue = nextConfig[key];
      if (nextValue !== currentConfig[key]) {
        ConfigService.upsertProjectConfigValue(key, nextValue);
      }
    }

    return nextConfig;
  }

  static unsetProjectConfigValue(key: ProjectConfigKey): string {
    return ConfigService.setProjectConfigValues({ [key]: PROJECT_CONFIG_DEFAULTS[key] })[key];
  }
}

const PROJECT_CONFIG_KEY_SET: ReadonlySet<string> = new Set(PROJECT_CONFIG_KEYS);
const PREFIX_PATTERN = /^[A-Z][A-Z0-9]*$/;
