// src/services/localEvents.ts
//
// Registrazione di eventi generati DENTRO log-service (audit delle regole e
// dei destinatari, cambi di stato dell'HealthMonitor). Stesso formato degli
// eventi inviati via HTTP dai logger.ts degli altri servizi (ADR034), ma
// scritti direttamente in MongoDB; ogni evento passa dall'AlertManager come
// qualunque altro (ADR038). Non lancia mai: un evento non registrato non
// deve far fallire chi lo genera.
import AzioneLog from '../models/azioneLog';
import AlertManager from './alerting/AlertManager';
import { currentRequestId } from './requestContext';

export const LOG_SERVICE_ID = 'log-service';

export interface LocalEvent {
  categoria: 'AUTH' | 'DATA' | 'EMAIL' | 'SYSTEM' | 'AUDIT' | 'SECURITY';
  /** Tipo di evento, es. 'health.down', 'alert.rule_created' */
  tipo: string;
  criticita: 'info' | 'warning' | 'error' | 'critical';
  esito: 'successo' | 'fallito' | 'parziale';
  messaggio: string;
  /** Servizio/entita' a cui l'evento si riferisce (usato da groupBy 'service') */
  entita?: string;
  dettagli?: Record<string, unknown>;
  attore?: { id: number | string; email?: string; tenantId?: number | null } | null;
}

export async function recordEvent(ev: LocalEvent): Promise<void> {
  try {
    const saved = await new AzioneLog({
      timestamp: new Date(),
      categoria: ev.categoria,
      sottoCategoria: ev.tipo,
      criticita: ev.criticita,
      origine: ev.attore
        ? {
            tipo: 'utente',
            id: String(ev.attore.id),
            dettagli: {
              ...(ev.attore.email ? { email: ev.attore.email } : {}),
              ...(ev.attore.tenantId != null ? { tenantId: ev.attore.tenantId } : {}),
            },
          }
        : { tipo: 'sistema', id: LOG_SERVICE_ID, dettagli: {} },
      azione: {
        tipo: 'custom',
        entita: ev.entita ?? LOG_SERVICE_ID,
        idEntita: ev.tipo,
        operazione: ev.messaggio,
        dettagli: ev.dettagli ?? {},
      },
      risultato: { esito: ev.esito, messaggio: ev.messaggio },
      contesto: {
        ambiente: process.env.NODE_ENV || 'development',
        ...(currentRequestId() ? { transazioneId: currentRequestId() } : {}),
      },
      tags: [LOG_SERVICE_ID, ev.criticita],
    }).save();

    await AlertManager.evaluate(saved.toObject());
  } catch (err: any) {
    console.error(`[localEvents] ${ev.tipo} non registrato:`, err?.message);
  }
}
