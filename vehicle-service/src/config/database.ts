import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'edg_vehicles',
  DB_USER = 'vehicle_user',
  DB_PASSWORD = '',
  DB_SSL = 'false',
  NODE_ENV = 'development',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: 'postgres',
  dialectOptions: {
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  logging: NODE_ENV === 'development' ? msg => console.log(`[SQL] ${msg}`) : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true, // snake_case per colonne (coerente col nostro schema SQL)
    freezeTableName: true, // non pluralizzare i nomi tabella automaticamente
    timestamps: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log(`[DB] PostgreSQL connesso — ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
  } catch (error) {
    console.error('[DB] Connessione fallita:', error);
    process.exit(1);
  }
};
