import { ConflictError, NotFoundError, ValidationError } from '@/src/services/errors';
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_ERROR,
  HTTP_NOT_FOUND,
} from '@/src/server/constants';

export abstract class HttpErrors {
  static invalidRequest(message: string): HttpError {
    return new HttpError(HTTP_BAD_REQUEST, 'invalid_request', message);
  }

  static forbidden(message: string): HttpError {
    return new HttpError(HTTP_FORBIDDEN, 'forbidden', message);
  }

  static notFound(message: string): HttpError {
    return new HttpError(HTTP_NOT_FOUND, 'not_found', message);
  }

  static toHttpError(error: unknown): HttpError {
    if (error instanceof HttpError) {
      return error;
    }
    if (error instanceof NotFoundError) {
      return HttpErrors.notFound(error.message);
    }
    if (error instanceof ConflictError) {
      return new HttpError(HTTP_CONFLICT, 'conflict', error.message);
    }
    if (error instanceof ValidationError) {
      return HttpErrors.invalidRequest(error.message);
    }
    if (error instanceof Error) {
      if (NOT_FOUND_MESSAGE.test(error.message)) {
        return HttpErrors.notFound(error.message);
      }
      if (CONFLICT_MESSAGE.test(error.message)) {
        return new HttpError(HTTP_CONFLICT, 'conflict', error.message);
      }
      if (INVALID_MESSAGE.test(error.message)) {
        return HttpErrors.invalidRequest(error.message);
      }
    }
    console.error('trekker serve: unhandled error', error);
    return new HttpError(HTTP_INTERNAL_ERROR, 'internal', 'Internal server error');
  }
}

export type ErrorCode = 'invalid_request' | 'forbidden' | 'not_found' | 'conflict' | 'internal';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const NOT_FOUND_MESSAGE = /not found/i;
const CONFLICT_MESSAGE = /already exists|would create a cycle|must be unique/i;
const INVALID_MESSAGE = /^(invalid|unsupported)\b|is required|cannot depend on itself/i;
