import { z } from 'zod';
import {
  listAllContainers,
  getContainerStats,
  checkContainerHealth,
  diagnoseArchitecture,
  getArchitectureHealthReport,
  detectFrontends,
  detectMicroservices,
  detectDatabases,
} from '../services/docker.service.js';

export function registerDiagnosticsTools(server: any) {
  // Tool: Lista tutti i container
  server.tool('list-containers', {}, async () => {
    const containers = await listAllContainers();
    const summary = containers.map(c => ({
      id: c.Id.substring(0, 12),
      names: c.Names,
      image: c.Image,
      state: c.State,
      status: c.Status,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  });

  // Tool: Diagnostica completa architettura (versione intelligente)
  server.tool('diagnose-architecture', {}, async () => {
    const diagnostics = await diagnoseArchitecture();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(diagnostics, null, 2),
        },
      ],
    };
  });

  // Tool: Report di salute sintetico
  server.tool('health-report', {}, async () => {
    const report = await getArchitectureHealthReport();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  });

  // Tool: Rileva frontend
  server.tool('detect-frontends', {}, async () => {
    const frontends = await detectFrontends();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(frontends, null, 2),
        },
      ],
    };
  });

  // Tool: Rileva microservizi
  server.tool('detect-microservices', {}, async () => {
    const microservices = await detectMicroservices();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(microservices, null, 2),
        },
      ],
    };
  });

  // Tool: Rileva database
  server.tool('detect-databases', {}, async () => {
    const databases = await detectDatabases();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(databases, null, 2),
        },
      ],
    };
  });

  // Tool: Ispeziona container specifico
  server.tool('inspect-container', { containerId: z.string() }, async ({ containerId }: { containerId: string }) => {
    const stats = await getContainerStats(containerId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  });
}
