// =============================================================================
// Ereditarieta' a tre livelli (01-dominio 1.0, 02-modello-dati 2.2)
// =============================================================================
//   libreria EDG  --copia con origine-->  controllo del cliente
//   controllo     --eredita' viva------>  singola scadenza
// La copia avviene una volta (procedura di avvio). Qui solo l'eredita' viva:
// valore effettivo = ridefinizione della scadenza ?? valore del controllo.
// E' l'UNICO punto che fonde: nessun altro codice ripete questa logica.
// =============================================================================
import { CADENZA_UNA_TANTUM, GRUPPI, NESSUNA_TOLLERANZA, type Gruppo, type Impostazioni } from './tipi';

export type Origine = 'controllo' | 'scadenza' | 'predefinito';

export type Ridefinizioni = { [G in Gruppo]?: Impostazioni[G] | null };

export interface ImpostazioniEffettive extends Impostazioni {
  /** Da dove viene ogni gruppo: serve all'interfaccia (Dal controllo / Personalizzato) */
  origine: Record<Gruppo, Origine>;
}

/** Valori di partenza quando non c'e' un controllo (promemoria libero) */
export function impostazioniPredefinite(preavvisiGiorni: number[] = [32, 8, 1]): Impostazioni {
  return {
    cadenza: CADENZA_UNA_TANTUM,
    preavvisi: { giorni: [...preavvisiGiorni], uso: [] },
    tolleranza: NESSUNA_TOLLERANZA,
    destinatari: [{ tipo: 'ufficio' }],
  };
}

/**
 * Impostazioni effettive di una scadenza.
 * @param base          quelle del controllo, oppure le predefinite (promemoria libero)
 * @param ridefinizioni colonne della scadenza: assente o null = eredita
 * @param daControllo   true se `base` e' un controllo (cambia solo l'etichetta d'origine)
 */
export function impostazioniEffettive(
  base: Impostazioni,
  ridefinizioni: Ridefinizioni = {},
  daControllo = true
): ImpostazioniEffettive {
  const origineBase: Origine = daControllo ? 'controllo' : 'predefinito';
  const risultato = { ...base, origine: {} as Record<Gruppo, Origine> } as ImpostazioniEffettive;
  for (const g of GRUPPI) {
    const r = ridefinizioni[g];
    if (r !== undefined && r !== null) {
      (risultato as unknown as Record<Gruppo, unknown>)[g] = r;
      risultato.origine[g] = 'scadenza';
    } else {
      risultato.origine[g] = origineBase;
    }
  }
  return risultato;
}
