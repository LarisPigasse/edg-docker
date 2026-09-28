// src/client/queue/OfflineQueue.ts

import { LogEventPayload } from "../types";

export interface OfflineQueueConfig {
  maxSize: number;
  retryDelay: number;
  onFlush: (payload: LogEventPayload) => Promise<any>;
  debug?: boolean;
}

/**
 * Queue in-memory per eventi offline
 * 
 * Features:
 * - Buffer FIFO per eventi quando log-service è offline
 * - Auto-flush periodico ogni 10 secondi
 * - Limite di dimensione configurabile
 * - Resilienza a failure temporanei
 */
export class OfflineQueue {
  private queue: LogEventPayload[] = [];
  private config: OfflineQueueConfig;
  private flushTimer?: NodeJS.Timeout;
  private isFlushing = false;

  constructor(config: OfflineQueueConfig) {
    this.config = config;
    this.startAutoFlush();
  }

  /**
   * Accoda un evento
   */
  enqueue(payload: LogEventPayload): boolean {
    if (this.queue.length >= this.config.maxSize) {
      if (this.config.debug) {
        console.warn(
          `[OfflineQueue] Queue full (${this.config.maxSize}), dropping event`
        );
      }
      return false;
    }

    this.queue.push(payload);

    if (this.config.debug) {
      console.log(
        `[OfflineQueue] Event queued. Queue size: ${this.queue.length}`
      );
    }

    return true;
  }

  /**
   * Flush di tutti gli eventi in queue
   */
  async flush(): Promise<number> {
    if (this.isFlushing) {
      if (this.config.debug) {
        console.log("[OfflineQueue] Flush already in progress, skipping");
      }
      return 0;
    }

    if (this.queue.length === 0) {
      return 0;
    }

    this.isFlushing = true;
    let successCount = 0;
    const failedEvents: LogEventPayload[] = [];

    if (this.config.debug) {
      console.log(`[OfflineQueue] Flushing ${this.queue.length} events...`);
    }

    while (this.queue.length > 0) {
      const payload = this.queue.shift()!;

      try {
        await this.config.onFlush(payload);
        successCount++;
      } catch (error) {
        if (!failedEvents.includes(payload)) {
          failedEvents.push(payload);
        }

        if (this.config.debug) {
          console.error("[OfflineQueue] Failed to flush event:", error);
        }
      }
    }

    this.queue.unshift(...failedEvents);
    this.isFlushing = false;

    if (this.config.debug) {
      console.log(
        `[OfflineQueue] Flush completed. Success: ${successCount}, Failed: ${failedEvents.length}`
      );
    }

    return successCount;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.queue.length > 0) {
        await this.flush();
      }
    }, 10000); // 10 secondi

    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }
}
