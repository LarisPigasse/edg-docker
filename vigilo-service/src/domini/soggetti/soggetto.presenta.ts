// =============================================================================
// Soggetti — come escono dalle API
// =============================================================================
import { riferimentoCategoria } from '../categorie/categoria.presenta';
import type { Contatore } from '../contatori/contatore.model';
import { IDENTIFICATIVO } from './datiTipo';
import type { Soggetto } from './soggetto.model';

export const riferimentoSoggetto = (s: Soggetto) => ({
  uuid: s.uuidSoggetto,
  tipo: s.tipo,
  nome: s.nome,
  identificativo: s.identificativo ?? null,
  stato: s.stato,
});

export const presentaContatore = (c: Contatore) => ({
  uuid: c.uuidContatore,
  unita: c.unita,
  nome: c.nome,
  valore: c.valore ?? null,
  lettoIl: c.lettoIl ?? null,
  usoGiornaliero: c.usoGiornaliero ?? null,
});

export function presentaSoggetto(s: Soggetto) {
  const extra = s.get() as { nAperte?: string | number; peggiore?: string | null; urgenza?: string | null };
  return {
    uuid: s.uuidSoggetto,
    tipo: s.tipo,
    categoria: s.categoria ? riferimentoCategoria(s.categoria) : null,
    nome: s.nome,
    identificativo: s.identificativo ?? null,
    etichettaIdentificativo: IDENTIFICATIVO[s.tipo],
    codice: s.codice ?? null,
    stato: s.stato,
    statoDal: s.statoDal ?? null,
    dati: s.dati,
    campi: s.campi,
    sede: s.sede ? riferimentoSoggetto(s.sede) : null,
    referente: s.referente ? riferimentoSoggetto(s.referente) : null,
    contatori: (s.contatori ?? []).map(presentaContatore),
    assegnazioni: (s.assegnazioni ?? []).map(a => ({
      uuid: a.uuidAssegnazione,
      persona: a.persona ? riferimentoSoggetto(a.persona) : null,
      dal: a.dal,
      al: a.al ?? null,
    })),
    note: s.note ?? null,
    ...(extra.nAperte !== undefined
      ? { scadenze: { aperte: Number(extra.nAperte), statoPeggiore: extra.peggiore ?? null, urgenzaIl: extra.urgenza ?? null } }
      : {}),
    creatoIl: s.createdAt,
    modificatoIl: s.updatedAt,
  };
}
