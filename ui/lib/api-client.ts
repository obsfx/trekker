import * as v from 'valibot';

export class ApiError extends Error {
  readonly path: string;
  readonly status: number | null;
  readonly code: string | null;

  constructor(
    path: string,
    message: string,
    status: number | null = null,
    code: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.path = path;
    this.status = status;
    this.code = code;
  }

  static unexpectedShape(path: string) {
    return new ApiError(path, `${path}: unexpected response shape`);
  }

  static isNotFound(error: unknown) {
    return error instanceof ApiError && error.status === 404;
  }

  static describe(error: unknown, subject: string) {
    if (error instanceof ApiError && error.status !== null) {
      return `${subject} failed: ${error.message}`;
    }
    return `${subject} failed`;
  }
}

type WriteMethod = 'POST' | 'PATCH' | 'DELETE';

export class ApiClient {
  private static readonly errorBody = v.object({
    error: v.object({ code: v.string(), message: v.string() }),
  });

  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  static withQuery(path: string, query: URLSearchParams) {
    const text = query.toString();
    if (text === '') {
      return path;
    }
    return `${path}?${text}`;
  }

  static parse<TSchema extends v.GenericSchema>(
    schema: TSchema,
    body: unknown,
    path: string
  ): v.InferOutput<TSchema> {
    const result = v.safeParse(schema, body);
    if (!result.success) {
      throw ApiError.unexpectedShape(path);
    }
    return result.output;
  }

  private static jsonInit(method: WriteMethod, payload: unknown): RequestInit {
    if (payload === undefined) {
      return { method };
    }
    return {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    };
  }

  url(path: string) {
    return new URL(path, this.baseUrl).toString();
  }

  get<TSchema extends v.GenericSchema>(path: string, schema: TSchema) {
    return this.request(path, { method: 'GET' }, schema);
  }

  send<TSchema extends v.GenericSchema>(
    method: WriteMethod,
    path: string,
    payload: unknown,
    schema: TSchema
  ) {
    return this.request(path, ApiClient.jsonInit(method, payload), schema);
  }

  async sendWithoutContent(method: WriteMethod, path: string, payload?: unknown) {
    await this.fetchOk(path, ApiClient.jsonInit(method, payload));
  }

  private async request<TSchema extends v.GenericSchema>(
    path: string,
    init: RequestInit,
    schema: TSchema
  ) {
    const response = await this.fetchOk(path, init);
    const body: unknown = await response.json();
    return ApiClient.parse(schema, body, path);
  }

  private async fetchOk(path: string, init: RequestInit) {
    const response = await fetch(this.url(path), init);
    if (response.ok) {
      return response;
    }
    const body: unknown = await response.json().catch(() => {
      return null;
    });
    const parsed = v.safeParse(ApiClient.errorBody, body);
    if (parsed.success) {
      throw new ApiError(
        path,
        parsed.output.error.message,
        response.status,
        parsed.output.error.code
      );
    }
    throw new ApiError(path, `${path}: request failed`, response.status);
  }
}
