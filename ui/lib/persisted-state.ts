import * as v from 'valibot';

export abstract class PersistedState {
  static merge<TState extends object>(schema: v.GenericSchema<unknown, Partial<TState>>) {
    return (persisted: unknown, current: TState): TState => {
      const result = v.safeParse(schema, persisted);
      if (!result.success) {
        return current;
      }
      return { ...current, ...result.output };
    };
  }
}
