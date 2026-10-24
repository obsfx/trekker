import * as v from 'valibot';

export interface ProjectIdentity {
  name: string;
  root: string;
}

export interface TrekkerGlobal {
  baseUrl: string;
  version: string | null;
  project: ProjectIdentity | null;
}

declare global {
  interface Window {
    __trekkerGlobal?: unknown;
  }
}

export abstract class AppGlobals {
  private static readonly injected = v.object({
    baseUrl: v.string(),
    version: v.fallback(v.nullable(v.string()), null),
    project: v.fallback(v.nullable(v.object({ name: v.string(), root: v.string() })), null),
  });

  static read(): TrekkerGlobal {
    const result = v.safeParse(AppGlobals.injected, window.__trekkerGlobal);
    if (result.success) {
      return result.output;
    }
    return { baseUrl: window.location.origin, version: null, project: null };
  }
}
