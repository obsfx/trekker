import { pipeline } from "@huggingface/transformers";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const MODEL_ID = "onnx-community/embeddinggemma-300m-ONNX";
/** Full embedding dimension from the model before MRL (Matryoshka Representation Learning) truncation */
const FULL_DIMENSION = 768;
/** Target dimension after MRL truncation - smaller vectors with preserved semantic quality */
const TARGET_DIMENSION = 256;
const CACHE_DIR = join(homedir(), ".trekker", "models");

export interface EmbeddingOptions {
  /** If true, suppresses progress output to stderr */
  silent?: boolean;
}

// Feature extraction pipeline type - simplified to avoid complex union type issues
interface FeatureExtractor {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<{ data: ArrayLike<number> }>;
}

let extractor: FeatureExtractor | null = null;
let modelLoadFailed = false;
let modelLoading: Promise<boolean> | null = null;

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function truncateAndNormalize(
  embedding: Float32Array,
  targetDim: number
): Float32Array {
  // Truncate to target dimension (MRL technique)
  const truncated = embedding.slice(0, targetDim);

  // Re-normalize after truncation
  let norm = 0;
  for (let i = 0; i < truncated.length; i++) {
    norm += truncated[i] * truncated[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < truncated.length; i++) {
      truncated[i] = truncated[i] / norm;
    }
  }

  return truncated;
}

/**
 * Resets the model state to allow retrying after transient errors.
 * Call this before retrying ensureModelLoaded() if a previous attempt failed.
 */
export function resetModelState(): void {
  extractor = null;
  modelLoading = null;
  modelLoadFailed = false;
}

export async function ensureModelLoaded(options?: EmbeddingOptions): Promise<boolean> {
  if (extractor) {
    return true;
  }

  if (modelLoadFailed) {
    return false;
  }

  // If already loading, wait for that promise
  if (modelLoading) {
    return modelLoading;
  }

  const silent = options?.silent ?? false;

  modelLoading = (async () => {
    try {
      ensureCacheDir();

      // Progress callback writes to stderr unless silent
      const progressCallback = silent
        ? undefined
        : (progress: { status: string; file?: string; progress?: number }) => {
            if (progress.status === "download" && progress.file && progress.progress !== undefined) {
              const percent = Math.round(progress.progress);
              process.stderr.write(`\rDownloading ${progress.file}: ${percent}%`);
            } else if (progress.status === "done") {
              process.stderr.write("\n");
            }
          };

      extractor = await (pipeline as Function)("feature-extraction", MODEL_ID, {
        cache_dir: CACHE_DIR,
        quantized: true,
        progress_callback: progressCallback,
      }) as FeatureExtractor;

      return true;
    } catch (error) {
      modelLoadFailed = true;
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`\nFailed to load embedding model: ${message}\n`);
      }
      return false;
    } finally {
      modelLoading = null;
    }
  })();

  return modelLoading;
}

export function isModelAvailable(): boolean {
  return extractor !== null;
}

export function getEmbeddingDimension(): number {
  return TARGET_DIMENSION;
}

export async function embed(text: string): Promise<Float32Array> {
  const loaded = await ensureModelLoaded();
  if (!loaded || !extractor) {
    throw new Error("Embedding model is not available");
  }

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  // Extract the embedding from the tensor output
  const fullEmbedding = new Float32Array(output.data as ArrayLike<number>);

  if (fullEmbedding.length !== FULL_DIMENSION) {
    throw new Error(
      `Unexpected embedding dimension: expected ${FULL_DIMENSION}, got ${fullEmbedding.length}`
    );
  }

  return truncateAndNormalize(fullEmbedding, TARGET_DIMENSION);
}

export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) {
    return [];
  }

  const loaded = await ensureModelLoaded();
  if (!loaded || !extractor) {
    throw new Error("Embedding model is not available");
  }

  const results: Float32Array[] = [];

  // Process each text individually to ensure proper output handling
  for (const text of texts) {
    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    const fullEmbedding = new Float32Array(output.data as ArrayLike<number>);

    if (fullEmbedding.length !== FULL_DIMENSION) {
      throw new Error(
        `Unexpected embedding dimension: expected ${FULL_DIMENSION}, got ${fullEmbedding.length}`
      );
    }

    results.push(truncateAndNormalize(fullEmbedding, TARGET_DIMENSION));
  }

  return results;
}
