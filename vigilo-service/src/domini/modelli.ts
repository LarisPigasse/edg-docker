// =============================================================================
// Modelli di Vigilo + associazioni (blocco B3)
// =============================================================================
// Ogni modello vive nel suo dominio; qui solo i collegamenti, in un posto, e
// l'esportazione unica. Va importato prima delle rotte (domini/index.ts).
// Le FK e le regole di cancellazione vere sono nella migrazione: qui
// constraints: false, Sequelize non deve crearle ne' dedurle.
// =============================================================================
import { LibreriaCategoria } from './libreria/libreriaCategoria.model';
import { LibreriaControllo } from './libreria/libreriaControllo.model';
import { ModelloSettore, ModelloVoce } from './libreria/modelloSettore.model';
import { ImpostazioniTenant } from './impostazioni/impostazioni.model';
import { Categoria } from './categorie/categoria.model';
import { Soggetto } from './soggetti/soggetto.model';
import { Assegnazione } from './soggetti/assegnazione.model';
import { Fornitore } from './fornitori/fornitore.model';
import { Controllo } from './controlli/controllo.model';
import { ControlloCategoria } from './controlli/controlloCategoria.model';
import { Contatore } from './contatori/contatore.model';
import { Lettura } from './contatori/lettura.model';
import { Scadenza } from './scadenze/scadenza.model';
import { Registrazione } from './registrazioni/registrazione.model';
import { Allegato } from './allegati/allegato.model';
import { Avviso } from './avvisi/avviso.model';
import { Consegna } from './avvisi/consegna.model';
import { PreferenzeAvvisi } from './avvisi/preferenzeAvvisi.model';
import { RecapitoEmail } from './avvisi/recapitoEmail.model';
import { DecisioneLibreria } from './aggiornamenti/decisioneLibreria.model';

const fk = (foreignKey: string) => ({ foreignKey, constraints: false });

// Libreria: modello di settore 1-n voci
ModelloSettore.hasMany(ModelloVoce, { ...fk('chiaveModello'), sourceKey: 'chiave', as: 'voci' });
ModelloVoce.belongsTo(ModelloSettore, { ...fk('chiaveModello'), targetKey: 'chiave', as: 'modello' });

// Categorie 1-n soggetti
Categoria.hasMany(Soggetto, { ...fk('idCategoria'), as: 'soggetti' });
Soggetto.belongsTo(Categoria, { ...fk('idCategoria'), as: 'categoria' });

// Soggetto -> sede e referente (altri soggetti)
Soggetto.belongsTo(Soggetto, { ...fk('idSede'), as: 'sede' });
Soggetto.belongsTo(Soggetto, { ...fk('idReferente'), as: 'referente' });

// Assegnazioni: soggetto usato da una persona
Soggetto.hasMany(Assegnazione, { ...fk('idSoggetto'), as: 'assegnazioni' });
Soggetto.hasMany(Assegnazione, { ...fk('idPersona'), as: 'incarichi' });
Assegnazione.belongsTo(Soggetto, { ...fk('idSoggetto'), as: 'soggetto' });
Assegnazione.belongsTo(Soggetto, { ...fk('idPersona'), as: 'persona' });

// Contatori e letture
Soggetto.hasMany(Contatore, { ...fk('idSoggetto'), as: 'contatori' });
Contatore.belongsTo(Soggetto, { ...fk('idSoggetto'), as: 'soggetto' });
Contatore.hasMany(Lettura, { ...fk('idContatore'), as: 'letture' });
Lettura.belongsTo(Contatore, { ...fk('idContatore'), as: 'contatore' });
Lettura.belongsTo(Registrazione, { ...fk('idRegistrazione'), as: 'registrazione' });

// Controlli n-n categorie
Controllo.belongsToMany(Categoria, {
  through: ControlloCategoria,
  foreignKey: 'idControllo',
  otherKey: 'idCategoria',
  as: 'categorie',
  constraints: false,
});
Categoria.belongsToMany(Controllo, {
  through: ControlloCategoria,
  foreignKey: 'idCategoria',
  otherKey: 'idControllo',
  as: 'controlli',
  constraints: false,
});

// Scadenze
Soggetto.hasMany(Scadenza, { ...fk('idSoggetto'), as: 'scadenze' });
Scadenza.belongsTo(Soggetto, { ...fk('idSoggetto'), as: 'soggetto' });
Controllo.hasMany(Scadenza, { ...fk('idControllo'), as: 'scadenze' });
Scadenza.belongsTo(Controllo, { ...fk('idControllo'), as: 'controllo' });
Scadenza.belongsTo(Contatore, { ...fk('idContatore'), as: 'contatore' });

// Registrazioni
Scadenza.hasMany(Registrazione, { ...fk('idScadenza'), as: 'registrazioni' });
Registrazione.belongsTo(Scadenza, { ...fk('idScadenza'), as: 'scadenza' });
Registrazione.belongsTo(Scadenza, { ...fk('idScadenzaSuccessiva'), as: 'successiva' });
Registrazione.belongsTo(Fornitore, { ...fk('idFornitore'), as: 'fornitore' });
Registrazione.belongsTo(Contatore, { ...fk('idContatore'), as: 'contatore' });
Fornitore.hasMany(Registrazione, { ...fk('idFornitore'), as: 'registrazioni' });

// Avvisi e consegne
Scadenza.hasMany(Avviso, { ...fk('idScadenza'), as: 'avvisi' });
Avviso.belongsTo(Scadenza, { ...fk('idScadenza'), as: 'scadenza' });
Avviso.hasMany(Consegna, { ...fk('idAvviso'), as: 'consegne' });
Consegna.belongsTo(Avviso, { ...fk('idAvviso'), as: 'avviso' });

export {
  LibreriaCategoria,
  LibreriaControllo,
  ModelloSettore,
  ModelloVoce,
  ImpostazioniTenant,
  Categoria,
  Soggetto,
  Assegnazione,
  Fornitore,
  Controllo,
  ControlloCategoria,
  Contatore,
  Lettura,
  Scadenza,
  Registrazione,
  Allegato,
  Avviso,
  Consegna,
  PreferenzeAvvisi,
  RecapitoEmail,
  DecisioneLibreria,
};
