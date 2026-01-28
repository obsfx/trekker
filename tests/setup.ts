/**
 * Vitest Test Setup
 *
 * Configures the test environment for Node.js with sql.js (WASM SQLite).
 * No more Bun-specific crashes since we're using pure JavaScript/WASM.
 */

// Skip embeddings during tests for faster execution
process.env.TREKKER_SKIP_EMBEDDINGS = "1";
