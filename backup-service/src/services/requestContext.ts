// src/services/requestContext.ts
//
// backup-service non riceve richieste dall'api-gateway: nessun ID di
// richiesta da propagare. Il modulo esiste solo per mantenere logger.ts
// identico a quello degli altri servizi (ADR039).
export const currentRequestId = (): string | undefined => undefined;
