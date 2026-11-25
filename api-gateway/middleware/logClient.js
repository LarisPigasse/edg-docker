// =============================================================================
// EVENTI DEL GATEWAY VERSO LOG-SERVICE — non bloccanti, con coda (ADR041)
// =============================================================================
// Il gateway scrive pochi eventi propri (gli accessi ai moduli, ADR117). Mai
// attesi da una richiesta: si consegnano subito se possibile, altrimenti
// aspettano in una coda in memoria e si ritenta periodicamente. A coda piena
// si scarta il piu' vecchio e, alla ripresa, arriva un evento log.events_lost
// con il loro numero. Limite accettato: un riavvio del gateway perde la coda.
// Stesso schema dei logger dei servizi (es. vigilo-service core/services/logger.ts).
//
// Parametri (limiti invalicabili):
//   GATEWAY_LOG_CODA_MAX         eventi in attesa            256 (da 64 a 1024)
//   GATEWAY_LOG_RITENTA_SECONDI  secondi fra due tentativi    16 (da 4 a 64)
// =============================================================================
const axios = require('axios');
const { parametro } = require('../config/parametri');

const CODA_MAX = parametro('GATEWAY_LOG_CODA_MAX', 256, 64, 1024);
const RITENTA_MS = parametro('GATEWAY_LOG_RITENTA_SECONDI', 16, 4, 64) * 1000;
/** Attesa massima di una consegna: log-service lento non deve accumulare connessioni */
const TIMEOUT_MS = 2048;

/** Nome dell'istanza (container), come lo usa l'HealthMonitor: api-gateway-1, api-gateway-2 */
const ISTANZA = process.env.HOSTNAME || 'api-gateway';

function createLogClient({ url = process.env.LOG_SERVICE_URL, apiKey = process.env.LOG_API_KEY_SECRET } = {}) {
  const attivo = Boolean(url && apiKey);
  if (!attivo) console.warn('⚠️ [GATEWAY] LOG_SERVICE_URL o LOG_API_KEY_SECRET mancanti: gli eventi del gateway non si registrano');

  const coda = [];
  let persi = 0;
  let svuotando = false;
  let timer = null;

  /** Un tentativo: 'ok', 'retry' (rete, 5xx, 429) o 'drop' (rifiutato: non riprovare) */
  async function posta(body) {
    try {
      await axios.post(`${url}/api/log/azione`, body, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        timeout: TIMEOUT_MS,
      });
      return 'ok';
    } catch (err) {
      const status = err?.response?.status;
      if (status === undefined || status >= 500 || status === 429) return 'retry';
      console.error(`❌ [GATEWAY] Evento rifiutato da log-service (HTTP ${status}): ${body.sottoCategoria}`);
      return 'drop';
    }
  }

  function programma() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      void svuota();
    }, RITENTA_MS);
    timer.unref?.();
  }

  function accoda(body) {
    if (coda.length === 0) console.warn(`⚠️ [GATEWAY] log-service non raggiungibile: eventi in coda, nuovo tentativo fra ${RITENTA_MS / 1000} s`);
    if (coda.length >= CODA_MAX) {
      coda.shift();
      persi++;
    }
    coda.push(body);
    programma();
  }

  function avvisoPersi(n) {
    const messaggio = `${n} eventi di log persi: log-service non raggiungibile e coda di attesa piena`;
    return {
      timestamp: new Date().toISOString(),
      categoria: 'SYSTEM',
      sottoCategoria: 'log.events_lost',
      criticita: 'warning',
      origine: { tipo: 'sistema', id: ISTANZA, dettagli: {} },
      azione: { tipo: 'custom', entita: ISTANZA, idEntita: 'log.events_lost', operazione: messaggio, dettagli: { persi: n } },
      risultato: { esito: 'parziale', messaggio },
      contesto: { ambiente: process.env.NODE_ENV || 'development' },
      tags: [ISTANZA, 'warn'],
    };
  }

  async function svuota() {
    if (svuotando) return;
    svuotando = true;
    let consegnati = 0;
    try {
      while (coda.length > 0) {
        const esito = await posta(coda[0]);
        if (esito === 'retry') break;
        coda.shift();
        if (esito === 'ok') consegnati++;
      }
      if (coda.length === 0 && persi > 0) {
        const n = persi;
        persi = 0;
        if ((await posta(avvisoPersi(n))) === 'retry') persi += n;
      }
    } finally {
      svuotando = false;
      if (consegnati > 0) console.log(`✅ [GATEWAY] log-service di nuovo raggiungibile: consegnati ${consegnati} eventi in coda`);
      if (coda.length > 0 || persi > 0) programma();
    }
  }

  /** Consegna senza attendere: subito se possibile, altrimenti in coda (l'ordine si conserva) */
  function invia(body) {
    if (!attivo) return;
    void (async () => {
      if (coda.length === 0 && !svuotando && (await posta(body)) !== 'retry') return;
      accoda(body);
    })();
  }

  return { invia, istanza: ISTANZA, inCoda: () => coda.length };
}

module.exports = { createLogClient, ISTANZA };
