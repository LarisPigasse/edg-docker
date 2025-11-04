import { z } from 'zod';
import { restartContainer, startBackupGateway } from '../services/docker.service.js';
import { sendAlert } from '../services/email.service.js';

export function registerOrchestrationTools(server: any) {
  // Tool: Restart container
  server.tool('restart-container', { containerId: z.string() }, async ({ containerId }: { containerId: string }) => {
    // ← Aggiungi il tipo qui
    const result = await restartContainer(containerId);
    await sendAlert('Container Restarted', result.message);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  });

  // Tool: Avvia gateway di backup
  server.tool('start-backup-gateway', {}, async () => {
    const backupId = await startBackupGateway();
    await sendAlert('Manual Backup Started', `Backup gateway ID: ${backupId}`);

    return {
      content: [
        {
          type: 'text',
          text: `Backup gateway started with ID: ${backupId}`,
        },
      ],
    };
  });
}
