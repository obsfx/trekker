import * as v from 'valibot';

export abstract class ValueSchemas {
  static readonly count = v.pipe(v.number(), v.integer(), v.minValue(0));
  static readonly timestamp = v.pipe(v.number(), v.minValue(0));
  static readonly nullableString = v.nullable(v.string());
}
