// =============================================================================
// EDG Vehicle Service - Cron Jobs
// Eseguito all'avvio del servizio. Schedula task periodici.
//
// Job attivi:
//   - dailyStatusCheck: ogni giorno alle 06:00
//     1. Aggiorna status vehicle_deadlines
//     2. Aggiorna status driver_compliances
//     3. Crea notifiche per status cambiati (expiring/expired)
// =============================================================================
import cron from 'node-cron';
import { Op } from 'sequelize';
import {
  VehicleDeadline,
  DeadlineType,
  Vehicle,
  DriverCompliance,
  DriverComplianceType,
  Driver,
  Notification,
} from '../models';
import { computeDeadlineStatus, computeComplianceStatus, statusToSeverity, statusLabel } from './statusChecker';

// ─── Utility ──────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[CRON][${new Date().toISOString()}] ${msg}`);
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Aggiornamento scadenze veicoli ─────────────────────────────────────

async function updateVehicleDeadlines(): Promise<{ updated: number; notified: number }> {
  let updated = 0;
  let notified = 0;

  const deadlines = await VehicleDeadline.findAll({
    include: [
      {
        model: DeadlineType,
        as: 'deadlineType',
        attributes: ['id', 'name', 'label', 'alertDays1', 'alertDays2', 'alertDays3'],
      },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate'] },
    ],
  });

  for (const deadline of deadlines) {
    const dt = deadline.deadlineType as DeadlineType;
    if (!dt) continue;

    const newStatus = computeDeadlineStatus(deadline.expiryDate, dt.alertDays2);
    const oldStatus = deadline.status;

    // Aggiorna solo se lo status è cambiato
    if (newStatus !== oldStatus) {
      await deadline.update({ status: newStatus });
      updated++;

      log(
        `VehicleDeadline #${deadline.id}: ${oldStatus} → ${newStatus} (scadenza: ${deadline.expiryDate.toISOString().substring(0, 10)})`
      );

      // Crea notifica solo per transizioni a expiring o expired
      if (newStatus === 'expiring' || newStatus === 'expired') {
        const vehicle = deadline.vehicle as Vehicle;
        const days = daysUntil(deadline.expiryDate);
        const daysText = newStatus === 'expired' ? `scaduta da ${Math.abs(days)} giorni` : `scade tra ${days} giorni`;

        await Notification.create({
          vehicleId: deadline.vehicleId,
          driverId: null,
          entityType: 'vehicle_deadline',
          entityId: deadline.id,
          type: 'deadline',
          severity: statusToSeverity(newStatus),
          title: `${statusLabel(newStatus)} — ${dt.label || dt.name}`,
          message: `Scadenza "${dt.label || dt.name}" del veicolo ${vehicle?.plate ?? `#${deadline.vehicleId}`} ${daysText}.`,
          isRead: false,
          isArchived: false,
          emailSent: false,
        });
        notified++;
      }
    }
  }

  return { updated, notified };
}

// ─── Aggiornamento conformità autisti ───────────────────────────────────

async function updateDriverCompliances(): Promise<{ updated: number; notified: number }> {
  let updated = 0;
  let notified = 0;

  // Solo conformità che hanno una scadenza (not_applicable escluso)
  const compliances = await DriverCompliance.findAll({
    where: {
      status: { [Op.not]: 'not_applicable' },
      expiresAt: { [Op.not]: null },
    },
    include: [
      {
        model: DriverComplianceType,
        as: 'complianceType',
        attributes: ['id', 'name', 'label', 'alertDays1', 'alertDays2', 'alertDays3', 'hasExpiry'],
      },
      { model: Driver, as: 'driver', attributes: ['id', 'firstName', 'lastName'] },
    ],
  });

  for (const compliance of compliances) {
    const ct = compliance.complianceType as DriverComplianceType;
    if (!ct || !ct.hasExpiry) continue;

    const newStatus = computeComplianceStatus(compliance.expiresAt, ct.alertDays2);
    const oldStatus = compliance.status;

    if (newStatus !== oldStatus) {
      await compliance.update({ status: newStatus });
      updated++;

      log(
        `DriverCompliance #${compliance.id}: ${oldStatus} → ${newStatus} (scadenza: ${compliance.expiresAt!.toISOString().substring(0, 10)})`
      );

      if (newStatus === 'expiring' || newStatus === 'expired') {
        const driver = compliance.driver as Driver;
        const days = daysUntil(compliance.expiresAt!);
        const daysText = newStatus === 'expired' ? `scaduta da ${Math.abs(days)} giorni` : `scade tra ${days} giorni`;
        const driverName = driver ? `${driver.firstName} ${driver.lastName}` : `#${compliance.driverId}`;

        await Notification.create({
          vehicleId: null,
          driverId: compliance.driverId,
          entityType: 'driver_compliance',
          entityId: compliance.id,
          type: 'driver_compliance',
          severity: statusToSeverity(newStatus),
          title: `${statusLabel(newStatus)} — ${ct.label || ct.name}`,
          message: `Conformità "${ct.label || ct.name}" dell'autista ${driverName} ${daysText}.`,
          isRead: false,
          isArchived: false,
          emailSent: false,
        });
        notified++;
      }
    }
  }

  return { updated, notified };
}

// ─── Job principale ──────────────────────────────────────────────────────

async function runDailyStatusCheck(): Promise<void> {
  log('=== Avvio daily status check ===');

  try {
    const deadlineResult = await updateVehicleDeadlines();
    log(`VehicleDeadlines: ${deadlineResult.updated} aggiornate, ${deadlineResult.notified} notifiche create`);

    const complianceResult = await updateDriverCompliances();
    log(`DriverCompliances: ${complianceResult.updated} aggiornate, ${complianceResult.notified} notifiche create`);

    log(
      `=== Daily status check completato. Totale: ${deadlineResult.updated + complianceResult.updated} aggiornamenti, ${deadlineResult.notified + complianceResult.notified} notifiche ===`
    );
  } catch (err) {
    console.error('[CRON][ERROR] Errore durante il daily status check:', err);
  }
}

// ─── Registrazione job ───────────────────────────────────────────────────

export function startCronJobs(): void {
  // Ogni giorno alle 06:00
  // Formato: secondi minuti ore giorno mese giorno_settimana
  cron.schedule('0 0 6 * * *', runDailyStatusCheck, {
    scheduled: true,
    timezone: process.env.TZ || 'Europe/Rome',
  });

  log('Cron job "dailyStatusCheck" registrato — esecuzione ogni giorno alle 06:00 (Europe/Rome)');

  // Esegui subito all'avvio in modo da allineare lo stato immediatamente
  // (utile dopo un restart del servizio)
  if (process.env.CRON_RUN_ON_START === 'true') {
    log('CRON_RUN_ON_START=true → esecuzione immediata del daily status check');
    runDailyStatusCheck();
  }
}
