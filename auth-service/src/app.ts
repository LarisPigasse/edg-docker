// src/app.ts - EDG Auth Service (con logging dettagliato)
import { createServiceConfig } from './core/config/environment';
import { createServer, ServerModule } from './core/server';
import { DatabaseManager } from './core/config/database';
import cron from 'node-cron';

// Import modelli e associazioni
import {
  createAccountModel,
  createSessionModel,
  createResetTokenModel,
  createRoleModel,
  createRolePermissionModel,
  createTenantModel,
  createTenantModuleModel,
  setupAuthAssociations,
} from './modules/auth/models';

// Import services e routes
import { AuthService } from './modules/auth/services';
import { AuthController } from './modules/auth/controllers/AuthController';
import { SessionController } from './modules/auth/controllers/SessionController';
import { createAuthRouter } from './modules/auth/routes/auth.routes';
import { createAccountRouter } from './modules/auth/routes/account.routes';
import { createTenantRouter } from './modules/auth/routes/tenant.routes';
import { Router, Application, Request, Response, NextFunction } from 'express';
import { installCrashHandlers, logger } from './services/logger';
import { requestActor } from './services/requestActor';
import { requestContextMiddleware } from './services/requestContext';
import { runJob } from './services/jobRunner';

// Prima di tutto: un errore non gestito va segnalato a log-service prima di uscire (ADR043)
installCrashHandlers();

// ============================================================================
// CONFIGURAZIONE AUTH SERVICE
// ============================================================================

const config = createServiceConfig({
  serviceName: 'EDG Auth Service',
  port: 3001,
});

// ============================================================================
// PREPARAZIONE MODULO (solo modelli e associazioni)
// ============================================================================

console.log('\n [APP] Fase 1: Creazione placeholder router');
const placeholderRouter = Router();
console.log(' Placeholder router creato');

// Modulo contenente configurazione modelli e associazioni
const AuthModuleConfig: ServerModule = {
  name: 'auth',
  path: '/auth',
  router: placeholderRouter,
  models: [
    createRoleModel,
    createRolePermissionModel,
    createTenantModel,
    createTenantModuleModel,
    createAccountModel,
    createSessionModel,
    createResetTokenModel,
  ],
  associations: setupAuthAssociations,
};

console.log(' AuthModuleConfig creato con placeholder router');

// ============================================================================
// REQUEST LOGGER (ADR034)
// ============================================================================
// Stesso ruolo del request logger di system-service/vehicle-service: rete di
// sicurezza tecnica, filtrata da shouldPersistRequest() in services/logger.ts
// (letture riuscite e veloci scartate). Registrato come customMiddleware:
// EDGServer lo monta nel costruttore, dopo / e /health (quindi gli health
// check non passano mai di qui) e prima di tutte le route applicative.
//
// QUIET_ON_SUCCESS: scritture che, se riuscite, sono gia' coperte da un evento
// di audit esplicito (login, logout, reset e cambio password — ADR039) o sono
// puramente tecniche (refresh del token, ripetuto in automatico dal
// frontend). In caso di errore (>= 400) vengono comunque registrate.
const QUIET_ON_SUCCESS = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/request-reset-password',
  '/auth/reset-password',
  '/auth/change-password',
]);

const requestLogger = (app: Application): void => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    // Path completo catturato ORA: in 'finish' Express ha gia' riscritto
    // req.url/req.path relativi al router montato (es. '/refresh' invece di
    // '/auth/refresh') — vedi lezione L039.
    const path = req.path;
    res.on('finish', () => {
      if (res.statusCode < 400 && QUIET_ON_SUCCESS.has(path)) return;
      // Autore da req.account (solo route protette): sulle altre risulta 'sistema'
      logger.request(req.method, req.originalUrl, res.statusCode, Date.now() - start, requestActor(req));
    });
    next();
  });
};

// ============================================================================
// CREAZIONE SERVER (senza route ancora)
// ============================================================================

console.log('\n [APP] Fase 2: Creazione server');
const server = createServer({
  config,
  modules: [AuthModuleConfig],
  // Contesto della richiesta per primo (ADR039): l'ID dell'api-gateway arriva al logger
  customMiddleware: [app => app.use(requestContextMiddleware), requestLogger],
});
console.log(' Server creato (route non ancora registrate)');

// ============================================================================
// AVVIO SERVER CON INIZIALIZZAZIONE CORRETTA
// ============================================================================

const startServer = async () => {
  try {
    console.log(`\n [APP] Avvio ${config.serviceName}...`);

    // 1. INIZIALIZZA DATABASE
    console.log('\n [APP] Fase 3: Inizializzazione database');
    const dbReady = await server.initializeDatabase();
    if (!dbReady) {
      console.error(' [APP] Impossibile avviare il servizio senza database');
      process.exit(1);
    }
    console.log(' Database inizializzato');

    // 2. RECUPERA i modelli Sequelize inizializzati
    console.log('\n [APP] Fase 4: Recupero modelli dal database');
    const databaseManager: DatabaseManager = server.getDatabase();
    const models = databaseManager.getModels();

    const Account = models.find((m: any) => m.name === 'Account');
    const Session = models.find((m: any) => m.name === 'Session');
    const ResetToken = models.find((m: any) => m.name === 'ResetToken');
    const Role = models.find((m: any) => m.name === 'Role');
    const RolePermission = models.find((m: any) => m.name === 'RolePermission');
    const Tenant = models.find((m: any) => m.name === 'Tenant');
    const TenantModule = models.find((m: any) => m.name === 'TenantModule');

    if (!Account || !Session || !ResetToken || !Role || !RolePermission || !Tenant || !TenantModule) {
      throw new Error('Errore: modelli richiesti non trovati dopo inizializzazione');
    }
    console.log('  Tutti i modelli trovati');

    // 3. INIZIALIZZA la logica di business (Service e Controller)
    console.log('\n [APP] Fase 5: Creazione Service e Controller');
    const authService = new AuthService(Account, Session, ResetToken, Role, RolePermission, TenantModule, Tenant);
    console.log('  AuthService creato');

    const authController = new AuthController(authService);
    console.log('  AuthController creato');

    const sessionController = new SessionController(Session, Account);
    console.log('  SessionController creato');

    console.log('\n [APP] Fase 6: Creazione router VERO con tutte le route');
    const authRouter = createAuthRouter(authController, sessionController);
    console.log('  Router vero creato');

    // Debug: Verifica che il router abbia le route
    console.log('\n [APP] DEBUG: Verifica route nel router appena creato');
    const routerStack = (authRouter as any).stack;
    console.log(`  Numero di route nel router: ${routerStack ? routerStack.length : 0}`);
    if (routerStack && routerStack.length > 0) {
      console.log('  Route presenti nel router:');
      routerStack.forEach((layer: any, index: number) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          console.log(`      ${index + 1}. ${methods} ${layer.route.path}`);
        }
      });
    } else {
      console.log('ATTENZIONE: Il router sembra vuoto!');
    }

    // 4. SOSTITUISCI il router placeholder con quello VERO
    console.log('\n [APP] Fase 7: Sostituzione placeholder con router vero');
    console.log(` Router PRIMA: ${AuthModuleConfig.router === placeholderRouter ? 'PLACEHOLDER' : 'VERO'}`);
    AuthModuleConfig.router = authRouter;
    console.log(` Router DOPO: ${AuthModuleConfig.router === authRouter ? 'VERO' : 'PLACEHOLDER'}`);
    console.log(' Router sostituito nel modulo');

    // 5. REGISTRA LE ROUTE
    console.log('\n🔧 [APP] Fase 8: Registrazione route nel server Express');
    server.registerModuleRoutes();

    console.log('   ✅ Route registrate con successo!');

    // 5.1 CREA E REGISTRA ROUTER ACCOUNTS
    console.log('\n🔧 [APP] Fase 8.1: Creazione e registrazione router accounts');
    const app = server.getApp();
    const accountRouter = createAccountRouter(Account, Role, Session, Tenant, RolePermission);
    app.use('/auth/accounts', accountRouter);
    console.log('   ✅ Router accounts creato e registrato!');

    // 5.1bis CREA E REGISTRA ROUTER TENANTS (menu "SISTEMA", solo root)
    console.log('\n🔧 [APP] Fase 8.1bis: Creazione e registrazione router tenants');
    const tenantRouter = createTenantRouter(Tenant);
    app.use('/auth/tenants', tenantRouter);
    console.log('   ✅ Router tenants creato e registrato!');

    // 5.2 CRON JOB — pulizia sessioni e token scaduti
    console.log('\n🔧 [APP] Fase 8.2: Setup cron job pulizia sessioni');
    // Ogni giorno alle 03:00 (Europe/Rome)
    // Eseguito e tracciato da runJob (ADR039): job.completed / job.failed in log-service
    const cleanupExpired = () =>
      runJob('auth.cleanup-expired', 'Pulizia sessioni e token scaduti', async () => {
        const { sessions, resetTokens } = await authService.cleanupExpired();
        return `${sessions} sessioni e ${resetTokens} token di reset eliminati`;
      });
    cron.schedule('0 3 * * *', cleanupExpired, { timezone: 'Europe/Rome' });
    console.log('   ✅ Cron job registrato (ogni giorno alle 03:00 Europe/Rome)');
    // In sviluppo il PC di notte e' spento: recupero all'avvio (come vehicle-service)
    if (process.env.CRON_RUN_ON_START === 'true') {
      console.log('   ⏱️  CRON_RUN_ON_START=true → pulizia eseguita subito');
      void cleanupExpired();
    }

    // 6. CRITICO: Registra error handlers DOPO le route!
    console.log('\n [APP] Fase 9: Registrazione error handlers (404, 500)');
    server.setupErrorHandlers();

    console.log(' Error handlers registrati!');

    // 7. Avvia server HTTP
    console.log('\n [APP] Fase 10: Avvio server HTTP');
    app.listen(config.port, () => {
      console.log(`\n ${config.serviceName} avviato con successo!`);
      console.log(` Server: http://localhost:${config.port}`);
      console.log(` Database: ${config.database.name}@${config.database.host}`);
      console.log(` Moduli: auth`);
      console.log(` Pronto per ricevere richieste!\n`);

      console.log(' Test suggeriti:');
      console.log(' curl http://localhost:3001/');
      console.log(' curl http://localhost:3001/health');
      console.log(
        '   curl -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d \'{"email":"test@edg.com"}\''
      );
      console.log('');
    });

    // Graceful shutdown handlers
    const handleShutdown = async (signal: string) => {
      console.log(`\n Shutdown graceful in corso (${signal})...`);
      try {
        await databaseManager.close();
        console.log(' Servizio terminato correttamente');
        process.exit(0);
      } catch (error) {
        console.error(' Errore durante shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error(" [APP] Errore durante l'avvio:", error);
    process.exit(1);
  }
};

// Avvia il server
startServer();

export default server;
