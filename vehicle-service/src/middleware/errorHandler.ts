// =============================================================================
// EDG Vehicle Service - Global Error Handler
// Intercetta tutti gli errori non gestiti dai controller
// Deve essere registrato DOPO tutte le route in app.ts
// =============================================================================
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Error handler globale (4 parametri — Express lo riconosce automaticamente)
// ---------------------------------------------------------------------------
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ❌ ERROR ${req.method} ${req.url}`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Errore operazionale (AppError e sottoclassi)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Errore validazione Sequelize
  if (err.name === 'SequelizeValidationError') {
    const details = (err as unknown as { errors: { path: string; message: string }[] }).errors;
    res.status(400).json({
      success: false,
      message: 'Dati non validi',
      errors: details.map(e => ({ field: e.path, message: e.message })),
    });
    return;
  }

  // Errore unicità Sequelize (duplicate key)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const details = (err as unknown as { errors: { path: string }[] }).errors;
    res.status(409).json({
      success: false,
      message: 'Risorsa già esistente',
      field: details[0]?.path,
    });
    return;
  }

  // Errore FK Sequelize (record referenziato non esiste)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    res.status(422).json({
      success: false,
      message: 'Riferimento a risorsa non esistente',
    });
    return;
  }

  // Errore database generico Sequelize
  if (err.name?.startsWith('Sequelize')) {
    res.status(503).json({
      success: false,
      message: 'Errore database',
    });
    return;
  }

  // Errore sconosciuto — non esporre dettagli in produzione
  res.status(500).json({
    success: false,
    message: 'Errore interno del server',
  });
}

// ---------------------------------------------------------------------------
// Handler per route non trovate (404)
// Registrare PRIMA dell'errorHandler ma DOPO tutte le route
// ---------------------------------------------------------------------------
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route non trovata: ${req.method} ${req.url}`,
  });
}
