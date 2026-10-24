export abstract class Errors {
  static of(error: unknown) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}
