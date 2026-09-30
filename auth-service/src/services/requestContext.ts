// src/services/requestContext.ts
//
// Contesto della richiesta in corso (ADR039): l'ID generato dall'api-gateway
// (header x-request-id) resta disponibile per tutta la durata della
// richiesta, anche dentro chiamate asincrone, senza passarlo di funzione in
// funzione. Il logger lo legge da qui e lo registra in
// contesto.transazioneId: tutti gli eventi della stessa richiesta, in
// qualunque servizio, condividono lo stesso ID.
// Modulo identico in auth-service, system-service, vehicle-service e log-service.
import { AsyncLocalStorage } from 'async_hooks';
import type { NextFunction, Request, Response } from 'express';

interface RequestContext {
  requestId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Da montare per primo: apre il contesto per ogni richiesta */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers['x-request-id'];
  const requestId = typeof header === 'string' && header.length <= 64 ? header : undefined;
  storage.run({ requestId }, () => next());
}

/** ID della richiesta in corso, se esiste (undefined per i processi pianificati) */
export const currentRequestId = (): string | undefined => storage.getStore()?.requestId;
