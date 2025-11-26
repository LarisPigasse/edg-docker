import Docker from 'dockerode';

const docker = new Docker();

/**
 * Control Service
 * Gestisce operazioni di controllo container (start/stop/restart/pause/scale)
 */

// ============================================
// BASIC CONTROL FUNCTIONS
// ============================================

/**
 * Avvia un container fermo
 */
export async function startContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    if (info.State.Running) {
      return `⚠️  Container ${name} is already running`;
    }

    await container.start();

    // Verifica che sia effettivamente partito
    const updatedInfo = await container.inspect();

    let output = `=== Container Started ===\n\n`;
    output += `✅ Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Started at: ${new Date(updatedInfo.State.StartedAt).toLocaleString()}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error starting container: ${error.message}`;
  }
}

/**
 * Ferma un container in esecuzione
 */
export async function stopContainer(containerId: string, timeout: number = 10) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    if (!info.State.Running) {
      return `⚠️  Container ${name} is already stopped`;
    }

    // Graceful stop con timeout
    await container.stop({ t: timeout });

    // Verifica che sia effettivamente fermato
    const updatedInfo = await container.inspect();

    let output = `=== Container Stopped ===\n\n`;
    output += `✅ Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Stopped at: ${new Date(updatedInfo.State.FinishedAt).toLocaleString()}\n`;
    output += `   Timeout used: ${timeout}s\n`;

    return output;
  } catch (error: any) {
    return `❌ Error stopping container: ${error.message}`;
  }
}

/**
 * Riavvia un container (wrapper migliorato)
 */
export async function restartContainerImproved(containerId: string, timeout: number = 10) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    await container.restart({ t: timeout });

    // Attende che sia effettivamente riavviato
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedInfo = await container.inspect();

    let output = `=== Container Restarted ===\n\n`;
    output += `✅ Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Restarted at: ${new Date(updatedInfo.State.StartedAt).toLocaleString()}\n`;
    output += `   Health: ${updatedInfo.State.Health?.Status || 'N/A'}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error restarting container: ${error.message}`;
  }
}

// ============================================
// PAUSE/UNPAUSE FUNCTIONS
// ============================================

/**
 * Mette in pausa un container
 */
export async function pauseContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    if (info.State.Paused) {
      return `⚠️  Container ${name} is already paused`;
    }

    if (!info.State.Running) {
      return `❌ Cannot pause: container ${name} is not running`;
    }

    await container.pause();

    const updatedInfo = await container.inspect();

    let output = `=== Container Paused ===\n\n`;
    output += `⏸️  Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Paused: ${updatedInfo.State.Paused}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error pausing container: ${error.message}`;
  }
}

/**
 * Riprende un container in pausa
 */
export async function unpauseContainer(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    if (!info.State.Paused) {
      return `⚠️  Container ${name} is not paused`;
    }

    await container.unpause();

    const updatedInfo = await container.inspect();

    let output = `=== Container Unpaused ===\n\n`;
    output += `▶️  Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Running: ${updatedInfo.State.Running}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error unpausing container: ${error.message}`;
  }
}

// ============================================
// ADVANCED CONTROL FUNCTIONS
// ============================================

/**
 * Kill (force stop) di un container
 */
export async function killContainer(containerId: string, signal: string = 'SIGKILL') {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    if (!info.State.Running) {
      return `⚠️  Container ${name} is not running`;
    }

    await container.kill({ signal });

    const updatedInfo = await container.inspect();

    let output = `=== Container Killed ===\n\n`;
    output += `🔴 Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Signal: ${signal}\n`;
    output += `   Status: ${updatedInfo.State.Status}\n`;
    output += `   Exit Code: ${updatedInfo.State.ExitCode}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error killing container: ${error.message}`;
  }
}

/**
 * Ottiene lo stato di un container
 */
export async function getContainerStatus(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    let output = `=== Container Status ===\n\n`;
    output += `📦 Container: ${name}\n`;
    output += `   ID: ${info.Id.substring(0, 12)}\n`;
    output += `   Image: ${info.Config.Image}\n`;
    output += `   Status: ${info.State.Status}\n`;
    output += `   Running: ${info.State.Running ? '✅' : '❌'}\n`;
    output += `   Paused: ${info.State.Paused ? '⏸️' : '▶️'}\n`;
    output += `   Restarting: ${info.State.Restarting ? '🔄' : '—'}\n`;
    output += `   Health: ${info.State.Health?.Status || 'N/A'}\n`;
    output += `   Restart Count: ${info.RestartCount}\n`;

    if (info.State.Running) {
      output += `   Started at: ${new Date(info.State.StartedAt).toLocaleString()}\n`;
      const uptime = Math.floor((Date.now() - new Date(info.State.StartedAt).getTime()) / 1000);
      output += `   Uptime: ${formatUptime(uptime)}\n`;
    } else if (info.State.FinishedAt && info.State.FinishedAt !== '0001-01-01T00:00:00Z') {
      output += `   Stopped at: ${new Date(info.State.FinishedAt).toLocaleString()}\n`;
      output += `   Exit Code: ${info.State.ExitCode}\n`;
    }

    return output;
  } catch (error: any) {
    return `❌ Error getting container status: ${error.message}`;
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Riavvia multipli container in sequenza
 */
export async function restartMultipleContainers(containerIds: string[], timeout: number = 10) {
  try {
    let output = `=== Batch Restart Operation ===\n`;
    output += `Containers: ${containerIds.length}\n`;
    output += `Timeout: ${timeout}s\n\n`;

    const results: { id: string; success: boolean; message: string }[] = [];

    for (const containerId of containerIds) {
      try {
        const container = docker.getContainer(containerId);
        const info = await container.inspect();
        const name = info.Name.replace('/', '');

        output += `🔄 Restarting ${name}...\n`;

        await container.restart({ t: timeout });
        await new Promise(resolve => setTimeout(resolve, 2000));

        results.push({
          id: name,
          success: true,
          message: 'Restarted successfully',
        });

        output += `   ✅ ${name} restarted\n`;
      } catch (error: any) {
        const container = docker.getContainer(containerId);
        const info = await container.inspect();
        const name = info.Name.replace('/', '');

        results.push({
          id: name,
          success: false,
          message: error.message,
        });

        output += `   ❌ ${name} failed: ${error.message}\n`;
      }
    }

    output += `\n=== Summary ===\n`;
    const successful = results.filter(r => r.success).length;
    output += `✅ Successful: ${successful}/${containerIds.length}\n`;
    output += `❌ Failed: ${containerIds.length - successful}/${containerIds.length}\n`;

    return output;
  } catch (error: any) {
    return `❌ Error in batch restart: ${error.message}`;
  }
}

// ============================================
// SCALING FUNCTIONS
// ============================================

/**
 * Scala un servizio Docker Compose (es. API Gateway)
 */
export async function scaleService(serviceName: string, replicas: number, projectName: string = 'edg-docker') {
  try {
    // Nota: Docker SDK non ha API diretta per scaling Compose
    // Dobbiamo listare i container del servizio e crearne di nuovi

    let output = `=== Scale Service ===\n\n`;
    output += `Service: ${serviceName}\n`;
    output += `Target Replicas: ${replicas}\n`;
    output += `Project: ${projectName}\n\n`;

    // Lista container del servizio
    const containers = await docker.listContainers({ all: true });
    const serviceContainers = containers.filter(
      c => c.Labels['com.docker.compose.service'] === serviceName && c.Labels['com.docker.compose.project'] === projectName
    );

    const currentReplicas = serviceContainers.length;
    output += `Current Replicas: ${currentReplicas}\n\n`;

    if (currentReplicas === replicas) {
      output += `⚠️  Service already has ${replicas} replicas\n`;
      return output;
    }

    if (replicas > currentReplicas) {
      // Scale UP - avvia container fermati o crea nuovi
      const stoppedContainers = serviceContainers.filter(c => c.State !== 'running');
      const toStart = Math.min(replicas - currentReplicas, stoppedContainers.length);

      output += `📈 Scaling UP: ${currentReplicas} → ${replicas}\n\n`;

      for (let i = 0; i < toStart; i++) {
        const container = docker.getContainer(stoppedContainers[i].Id);
        const name = stoppedContainers[i].Names[0].replace('/', '');

        try {
          await container.start();
          output += `✅ Started: ${name}\n`;
        } catch (error: any) {
          output += `❌ Failed to start ${name}: ${error.message}\n`;
        }
      }

      const remaining = replicas - currentReplicas - toStart;
      if (remaining > 0) {
        output += `\n⚠️  Need ${remaining} more replicas but no stopped containers available.\n`;
        output += `   Tip: Use docker-compose up --scale ${serviceName}=${replicas}\n`;
      }
    } else {
      // Scale DOWN - ferma container extra
      const runningContainers = serviceContainers.filter(c => c.State === 'running');
      const toStop = currentReplicas - replicas;

      output += `📉 Scaling DOWN: ${currentReplicas} → ${replicas}\n\n`;

      // Ferma gli ultimi container (preserva il primo)
      const containersToStop = runningContainers.slice(-toStop);

      for (const containerInfo of containersToStop) {
        const container = docker.getContainer(containerInfo.Id);
        const name = containerInfo.Names[0].replace('/', '');

        try {
          await container.stop({ t: 10 });
          output += `✅ Stopped: ${name}\n`;
        } catch (error: any) {
          output += `❌ Failed to stop ${name}: ${error.message}\n`;
        }
      }
    }

    output += `\n✅ Scaling operation completed\n`;
    return output;
  } catch (error: any) {
    return `❌ Error scaling service: ${error.message}`;
  }
}

/**
 * Lista i servizi Docker Compose disponibili per scaling
 */
export async function listScalableServices(projectName: string = 'edg-docker') {
  try {
    const containers = await docker.listContainers({ all: true });

    // Raggruppa per servizio
    const serviceMap = new Map<string, any[]>();

    containers.forEach(c => {
      const service = c.Labels['com.docker.compose.service'];
      const project = c.Labels['com.docker.compose.project'];

      if (service && project === projectName) {
        if (!serviceMap.has(service)) {
          serviceMap.set(service, []);
        }
        serviceMap.get(service)!.push(c);
      }
    });

    let output = `=== Scalable Services ===\n`;
    output += `Project: ${projectName}\n`;
    output += `Total Services: ${serviceMap.size}\n\n`;

    for (const [service, containers] of serviceMap.entries()) {
      const running = containers.filter(c => c.State === 'running').length;
      const total = containers.length;

      output += `📦 ${service}\n`;
      output += `   Replicas: ${total} (${running} running)\n`;

      containers.forEach(c => {
        const name = c.Names[0].replace('/', '');
        const status = c.State === 'running' ? '✅' : '❌';
        output += `   ${status} ${name} - ${c.Status}\n`;
      });

      output += '\n';
    }

    return output;
  } catch (error: any) {
    return `❌ Error listing services: ${error.message}`;
  }
}

// ============================================
// CLEANUP FUNCTIONS
// ============================================

/**
 * Rimuove un container (PERICOLOSO - con conferma)
 */
export async function removeContainer(containerId: string, force: boolean = false, removeVolumes: boolean = false) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const name = info.Name.replace('/', '');

    // Safety check - non rimuovere container critici
    const criticalServices = ['traefik', 'api-gateway', 'auth-service', 'log-service'];
    const isCritical = criticalServices.some(service => name.includes(service));

    if (isCritical && !force) {
      return `❌ SAFETY: Cannot remove critical service "${name}" without force=true`;
    }

    let output = `=== Remove Container ===\n\n`;
    output += `🗑️  Container: ${name}\n`;
    output += `   ID: ${containerId.substring(0, 12)}\n`;
    output += `   Force: ${force ? 'YES' : 'NO'}\n`;
    output += `   Remove Volumes: ${removeVolumes ? 'YES' : 'NO'}\n\n`;

    if (info.State.Running && !force) {
      output += `❌ Container is running. Stop it first or use force=true\n`;
      return output;
    }

    await container.remove({ force, v: removeVolumes });

    output += `✅ Container removed successfully\n`;

    if (removeVolumes) {
      output += `   Associated volumes also removed\n`;
    }

    return output;
  } catch (error: any) {
    return `❌ Error removing container: ${error.message}`;
  }
}

/**
 * Pulizia volumi non utilizzati
 */
export async function pruneVolumes(dryRun: boolean = true) {
  try {
    let output = `=== Prune Unused Volumes ===\n`;
    output += `Mode: ${dryRun ? 'DRY RUN (safe preview)' : 'ACTUAL DELETION'}\n\n`;

    const dfInfo = await docker.df();

    if (!dfInfo.Volumes) {
      output += 'No volumes found.\n';
      return output;
    }

    // Trova volumi non utilizzati
    const unusedVolumes = dfInfo.Volumes.filter((vol: any) => vol.UsageData && vol.UsageData.RefCount === 0);

    if (unusedVolumes.length === 0) {
      output += '✅ No unused volumes to clean.\n';
      return output;
    }

    let totalSize = 0;
    unusedVolumes.forEach((vol: any) => {
      totalSize += vol.UsageData?.Size || 0;
    });

    output += `Found ${unusedVolumes.length} unused volumes\n`;
    output += `Total reclaimable space: ${formatBytes(totalSize)}\n\n`;

    output += `📦 Volumes to remove:\n`;
    output += `${'─'.repeat(50)}\n`;

    unusedVolumes.forEach((vol: any, index: number) => {
      const name = vol.Name.length > 40 ? vol.Name.substring(0, 37) + '...' : vol.Name;
      const size = formatBytes(vol.UsageData?.Size || 0);
      output += `${index + 1}. ${name} (${size})\n`;
    });

    if (!dryRun) {
      output += `\n🗑️  Removing volumes...\n`;

      let removed = 0;
      let failed = 0;

      for (const vol of unusedVolumes) {
        try {
          const volume = docker.getVolume(vol.Name);
          await volume.remove();
          removed++;
        } catch (error: any) {
          failed++;
          output += `   ❌ Failed to remove ${vol.Name}: ${error.message}\n`;
        }
      }

      output += `\n✅ Removed: ${removed} volumes\n`;
      if (failed > 0) {
        output += `❌ Failed: ${failed} volumes\n`;
      }
      output += `💾 Space reclaimed: ${formatBytes(totalSize)}\n`;
    } else {
      output += `\n⚠️  DRY RUN: No volumes were actually removed.\n`;
      output += `   Set dryRun=false to perform actual cleanup.\n`;
    }

    return output;
  } catch (error: any) {
    return `❌ Error pruning volumes: ${error.message}`;
  }
}

/**
 * Pulizia container fermati
 */
export async function pruneContainers(dryRun: boolean = true) {
  try {
    let output = `=== Prune Stopped Containers ===\n`;
    output += `Mode: ${dryRun ? 'DRY RUN (safe preview)' : 'ACTUAL DELETION'}\n\n`;

    const containers = await docker.listContainers({ all: true });
    const stoppedContainers = containers.filter(c => c.State === 'exited' || c.State === 'created');

    if (stoppedContainers.length === 0) {
      output += '✅ No stopped containers to clean.\n';
      return output;
    }

    output += `Found ${stoppedContainers.length} stopped containers\n\n`;

    output += `📦 Containers to remove:\n`;
    output += `${'─'.repeat(50)}\n`;

    stoppedContainers.forEach((c, index) => {
      const name = c.Names[0].replace('/', '');
      const age = new Date(c.Created * 1000).toLocaleDateString();
      output += `${index + 1}. ${name} (stopped: ${age})\n`;
    });

    if (!dryRun) {
      output += `\n🗑️  Removing containers...\n`;

      let removed = 0;
      let failed = 0;

      for (const containerInfo of stoppedContainers) {
        try {
          const container = docker.getContainer(containerInfo.Id);
          await container.remove();
          removed++;
        } catch (error: any) {
          failed++;
          const name = containerInfo.Names[0].replace('/', '');
          output += `   ❌ Failed to remove ${name}: ${error.message}\n`;
        }
      }

      output += `\n✅ Removed: ${removed} containers\n`;
      if (failed > 0) {
        output += `❌ Failed: ${failed} containers\n`;
      }
    } else {
      output += `\n⚠️  DRY RUN: No containers were actually removed.\n`;
      output += `   Set dryRun=false to perform actual cleanup.\n`;
    }

    return output;
  } catch (error: any) {
    return `❌ Error pruning containers: ${error.message}`;
  }
}

// ============================================
// MAINTENANCE FUNCTIONS
// ============================================

/**
 * Modalità manutenzione - pausa tutti i servizi frontend
 */
export async function enableMaintenanceMode(projectName: string = 'edg-docker') {
  try {
    let output = `=== Enable Maintenance Mode ===\n\n`;

    const containers = await docker.listContainers();
    const frontendContainers = containers.filter(c => {
      const service = c.Labels['com.docker.compose.service'];
      const project = c.Labels['com.docker.compose.project'];
      return project === projectName && service && service.includes('frontend');
    });

    if (frontendContainers.length === 0) {
      output += '⚠️  No frontend containers found.\n';
      return output;
    }

    output += `Pausing ${frontendContainers.length} frontend containers...\n\n`;

    for (const containerInfo of frontendContainers) {
      const container = docker.getContainer(containerInfo.Id);
      const name = containerInfo.Names[0].replace('/', '');

      try {
        await container.pause();
        output += `⏸️  Paused: ${name}\n`;
      } catch (error: any) {
        output += `❌ Failed to pause ${name}: ${error.message}\n`;
      }
    }

    output += `\n✅ Maintenance mode enabled\n`;
    output += `   Tip: Use disable-maintenance-mode to resume\n`;

    return output;
  } catch (error: any) {
    return `❌ Error enabling maintenance mode: ${error.message}`;
  }
}

/**
 * Disabilita modalità manutenzione - riprende tutti i frontend
 */
export async function disableMaintenanceMode(projectName: string = 'edg-docker') {
  try {
    let output = `=== Disable Maintenance Mode ===\n\n`;

    const containers = await docker.listContainers({ all: true });
    const frontendContainers = containers.filter(c => {
      const service = c.Labels['com.docker.compose.service'];
      const project = c.Labels['com.docker.compose.project'];
      return project === projectName && service && service.includes('frontend') && c.State === 'paused';
    });

    if (frontendContainers.length === 0) {
      output += '⚠️  No paused frontend containers found.\n';
      return output;
    }

    output += `Resuming ${frontendContainers.length} frontend containers...\n\n`;

    for (const containerInfo of frontendContainers) {
      const container = docker.getContainer(containerInfo.Id);
      const name = containerInfo.Names[0].replace('/', '');

      try {
        await container.unpause();
        output += `▶️  Resumed: ${name}\n`;
      } catch (error: any) {
        output += `❌ Failed to resume ${name}: ${error.message}\n`;
      }
    }

    output += `\n✅ Maintenance mode disabled\n`;

    return output;
  } catch (error: any) {
    return `❌ Error disabling maintenance mode: ${error.message}`;
  }
}

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Esegue health check su tutti i container e riavvia quelli unhealthy
 */
export async function healthCheckAndRestart(autoRestart: boolean = false) {
  try {
    let output = `=== Health Check & Auto-Restart ===\n`;
    output += `Auto-restart: ${autoRestart ? 'ENABLED' : 'DISABLED (report only)'}\n\n`;

    const containers = await docker.listContainers();

    const healthyContainers: string[] = [];
    const unhealthyContainers: string[] = [];
    const noHealthCheck: string[] = [];

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      const info = await container.inspect();
      const name = info.Name.replace('/', '');

      if (!info.State.Health) {
        noHealthCheck.push(name);
        continue;
      }

      const health = info.State.Health.Status;

      if (health === 'healthy') {
        healthyContainers.push(name);
      } else if (health === 'unhealthy') {
        unhealthyContainers.push(name);

        if (autoRestart) {
          output += `🔄 Restarting unhealthy container: ${name}...\n`;
          try {
            await container.restart({ t: 10 });
            output += `   ✅ ${name} restarted\n`;
          } catch (error: any) {
            output += `   ❌ Failed to restart ${name}: ${error.message}\n`;
          }
        }
      }
    }

    output += `\n📊 Health Summary:\n`;
    output += `${'─'.repeat(50)}\n`;
    output += `✅ Healthy: ${healthyContainers.length}\n`;
    output += `❌ Unhealthy: ${unhealthyContainers.length}\n`;
    output += `⚪ No health check: ${noHealthCheck.length}\n`;

    if (unhealthyContainers.length > 0) {
      output += `\n❌ Unhealthy containers:\n`;
      unhealthyContainers.forEach(name => (output += `   - ${name}\n`));

      if (!autoRestart) {
        output += `\n💡 Tip: Set autoRestart=true to automatically restart unhealthy containers\n`;
      }
    }

    return output;
  } catch (error: any) {
    return `❌ Error in health check: ${error.message}`;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
