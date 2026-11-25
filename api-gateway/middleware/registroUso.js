// =============================================================================
// REGISTRO D'USO — accessi ai moduli (fase 1 dei log, ADR117)
// =============================================================================
// Dopo il controllo del modulo (moduleGuard), la prima richiesta di una
// sessione a un modulo dopo una pausa diventa un evento "Accesso a <modulo>"
// (categoria USO, modulo dichiarato) in log-service. Ogni richiesta successiva
// della stessa sessione allunga la finestra: un accesso = un periodo d'uso
// continuo, che finisce dopo la pausa senza richieste.
//
// Il segno "gia' dentro" sta in Redis (uso:<sessione>:<modulo>, comune ai due
// gateway). Se Redis non e' pronto o non risponde, in memoria: nel caso
// peggiore un accesso si conta due volte, ma il traffico non si ferma mai
// (ADR040). Il middleware non attende niente: chiama subito next().
//
// Non contano: le richieste in sottofondo (intestazione x-edg-sfondo: 1, es.
// la campanella di EDG App che rilegge gli avvisi da qualunque pagina) e le
// richieste HEAD/OPTIONS. In accesso assistito l'evento nomina anche chi di
// EDG agisce (claim `assistenza` del token, ADR085).
//
// Parametro (limiti invalicabili):
//   GATEWAY_USO_PAUSA_MINUTI  pausa che chiude un accesso  32 (da 4 a 256)
// =============================================================================
const { parametro } = require('../config/parametri');

const PAUSA_SECONDI = parametro('GATEWAY_USO_PAUSA_MINUTI', 32, 4, 256) * 60;
/** Oltre questo numero di sessioni ricordate in memoria si tolgono le scadute */
const MEMORIA_PULIZIA = 4096;
const NON_CONTANO = new Set(['HEAD', 'OPTIONS']);

/** La richiesta e' in sottofondo o non e' un uso (pura) */
const nonConta = req => NON_CONTANO.has(String(req.method).toUpperCase()) || req.headers['x-edg-sfondo'] === '1';

/** Identificativo della sessione: quella del token, o la sessione assistita, o l'account (pura) */
function sessioneDi(utente) {
  if (utente?.sessionId) return String(utente.sessionId);
  if (utente?.assistenza?.id) return `as${utente.assistenza.id}`;
  return `a${utente?.accountId}`;
}

/** Chiave Redis del segno "gia' dentro" (pura) */
const chiaveUso = (utente, modulo) => `uso:${sessioneDi(utente)}:${modulo}`;

/** L'evento di accesso per log-service (pura) */
function eventoAccesso({ utente, modulo, istanza, ip, userAgent, transazioneId, adesso = new Date(), ambiente = 'development' }) {
  const assistenza = utente.assistenza
    ? {
        modo: utente.assistenza.modo,
        operatore: utente.assistenza.operatore ?? null,
        ...(utente.assistenza.perConto ? { perConto: utente.assistenza.perConto } : {}),
      }
    : null;
  const chi = assistenza?.operatore?.nome ? ` (assistenza EDG: ${assistenza.operatore.nome})` : '';
  const messaggio = `Accesso a ${modulo}: ${utente.email}${chi}`;
  const tipo = `${modulo}.accesso`;
  return {
    timestamp: adesso.toISOString(),
    categoria: 'USO',
    sottoCategoria: tipo,
    criticita: 'info',
    modulo,
    origine: {
      tipo: 'utente',
      id: String(utente.accountId),
      dettagli: { email: utente.email, ...(utente.tenantId != null ? { tenantId: utente.tenantId } : {}) },
    },
    azione: {
      tipo: 'custom',
      entita: istanza,
      idEntita: tipo,
      operazione: messaggio,
      dettagli: { modulo, sessione: sessioneDi(utente), pausaMinuti: PAUSA_SECONDI / 60, ...(assistenza ? { assistenza } : {}) },
    },
    risultato: { esito: 'successo', messaggio },
    contesto: {
      ambiente,
      ...(transazioneId ? { transazioneId } : {}),
      ...(utente.sessionId ? { sessione: String(utente.sessionId) } : {}),
      ...(ip ? { ip } : {}),
      ...(userAgent ? { userAgent } : {}),
    },
    tags: [istanza, 'uso', modulo],
  };
}

/**
 * @param {import('ioredis').Redis | null} redisClient
 * @param {{ invia: (body: object) => void, istanza: string }} logClient
 */
function createRegistroUso(redisClient, logClient) {
  /** Ripiego quando Redis non c'e': chiave -> istante di scadenza (ms) */
  const memoria = new Map();

  /** In memoria: true se e' un accesso nuovo; rinnova comunque la scadenza */
  function nuovoInMemoria(chiave, adesso) {
    const scade = memoria.get(chiave);
    memoria.set(chiave, adesso + PAUSA_SECONDI * 1000);
    if (memoria.size > MEMORIA_PULIZIA) for (const [k, t] of memoria) if (t <= adesso) memoria.delete(k);
    return !(scade > adesso);
  }

  /** true se e' un accesso nuovo; rinnova la finestra in ogni caso */
  async function nuovoAccesso(chiave) {
    const adesso = Date.now();
    if (!redisClient || redisClient.status !== 'ready') return nuovoInMemoria(chiave, adesso);
    try {
      const creato = await redisClient.set(chiave, '1', 'EX', PAUSA_SECONDI, 'NX');
      if (creato === 'OK') return true;
      redisClient.expire(chiave, PAUSA_SECONDI).catch(() => {});
      return false;
    } catch {
      return nuovoInMemoria(chiave, adesso); // Redis lento o in errore: mai bloccare (ADR040)
    }
  }

  /** Middleware per un modulo: non attende, chiama subito next() */
  return modulo => (req, res, next) => {
    next();
    const utente = req.userData;
    if (!utente?.accountId || nonConta(req)) return;
    void nuovoAccesso(chiaveUso(utente, modulo))
      .then(nuovo => {
        if (!nuovo) return;
        logClient.invia(
          eventoAccesso({
            utente,
            modulo,
            istanza: logClient.istanza,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            transazioneId: req.requestId,
            ambiente: process.env.NODE_ENV || 'development',
          })
        );
      })
      .catch(err => console.error('❌ [GATEWAY] Registro d\'uso:', err.message));
  };
}

module.exports = { createRegistroUso, eventoAccesso, chiaveUso, sessioneDi, nonConta, PAUSA_SECONDI };
