import * as dotenv from 'dotenv';
dotenv.config();

const required = (key: string, fallback?: string) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env: ${key}`);
  return v;
};

export const env = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),

  mongodbUri: required('MONGODB_URI', ''),

  jwtSecret: required('JWT_SECRET', ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseSchema: process.env.SUPABASE_SCHEMA || 'public',
};
