import * as v from 'valibot';
import { HttpErrors } from '@/src/server/http/errors';

export abstract class Requests {
  private static describeIssues(issues: readonly v.BaseIssue<unknown>[]): string {
    return issues
      .map((issue) => {
        const path = v.getDotPath(issue);
        if (path === null) {
          return issue.message;
        }
        return `${path}: ${issue.message}`;
      })
      .join('; ');
  }

  static parseWith<TSchema extends v.GenericSchema>(
    schema: TSchema,
    input: unknown
  ): v.InferOutput<TSchema> {
    const result = v.safeParse(schema, input);
    if (!result.success) {
      throw HttpErrors.invalidRequest(Requests.describeIssues(result.issues));
    }
    return result.output;
  }

  static parseQuery<TSchema extends v.GenericSchema>(
    url: URL,
    schema: TSchema
  ): v.InferOutput<TSchema> {
    return Requests.parseWith(schema, Object.fromEntries(url.searchParams));
  }

  static async parseBody<TSchema extends v.GenericSchema>(
    request: Request,
    schema: TSchema
  ): Promise<v.InferOutput<TSchema>> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw HttpErrors.invalidRequest('Request body must be valid JSON');
    }
    return Requests.parseWith(schema, body);
  }
}
