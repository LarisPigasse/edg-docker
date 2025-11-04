#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerDiagnosticsTools } from './tools/diagnostics.tools.js';
import { registerOrchestrationTools } from './tools/orchestration.tools.js';
import { startMonitoring } from './services/monitor.service.js';

// Crea il server
const server = new Server(
  {
    name: 'docker-monitor-mcp',
    version: '2.0.0',
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

// Aggiungi tutti i tool alla mappa
Object.entries({ ...diagnosticsTools, ...orchestrationTools }).forEach(([name, tool]) => {
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

    console.error('Docker Monitor MCP Server v2.0 running on stdio');
    console.error('New intelligent diagnostics tools available');

    // Avvia monitoring in background
    startMonitoring();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
}

main();
