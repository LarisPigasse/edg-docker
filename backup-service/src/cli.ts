// src/cli.ts
//
// Backup a richiesta:  docker compose exec backup-service npm run backup
// Non esegue il backup in un secondo processo: lo chiede al servizio in
// esecuzione (POST /run), che resta l'unico esecutore. Cosi' non possono
// partire due backup insieme e l'esito viene tracciato come quelli pianificati.
import http from 'http';
import { config } from './config';

const req = http.request(
  { host: '127.0.0.1', port: config.port, path: '/run', method: 'POST' },
  res => {
    let body = '';
    res.on('data', chunk => (body += chunk));
    res.on('end', () => {
      let message = body;
      try {
        message = (JSON.parse(body) as { message?: string }).message ?? body;
      } catch {
        /* risposta non JSON: la mostro com'e' */
      }
      const ok = res.statusCode === 200;
      console.log(`${ok ? 'Backup completato' : 'Backup non eseguito'}: ${message}`);
      process.exit(ok ? 0 : 1);
    });
  }
);
req.on('error', err => {
  console.error(`backup-service non raggiungibile: ${err.message}`);
  process.exit(1);
});
req.end();
