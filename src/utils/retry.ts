import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  onRetry: (error, attempt) => {
    logger.warn(`Retry attempt ${attempt} after error: ${error.message}`);
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxAttempts) {
        logger.error(`All ${opts.maxAttempts} attempts failed`);
        throw lastError;
      }

      const delay = Math.min(
        opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      opts.onRetry(lastError, attempt);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with specific error handling
 */
export async function withRetryOnNetworkError<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    onRetry: (error, attempt) => {
      if (isNetworkError(error)) {
        logger.warn(
          `Network error on attempt ${attempt}, retrying... (${error.message})`
        );
      } else {
        logger.warn(`Error on attempt ${attempt}: ${error.message}`);
      }
    },
  });
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'network',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'fetch failed',
    '429', // Rate limit
    '502', // Bad gateway
    '503', // Service unavailable
    '504', // Gateway timeout
  ];

  return networkErrorMessages.some((msg) =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Batch retry helper for multiple operations
 */
export async function batchWithRetry<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<void>,
  options: RetryOptions & { batchSize?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<{ successful: T[]; failed: Array<{ item: T; error: Error }> }> {
  const batchSize = options.batchSize || 10;
  const successful: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item, batchIndex) => {
        const index = i + batchIndex;
        try {
          await withRetry(() => fn(item, index), options);
          successful.push(item);
        } catch (error) {
          failed.push({ item, error: error as Error });
        }

        if (options.onProgress) {
          options.onProgress(successful.length + failed.length, items.length);
        }
      })
    );
  }

  return { successful, failed };
}
