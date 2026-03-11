// =============================================================================
// EDG Vehicle Service - Status Checker
// Logica di calcolo status per scadenze e conformità.
// Usata sia dal cron job che dai controller al momento della creazione/rinnovo.
// =============================================================================

export type DeadlineStatus = 'valid' | 'expiring' | 'expired';
export type ComplianceStatus = 'valid' | 'expiring' | 'expired' | 'not_applicable';

/**
 * Calcola lo status di una scadenza in base alla data di scadenza
 * e alle soglie di allerta del tipo di scadenza.
 *
 * @param expiryDate  - Data di scadenza
 * @param alertDays2  - Soglia "expiring" in giorni (es: 30)
 * @returns 'expired' | 'expiring' | 'valid'
 */
export function computeDeadlineStatus(expiryDate: Date, alertDays2: number): DeadlineStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 'expired';
  if (daysLeft <= alertDays2) return 'expiring';
  return 'valid';
}

/**
 * Calcola lo status di una conformità autista.
 * Se expiresAt è null → 'valid' (conformità permanente / non applicabile al rinnovo).
 */
export function computeComplianceStatus(expiresAt: Date | null, alertDays2: number): DeadlineStatus {
  if (!expiresAt) return 'valid';
  return computeDeadlineStatus(expiresAt, alertDays2);
}

/**
 * Ritorna una label leggibile per i messaggi di notifica.
 */
export function statusLabel(status: DeadlineStatus): string {
  switch (status) {
    case 'expired':
      return 'SCADUTA';
    case 'expiring':
      return 'IN SCADENZA';
    default:
      return 'VALIDA';
  }
}

/**
 * Mappa status → severity notifica
 */
export function statusToSeverity(status: DeadlineStatus): 'info' | 'warning' | 'critical' {
  switch (status) {
    case 'expired':
      return 'critical';
    case 'expiring':
      return 'warning';
    default:
      return 'info';
  }
}
