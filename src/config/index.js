const { z } = require('zod');
const path = require('path');

// Load env with dotenv-safe at module load time
require('dotenv-safe').config({
  example: path.resolve(process.cwd(), '.env.example'),
  allowEmptyValues: true
});

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.string().transform(v => parseInt(v, 10)).catch(3001),
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',') : ['http://localhost:3000'])),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(v => parseInt(v, 10)).catch(5432),
  DB_NAME: z.string().default('mybidfit'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password')
});

function loadConfig() {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${JSON.stringify(parsed.error.format())}`);
  }
  const env = parsed.data;

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    allowedOrigins: env.ALLOWED_ORIGINS,
    db: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    }
  };
}

module.exports = { loadConfig };

