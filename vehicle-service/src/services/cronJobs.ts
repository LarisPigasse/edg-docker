// =============================================================================
// EDG Vehicle Service - Cron Jobs
// Eseguito all'avvio del servizio. Schedula task periodici.
//
// Job attivi:
//   - dailyStatusCheck: ogni giorno alle 06:00
//     1. Aggiorna status (vehicle_deadlines / driver_compliances / maintenance_schedules)
//     2. Genera notifiche lungo la cascata di avvisi a soglie (non più solo
//        al cambio di stato) — vedi statusChecker.ts per il disegno completo
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
  MaintenanceSchedule,
  MaintenanceType,
} from '../models';
import {
  computeDeadlineStatus,
  computeComplianceStatus,
  computeScheduleStatus,
  computeDayAlertTier,
  computeKmAlertTier,
  isNewAlertTier,
  alertTierLabel,
  alertTierSeverity,
  type AlertTier,
} from './statusChecker';
import { sendAlertEmails } from './emailNotifier';

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

/** Testo del messaggio per la cascata a giorni — il "quale tappa" lo dice già il titolo (alertTierLabel) */
function formatDayAlertMessage(tier: AlertTier, daysLeft: number): string {
  if (tier < 0) return `scade tra ${daysLeft} ${daysLeft === 1 ? 'giorno' : 'giorni'}`;
  const daysPast = -daysLeft;
  if (tier === 0) return daysPast <= 0 ? 'scade oggi' : `scaduta da ${daysPast} ${daysPast === 1 ? 'giorno' : 'giorni'}`;
  return `scaduta da ${daysPast} giorni`;
}

/** Stesso concetto per la cascata a km */
function formatKmAlertMessage(tier: AlertTier, kmLeft: number, currentKm: number): string {
  if (tier < 0) return `previsto tra ${kmLeft.toLocaleString('it-IT')} km (attuali: ${currentKm.toLocaleString('it-IT')} km)`;
  const kmPast = -kmLeft;
  return `superato di ${kmPast.toLocaleString('it-IT')} km (attuali: ${currentKm.toLocaleString('it-IT')} km)`;
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
    const vehicle = deadline.vehicle as Vehicle;
    if (!dt || !vehicle) continue;

    const daysLeft = daysUntil(deadline.expiryDate);
    const newStatus = computeDeadlineStatus(deadline.expiryDate, dt.alertDays2);
    const oldStatus = deadline.status;
    const statusChanged = newStatus !== oldStatus;

    const currentTier = computeDayAlertTier(daysLeft, dt.alertDays1, dt.alertDays2, dt.alertDays3);
    const shouldNotify = isNewAlertTier(currentTier, deadline.lastAlertOffset);

    if (statusChanged || shouldNotify) {
      await deadline.update({
        ...(statusChanged ? { status: newStatus } : {}),
        ...(shouldNotify ? { lastAlertOffset: currentTier } : {}),
      });
    }

    if (statusChanged) {
      updated++;
      log(
        `VehicleDeadline #${deadline.id}: ${oldStatus} → ${newStatus} (scadenza: ${deadline.expiryDate.toISOString().substring(0, 10)})`
      );
    }

    if (shouldNotify && currentTier !== null) {
      const tierLabel = alertTierLabel(currentTier);
      const title = `${tierLabel} — ${dt.label || dt.name}`;
      const message = `Scadenza "${dt.label || dt.name}" del veicolo ${vehicle.plate ?? `#${deadline.vehicleId}`} ${formatDayAlertMessage(currentTier, daysLeft)}.`;
      const severity = alertTierSeverity(currentTier);

      const notification = await Notification.create({
        vehicleId: deadline.vehicleId,
        driverId: null,
        entityType: 'vehicle_deadline',
        entityId: deadline.id,
        type: 'deadline',
        severity,
        title,
        message,
        isRead: false,
        isArchived: false,
        emailSent: false,
      });
      notified++;
      log(`VehicleDeadline #${deadline.id}: notifica tappa ${currentTier} (${tierLabel})`);

      const emailsSent = await sendAlertEmails({
        kind: 'deadline',
        typeId: deadline.deadlineTypeId,
        title,
        message,
        severity,
        notificationId: notification.id,
      });
      if (emailsSent > 0) await notification.update({ emailSent: true, emailSentAt: new Date() });
    }
  }

  return { updated, notified };
}

// ─── Aggiornamento conformità autisti ───────────────────────────────────

async function updateDriverCompliances(): Promise<{ updated: number; notified: number }> {
  let updated = 0;
  let notified = 0;

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
      { model: Driver, as: 'driver', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  for (const compliance of compliances) {
    const ct = compliance.complianceType as DriverComplianceType;
    if (!ct || !ct.hasExpiry) continue;

    const daysLeft = daysUntil(compliance.expiresAt!);
    const newStatus = computeComplianceStatus(compliance.expiresAt, ct.alertDays2);
    const oldStatus = compliance.status;
    const statusChanged = newStatus !== oldStatus;

    const currentTier = computeDayAlertTier(daysLeft, ct.alertDays1, ct.alertDays2, ct.alertDays3);
    const shouldNotify = isNewAlertTier(currentTier, compliance.lastAlertOffset);

    if (statusChanged || shouldNotify) {
      await compliance.update({
        ...(statusChanged ? { status: newStatus } : {}),
        ...(shouldNotify ? { lastAlertOffset: currentTier } : {}),
      });
    }

    if (statusChanged) {
      updated++;
      log(
        `DriverCompliance #${compliance.id}: ${oldStatus} → ${newStatus} (scadenza: ${compliance.expiresAt!.toISOString().substring(0, 10)})`
      );
    }

    if (shouldNotify && currentTier !== null) {
      const driver = compliance.driver as Driver;
      const driverName = driver ? `${driver.firstName} ${driver.lastName}` : `#${compliance.driverId}`;
      const tierLabel = alertTierLabel(currentTier);
      const title = `${tierLabel} — ${ct.label || ct.name}`;
      const message = `Conformità "${ct.label || ct.name}" dell'autista ${driverName} ${formatDayAlertMessage(currentTier, daysLeft)}.`;
      const severity = alertTierSeverity(currentTier);

      const notification = await Notification.create({
        vehicleId: null,
        driverId: compliance.driverId,
        entityType: 'driver_compliance',
        entityId: compliance.id,
        type: 'driver_compliance',
        severity,
        title,
        message,
        isRead: false,
        isArchived: false,
        emailSent: false,
      });
      notified++;
      log(`DriverCompliance #${compliance.id}: notifica tappa ${currentTier} (${tierLabel})`);

      const emailsSent = await sendAlertEmails({
        kind: 'compliance',
        typeId: compliance.typeId,
        title,
        message,
        severity,
        notificationId: notification.id,
        extraRecipient: driver?.email ? { email: driver.email, name: `${driver.firstName} ${driver.lastName}` } : null,
      });
      if (emailsSent > 0) await notification.update({ emailSent: true, emailSentAt: new Date() });
    }
  }

  return { updated, notified };
}

// ─── Aggiornamento programmazione manutenzioni ──────────────────────────

async function updateMaintenanceSchedules(): Promise<{ updated: number; notified: number }> {
  let updated = 0;
  let notified = 0;

  // 'suspended' è una scelta manuale — il cron non deve mai toccarla
  const schedules = await MaintenanceSchedule.findAll({
    where: { status: { [Op.not]: 'suspended' } },
    include: [
      {
        model: MaintenanceType,
        as: 'maintenanceType',
        attributes: ['id', 'name', 'label', 'alertKmBefore', 'alertDays1', 'alertDays2', 'alertDays3'],
      },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'brand', 'model', 'plate', 'currentKm'] },
    ],
  });

  for (const schedule of schedules) {
    const mt = schedule.maintenanceType as MaintenanceType;
    const vehicle = schedule.vehicle as Vehicle;
    if (!mt || !vehicle) continue;

    const newStatus = computeScheduleStatus({
      nextDate: schedule.nextDate,
      alertDaysBefore: mt.alertDays2,
      nextKm: schedule.nextKm,
      alertKmBefore: mt.alertKmBefore,
      currentKm: vehicle.currentKm,
    });
    const oldStatus = schedule.status;
    const statusChanged = newStatus !== oldStatus;

    // Cascata a giorni e cascata a km sono indipendenti — una manutenzione
    // tracciata su entrambe le dimensioni può generare due notifiche distinte
    // nello stesso giro, se entrambe superano una soglia insieme.
    let dayTier: AlertTier | null = null;
    let daysLeft = 0;
    if (schedule.nextDate) {
      daysLeft = daysUntil(schedule.nextDate);
      dayTier = computeDayAlertTier(daysLeft, mt.alertDays1, mt.alertDays2, mt.alertDays3);
    }
    const shouldNotifyDays = isNewAlertTier(dayTier, schedule.lastAlertDaysOffset);

    let kmTier: AlertTier | null = null;
    let kmLeft = 0;
    if (schedule.nextKm != null) {
      kmLeft = schedule.nextKm - vehicle.currentKm;
      kmTier = computeKmAlertTier(kmLeft, mt.alertKmBefore);
    }
    const shouldNotifyKm = isNewAlertTier(kmTier, schedule.lastAlertKmOffset);

    if (statusChanged || shouldNotifyDays || shouldNotifyKm) {
      await schedule.update({
        ...(statusChanged ? { status: newStatus } : {}),
        ...(shouldNotifyDays ? { lastAlertDaysOffset: dayTier } : {}),
        ...(shouldNotifyKm ? { lastAlertKmOffset: kmTier } : {}),
      });
    }

    if (statusChanged) {
      updated++;
      log(`MaintenanceSchedule #${schedule.id}: ${oldStatus} → ${newStatus}`);
    }

    if (shouldNotifyDays && dayTier !== null) {
      const tierLabel = alertTierLabel(dayTier);
      const title = `${tierLabel} — ${mt.label || mt.name}`;
      const message = `Manutenzione "${mt.label || mt.name}" del veicolo ${vehicle.plate ?? `#${schedule.vehicleId}`} ${formatDayAlertMessage(dayTier, daysLeft)}.`;
      const severity = alertTierSeverity(dayTier);

      const notification = await Notification.create({
        vehicleId: schedule.vehicleId,
        driverId: null,
        entityType: 'maintenance_schedule',
        entityId: schedule.id,
        type: 'maintenance',
        severity,
        title,
        message,
        isRead: false,
        isArchived: false,
        emailSent: false,
      });
      notified++;
      log(`MaintenanceSchedule #${schedule.id}: notifica giorni tappa ${dayTier} (${tierLabel})`);

      const emailsSent = await sendAlertEmails({
        kind: 'maintenance',
        typeId: schedule.maintenanceTypeId,
        title,
        message,
        severity,
        notificationId: notification.id,
      });
      if (emailsSent > 0) await notification.update({ emailSent: true, emailSentAt: new Date() });
    }

    if (shouldNotifyKm && kmTier !== null) {
      const tierLabel = alertTierLabel(kmTier);
      const title = `${tierLabel} (km) — ${mt.label || mt.name}`;
      const message = `Manutenzione "${mt.label || mt.name}" del veicolo ${vehicle.plate ?? `#${schedule.vehicleId}`} ${formatKmAlertMessage(kmTier, kmLeft, vehicle.currentKm)}.`;
      const severity = alertTierSeverity(kmTier);

      const notification = await Notification.create({
        vehicleId: schedule.vehicleId,
        driverId: null,
        entityType: 'maintenance_schedule',
        entityId: schedule.id,
        type: 'maintenance',
        severity,
        title,
        message,
        isRead: false,
        isArchived: false,
        emailSent: false,
      });
      notified++;
      log(`MaintenanceSchedule #${schedule.id}: notifica km tappa ${kmTier} (${tierLabel})`);

      const emailsSent = await sendAlertEmails({
        kind: 'maintenance',
        typeId: schedule.maintenanceTypeId,
        title,
        message,
        severity,
        notificationId: notification.id,
      });
      if (emailsSent > 0) await notification.update({ emailSent: true, emailSentAt: new Date() });
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

    const scheduleResult = await updateMaintenanceSchedules();
    log(`MaintenanceSchedules: ${scheduleResult.updated} aggiornate, ${scheduleResult.notified} notifiche create`);

    log(
      `=== Daily status check completato. Totale: ${deadlineResult.updated + complianceResult.updated + scheduleResult.updated} aggiornamenti, ${deadlineResult.notified + complianceResult.notified + scheduleResult.notified} notifiche ===`
    );
  } catch (err) {
    console.error('[CRON][ERROR] Errore durante il daily status check:', err);
  }
}

// ─── Registrazione job ───────────────────────────────────────────────────

export function startCronJobs(): void {
  cron.schedule('0 0 6 * * *', runDailyStatusCheck, {
    scheduled: true,
    timezone: process.env.TZ || 'Europe/Rome',
  });

  log('Cron job "dailyStatusCheck" registrato — esecuzione ogni giorno alle 06:00 (Europe/Rome)');

  if (process.env.CRON_RUN_ON_START === 'true') {
    log('CRON_RUN_ON_START=true → esecuzione immediata del daily status check');
    runDailyStatusCheck();
  }
}
