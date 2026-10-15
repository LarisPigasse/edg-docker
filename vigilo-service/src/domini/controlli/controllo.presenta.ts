// =============================================================================
// Controlli — come escono dalle API
// =============================================================================
// Con le frasi pronte delle impostazioni ("ogni 2 anni dall'immatricolazione...")
// cosi' il frontend non ripete le regole dei testi.
// =============================================================================
import { descriviCadenza, descriviPreavvisi, descriviTolleranza, type Cadenza, type Preavvisi, type Tolleranza } from '../../regole';
import { riferimentoCategoria } from '../categorie/categoria.presenta';
import { etichetteDate, type TipoSoggetto } from '../valori';
import type { Controllo } from './controllo.model';

interface Regole {
  tipoSoggetto: TipoSoggetto;
  cadenza: Cadenza;
  preavvisi: Preavvisi;
  tolleranza: Tolleranza;
}

/** Le tre frasi di un controllo, del cliente o della libreria */
export function frasiControllo(c: Regole) {
  const unita = c.cadenza.uso?.unita ?? null;
  return {
    cadenza: descriviCadenza(c.cadenza, etichetteDate(c.tipoSoggetto)),
    preavvisi: descriviPreavvisi(c.preavvisi, unita),
    tolleranza: descriviTolleranza(c.tolleranza, unita),
  };
}

export function presentaControllo(c: Controllo) {
  const conteggi = c.get() as { nAperte?: string | number };
  return {
    uuid: c.uuidControllo,
    nome: c.nome,
    descrizione: c.descrizione ?? null,
    riferimentoNormativo: c.riferimentoNormativo ?? null,
    natura: c.natura,
    tipoSoggetto: c.tipoSoggetto,
    automatico: c.automatico,
    cadenza: c.cadenza,
    preavvisi: c.preavvisi,
    tolleranza: c.tolleranza,
    destinatari: c.destinatari,
    rinnovo: c.rinnovo,
    rinviabile: c.rinviabile,
    avvisaAncheSeFermo: c.avvisaAncheSeFermo,
    registrazione: c.registrazione,
    ordine: c.ordine,
    attivo: c.attivo,
    categorie: (c.categorie ?? []).map(riferimentoCategoria),
    frasi: frasiControllo(c),
    libreria: c.chiaveLibreria ? { chiave: c.chiaveLibreria, versione: c.versioneLibreria, versioneIgnorata: c.versioneIgnorata ?? null } : null,
    ...(conteggi.nAperte !== undefined ? { scadenzeAperte: Number(conteggi.nAperte) } : {}),
    creatoIl: c.createdAt,
    modificatoIl: c.updatedAt,
  };
}
