// src/modules/auth/seed/root-account.seed.ts
import { v4 as uuidv4 } from 'uuid';
import { createServiceConfig } from '../../../core/config/environment';
import { DatabaseManager } from '../../../core/config/database';
import { 
  createAccountModel, 
  createRoleModel, 
  createRolePermissionModel,
  createSessionModel,
  createResetTokenModel,
  setupAuthAssociations 
} from '../models';
import { PasswordUtils } from '../utils';

// ============================================================================
// CONFIGURAZIONE ACCOUNT ROOT
// ============================================================================

// ⚠️ MODIFICA QUESTI VALORI CON I TUOI DATI
const ROOT_ACCOUNT = {
  email: 'renato.casalena@gmail.com',  // La tua email
  password: 'Root@2026!',               // Password temporanea - CAMBIALA dopo il primo accesso!
  accountType: 'operatore' as const,    // Tipo account (operatore per pro-frontend)
};

// ============================================================================
// FUNZIONE PRINCIPALE
// ============================================================================

async function createRootAccount() {
  let dbManager: DatabaseManager | null = null;

  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         CREAZIONE ACCOUNT ROOT - EDG Auth Service         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // 1. Carica configurazione
    const config = createServiceConfig({
      serviceName: 'EDG Auth Seed',
      port: 3001,
    });

    // 2. Inizializza database
    console.log('📊 Connessione al database...');
    dbManager = new DatabaseManager(config);
    
    const connected = await dbManager.testConnection();
    if (!connected) {
      throw new Error('Impossibile connettersi al database');
    }

    // 3. Registra modelli
    console.log('📝 Registrazione modelli...');
    const sequelize = dbManager.getSequelize();
    const Account = createAccountModel(sequelize);
    const Session = createSessionModel(sequelize);
    const ResetToken = createResetTokenModel(sequelize);
    const Role = createRoleModel(sequelize);
    const RolePermission = createRolePermissionModel(sequelize);

    // Setup associazioni (passa tutti i modelli)
    setupAuthAssociations([Account, Session, ResetToken, Role, RolePermission]);

    console.log('✅ Modelli registrati\n');

    // 4. Verifica che esista il ruolo "root"
    console.log('🔍 Verifica ruolo "root"...');
    const rootRole = await Role.findOne({
      where: { name: 'root' },
    });

    if (!rootRole) {
      console.error('❌ Ruolo "root" non trovato!');
      console.error('   Esegui prima: npm run seed:roles');
      process.exit(1);
    }

    console.log(`✅ Ruolo "root" trovato (ID: ${(rootRole as any).id})\n`);

    // 5. Verifica se l'account esiste già
    console.log(`🔍 Verifica account esistente: ${ROOT_ACCOUNT.email}...`);
    const existingAccount = await Account.findOne({
      where: { 
        email: ROOT_ACCOUNT.email,
        accountType: ROOT_ACCOUNT.accountType,
      },
    });

    if (existingAccount) {
      console.log('⚠️  Account già esistente!');
      console.log(`   Email: ${ROOT_ACCOUNT.email}`);
      console.log(`   Tipo: ${ROOT_ACCOUNT.accountType}`);
      console.log(`   ID: ${(existingAccount as any).id}`);
      console.log('\n💡 Se vuoi reimpostare la password, usa la funzione "Password dimenticata"');
      console.log('   oppure elimina manualmente l\'account dal database.\n');
      
      await dbManager.close();
      process.exit(0);
    }

    // 6. Hash della password
    console.log('🔐 Generazione hash password...');
    const passwordHash = await PasswordUtils.hash(ROOT_ACCOUNT.password);
    console.log('✅ Password hashata\n');

    // 7. Crea account root
    console.log('📝 Creazione account root...');
    const newAccount = await Account.create({
      uuid: uuidv4(),
      email: ROOT_ACCOUNT.email,
      password: passwordHash,
      accountType: ROOT_ACCOUNT.accountType,
      entityId: uuidv4(), // UUID fittizio per l'entità root
      roleId: (rootRole as any).id,
      isActive: true,
      isVerified: true, // Già verificato (è root)
    });

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ACCOUNT ROOT CREATO CON SUCCESSO             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📋 Dettagli account:');
    console.log('┌─────────────────┬────────────────────────────────────────┐');
    console.log(`│ ID              │ ${String((newAccount as any).id).padEnd(38)} │`);
    console.log(`│ UUID            │ ${(newAccount as any).uuid.padEnd(38)} │`);
    console.log(`│ Email           │ ${ROOT_ACCOUNT.email.padEnd(38)} │`);
    console.log(`│ Tipo Account    │ ${ROOT_ACCOUNT.accountType.padEnd(38)} │`);
    console.log(`│ Ruolo           │ root (ID: ${(rootRole as any).id})`.padEnd(41) + '│');
    console.log(`│ Permessi        │ * (accesso completo)`.padEnd(41) + '│');
    console.log('└─────────────────┴────────────────────────────────────────┘\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('   1. Cambia la password dopo il primo accesso!');
    console.log('   2. Non condividere queste credenziali');
    console.log('   3. Usa questo account solo per operazioni amministrative\n');

    console.log('🔑 Credenziali di accesso:');
    console.log(`   Email:    ${ROOT_ACCOUNT.email}`);
    console.log(`   Password: ${ROOT_ACCOUNT.password}`);
    console.log('');

    // 8. Chiudi connessione
    await dbManager.close();
    console.log('✅ Connessione database chiusa\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRORE durante creazione account root:');
    console.error(error);

    if (dbManager) {
      await dbManager.close();
    }

    process.exit(1);
  }
}

// Esegui script
createRootAccount();
