// =============================================================================
// Client verso email-service (ADR089)
// =============================================================================
// email-service sta solo sulla rete interna. 8192 ms al massimo: l'SMTP può
// essere lento. Lancia un errore se l'invio non riesce.
// =============================================================================

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';
const TIMEOUT_MS = 8192;

export interface EmailDaInviare {
  to: string;
  subject: string;
  template: 'vigilo/pronto-cliente' | 'vigilo/pronto-edg';
  data: Record<string, unknown>;
  replyTo?: string;
}

export async function inviaEmail(email: EmailDaInviare): Promise<void> {
  const res = await fetch(`${EMAIL_SERVICE_URL}/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const corpo = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(corpo?.error ?? `email-service ha risposto ${res.status}`);
  }
}
