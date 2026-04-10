import { eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { projectConfig } from '../db/schema';
import {
  type ProjectConfig,
  type ProjectConfigEntry,
  type ProjectConfigKey,
  PROJECT_CONFIG_DEFAULTS,
  PROJECT_CONFIG_KEYS,
} from '../types';

const PROJECT_CONFIG_KEY_SET: ReadonlySet<string> = new Set(PROJECT_CONFIG_KEYS);
const PREFIX_PATTERN = /^[A-Z][A-Z0-9]*$/;

export function assertProjectConfigKey(key: string): asserts key is ProjectConfigKey {
  if (!PROJECT_CONFIG_KEY_SET.has(key)) {
    throw new Error(
      `Unsupported config key: ${key}. Valid keys: ${PROJECT_CONFIG_KEYS.join(', ')}`
    );
  }
}

function normalizePrefixValue(value: string): string {
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

function validateUniquePrefixes(config: ProjectConfig): void {
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

export function resolveProjectConfig(
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
      normalizedUpdates[rawKey] = normalizePrefixValue(rawValue);
    }
  }

  const nextConfig: ProjectConfig = {
    ...baseConfig,
    ...normalizedUpdates,
  };

  validateUniquePrefixes(nextConfig);

  return nextConfig;
}

export function listProjectConfig(): ProjectConfig {
  const db = getDb();
  const rows = db.select().from(projectConfig).all();

  const config: ProjectConfig = { ...PROJECT_CONFIG_DEFAULTS };

  for (const row of rows) {
    if (!PROJECT_CONFIG_KEY_SET.has(row.key)) {
      continue;
    }

    assertProjectConfigKey(row.key);
    config[row.key] = row.value;
  }

  return config;
}

export function listProjectConfigEntries(): ProjectConfigEntry[] {
  const config = listProjectConfig();
  return PROJECT_CONFIG_KEYS.map((key) => ({ key, value: config[key] }));
}

export function getProjectConfigValue(key: ProjectConfigKey): string {
  return listProjectConfig()[key];
}

function upsertProjectConfigValue(key: ProjectConfigKey, value: string): void {
  const db = getDb();
  const existing = db.select().from(projectConfig).where(eq(projectConfig.key, key)).get();

  if (existing) {
    db.update(projectConfig).set({ value }).where(eq(projectConfig.key, key)).run();
    return;
  }

  db.insert(projectConfig).values({ key, value }).run();
}

export function setProjectConfigValues(
  updates: Partial<Record<ProjectConfigKey, string | undefined>>
): ProjectConfig {
  const currentConfig = listProjectConfig();
  const nextConfig = resolveProjectConfig(updates, currentConfig);

  for (const key of PROJECT_CONFIG_KEYS) {
    const nextValue = nextConfig[key];
    if (nextValue !== currentConfig[key]) {
      upsertProjectConfigValue(key, nextValue);
    }
  }

  return nextConfig;
}

export function unsetProjectConfigValue(key: ProjectConfigKey): string {
  return setProjectConfigValues({ [key]: PROJECT_CONFIG_DEFAULTS[key] })[key];
}
