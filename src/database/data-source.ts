import { join } from 'node:path';
import { DataSource } from 'typeorm';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(getRequiredEnv('DB_PORT'));
if (!Number.isInteger(port)) {
  throw new Error('DB_PORT must be an integer');
}

export default new DataSource({
  type: 'postgres',
  host: getRequiredEnv('DB_HOST'),
  port,
  username: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_NAME'),
  entities: [join(import.meta.dirname, '..', '**', '*.entity.js')],
  migrations: [join(import.meta.dirname, 'migrations', '*.js')],
  synchronize: false,
});
