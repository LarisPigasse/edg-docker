/**
 * Metrics Service - Gestione metriche risorse container Docker
 * Fornisce statistiche CPU, RAM, Network, Disk I/O
 */

import Docker from 'dockerode';
import os from 'os';

const docker = new Docker();

/**
 * Interfaccia per metriche container
 */
interface ContainerMetrics {
  id: string;
  name: string;
  cpuPercent: number;
  memoryUsage: string;
  memoryPercent: number;
  memoryLimit: string;
  networkRx: string;
  networkTx: string;
  diskRead: string;
  diskWrite: string;
  pids: number;
  uptime: string;
  status: string;
  health: string;
}

/**
 * Interfaccia per metriche sistema
 */
interface SystemMetrics {
  totalCPUs: number;
  totalMemory: string;
  freeMemory: string;
  usedMemory: string;
  memoryPercent: number;
  platform: string;
  architecture: string;
  dockerContainers: {
    running: number;
    total: number;
  };
  dockerMemoryUsage: string;
}

/**
 * Ottiene metriche di un singolo container
 */
export async function getContainerMetrics(containerId: string): Promise<string> {
  try {
    const container = docker.getContainer(containerId);

    // Ottieni info container
    const inspect = await container.inspect();
    const stats = await container.stats({ stream: false });

    // Calcola metriche
    const metrics = calculateMetrics(inspect, stats);

    // Formatta output
    return formatSingleMetrics(metrics);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get metrics for container ${containerId}: ${err.message}`);
  }
}

/**
 * Ottiene metriche di tutti i container
 */
export async function getAllContainerMetrics(sortBy: 'cpu' | 'memory' = 'cpu'): Promise<string> {
  try {
    const containers = await docker.listContainers({ all: false }); // Solo running

    if (containers.length === 0) {
      return 'No running containers found.';
    }

    // Ottieni metriche per ogni container in parallelo
    const metricsPromises = containers.map(async containerInfo => {
      try {
        const container = docker.getContainer(containerInfo.Id);
        const inspect = await container.inspect();
        const stats = await container.stats({ stream: false });
        return calculateMetrics(inspect, stats);
      } catch (error) {
        // Se fallisce per un container, restituisci metriche vuote
        return null;
      }
    });

    const allMetrics = (await Promise.all(metricsPromises)).filter(m => m !== null) as ContainerMetrics[];

    // Ordina
    if (sortBy === 'cpu') {
      allMetrics.sort((a, b) => b.cpuPercent - a.cpuPercent);
    } else {
      allMetrics.sort((a, b) => b.memoryPercent - a.memoryPercent);
    }

    // Formatta come tabella
    return formatTableMetrics(allMetrics, sortBy);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get all container metrics: ${err.message}`);
  }
}

/**
 * Confronta metriche di più container
 */
export async function compareContainerMetrics(containerIds: string[]): Promise<string> {
  try {
    // Limita a 5 container
    const safeIds = containerIds.slice(0, 5);

    // Ottieni metriche per ogni container
    const metricsPromises = safeIds.map(async id => {
      try {
        const container = docker.getContainer(id);
        const inspect = await container.inspect();
        const stats = await container.stats({ stream: false });
        return calculateMetrics(inspect, stats);
      } catch (error) {
        const err = error as Error;
        return {
          id,
          name: id,
          error: err.message,
        } as any;
      }
    });

    const metrics = await Promise.all(metricsPromises);

    // Formatta confronto
    return formatComparisonMetrics(metrics);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to compare container metrics: ${err.message}`);
  }
}

/**
 * Ottiene metriche risorse sistema
 */
export async function getSystemMetrics(): Promise<string> {
  try {
    // Info sistema
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Info Docker
    const containers = await docker.listContainers({ all: true });
    const runningContainers = containers.filter(c => c.State === 'running');

    // Calcola memoria usata da Docker
    let dockerMemoryUsage = 0;
    for (const containerInfo of runningContainers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        const stats = await container.stats({ stream: false });
        dockerMemoryUsage += stats.memory_stats.usage || 0;
      } catch {
        // Ignora errori per singoli container
      }
    }

    const systemMetrics: SystemMetrics = {
      totalCPUs: os.cpus().length,
      totalMemory: formatBytes(totalMemory),
      freeMemory: formatBytes(freeMemory),
      usedMemory: formatBytes(usedMemory),
      memoryPercent: (usedMemory / totalMemory) * 100,
      platform: os.platform(),
      architecture: os.arch(),
      dockerContainers: {
        running: runningContainers.length,
        total: containers.length,
      },
      dockerMemoryUsage: formatBytes(dockerMemoryUsage),
    };

    return formatSystemMetrics(systemMetrics);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get system metrics: ${err.message}`);
  }
}

/**
 * Calcola metriche da stats Docker
 */
function calculateMetrics(inspect: any, stats: any): ContainerMetrics {
  // CPU
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

  // Memory
  const memoryUsage = stats.memory_stats.usage || 0;
  const memoryLimit = stats.memory_stats.limit || 0;
  const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

  // Network
  let networkRx = 0;
  let networkTx = 0;
  if (stats.networks) {
    Object.values(stats.networks).forEach((net: any) => {
      networkRx += net.rx_bytes || 0;
      networkTx += net.tx_bytes || 0;
    });
  }

  // Disk I/O
  let diskRead = 0;
  let diskWrite = 0;
  if (stats.blkio_stats && stats.blkio_stats.io_service_bytes_recursive) {
    stats.blkio_stats.io_service_bytes_recursive.forEach((io: any) => {
      if (io.op === 'read' || io.op === 'Read') diskRead += io.value;
      if (io.op === 'write' || io.op === 'Write') diskWrite += io.value;
    });
  }

  // PIDs
  const pids = stats.pids_stats?.current || 0;

  // Uptime
  const startedAt = new Date(inspect.State.StartedAt);
  const uptime = formatUptime(Date.now() - startedAt.getTime());

  // Status e Health
  const status = inspect.State.Status || 'unknown';
  const health = inspect.State.Health?.Status || 'none';

  return {
    id: inspect.Id.substring(0, 12),
    name: inspect.Name.replace(/^\//, ''),
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    memoryUsage: formatBytes(memoryUsage),
    memoryPercent: Math.round(memoryPercent * 100) / 100,
    memoryLimit: formatBytes(memoryLimit),
    networkRx: formatBytes(networkRx),
    networkTx: formatBytes(networkTx),
    diskRead: formatBytes(diskRead),
    diskWrite: formatBytes(diskWrite),
    pids,
    uptime,
    status,
    health,
  };
}

/**
 * Formatta metriche singolo container
 */
function formatSingleMetrics(metrics: ContainerMetrics): string {
  return `=== Metrics for ${metrics.name} ===

CPU Usage:      ${metrics.cpuPercent}%
Memory:         ${metrics.memoryUsage} / ${metrics.memoryLimit} (${metrics.memoryPercent}%)
Network:
  ↓ RX:         ${metrics.networkRx}
  ↑ TX:         ${metrics.networkTx}
Disk I/O:
  ↓ Read:       ${metrics.diskRead}
  ↑ Write:      ${metrics.diskWrite}

Uptime:         ${metrics.uptime}
Status:         ${metrics.status}
Health:         ${metrics.health}
PIDs:           ${metrics.pids}
`;
}

/**
 * Formatta metriche come tabella
 */
function formatTableMetrics(metrics: ContainerMetrics[], sortBy: string): string {
  const header = `=== Container Metrics (sorted by ${sortBy.toUpperCase()}) ===\n\n`;

  // Header tabella
  let table =
    'Container'.padEnd(25) +
    'CPU%'.padStart(8) +
    'Memory'.padStart(20) +
    'Network RX/TX'.padStart(20) +
    'Status'.padStart(12) +
    '\n';

  table += '-'.repeat(85) + '\n';

  // Righe
  metrics.forEach(m => {
    const memory = `${m.memoryUsage}/${m.memoryLimit}`;
    const network = `${m.networkRx}/${m.networkTx}`;
    const statusIcon = m.health === 'healthy' ? '✓' : m.health === 'unhealthy' ? '✗' : m.health === 'starting' ? '◷' : '-';

    table +=
      m.name.padEnd(25) +
      `${m.cpuPercent}%`.padStart(8) +
      memory.padStart(20) +
      network.padStart(20) +
      `${statusIcon} ${m.status}`.padStart(12) +
      '\n';
  });

  return header + table;
}

/**
 * Formatta confronto metriche
 */
function formatComparisonMetrics(metrics: ContainerMetrics[]): string {
  let output = `=== Metrics Comparison (${metrics.length} containers) ===\n\n`;

  metrics.forEach((m, index) => {
    if ((m as any).error) {
      output += `▼ ${m.name}\n`;
      output += `  Error: ${(m as any).error}\n\n`;
    } else {
      output += `▼ ${m.name}\n`;
      output += `  CPU:     ${m.cpuPercent}%\n`;
      output += `  Memory:  ${m.memoryUsage} / ${m.memoryLimit} (${m.memoryPercent}%)\n`;
      output += `  Network: ↓${m.networkRx} / ↑${m.networkTx}\n`;
      output += `  Disk:    ↓${m.diskRead} / ↑${m.diskWrite}\n`;
      output += `  Status:  ${m.status} (${m.health})\n`;
      output += `  Uptime:  ${m.uptime}\n`;

      if (index < metrics.length - 1) {
        output += '\n' + '─'.repeat(50) + '\n\n';
      }
    }
  });

  return output;
}

/**
 * Formatta metriche sistema
 */
function formatSystemMetrics(metrics: SystemMetrics): string {
  return `=== System Resources ===

Hardware:
  CPUs:           ${metrics.totalCPUs}
  Platform:       ${metrics.platform} (${metrics.architecture})

Memory:
  Total:          ${metrics.totalMemory}
  Used:           ${metrics.usedMemory} (${metrics.memoryPercent.toFixed(1)}%)
  Free:           ${metrics.freeMemory}

Docker:
  Containers:     ${metrics.dockerContainers.running} running / ${metrics.dockerContainers.total} total
  Memory Usage:   ${metrics.dockerMemoryUsage}
`;
}

/**
 * Helper: Formatta bytes in formato leggibile
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper: Formatta uptime in formato leggibile
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
