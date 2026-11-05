# Strumenti di sviluppo (EDG / Vigilo)

Copie degli strumenti che l'assistente usa sul VM del dispositivo, salvati qui
perché la cartella di lavoro del VM (`~`) non sopravvive fra le conversazioni.
All'inizio di una nuova conversazione: `cp docs/dev-knowledge/strumenti/w.py ~/w.py`.

- `w.py` — modifiche sul posto conservando CRLF/LF.
  `python3 ~/w.py write <file> [lf|crlf]` (contenuto da stdin) ·
  `python3 ~/w.py edit <file>` (stdin JSON `[[vecchio, nuovo], ...]`, ogni vecchio una sola volta).
- `comando.sh` — `bash comando.sh prove/x/prove.js [MODO=piano] > cmd.txt`: il testo per
  `exec-in-container` (gzip+base64, nessuna virgoletta esterna).
- `prove/` — script dal vivo. Quelli che richiedono `pg` (`b10b/*`, `demo/snapshot.js`,
  `demo/verifica.js`) vanno nel container **vigilo-service**; gli altri nel container **auth-service** (ha `jsonwebtoken`,
  `JWT_SECRET`, `mysql2`; chiamano `http://api-gateway-1:8080` e `-2`). Niente segreti nei file:
  tutto dalle variabili d'ambiente del container.
  - `aa4/codice.js` codice d'ingresso di un'assistenza di prova (`node /tmp/codice.js 9`), `aa4/prove.js`, `aa5/prove.js`
  - `b9c`, `f0`, `f1`, `csv` prove dei rispettivi blocchi
  - `b10b/simula.js` e `ripristina.js` simulano/ripristinano un aggiornamento della libreria
  - `demo/` dati demo del Tenant Demo (tenant 2): `demo.js`, `guasti.js`, `snapshot.js`, `verifica.js`
  - `costo/demo.js` costo di possesso sui mezzi, `costo/prove.js` (tappa 1, ADR108)
  - `rifornimenti/demo.js` (`MODO=piano|scrivi`, 742 rifornimenti già caricati: non rilanciare con scrivi),
    `rifornimenti/prove.js` (tappa 2, ADR109; si ripulisce da solo)
