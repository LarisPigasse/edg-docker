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

export function computeScheduleStatus(params: {
  nextDate: Date | null;
  alertDaysBefore: number | null;
  nextKm: number | null;
  alertKmBefore: number | null;
  currentKm: number;
}): 'ok' | 'warning' | 'overdue' {
  const { nextDate, alertDaysBefore, nextKm, alertKmBefore, currentKm } = params;

  let dateStatus: 'ok' | 'warning' | 'overdue' = 'ok';
  if (nextDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(nextDate);
    next.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) dateStatus = 'overdue';
    else if (alertDaysBefore != null && daysLeft <= alertDaysBefore) dateStatus = 'warning';
  }

  let kmStatus: 'ok' | 'warning' | 'overdue' = 'ok';
  if (nextKm != null) {
    const kmLeft = nextKm - currentKm;
    if (kmLeft < 0) kmStatus = 'overdue';
    else if (alertKmBefore != null && kmLeft <= alertKmBefore) kmStatus = 'warning';
  }

  if (dateStatus === 'overdue' || kmStatus === 'overdue') return 'overdue';
  if (dateStatus === 'warning' || kmStatus === 'warning') return 'warning';
  return 'ok';
}

// ─────────────────────────────────────────────────────────────────────────────
// Cascata di avvisi — 7 tappe simmetriche attorno alla scadenza (giorni) o
// 5 tappe attorno al superamento soglia (km). Calcolo indipendente da status:
// decide "quando mandare un promemoria", non "che colore ha il badge".
// ─────────────────────────────────────────────────────────────────────────────

export type AlertTier = -3 | -2 | -1 | 0 | 1 | 2 | 3;

/**
 * Tappa della cascata a giorni. alertDays1/alertDays3 possono essere null
 * (soglie non configurate) — la cascata degrada automaticamente a 3 sole
 * tappe (-2, 0, +2) usando solo alertDays2, se le altre due mancano.
 * alertDays2 null → nessuna cascata a giorni possibile (torna sempre null).
 */
export function computeDayAlertTier(
  daysLeft: number,
  alertDays1: number | null,
  alertDays2: number | null,
  alertDays3: number | null
): AlertTier | null {
  if (alertDays2 === null) return null;

  if (daysLeft >= 0) {
    if (alertDays3 !== null && daysLeft <= alertDays3) return -1;
    if (daysLeft <= alertDays2) return -2;
    if (alertDays1 !== null && daysLeft <= alertDays1) return -3;
    return null;
  }

  const daysPast = -daysLeft;
  if (alertDays1 !== null && daysPast >= alertDays1) return 3;
  if (daysPast >= alertDays2) return 2;
  if (alertDays3 !== null && daysPast >= alertDays3) return 1;
  return 0;
}

/**
 * Tappa della cascata a km — un'unica soglia, usata anche come passo per
 * le tre ripetizioni dopo il superamento (x1, x2, x3).
 */
export function computeKmAlertTier(kmLeft: number, alertKmBefore: number | null): AlertTier | null {
  if (alertKmBefore === null) return null;

  if (kmLeft >= 0) {
    if (kmLeft <= alertKmBefore) return -1;
    return null;
  }

  const kmPast = -kmLeft;
  if (kmPast >= 3 * alertKmBefore) return 3;
  if (kmPast >= 2 * alertKmBefore) return 2;
  if (kmPast >= alertKmBefore) return 1;
  return 0;
}

/** true se currentTier è una tappa più avanti nella cascata rispetto all'ultima notificata */
export function isNewAlertTier(currentTier: AlertTier | null, lastTier: number | null): boolean {
  if (currentTier === null) return false;
  return lastTier === null || currentTier > lastTier;
}

export function alertTierLabel(tier: AlertTier): string {
  switch (tier) {
    case -3:
      return 'Primo avviso';
    case -2:
      return 'Avviso';
    case -1:
      return 'Ultimo avviso prima della scadenza';
    case 0:
      return 'Scaduta';
    case 1:
      return 'Sollecito';
    case 2:
      return 'Secondo sollecito';
    case 3:
      return 'Ultimo sollecito';
  }
}

export function alertTierSeverity(tier: AlertTier): 'info' | 'warning' | 'critical' {
  return tier < 0 ? 'warning' : 'critical';
}
