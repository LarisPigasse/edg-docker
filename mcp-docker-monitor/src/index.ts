#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerDiagnosticsTools } from './tools/diagnostics.tools.js';
import { registerOrchestrationTools } from './tools/orchestration.tools.js';
import { startMonitoring } from './services/monitor.service.js';
import { inspectNetwork, testConnectivity, listVolumes, volumeUsage } from './services/network.service.js';
import {
  startContainer,
  stopContainer,
  restartContainerImproved,
  pauseContainer,
  unpauseContainer,
  killContainer,
  getContainerStatus,
  restartMultipleContainers,
  scaleService,
  listScalableServices,
  removeContainer,
  pruneVolumes,
  pruneContainers,
  enableMaintenanceMode,
  disableMaintenanceMode,
  healthCheckAndRestart,
} from './services/control.service.js';
// ============================================================================
// NUOVI IMPORT: AUTOMATION SERVICE (FASE 3)
// ============================================================================
import {
  backupMySQL,
  backupMongoDB,
  backupDockerVolumes,
  backupAll,
  listBackups,
  cleanupOldBackups,
  startAutoHealing,
  stopAutoHealing,
  getAutoHealingStatus,
  configureThresholds,
  checkSystemThresholds,
  getAlertHistory,
  clearAlertHistory,
} from './services/automation.service.js';

// Crea il server
const server = new Server(
  {
    name: 'docker-monitor-mcp',
    version: '2.5.0', // Aggiornato con Automazione (FASE 3)
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Mappa per tenere traccia dei tool registrati
const tools = new Map<string, any>();

// Funzione helper per registrare tool
function registerTool(name: string, description: string, inputSchema: any, handler: any) {
  tools.set(name, { name, description, inputSchema, handler });
}

// Registra i tool per diagnostica
const diagnosticsTools = {
  'list-containers': {
    description: 'Lista tutti i container Docker presenti sul sistema',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { listAllContainers } = await import('./services/docker.service.js');
      const containers = await listAllContainers();
      const summary = containers.map(c => ({
        id: c.Id.substring(0, 12),
        names: c.Names,
        image: c.Image,
        state: c.State,
        status: c.Status,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    },
  },
  'diagnose-architecture': {
    description: "Esegue una diagnostica completa e intelligente dell'architettura Docker EDG",
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { diagnoseArchitecture } = await import('./services/docker.service.js');
      const diagnostics = await diagnoseArchitecture();
      return { content: [{ type: 'text', text: JSON.stringify(diagnostics, null, 2) }] };
    },
  },
  'health-report': {
    description: "Genera un report sintetico dello stato di salute dell'architettura",
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { getArchitectureHealthReport } = await import('./services/docker.service.js');
      const report = await getArchitectureHealthReport();
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    },
  },
  'detect-frontends': {
    description: 'Rileva automaticamente tutti i frontend presenti nel sistema',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { detectFrontends } = await import('./services/docker.service.js');
      const frontends = await detectFrontends();
      return { content: [{ type: 'text', text: JSON.stringify(frontends, null, 2) }] };
    },
  },
  'detect-microservices': {
    description: 'Rileva automaticamente tutti i microservizi presenti nel sistema',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { detectMicroservices } = await import('./services/docker.service.js');
      const microservices = await detectMicroservices();
      return { content: [{ type: 'text', text: JSON.stringify(microservices, null, 2) }] };
    },
  },
  'detect-databases': {
    description: 'Rileva automaticamente tutti i database presenti nel sistema',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { detectDatabases } = await import('./services/docker.service.js');
      const databases = await detectDatabases();
      return { content: [{ type: 'text', text: JSON.stringify(databases, null, 2) }] };
    },
  },
  'inspect-container': {
    description: 'Ispeziona un container Docker specifico',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID del container da ispezionare' },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const { getContainerStats } = await import('./services/docker.service.js');
      const stats = await getContainerStats(args.containerId);
      return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    },
  },
};

// Registra i tool per orchestrazione
const orchestrationTools = {
  'restart-container': {
    description: 'Riavvia un container Docker specifico',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'ID del container da riavviare' },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const { restartContainer } = await import('./services/docker.service.js');
      const { sendAlert } = await import('./services/email.service.js');
      const result = await restartContainer(args.containerId);
      await sendAlert('Container Restarted', result.message);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  'start-backup-gateway': {
    description: "Avvia un'istanza di backup dell'API Gateway",
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const { startBackupGateway } = await import('./services/docker.service.js');
      const { sendAlert } = await import('./services/email.service.js');
      const backupId = await startBackupGateway();
      await sendAlert('Manual Backup Started', `Backup gateway ID: ${backupId}`);
      return { content: [{ type: 'text', text: `Backup gateway started with ID: ${backupId}` }] };
    },
  },
};

// ============================================================================
// NUOVI TOOL: LOGS (FASE 1 - Step 1: Più Visibilità)
// ============================================================================
const logsTools = {
  'get-logs': {
    description: 'Ottiene gli ultimi N log di un container in formato plain text',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
        lines: {
          type: 'number',
          description: 'Numero di righe da recuperare (default: 100, max: 1000)',
          default: 100,
        },
        since: {
          type: 'string',
          description: 'Filtra logs da: 30s, 5m, 1h, 2d (opzionale)',
          default: undefined,
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; lines?: number; since?: string }) => {
      const { getContainerLogs } = await import('./services/logs.service.js');
      const logs = await getContainerLogs(args.containerId, args.lines, args.since);

      // Formatta output con header
      const header =
        `=== Logs for ${args.containerId} ===\n` +
        `Lines: ${args.lines || 100}${args.since ? `, Since: ${args.since}` : ''}\n` +
        `${'='.repeat(50)}\n\n`;

      return { content: [{ type: 'text', text: header + logs }] };
    },
  },

  'stream-logs': {
    description: 'Stream logs in tempo reale per una durata limitata (max 60s)',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
        duration: {
          type: 'number',
          description: 'Durata streaming in secondi (default: 30, max: 60)',
          default: 30,
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; duration?: number }) => {
      const { streamContainerLogs } = await import('./services/logs.service.js');

      const header =
        `=== Streaming logs for ${args.containerId} ===\n` + `Duration: ${args.duration || 30}s\n` + `${'='.repeat(50)}\n\n`;

      const logs = await streamContainerLogs(args.containerId, args.duration);

      const footer = `\n${'='.repeat(50)}\n` + `Stream ended after ${args.duration || 30} seconds\n`;

      return { content: [{ type: 'text', text: header + logs + footer }] };
    },
  },

  'search-logs': {
    description: 'Cerca un pattern specifico nei logs di un container',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
        pattern: {
          type: 'string',
          description: 'Pattern da cercare (regex, case-insensitive)',
        },
        lines: {
          type: 'number',
          description: 'Numero di righe da analizzare (default: 500, max: 1000)',
          default: 500,
        },
      },
      required: ['containerId', 'pattern'],
    },
    handler: async (args: { containerId: string; pattern: string; lines?: number }) => {
      const { searchLogsPattern } = await import('./services/logs.service.js');
      const result = await searchLogsPattern(args.containerId, args.pattern, args.lines);

      const header =
        `=== Search Results for "${args.pattern}" in ${args.containerId} ===\n` +
        `Found: ${result.totalMatches} matches in ${result.totalLinesScanned} lines\n` +
        `${'='.repeat(50)}\n\n`;

      const matches = result.matchedLines.length > 0 ? result.matchedLines.join('\n') : '(No matches found)';

      return { content: [{ type: 'text', text: header + matches }] };
    },
  },

  'get-logs-multi': {
    description: 'Ottiene logs da multipli container per confronto (max 5 container)',
    inputSchema: {
      type: 'object',
      properties: {
        containerIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array di nomi o ID dei container',
        },
        lines: {
          type: 'number',
          description: 'Numero di righe per container (default: 50, max: 1000)',
          default: 50,
        },
      },
      required: ['containerIds'],
    },
    handler: async (args: { containerIds: string[]; lines?: number }) => {
      const { getMultiContainerLogs } = await import('./services/logs.service.js');
      const logsMap = await getMultiContainerLogs(args.containerIds, args.lines);

      let output = `=== Multi-Container Logs (${args.containerIds.length} containers) ===\n`;
      output += `Lines per container: ${args.lines || 50}\n`;
      output += `${'='.repeat(70)}\n\n`;

      for (const [containerId, logs] of Object.entries(logsMap)) {
        output += `\n${'─'.repeat(70)}\n`;
        output += `📦 Container: ${containerId}\n`;
        output += `${'─'.repeat(70)}\n`;
        output += logs + '\n';
      }

      return { content: [{ type: 'text', text: output }] };
    },
  },
};

// ============================================================================
// NUOVI TOOL: METRICS (FASE 1 - Step 2)
// ============================================================================
const metricsTools = {
  'get-container-metrics': {
    description: 'Ottiene metriche risorse (CPU, RAM, Network, Disk) di un container specifico',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const { getContainerMetrics } = await import('./services/metrics.service.js');
      const metrics = await getContainerMetrics(args.containerId);
      return { content: [{ type: 'text', text: metrics }] };
    },
  },

  'get-all-metrics': {
    description: 'Ottiene metriche di tutti i container running in formato tabella',
    inputSchema: {
      type: 'object',
      properties: {
        sortBy: {
          type: 'string',
          enum: ['cpu', 'memory'],
          description: 'Ordina per CPU o Memory (default: cpu)',
          default: 'cpu',
        },
      },
      required: [],
    },
    handler: async (args: { sortBy?: 'cpu' | 'memory' }) => {
      const { getAllContainerMetrics } = await import('./services/metrics.service.js');
      const metrics = await getAllContainerMetrics(args.sortBy);
      return { content: [{ type: 'text', text: metrics }] };
    },
  },

  'compare-metrics': {
    description: 'Confronta metriche di più container side-by-side (max 5)',
    inputSchema: {
      type: 'object',
      properties: {
        containerIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array di nomi o ID dei container da confrontare',
        },
      },
      required: ['containerIds'],
    },
    handler: async (args: { containerIds: string[] }) => {
      const { compareContainerMetrics } = await import('./services/metrics.service.js');
      const comparison = await compareContainerMetrics(args.containerIds);
      return { content: [{ type: 'text', text: comparison }] };
    },
  },

  'system-resources': {
    description: 'Snapshot risorse sistema: CPU, RAM totali + utilizzo Docker',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const { getSystemMetrics } = await import('./services/metrics.service.js');
      const metrics = await getSystemMetrics();
      return { content: [{ type: 'text', text: metrics }] };
    },
  },
};

// ============================================================================
// NUOVI TOOL: CONTROL (FASE 2 - Più Controllo)
// ============================================================================
const controlTools = {
  'start-container': {
    description: 'Avvia un container fermo',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container da avviare',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const result = await startContainer(args.containerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'stop-container': {
    description: 'Ferma un container in esecuzione (graceful stop)',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container da fermare',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in secondi per graceful stop (default: 10)',
          default: 10,
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; timeout?: number }) => {
      const result = await stopContainer(args.containerId, args.timeout);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'restart-container-improved': {
    description: 'Riavvia un container con verifica health status',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container da riavviare',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in secondi (default: 10)',
          default: 10,
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; timeout?: number }) => {
      const result = await restartContainerImproved(args.containerId, args.timeout);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'pause-container': {
    description: 'Mette in pausa un container in esecuzione',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const result = await pauseContainer(args.containerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'unpause-container': {
    description: 'Riprende un container in pausa',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const result = await unpauseContainer(args.containerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'kill-container': {
    description: 'Force stop di un container con segnale personalizzabile',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
        signal: {
          type: 'string',
          description: 'Segnale da inviare (default: SIGKILL)',
          default: 'SIGKILL',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; signal?: string }) => {
      const result = await killContainer(args.containerId, args.signal);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'get-container-status': {
    description: 'Ottiene lo stato dettagliato di un container',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const result = await getContainerStatus(args.containerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'restart-multiple-containers': {
    description: 'Riavvia multipli container in sequenza (batch operation)',
    inputSchema: {
      type: 'object',
      properties: {
        containerIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array di nomi o ID dei container',
        },
        timeout: {
          type: 'number',
          description: 'Timeout per ogni container (default: 10)',
          default: 10,
        },
      },
      required: ['containerIds'],
    },
    handler: async (args: { containerIds: string[]; timeout?: number }) => {
      const result = await restartMultipleContainers(args.containerIds, args.timeout);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'scale-service': {
    description: 'Scala un servizio Docker Compose (scale up/down)',
    inputSchema: {
      type: 'object',
      properties: {
        serviceName: {
          type: 'string',
          description: 'Nome del servizio da scalare',
        },
        replicas: {
          type: 'number',
          description: 'Numero target di repliche',
        },
        projectName: {
          type: 'string',
          description: 'Nome progetto Docker Compose (default: edg-docker)',
          default: 'edg-docker',
        },
      },
      required: ['serviceName', 'replicas'],
    },
    handler: async (args: { serviceName: string; replicas: number; projectName?: string }) => {
      const result = await scaleService(args.serviceName, args.replicas, args.projectName);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'list-scalable-services': {
    description: 'Lista i servizi Docker Compose disponibili per scaling',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Nome progetto Docker Compose (default: edg-docker)',
          default: 'edg-docker',
        },
      },
      required: [],
    },
    handler: async (args: { projectName?: string }) => {
      const result = await listScalableServices(args.projectName);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'remove-container': {
    description: 'Rimuove un container (PERICOLOSO - con safety checks)',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
        force: {
          type: 'boolean',
          description: 'Forza rimozione anche se running (default: false)',
          default: false,
        },
        removeVolumes: {
          type: 'boolean',
          description: 'Rimuovi anche volumi associati (default: false)',
          default: false,
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string; force?: boolean; removeVolumes?: boolean }) => {
      const result = await removeContainer(args.containerId, args.force, args.removeVolumes);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'prune-volumes': {
    description: 'Pulizia volumi non utilizzati (DRY RUN by default)',
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Preview only senza rimozione (default: true)',
          default: true,
        },
      },
      required: [],
    },
    handler: async (args: { dryRun?: boolean }) => {
      const result = await pruneVolumes(args.dryRun !== false);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'prune-containers': {
    description: 'Pulizia container fermati (DRY RUN by default)',
    inputSchema: {
      type: 'object',
      properties: {
        dryRun: {
          type: 'boolean',
          description: 'Preview only senza rimozione (default: true)',
          default: true,
        },
      },
      required: [],
    },
    handler: async (args: { dryRun?: boolean }) => {
      const result = await pruneContainers(args.dryRun !== false);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'enable-maintenance-mode': {
    description: 'Abilita modalità manutenzione (pausa tutti i frontend)',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Nome progetto (default: edg-docker)',
          default: 'edg-docker',
        },
      },
      required: [],
    },
    handler: async (args: { projectName?: string }) => {
      const result = await enableMaintenanceMode(args.projectName);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'disable-maintenance-mode': {
    description: 'Disabilita modalità manutenzione (riprende i frontend)',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          description: 'Nome progetto (default: edg-docker)',
          default: 'edg-docker',
        },
      },
      required: [],
    },
    handler: async (args: { projectName?: string }) => {
      const result = await disableMaintenanceMode(args.projectName);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'health-check-and-restart': {
    description: 'Health check su tutti i container con auto-restart opzionale',
    inputSchema: {
      type: 'object',
      properties: {
        autoRestart: {
          type: 'boolean',
          description: 'Riavvia automaticamente container unhealthy (default: false)',
          default: false,
        },
      },
      required: [],
    },
    handler: async (args: { autoRestart?: boolean }) => {
      const result = await healthCheckAndRestart(args.autoRestart || false);
      return { content: [{ type: 'text', text: result }] };
    },
  },
};

// ============================================================================
// NUOVI TOOL: NETWORK & VOLUMES (FASE 1 - Step 3)
// ============================================================================
const networkTools = {
  'inspect-network': {
    description: 'Ispeziona la configurazione di rete di un container (IP, gateway, porte)',
    inputSchema: {
      type: 'object',
      properties: {
        containerId: {
          type: 'string',
          description: 'Nome o ID del container',
        },
      },
      required: ['containerId'],
    },
    handler: async (args: { containerId: string }) => {
      const result = await inspectNetwork(args.containerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'test-connectivity': {
    description: 'Testa la connettività tra due container usando ping',
    inputSchema: {
      type: 'object',
      properties: {
        sourceContainerId: {
          type: 'string',
          description: 'Container sorgente (da cui fare ping)',
        },
        targetContainerId: {
          type: 'string',
          description: 'Container target (nome o ID)',
        },
      },
      required: ['sourceContainerId', 'targetContainerId'],
    },
    handler: async (args: { sourceContainerId: string; targetContainerId: string }) => {
      const result = await testConnectivity(args.sourceContainerId, args.targetContainerId);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'list-volumes': {
    description: 'Lista tutti i volumi Docker con dettagli (driver, mountpoint, labels)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await listVolumes();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'volume-usage': {
    description: 'Analizza utilizzo spazio dei volumi con size e containers che li usano',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await volumeUsage();
      return { content: [{ type: 'text', text: result }] };
    },
  },
};

// ============================================================================
// NUOVI TOOL: AUTOMATION (FASE 3 - Backup, Auto-Healing, Monitoring)
// ============================================================================
const automationTools = {
  // ============================================================================
  // BACKUP TOOLS (6 tool)
  // ============================================================================
  'backup-mysql': {
    description: 'Export SQL database MySQL',
    inputSchema: {
      type: 'object',
      properties: {
        containerName: {
          type: 'string',
          description: 'Nome container MySQL (default: mysql)',
          default: 'mysql',
        },
        database: {
          type: 'string',
          description: 'Nome database da backuppare',
        },
        user: {
          type: 'string',
          description: 'Username MySQL (default: root)',
          default: 'root',
        },
        password: {
          type: 'string',
          description: 'Password MySQL',
        },
      },
      required: ['database', 'password'],
    },
    handler: async (args: { containerName?: string; database: string; user?: string; password: string }) => {
      // backupMySQL currently only accepts containerName and databaseName (user/password handled via env in container)
      const result = await backupMySQL(args.containerName, args.database);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'backup-mongodb': {
    description: 'Export archive database MongoDB',
    inputSchema: {
      type: 'object',
      properties: {
        containerName: {
          type: 'string',
          description: 'Nome container MongoDB (default: mongodb)',
          default: 'mongodb',
        },
        database: {
          type: 'string',
          description: 'Nome database da backuppare',
        },
      },
      required: ['database'],
    },
    handler: async (args: { containerName?: string; database: string }) => {
      const result = await backupMongoDB(args.containerName, args.database);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'backup-volumes': {
    description: 'Snapshot volumi Docker',
    inputSchema: {
      type: 'object',
      properties: {
        volumeNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array nomi volumi da backuppare (vuoto = tutti)',
        },
      },
      required: [],
    },
    handler: async (args: { volumeNames?: string[] }) => {
  const result = await backupDockerVolumes(args.volumeNames);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'backup-all': {
    description: 'Backup completo sistema (MySQL + MongoDB + Volumes)',
    inputSchema: {
      type: 'object',
      properties: {
        mysqlConfig: {
          type: 'object',
          description: 'Configurazione MySQL (opzionale)',
          properties: {
            containerName: { type: 'string' },
            database: { type: 'string' },
            user: { type: 'string' },
            password: { type: 'string' },
          },
        },
        mongoConfig: {
          type: 'object',
          description: 'Configurazione MongoDB (opzionale)',
          properties: {
            containerName: { type: 'string' },
            database: { type: 'string' },
          },
        },
      },
      required: [],
    },
    handler: async (args: { mysqlConfig?: any; mongoConfig?: any }) => {
      // backupAll does not accept config arguments; use defaults or preconfigure via other tools
      const result = await backupAll();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'list-backups': {
    description: 'Lista backup disponibili con metadata',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await listBackups();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'cleanup-old-backups': {
    description: 'Retention policy automatica - rimuove backup vecchi',
    inputSchema: {
      type: 'object',
      properties: {
        retentionDays: {
          type: 'number',
          description: 'Mantieni backup ultimi N giorni (default: 30)',
          default: 30,
        },
      },
      required: [],
    },
    handler: async (args: { retentionDays?: number }) => {
      const result = await cleanupOldBackups(args.retentionDays);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  // ============================================================================
  // AUTO-HEALING TOOLS (3 tool)
  // ============================================================================
  'start-auto-healing': {
    description: 'Avvia monitor riparazione automatica container unhealthy',
    inputSchema: {
      type: 'object',
      properties: {
        intervalMinutes: {
          type: 'number',
          description: 'Intervallo check in minuti (default: 5, min: 3)',
          default: 5,
        },
      },
      required: [],
    },
    handler: async (args: { intervalMinutes?: number }) => {
      const result = await startAutoHealing(args.intervalMinutes);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'stop-auto-healing': {
    description: 'Ferma monitor auto-healing',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await stopAutoHealing();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'get-auto-healing-status': {
    description: 'Status e statistiche auto-healing (checks, restart, alert)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await getAutoHealingStatus();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  // ============================================================================
  // MONITORING & ALERTS TOOLS (4 tool)
  // ============================================================================
  'configure-thresholds': {
    description: 'Configura soglie alert CPU/Memory/Unhealthy',
    inputSchema: {
      type: 'object',
      properties: {
        cpuWarning: {
          type: 'number',
          description: 'Soglia warning CPU % (default: 80)',
        },
        cpuCritical: {
          type: 'number',
          description: 'Soglia critical CPU % (default: 95)',
        },
        memoryWarning: {
          type: 'number',
          description: 'Soglia warning Memory % (default: 85)',
        },
        memoryCritical: {
          type: 'number',
          description: 'Soglia critical Memory % (default: 95)',
        },
        unhealthyWarning: {
          type: 'number',
          description: 'Numero container unhealthy warning (default: 1)',
        },
        unhealthyCritical: {
          type: 'number',
          description: 'Numero container unhealthy critical (default: 3)',
        },
      },
      required: [],
    },
    handler: async (args: {
      cpuWarning?: number;
      cpuCritical?: number;
      memoryWarning?: number;
      memoryCritical?: number;
      unhealthyWarning?: number;
      unhealthyCritical?: number;
    }) => {
      const result = await configureThresholds(args);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'check-system-thresholds': {
    description: 'Verifica manuale threshold sistema e genera alert se necessario',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await checkSystemThresholds();
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'get-alert-history': {
    description: 'Storico alert (ultimi 100)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Numero alert da visualizzare (default: 100)',
          default: 100,
        },
      },
      required: [],
    },
    handler: async (args: { limit?: number }) => {
      const result = await getAlertHistory(args.limit);
      return { content: [{ type: 'text', text: result }] };
    },
  },

  'clear-alert-history': {
    description: 'Pulizia storico alert',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await clearAlertHistory();
      return { content: [{ type: 'text', text: result }] };
    },
  },
};

// ============================================================================
// REGISTRAZIONE TOOL
// ============================================================================
// Aggiungi tutti i tool alla mappa
Object.entries({
  ...diagnosticsTools,
  ...orchestrationTools,
  ...logsTools, // TOOL LOGS (Step 1)
  ...controlTools, // TOOL CONTROL (Step 4 - FASE 2)
  ...metricsTools, // TOOL METRICS (Step 2)
  ...networkTools, // TOOL NETWORK & VOLUMES (Step 3)
  ...automationTools, // TOOL AUTOMATION (FASE 3) ✨ NEW
}).forEach(([name, tool]: [string, any]) => {
  // `tool` viene da Object.entries su oggetti letterali eterogenei;
  // tipizziamo come `any` qui per consentire l'accesso alle proprietà.
  registerTool(name, tool.description, tool.inputSchema, tool.handler);
});

// Handler per la lista dei tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Array.from(tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handler per l'esecuzione dei tool
server.setRequestHandler(CallToolRequestSchema, async request => {
  const tool = tools.get(request.params.name);
  if (!tool) {
    throw new Error(`Tool not found: ${request.params.name}`);
  }

  try {
    return await tool.handler(request.params.arguments || {});
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error executing tool ${request.params.name}:`, errorMessage);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Avvia il server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Docker Monitor MCP Server v2.5.0 running on stdio');
    console.error('Features: Full Automation - 59 tools (Logs+Metrics+Network+Control+Automation)');
    console.error('Intelligent diagnostics, orchestration, backup, and auto-healing available');

    // Avvia monitoring in background
    // startMonitoring();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
}

main();
