import * as v from 'valibot';
import { HttpErrors } from '@/src/server/http/errors';

export abstract class Cursors {
  static encodeCursor(payload: object): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  static decodeCursor<TSchema extends v.GenericSchema>(
    cursor: string,
    schema: TSchema
  ): v.InferOutput<TSchema> {
    let decoded: unknown;
    try {
      decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    } catch {
      throw HttpErrors.invalidRequest('Invalid cursor');
    }
    const result = v.safeParse(schema, decoded);
    if (!result.success) {
      throw HttpErrors.invalidRequest('Invalid cursor');
    }
    return result.output;
  }
}
