// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";

/**
 * Middleware per autenticazione con API key
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  // In modalità di sviluppo, salta l'autenticazione se specificato
  if (process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "true") {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validApiKey = process.env.API_KEY_SECRET;

  if (!apiKey) {
    console.warn("Tentativo di accesso senza API key", {
      ip: req.ip,
      endpoint: req.originalUrl,
    });
    res.status(401).json({ message: "API key mancante" });
    return;
  }

  if (apiKey !== validApiKey) {
    console.warn("Tentativo di accesso con API key non valida", {
      ip: req.ip,
      endpoint: req.originalUrl,
    });
    res.status(403).json({ message: "API key non valida" });
    return;
  }

  next();
};
