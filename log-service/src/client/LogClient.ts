// src/client/LogClient.ts

import axios, { AxiosInstance, AxiosError } from "axios";
import { OfflineQueue } from "./queue/OfflineQueue";
import { LogClientConfig, LogClientResponse, LogEventPayload } from "./types";

/**
 * Client HTTP per EDG Log Service
 * 
 * Features:
 * - HTTP client con retry automatico
 * - Queue offline per resilienza
 * - Type-safe con TypeScript
 * - Support per API Key authentication
 */
export class LogClient {
  private client: AxiosInstance;
  private config: Required<LogClientConfig>;
  private offlineQueue?: OfflineQueue;

  constructor(config: LogClientConfig) {
    // Default configuration
    this.config = {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || "",
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableOfflineQueue: config.enableOfflineQueue ?? true,
      maxQueueSize: config.maxQueueSize || 1000,
      debug: config.debug || false,
    };

    if (!this.config.apiUrl) {
      throw new Error("LogClient: apiUrl is required");
    }

    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { "X-API-Key": this.config.apiKey }),
      },
    });

    // Initialize offline queue if enabled
    if (this.config.enableOfflineQueue) {
      this.offlineQueue = new OfflineQueue({
        maxSize: this.config.maxQueueSize,
        retryDelay: this.config.retryDelay,
        onFlush: (payload) => this.sendToApi(payload),
        debug: this.config.debug,
      });
    }

    this.log = this.log.bind(this);
  }

  /**
   * Log un evento al log-service
   */
  async log(payload: LogEventPayload): Promise<LogClientResponse> {
    try {
      this.validatePayload(payload);
      const result = await this.sendWithRetry(payload);
      
      if (this.config.debug) {
        console.log("[LogClient] Event logged successfully:", result.logId);
      }

      return result;
    } catch (error) {
      if (this.offlineQueue) {
        this.offlineQueue.enqueue(payload);
        
        if (this.config.debug) {
          console.warn("[LogClient] Event queued for later delivery");
        }

        return {
          success: true,
          logId: "queued",
        };
      }

      return this.handleError(error);
    }
  }

  /**
   * Invia multiple eventi in batch
   */
  async logBatch(payloads: LogEventPayload[]): Promise<LogClientResponse[]> {
    const results: LogClientResponse[] = [];

    for (const payload of payloads) {
      const result = await this.log(payload);
      results.push(result);
    }

    return results;
  }

  /**
   * Flush manuale della queue offline
   */
  async flushQueue(): Promise<number> {
    if (!this.offlineQueue) {
      return 0;
    }

    return await this.offlineQueue.flush();
  }

  /**
   * Ottiene dimensione corrente della queue
   */
  getQueueSize(): number {
    return this.offlineQueue?.size() || 0;
  }

  /**
   * Health check del log-service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/health");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Chiude il client e flush della queue
   */
  async close(): Promise<void> {
    if (this.offlineQueue) {
      await this.offlineQueue.flush();
      this.offlineQueue.stop();
    }
  }

  // ========== PRIVATE METHODS ==========

  private async sendWithRetry(
    payload: LogEventPayload,
    attempt: number = 0
  ): Promise<LogClientResponse> {
    try {
      return await this.sendToApi(payload);
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        await this.sleep(this.config.retryDelay * (attempt + 1));
        return this.sendWithRetry(payload, attempt + 1);
      }

      throw error;
    }
  }

  private async sendToApi(
    payload: LogEventPayload
  ): Promise<LogClientResponse> {
    const response = await this.client.post("/api/log/azione", payload);

    return {
      success: true,
      logId: response.data._id || response.data.id,
    };
  }

  private validatePayload(payload: LogEventPayload): void {
    if (!payload.risultato) {
      throw new Error("LogClient: campo 'risultato' obbligatorio");
    }

    if (!payload.risultato.esito) {
      throw new Error("LogClient: campo 'risultato.esito' obbligatorio");
    }

    if (
      !["successo", "fallito", "parziale"].includes(payload.risultato.esito)
    ) {
      throw new Error(
        `LogClient: risultato.esito non valido: ${payload.risultato.esito}`
      );
    }

    if (payload.categoria && !payload.sottoCategoria) {
      throw new Error(
        "LogClient: campo 'sottoCategoria' obbligatorio quando 'categoria' è specificata"
      );
    }
  }

  private handleError(error: unknown): LogClientResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (this.config.debug) {
        console.error("[LogClient] HTTP Error:", {
          status: axiosError.response?.status,
          message: axiosError.message,
        });
      }

      return {
        success: false,
        error: axiosError.message,
      };
    }

    if (error instanceof Error) {
      if (this.config.debug) {
        console.error("[LogClient] Error:", error.message);
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Unknown error",
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
