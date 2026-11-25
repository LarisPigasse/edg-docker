// =============================================================================
// PARAMETRI DEL GATEWAY — dall'ambiente, con limiti invalicabili (ADR093)
// =============================================================================
// Un valore assente o non numerico vale il predefinito; uno fuori dai limiti
// si ferma al bordo e lo si scrive nel log. Il gateway non si ferma mai per un
// errore di configurazione.
// =============================================================================

/** Valore intero dall'ambiente, dentro i limiti; fuori dai limiti si ferma al bordo */
function parametro(nome, predefinito, min, max, env = process.env) {
  const letto = parseInt(env[nome], 10);
  const valore = Number.isFinite(letto) ? letto : predefinito;
  const limitato = Math.min(max, Math.max(min, valore));
  if (limitato !== valore) console.warn(`⚠️ [GATEWAY] ${nome}=${valore} fuori dai limiti (${min}-${max}): uso ${limitato}`);
  return limitato;
}

module.exports = { parametro };
