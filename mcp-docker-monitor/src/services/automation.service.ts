import Docker from 'dockerode';
import * as cron from 'node-cron';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { writeFile, stat, readdir } from 'fs/promises';
import { ensureDir, remove } from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const docker = new Docker();

/**
 * Automation Service
 * Gestisce backup, auto-healing, monitoring e alert intelligenti
 */

// ============================================
// TYPES & INTERFACES
// ============================================

enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

interface Alert {
  timestamp: Date;
  level: AlertLevel;
  category: string;
  message: string;
  containerId?: string;
  containerName?: string;
  value?: number;
  threshold?: number;
}

interface ThresholdConfig {
  cpuWarning: number;
  cpuCritical: number;
  memoryWarning: number;
  memoryCritical: number;
  unhealthyContainersWarning: number;
  unhealthyContainersCritical: number;
}

// ============================================
// GLOBAL STATE
// ============================================

const alertHistory: Alert[] = [];
let autoHealingTask: cron.ScheduledTask | null = null;
let autoHealingStats = {
  enabled: false,
  startedAt: null as Date | null,
  checksPerformed: 0,
  containersRestarted: 0,
  alertsSent: 0,
};

const defaultThresholds: ThresholdConfig = {
  cpuWarning: 80,
  cpuCritical: 95,
  memoryWarning: 85,
  memoryCritical: 95,
  unhealthyContainersWarning: 1,
  unhealthyContainersCritical: 3,
};

let currentThresholds = { ...defaultThresholds };

// Path configurabile tramite variabile d'ambiente
const BACKUP_DIR = process.env.BACKUP_DIR || 'd:/sviluppo/claude/backups';

// Verifica che la directory esista all'avvio
if (!existsSync(BACKUP_DIR)) {
  console.warn(`   Backup directory not found: ${BACKUP_DIR}`);
  console.warn(`   Creating directory...`);
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================
// ALERT SYSTEM
// ============================================

async function createAlert(level: AlertLevel, category: string, message: string, metadata?: Partial<Alert>): Promise<void> {
  const alert: Alert = {
    timestamp: new Date(),
    level,
    category,
    message,
    ...metadata,
  };

  alertHistory.push(alert);

  // Keep only last 1000 alerts
  if (alertHistory.length > 1000) {
    alertHistory.shift();
  }

  // Log to console with emoji
  const emoji = level === AlertLevel.CRITICAL ? '🚨' : level === AlertLevel.WARNING ? '⚠️' : 'ℹ️';
  console.error(`${emoji} [${level.toUpperCase()}] ${category}: ${message}`);

  // Send email for CRITICAL alerts
  if (level === AlertLevel.CRITICAL) {
    try {
      const { sendAlert } = await import('./email.service.js');
      await sendAlert(`CRITICAL: ${category}`, message);
      autoHealingStats.alertsSent++;
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
}

// ============================================
// BACKUP FUNCTIONS
// ============================================

/**
 * Backup MySQL database
 */
export async function backupMySQL(containerName: string = 'auth-mysql', databaseName: string = 'edg_auth'): Promise<string> {
  try {
    const startTime = Date.now();
    await ensureDir(BACKUP_DIR);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mysql_${databaseName}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    let output = `=== MySQL Backup ===\n\n`;
    output += `Database: ${databaseName}\n`;
    output += `Container: ${containerName}\n`;
    output += `File: ${filename}\n\n`;

    // Execute mysqldump inside container
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `mysqldump -u root -p\${MYSQL_ROOT_PASSWORD} ${databaseName}`],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', async () => {
        try {
          const sqlData = Buffer.concat(chunks).toString('utf8');

          // Check if backup has data
          if (sqlData.length < 100) {
            throw new Error('Backup file too small - likely failed');
          }

          await writeFile(filepath, sqlData);

          const stats = await stat(filepath);
          const duration = Date.now() - startTime;

          output += `✅ Backup completed\n`;
          output += `   Size: ${formatBytes(stats.size)}\n`;
          output += `   Duration: ${(duration / 1000).toFixed(2)}s\n`;
          output += `   Path: ${filepath}\n`;

          await createAlert(AlertLevel.INFO, 'Backup', `MySQL backup completed: ${filename} (${formatBytes(stats.size)})`);

          resolve(output);
        } catch (error: any) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  } catch (error: any) {
    await createAlert(AlertLevel.CRITICAL, 'Backup', `MySQL backup failed: ${error.message}`, { containerId: containerName });
    return `❌ MySQL backup failed: ${error.message}`;
  }
}

/**
 * Backup MongoDB database
 */
export async function backupMongoDB(containerName: string = 'log-mongo', databaseName: string = 'edg_logs'): Promise<string> {
  try {
    const startTime = Date.now();
    await ensureDir(BACKUP_DIR);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mongo_${databaseName}_${timestamp}.archive`;
    const filepath = path.join(BACKUP_DIR, filename);

    let output = `=== MongoDB Backup ===\n\n`;
    output += `Database: ${databaseName}\n`;
    output += `Container: ${containerName}\n`;
    output += `File: ${filename}\n\n`;

    // Execute mongodump with archive output
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: ['mongodump', '--db', databaseName, '--archive'],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', async () => {
        try {
          const archiveData = Buffer.concat(chunks);

          if (archiveData.length < 100) {
            throw new Error('Archive too small - likely failed');
          }

          await writeFile(filepath, archiveData);

          const stats = await stat(filepath);
          const duration = Date.now() - startTime;

          output += `✅ Backup completed\n`;
          output += `   Size: ${formatBytes(stats.size)}\n`;
          output += `   Duration: ${(duration / 1000).toFixed(2)}s\n`;
          output += `   Path: ${filepath}\n`;

          await createAlert(AlertLevel.INFO, 'Backup', `MongoDB backup completed: ${filename} (${formatBytes(stats.size)})`);

          resolve(output);
        } catch (error: any) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  } catch (error: any) {
    await createAlert(AlertLevel.CRITICAL, 'Backup', `MongoDB backup failed: ${error.message}`, { containerId: containerName });
    return `❌ MongoDB backup failed: ${error.message}`;
  }
}

/**
 * Backup Docker volumes (snapshot)
 */
export async function backupDockerVolumes(volumeNames?: string[]): Promise<string> {
  try {
    const startTime = Date.now();
    await ensureDir(BACKUP_DIR);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    let output = `=== Docker Volumes Backup ===\n\n`;

    // Get volumes to backup
    const volumesData = await docker.listVolumes();
    const allVolumes = volumesData.Volumes || [];

    const targetVolumes = volumeNames
      ? allVolumes.filter(v => volumeNames.includes(v.Name))
      : allVolumes.filter(v => v.Labels && v.Labels['com.docker.compose.project'] === 'edg-docker');

    if (targetVolumes.length === 0) {
      output += '⚠️  No volumes to backup\n';
      return output;
    }

    output += `Volumes to backup: ${targetVolumes.length}\n\n`;

    const backedUp: string[] = [];
    let totalSize = 0;

    for (const vol of targetVolumes) {
      try {
        const filename = `volume_${vol.Name}_${timestamp}.tar`;
        const filepath = path.join(BACKUP_DIR, filename);

        // Create temporary container to access volume
        const container = await docker.createContainer({
          Image: 'alpine:latest',
          Cmd: ['tail', '-f', '/dev/null'],
          HostConfig: {
            Binds: [`${vol.Name}:/volume:ro`],
          },
        });

        await container.start();

        // Create tar archive of volume
        const tarStream = await container.getArchive({ path: '/volume' });
        const writeStream = createWriteStream(filepath);

        tarStream.pipe(writeStream);

        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', reject);
        });

        await container.stop();
        await container.remove();

        const stats = await stat(filepath);
        totalSize += stats.size;
        backedUp.push(vol.Name);

        output += `✅ ${vol.Name}: ${formatBytes(stats.size)}\n`;
      } catch (error: any) {
        output += `❌ ${vol.Name}: ${error.message}\n`;
      }
    }

    const duration = Date.now() - startTime;

    output += `\n=== Summary ===\n`;
    output += `Backed up: ${backedUp.length}/${targetVolumes.length}\n`;
    output += `Total size: ${formatBytes(totalSize)}\n`;
    output += `Duration: ${(duration / 1000).toFixed(2)}s\n`;

    await createAlert(
      AlertLevel.INFO,
      'Backup',
      `Volumes backup completed: ${backedUp.length} volumes, ${formatBytes(totalSize)}`
    );

    return output;
  } catch (error: any) {
    await createAlert(AlertLevel.CRITICAL, 'Backup', `Volumes backup failed: ${error.message}`);
    return `❌ Volumes backup failed: ${error.message}`;
  }
}

/**
 * Backup completo sistema (MySQL + MongoDB + Volumes)
 */
export async function backupAll(): Promise<string> {
  try {
    const startTime = Date.now();

    let output = `=== FULL SYSTEM BACKUP ===\n`;
    output += `Started: ${new Date().toLocaleString()}\n\n`;

    // MySQL backup
    output += '🗄️  Backing up MySQL...\n';
    const mysqlResult = await backupMySQL();
    output += mysqlResult + '\n';

    // MongoDB backup
    output += '🗄️  Backing up MongoDB...\n';
    const mongoResult = await backupMongoDB();
    output += mongoResult + '\n';

    // Volumes backup
    output += '📦 Backing up volumes...\n';
    const volumesResult = await backupDockerVolumes();
    output += volumesResult + '\n';

    const duration = Date.now() - startTime;

    output += `\n=== FULL BACKUP COMPLETED ===\n`;
    output += `Total duration: ${(duration / 1000).toFixed(2)}s\n`;

    await createAlert(AlertLevel.INFO, 'Backup', `Full system backup completed in ${(duration / 1000).toFixed(2)}s`);

    return output;
  } catch (error: any) {
    await createAlert(AlertLevel.CRITICAL, 'Backup', `Full backup failed: ${error.message}`);
    return `❌ Full backup failed: ${error.message}`;
  }
}

/**
 * Lista backup disponibili
 */
export async function listBackups(): Promise<string> {
  try {
    await ensureDir(BACKUP_DIR);

    const files = await readdir(BACKUP_DIR);

    if (files.length === 0) {
      return '📦 No backups found';
    }

    let output = `=== Available Backups ===\n`;
    output += `Location: ${BACKUP_DIR}\n`;
    output += `Total: ${files.length} files\n\n`;

    const backups: { name: string; size: number; date: Date }[] = [];

    for (const file of files) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await stat(filepath);
      backups.push({
        name: file,
        size: stats.size,
        date: stats.mtime,
      });
    }

    // Sort by date (newest first)
    backups.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Group by type
    const mysql = backups.filter(b => b.name.startsWith('mysql_'));
    const mongo = backups.filter(b => b.name.startsWith('mongo_'));
    const volumes = backups.filter(b => b.name.startsWith('volume_'));

    if (mysql.length > 0) {
      output += `📊 MySQL Backups (${mysql.length}):\n`;
      mysql.slice(0, 5).forEach(b => {
        output += `   ${b.name} - ${formatBytes(b.size)} - ${b.date.toLocaleString()}\n`;
      });
      if (mysql.length > 5) output += `   ... and ${mysql.length - 5} more\n`;
      output += '\n';
    }

    if (mongo.length > 0) {
      output += `📊 MongoDB Backups (${mongo.length}):\n`;
      mongo.slice(0, 5).forEach(b => {
        output += `   ${b.name} - ${formatBytes(b.size)} - ${b.date.toLocaleString()}\n`;
      });
      if (mongo.length > 5) output += `   ... and ${mongo.length - 5} more\n`;
      output += '\n';
    }

    if (volumes.length > 0) {
      output += `📦 Volume Backups (${volumes.length}):\n`;
      volumes.slice(0, 5).forEach(b => {
        output += `   ${b.name} - ${formatBytes(b.size)} - ${b.date.toLocaleString()}\n`;
      });
      if (volumes.length > 5) output += `   ... and ${volumes.length - 5} more\n`;
    }

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    output += `\nTotal backup size: ${formatBytes(totalSize)}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error listing backups: ${error.message}`;
  }
}

/**
 * Pulizia backup vecchi (retention policy)
 */
export async function cleanupOldBackups(retentionDays: number = 30): Promise<string> {
  try {
    await ensureDir(BACKUP_DIR);

    const files = await readdir(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let output = `=== Cleanup Old Backups ===\n`;
    output += `Retention: ${retentionDays} days\n`;
    output += `Cutoff date: ${cutoffDate.toLocaleString()}\n\n`;

    let removed = 0;
    let reclaimedSpace = 0;

    for (const file of files) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await stat(filepath);

      if (stats.mtime < cutoffDate) {
        await remove(filepath);
        removed++;
        reclaimedSpace += stats.size;
        output += `🗑️  Removed: ${file} (${formatBytes(stats.size)})\n`;
      }
    }

    output += `\n=== Summary ===\n`;
    output += `Removed: ${removed} files\n`;
    output += `Space reclaimed: ${formatBytes(reclaimedSpace)}\n`;

    if (removed > 0) {
      await createAlert(
        AlertLevel.INFO,
        'Backup',
        `Cleanup: removed ${removed} old backups, reclaimed ${formatBytes(reclaimedSpace)}`
      );
    }

    return output;
  } catch (error: any) {
    return `❌ Error cleaning up backups: ${error.message}`;
  }
}

// ============================================
// AUTO-HEALING FUNCTIONS
// ============================================

/**
 * Auto-healing monitor (esegue periodicamente)
 */
async function autoHealingCheck(): Promise<void> {
  try {
    autoHealingStats.checksPerformed++;

    const containers = await docker.listContainers();

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      const info = await container.inspect();
      const name = info.Name.replace('/', '');

      // Check health status
      if (info.State.Health && info.State.Health.Status === 'unhealthy') {
        await createAlert(AlertLevel.CRITICAL, 'Auto-Healing', `Container ${name} is unhealthy - attempting restart`, {
          containerId: containerInfo.Id,
          containerName: name,
        });

        try {
          await container.restart({ t: 10 });
          autoHealingStats.containersRestarted++;

          await createAlert(AlertLevel.INFO, 'Auto-Healing', `Container ${name} restarted successfully`, {
            containerId: containerInfo.Id,
            containerName: name,
          });
        } catch (error: any) {
          await createAlert(AlertLevel.CRITICAL, 'Auto-Healing', `Failed to restart ${name}: ${error.message}`, {
            containerId: containerInfo.Id,
            containerName: name,
          });
        }
      }
    }

    // Check system thresholds
    await checkSystemThresholds();
  } catch (error: any) {
    console.error('Auto-healing check failed:', error);
  }
}

/**
 * Avvia auto-healing monitor
 */
export async function startAutoHealing(intervalMinutes: number = 5): Promise<string> {
  try {
    if (autoHealingTask) {
      return '⚠️  Auto-healing is already running';
    }

    // Schedule task (every N minutes)
    autoHealingTask = cron.schedule(`*/${intervalMinutes} * * * *`, () => {
      autoHealingCheck();
    });

    autoHealingStats.enabled = true;
    autoHealingStats.startedAt = new Date();

    let output = `=== Auto-Healing Started ===\n\n`;
    output += `✅ Monitor enabled\n`;
    output += `   Interval: ${intervalMinutes} minutes\n`;
    output += `   Started at: ${autoHealingStats.startedAt.toLocaleString()}\n`;

    await createAlert(AlertLevel.INFO, 'Auto-Healing', `Auto-healing monitor started (${intervalMinutes}min interval)`);

    return output;
  } catch (error: any) {
    return `❌ Failed to start auto-healing: ${error.message}`;
  }
}

/**
 * Ferma auto-healing monitor
 */
export async function stopAutoHealing(): Promise<string> {
  try {
    if (!autoHealingTask) {
      return '⚠️  Auto-healing is not running';
    }

    autoHealingTask.stop();
    autoHealingTask = null;

    autoHealingStats.enabled = false;

    let output = `=== Auto-Healing Stopped ===\n\n`;
    output += `✅ Monitor disabled\n`;

    await createAlert(AlertLevel.INFO, 'Auto-Healing', 'Auto-healing monitor stopped');

    return output;
  } catch (error: any) {
    return `❌ Failed to stop auto-healing: ${error.message}`;
  }
}

/**
 * Status auto-healing
 */
export async function getAutoHealingStatus(): Promise<string> {
  let output = `=== Auto-Healing Status ===\n\n`;

  output += `Status: ${autoHealingStats.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;

  if (autoHealingStats.startedAt) {
    const uptime = Date.now() - autoHealingStats.startedAt.getTime();
    output += `Started: ${autoHealingStats.startedAt.toLocaleString()}\n`;
    output += `Uptime: ${formatUptime(Math.floor(uptime / 1000))}\n`;
  }

  output += `\n📊 Statistics:\n`;
  output += `   Checks performed: ${autoHealingStats.checksPerformed}\n`;
  output += `   Containers restarted: ${autoHealingStats.containersRestarted}\n`;
  output += `   Alerts sent: ${autoHealingStats.alertsSent}\n`;

  return output;
}

// ============================================
// MONITORING & THRESHOLDS
// ============================================

/**
 * Configura threshold per alert
 */
export async function configureThresholds(config: Partial<ThresholdConfig>): Promise<string> {
  currentThresholds = { ...currentThresholds, ...config };

  let output = `=== Threshold Configuration ===\n\n`;
  output += `CPU Warning: ${currentThresholds.cpuWarning}%\n`;
  output += `CPU Critical: ${currentThresholds.cpuCritical}%\n`;
  output += `Memory Warning: ${currentThresholds.memoryWarning}%\n`;
  output += `Memory Critical: ${currentThresholds.memoryCritical}%\n`;
  output += `Unhealthy Warning: ${currentThresholds.unhealthyContainersWarning}\n`;
  output += `Unhealthy Critical: ${currentThresholds.unhealthyContainersCritical}\n`;

  await createAlert(AlertLevel.INFO, 'Configuration', 'Thresholds updated');

  return output;
}

/**
 * Verifica threshold e genera alert
 */
export async function checkSystemThresholds(): Promise<string> {
  let output = `=== Threshold Check ===\n`;
  output += `Time: ${new Date().toLocaleString()}\n\n`;

  const alerts: string[] = [];

  // Check containers health
  const containers = await docker.listContainers();
  let unhealthyCount = 0;

  for (const containerInfo of containers) {
    try {
      const container = docker.getContainer(containerInfo.Id);
      const info = await container.inspect();

      if (info.State.Health && info.State.Health.Status === 'unhealthy') {
        unhealthyCount++;
      }
    } catch (error) {
      // Skip container if inspect fails
    }
  }

  // Check unhealthy containers count
  if (unhealthyCount >= currentThresholds.unhealthyContainersCritical) {
    await createAlert(
      AlertLevel.CRITICAL,
      'Health',
      `${unhealthyCount} unhealthy containers detected (threshold: ${currentThresholds.unhealthyContainersCritical})`,
      { value: unhealthyCount, threshold: currentThresholds.unhealthyContainersCritical }
    );
    alerts.push(`🚨 ${unhealthyCount} unhealthy containers`);
  } else if (unhealthyCount >= currentThresholds.unhealthyContainersWarning) {
    await createAlert(
      AlertLevel.WARNING,
      'Health',
      `${unhealthyCount} unhealthy containers detected (threshold: ${currentThresholds.unhealthyContainersWarning})`,
      { value: unhealthyCount, threshold: currentThresholds.unhealthyContainersWarning }
    );
    alerts.push(`⚠️  ${unhealthyCount} unhealthy containers`);
  }

  if (alerts.length === 0) {
    output += '✅ All thresholds OK\n';
  } else {
    output += '⚠️  Threshold violations:\n';
    alerts.forEach(alert => (output += `   ${alert}\n`));
  }

  return output;
}

/**
 * Storico alert
 */
export async function getAlertHistory(limit: number = 50, level?: string): Promise<string> {
  let output = `=== Alert History ===\n`;
  output += `Total alerts: ${alertHistory.length}\n`;
  output += `Showing: last ${limit}\n\n`;

  const filtered = level ? alertHistory.filter(a => a.level === level) : alertHistory;

  const recent = filtered.slice(-limit).reverse();

  if (recent.length === 0) {
    output += 'No alerts found\n';
    return output;
  }

  recent.forEach(alert => {
    const emoji = alert.level === AlertLevel.CRITICAL ? '🚨' : alert.level === AlertLevel.WARNING ? '⚠️' : 'ℹ️';
    output += `${emoji} [${alert.timestamp.toLocaleString()}] ${alert.category}\n`;
    output += `   ${alert.message}\n`;
    if (alert.containerName) {
      output += `   Container: ${alert.containerName}\n`;
    }
    output += '\n';
  });

  // Statistics
  const criticalCount = alertHistory.filter(a => a.level === AlertLevel.CRITICAL).length;
  const warningCount = alertHistory.filter(a => a.level === AlertLevel.WARNING).length;
  const infoCount = alertHistory.filter(a => a.level === AlertLevel.INFO).length;

  output += `\n📊 Statistics:\n`;
  output += `   🚨 Critical: ${criticalCount}\n`;
  output += `   ⚠️  Warning: ${warningCount}\n`;
  output += `   ℹ️  Info: ${infoCount}\n`;

  return output;
}

/**
 * Pulisci storico alert
 */
export async function clearAlertHistory(): Promise<string> {
  const count = alertHistory.length;
  alertHistory.length = 0;

  return `✅ Cleared ${count} alerts from history`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
