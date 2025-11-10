import { logger } from './logger';

export interface ProgressTracker {
  start(total: number, label?: string): void;
  update(current: number, details?: string): void;
  complete(message?: string): void;
  fail(message: string): void;
}

export class ConsoleProgressTracker implements ProgressTracker {
  private total: number = 0;
  private label: string = '';
  private startTime: number = 0;

  start(total: number, label: string = 'Processing'): void {
    this.total = total;
    this.label = label;
    this.startTime = Date.now();

    logger.section(`${this.label}: 0/${this.total}`);
  }

  update(current: number, details?: string): void {
    const percentage = Math.floor((current / this.total) * 100);
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const rate = current / elapsed || 0;
    const remaining = this.total - current;
    const eta = remaining / rate || 0;

    logger.progress(current, this.total, details || '');

    if (details) {
      logger.debug(
        `Progress: ${current}/${this.total} (${percentage}%) - ${details}`
      );
    }

    if (elapsed > 0) {
      logger.debug(
        `Rate: ${rate.toFixed(2)}/s, ETA: ${Math.ceil(eta)}s`
      );
    }
  }

  complete(message: string = 'Completed'): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    logger.success(`${message} (${this.total} items in ${elapsed}s)`);
  }

  fail(message: string): void {
    logger.error(message);
  }
}

export class BatchProgressTracker extends ConsoleProgressTracker {
  private successful: number = 0;
  private failed: number = 0;
  private errors: Array<{ index: number; error: string }> = [];

  recordSuccess(): void {
    this.successful++;
    this.update(this.successful + this.failed);
  }

  recordFailure(index: number, error: string): void {
    this.failed++;
    this.errors.push({ index, error });
    this.update(this.successful + this.failed, `Failed: ${this.failed}`);
  }

  complete(message?: string): void {
    const total = this.successful + this.failed;
    const elapsed = Math.floor((Date.now() - Date.now()) / 1000);

    logger.newline();
    logger.section('Batch Operation Summary');
    logger.table({
      'Total Items': total,
      'Successful': this.successful,
      'Failed': this.failed,
      'Success Rate': `${((this.successful / total) * 100).toFixed(1)}%`,
    });

    if (this.errors.length > 0) {
      logger.section('Errors:');
      this.errors.forEach(({ index, error }) => {
        logger.error(`Item ${index}: ${error}`);
      });
    }

    super.complete(message);
  }
}

/**
 * Create a progress tracker instance
 */
export function createProgressTracker(type: 'console' | 'batch' = 'console'): ProgressTracker {
  switch (type) {
    case 'batch':
      return new BatchProgressTracker();
    case 'console':
    default:
      return new ConsoleProgressTracker();
  }
}
