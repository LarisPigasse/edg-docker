// Piano della procedura di avvio (03-libreria-avvio 3.5): cosa si copia, cosa si registra
import { pianoAvvio, type IngressoPiano } from '../../src/domini/avvio/piano';

const base = (scelte: IngressoPiano['scelte'], gia: { categorie?: string[]; controlli?: string[] } = {}): IngressoPiano => ({
  categorie: [{ chiave: 'pesante' }, { chiave: 'leggero' }],
  controlli: [
    { chiave: 'revisione', categorie: ['pesante', 'leggero'] },
    { chiave: 'tachigrafo', categorie: ['pesante'] },
    { chiave: 'durc', categorie: [] },
  ],
  categorieDelTenant: new Set(gia.categorie ?? []),
  controlliDelTenant: new Set(gia.controlli ?? []),
  scelte,
});

describe('piano di avvio', () => {
  test('primo avvio: scelte copiate, il resto escluso', () => {
    const p = pianoAvvio(base({ categorie: ['pesante'], controlli: ['revisione', 'durc'] }));
    expect(p.categorie).toEqual({ crea: ['pesante'], escluse: ['leggero'], giaPresenti: [] });
    expect(p.controlli.crea).toEqual([
      { chiave: 'revisione', categorie: ['pesante'] },
      { chiave: 'durc', categorie: [] },
    ]);
    expect(p.controlli.esclusi).toEqual(['tachigrafo']);
    expect(p.errori).toEqual({ nonProposte: [], senzaCategoria: [] });
  });

  test('parto da zero: tutto escluso, nessun errore', () => {
    const p = pianoAvvio(base({ categorie: [], controlli: [] }));
    expect(p.categorie.crea).toEqual([]);
    expect(p.controlli.crea).toEqual([]);
    expect(p.categorie.escluse).toHaveLength(2);
    expect(p.controlli.esclusi).toHaveLength(3);
  });

  test('ripetuto: le voci gia presenti si saltano e non si registrano', () => {
    const p = pianoAvvio(base({ categorie: ['pesante', 'leggero'], controlli: ['revisione', 'tachigrafo'] }, { categorie: ['pesante'], controlli: ['revisione'] }));
    expect(p.categorie).toEqual({ crea: ['leggero'], escluse: [], giaPresenti: ['pesante'] });
    expect(p.controlli.crea).toEqual([{ chiave: 'tachigrafo', categorie: ['pesante'] }]);
    expect(p.controlli.giaPresenti).toEqual(['revisione']);
    expect(p.controlli.esclusi).toEqual(['durc']);
  });

  test('un controllo si collega anche a categorie del cliente fuori dalla proposta', () => {
    const i = base({ categorie: [], controlli: ['tachigrafo'] }, { categorie: ['pesante'] });
    i.categorie = [{ chiave: 'leggero' }];
    expect(pianoAvvio(i).controlli.crea).toEqual([{ chiave: 'tachigrafo', categorie: ['pesante'] }]);
  });

  test('controllo senza nessuna delle sue categorie: errore', () => {
    const p = pianoAvvio(base({ categorie: ['leggero'], controlli: ['tachigrafo', 'revisione'] }));
    expect(p.errori.senzaCategoria).toEqual(['tachigrafo']);
    expect(p.controlli.crea).toEqual([{ chiave: 'revisione', categorie: ['leggero'] }]);
  });

  test('voci non proposte dai modelli scelti: errore', () => {
    const p = pianoAvvio(base({ categorie: ['rimorchio'], controlli: ['atp'] }));
    expect(p.errori.nonProposte).toEqual(['rimorchio', 'atp']);
  });
});
