import cron from 'node-cron';
import { checkContainerHealth, startBackupGateway } from './docker.service.js';
import { sendAlert } from './email.service.js';

export function startMonitoring() {
  // Controlla ogni minuto lo stato dell'API Gateway
  cron.schedule('* * * * *', async () => {
    const health = await checkContainerHealth('api-gateway');

    if (!health.healthy) {
      console.error('API Gateway is down!');

      // Invia email di alert
      await sendAlert('API Gateway Down', `API Gateway status: ${health.status}. Attempting automatic restart...`);

      // Avvia istanza di backup
      try {
        const backupId = await startBackupGateway();
        await sendAlert('Backup Gateway Started', `Backup gateway started with ID: ${backupId}`);
      } catch (error) {
        // ← Aggiungi type guard qui
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await sendAlert('Failed to Start Backup', `Error: ${errorMessage}`);
      }
    }
  });

  console.error('Monitoring service started');
}
