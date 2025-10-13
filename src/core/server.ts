// src/core/server.ts - EDG Server Core (con logging dettagliato)
import express, { Application, Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ServiceConfig, isDevelopment } from './config/environment';
import { DatabaseManager } from './config/database';

export interface ServerModule {
  name: string;
  path: string;
  router: Router;
  models?: Array<(sequelize: any) => any>;
  associations?: (models: any[]) => void;
}

export interface ServerOptions {
  config: ServiceConfig;
  modules?: ServerModule[];
  customMiddleware?: Array<(app: Application) => void>;
}

export class EDGServer {
  private app: Application;
  private config: ServiceConfig;
  private database: DatabaseManager;
  private modules: ServerModule[];

  constructor(options: ServerOptions) {
    this.app = express();
    this.config = options.config;
    this.database = new DatabaseManager(this.config);
    this.modules = options.modules || [];

    console.log('🔧 [SERVER] Constructor: Setup middleware e endpoint base');
    this.setupMiddleware();
    this.setupHealthAndRoot();
    // ⚠️ NON chiamiamo setupErrorHandling qui - deve essere DOPO le route!
    console.log('   ✅ Middleware e endpoint base configurati');

    // Custom middleware per servizi specifici
    if (options.customMiddleware) {
      options.customMiddleware.forEach(middleware => {
        middleware(this.app);
      });
    }
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(
      helmet({
        contentSecurityPolicy: isDevelopment(this.config) ? false : undefined,
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);

          if (this.config.cors.origins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn(`🚫 CORS: Origine non consentita: ${origin}`);
            callback(new Error('Non consentito da CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // Rate limiting globale
    const globalLimiter = rateLimit({
      windowMs: this.config.security.rateLimitWindow * 60 * 1000,
      max: this.config.security.rateLimitMaxAttempts,
      message: {
        success: false,
        error: 'Troppe richieste da questo IP, riprova più tardi',
        retryAfter: this.config.security.rateLimitWindow * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(globalLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging in development
    if (isDevelopment(this.config)) {
      this.app.use((req, res, next) => {
        console.log(`🔍 ${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * Setup endpoint base (/, /health)
   * Questi vengono registrati subito nel constructor
   */
  private setupHealthAndRoot(): void {
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          message: `${this.config.serviceName} - Ready`,
          service: this.config.serviceName,
          version: '1.0.0',
          environment: this.config.nodeEnv,
          modules: this.modules.map(m => ({
            name: m.name,
            path: m.path,
          })),
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const dbHealth = await this.database.healthCheck();

        const response = {
          success: dbHealth.status === 'healthy',
          data: {
            status: dbHealth.status,
            service: this.config.serviceName,
            database: dbHealth.details,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
        };

        res.status(dbHealth.status === 'healthy' ? 200 : 503).json(response);
      } catch (error) {
        res.status(503).json({
          success: false,
          data: {
            status: 'error',
            service: this.config.serviceName,
            error: 'Health check fallito',
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
  }

  /**
   * ✅ NUOVO: Registra le route dei moduli
   * Questo metodo viene chiamato DOPO l'inizializzazione del database
   * quando i router reali sono pronti
   */
  public registerModuleRoutes(): void {
    console.log('\n📦 [SERVER] Registrazione route moduli...');

    this.modules.forEach(module => {
      console.log(`\n   🔧 Modulo: ${module.name}`);
      console.log(`      Path: ${module.path}`);

      // Debug: Verifica il router prima di registrarlo
      const routerStack = (module.router as any).stack;
      console.log(`      Router stack length: ${routerStack ? routerStack.length : 'undefined'}`);

      if (routerStack && routerStack.length > 0) {
        console.log(`      ✅ Router ha ${routerStack.length} route`);
        routerStack.forEach((layer: any, index: number) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`         ${index + 1}. ${methods} ${layer.route.path}`);
          }
        });
      } else {
        console.log(`      ⚠️  ATTENZIONE: Router vuoto!`);
      }

      // Registra il router in Express
      console.log(`      🔗 Registrando: app.use('${module.path}', router)`);
      this.app.use(module.path, module.router);
      console.log(`      ✅ Registrato`);
    });

    console.log('\n✅ [SERVER] Route moduli registrate\n');
  }

  /**
   * ✅ NUOVO: Registra error handlers
   * Questo metodo DEVE essere chiamato DOPO registerModuleRoutes()
   * perché in Express l'ordine è critico: le route devono essere registrate
   * PRIMA degli error handlers, altrimenti il 404 handler cattura tutto!
   */
  public setupErrorHandlers(): void {
    console.log('🔧 [SERVER] Registrazione error handlers (404 e 500)...');
    this.setupErrorHandling();
    console.log('   ✅ Error handlers registrati\n');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      console.log(`⚠️  [SERVER] 404: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.originalUrl} non trovato`,
        service: this.config.serviceName,
        availableEndpoints: ['GET /', 'GET /health', ...this.modules.map(m => `${m.path}/*`)],
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('❌ [SERVER] Errore non gestito:', error);

      const isDev = isDevelopment(this.config);

      res.status(error.status || 500).json({
        success: false,
        error: isDev ? error.message : 'Errore interno del server',
        service: this.config.serviceName,
        ...(isDev && { stack: error.stack }),
        timestamp: new Date().toISOString(),
      });
    });
  }

  async initializeDatabase(): Promise<boolean> {
    // Test connessione
    const connected = await this.database.testConnection();
    if (!connected) return false;

    // Registra modelli dei moduli
    this.modules.forEach(module => {
      if (module.models) {
        module.models.forEach(modelInit => {
          this.database.registerModel(modelInit);
        });
      }
    });

    // Registra associazioni dei moduli
    this.modules.forEach(module => {
      if (module.associations) {
        this.database.registerAssociations(module.associations);
      }
    });

    // Sync se richiesto
    if (process.env.DB_SYNC === 'true') {
      console.log('🔄 Sincronizzazione database richiesta...');
      const synced = await this.database.syncDatabase();
      if (synced) {
        console.log('✅ Database sincronizzato');
      }
      return synced;
    } else {
      console.log('⏭️  Sync database saltata (aggiungi DB_SYNC=true per sincronizzare)');
      return true;
    }
  }

  async start(): Promise<void> {
    try {
      console.log(`🚀 Avvio ${this.config.serviceName}...`);

      // Inizializza database
      const dbReady = await this.initializeDatabase();
      if (!dbReady) {
        console.error('❌ Impossibile avviare il servizio senza database');
        process.exit(1);
      }

      // Avvia server HTTP
      this.app.listen(this.config.port, () => {
        console.log(`\n✅ ${this.config.serviceName} avviato con successo!`);
        console.log(`🌐 Server: http://localhost:${this.config.port}`);
        console.log(`📊 Database: ${this.config.database.name}@${this.config.database.host}`);
        console.log(`📦 Moduli: ${this.modules.map(m => m.name).join(', ') || 'nessuno'}`);
        console.log(`🚀 Pronto per ricevere richieste!\n`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown('SIGTERM'));
      process.on('SIGINT', () => this.shutdown('SIGINT'));
    } catch (error) {
      console.error("❌ Errore durante l'avvio:", error);
      process.exit(1);
    }
  }

  private async shutdown(signal: string): Promise<void> {
    console.log(`\n🔄 Shutdown graceful in corso (${signal})...`);

    try {
      await this.database.close();
      console.log('✅ Servizio terminato correttamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Errore durante shutdown:', error);
      process.exit(1);
    }
  }

  getApp(): Application {
    return this.app;
  }

  getDatabase(): DatabaseManager {
    return this.database;
  }
}

export const createServer = (options: ServerOptions): EDGServer => {
  return new EDGServer(options);
};
