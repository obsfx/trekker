/**
 * Queue a background task that runs without blocking.
 * Errors are logged to stderr in debug mode (TREKKER_DEBUG=1).
 * Skipped entirely when TREKKER_SKIP_EMBEDDINGS=1 (for faster tests).
 *
 * Use this for non-critical operations like embedding generation
 * where failure shouldn't block the main operation.
 */
export function queueBackgroundTask(
  promise: Promise<unknown>,
  context?: string
): void {
  // Skip background tasks in test mode for faster execution
  if (process.env.TREKKER_SKIP_EMBEDDINGS === "1") {
    return;
  }

  promise.catch((error: Error) => {
    if (process.env.TREKKER_DEBUG === "1") {
      const prefix = context ? `[${context}] ` : "";
      console.error(`${prefix}Background task failed: ${error.message}`);
    }
  });
}
