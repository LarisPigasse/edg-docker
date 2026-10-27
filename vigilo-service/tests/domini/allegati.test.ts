// Documenti (allegati) di soggetti, scadenze e registrazioni (B9a)
import { LIMITI_ALLEGATI, TIPI_ALLEGATO, byteMassimi, intestazioneNome, nomePulito, tipoDaFirma } from '../../src/domini/allegati/allegati';

const byte = (...x: (number | string)[]) => Uint8Array.from(x.flatMap(v => (typeof v === 'string' ? [...v].map(c => c.charCodeAt(0)) : [v])));

describe('documenti: tipo dai primi byte (B9a)', () => {
  test('PDF, JPEG, PNG, WEBP, HEIC, HEIF', () => {
    expect(tipoDaFirma(byte('%PDF-1.7'))?.mime).toBe('application/pdf');
    expect(tipoDaFirma(byte(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe('image/jpeg');
    expect(tipoDaFirma(byte(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe('image/png');
    expect(tipoDaFirma(byte('RIFF', 0, 0, 0, 0, 'WEBP'))?.mime).toBe('image/webp');
    expect(tipoDaFirma(byte(0, 0, 0, 24, 'ftypheic'))?.mime).toBe('image/heic');
    expect(tipoDaFirma(byte(0, 0, 0, 24, 'ftypmif1'))?.mime).toBe('image/heif');
  });

  test('il resto no: eseguibili travestiti, zip, testo, file vuoti, video', () => {
    expect(tipoDaFirma(byte('MZ', 0x90, 0))).toBeNull();
    expect(tipoDaFirma(byte('PK', 3, 4))).toBeNull();
    expect(tipoDaFirma(byte('ciao'))).toBeNull();
    expect(tipoDaFirma(new Uint8Array())).toBeNull();
    expect(tipoDaFirma(byte(0, 0, 0, 24, 'ftypisom'))).toBeNull();
  });

  test('solo PDF e immagini mostrabili si aprono nel browser', () => {
    expect(TIPI_ALLEGATO['application/pdf'].apribile).toBe(true);
    expect(TIPI_ALLEGATO['image/heic'].apribile).toBe(false);
  });
});

describe('documenti: nomi (B9a)', () => {
  const pdf = TIPI_ALLEGATO['application/pdf'];
  test('senza cartelle e caratteri di controllo, con l estensione', () => {
    expect(nomePulito('C:\\Users\\mario\\Patente  rinnovata.pdf', pdf)).toBe('Patente rinnovata.pdf');
    expect(nomePulito('../../etc/passwd', pdf)).toBe('passwd.pdf');
    expect(nomePulito('fattura\u0007"<1>".pdf', pdf)).toBe('fattura1.pdf');
    expect(nomePulito('', pdf)).toBe('documento.pdf');
  });

  test('entro il limite, l estensione resta', () => {
    const n = nomePulito(`${'a'.repeat(400)}.pdf`, pdf);
    expect(n).toHaveLength(LIMITI_ALLEGATI.nomeFile);
    expect(n.endsWith('.pdf')).toBe(true);
  });

  test('Content-Disposition con UTF-8 e ripiego ASCII', () => {
    expect(intestazioneNome('Visita medica è.pdf', true)).toBe(`inline; filename="Visita medica e_.pdf"; filename*=UTF-8''Visita%20medica%20%C3%A8.pdf`);
    expect(intestazioneNome('a.pdf', false).startsWith('attachment;')).toBe(true);
    expect(byteMassimi(16)).toBe(16 * 1024 * 1024);
  });
});
