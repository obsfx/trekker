import { HTTP_CREATED, HTTP_NO_CONTENT } from '@/src/server/constants';
import type { ErrorDto } from '@/src/server/http/dto';
import type { HttpError } from '@/src/server/http/errors';

export abstract class Responses {
  static json(body: unknown, status?: number): Response {
    return Response.json(body, { status, headers: NO_STORE });
  }

  static created(body: unknown): Response {
    return Responses.json(body, HTTP_CREATED);
  }

  static noContent(): Response {
    return new Response(null, { status: HTTP_NO_CONTENT, headers: NO_STORE });
  }

  static errorResponse(error: HttpError): Response {
    const body: ErrorDto = { error: { code: error.code, message: error.message } };
    return Responses.json(body, error.status);
  }
}

const NO_STORE = { 'cache-control': 'no-store' };
