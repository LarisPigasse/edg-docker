// src/client/middleware/expressLogger.ts

import { Request, Response, NextFunction } from "express";
import { LogClient } from "../LogClient";
import { EventCategory, EventSeverity, SystemEventType } from "../types";

export interface ExpressLoggerOptions {
  ignorePaths?: string[];
  ignoreMethods?: string[];
  errorsOnly?: boolean;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  extractUserId?: (req: Request) => string | undefined;
  extractMetadata?: (req: Request, res: Response) => Record<string, any>;
}

/**
 * Crea middleware Express per auto-logging delle richieste
 */
export function createExpressLogger(
  logger: LogClient,
  options: ExpressLoggerOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    ignorePaths = ["/health", "/metrics", "/favicon.ico"],
    ignoreMethods = [],
    errorsOnly = false,
    includeRequestBody = false,
    includeResponseBody = false,
    extractUserId,
    extractMetadata,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (ignorePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (ignoreMethods.includes(req.method)) {
      return next();
    }

    const startTime = Date.now();

    const originalEnd = res.end.bind(res);
    res.end = function (this: Response, ...args: any[]): Response {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (errorsOnly && statusCode < 400) {
        return originalEnd(...args);
      }

      let esito: "successo" | "fallito" | "parziale";
      if (statusCode < 400) {
        esito = "successo";
      } else if (statusCode < 500) {
        esito = "parziale";
      } else {
        esito = "fallito";
      }

      const metadata: any = {
        processName: "http-request",
        externalService: req.hostname || "unknown",
        apiEndpoint: `${req.method} ${req.path}`,
        statusCode,
        duration,
        ...(extractMetadata && extractMetadata(req, res)),
      };

      if (includeRequestBody && req.body) {
        metadata.requestBody = req.body;
      }

      const userId = extractUserId ? extractUserId(req) : undefined;

      let criticita = EventSeverity.INFO;
      if (statusCode >= 500) {
        criticita = EventSeverity.ERROR;
      } else if (statusCode >= 400) {
        criticita = EventSeverity.WARNING;
      }

      logger
        .log({
          categoria: EventCategory.SYSTEM,
          sottoCategoria: SystemEventType.API_CALL_EXTERNAL,
          criticita,
          metadata,
          risultato: {
            esito,
            messaggio: statusCode >= 400 ? res.statusMessage : undefined,
          },
          origine: userId
            ? { tipo: "utente", id: userId, dettagli: {} }
            : { tipo: "sistema", id: "express-app", dettagli: {} },
          contesto: {
            ip: req.ip,
            userAgent: req.get("user-agent"),
            ambiente: process.env.NODE_ENV || "development",
          },
          tags: ["http-request", req.method.toLowerCase()],
        })
        .catch((error) => {
          console.error("[ExpressLogger] Failed to log request:", error);
        });

      return originalEnd(...args);
    } as any;

    next();
  };
}
