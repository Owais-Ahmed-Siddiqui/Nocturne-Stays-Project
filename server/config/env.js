// Loads environment variables once and exposes a typed config object.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change',
  isProd: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true',
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  // Preferred: secret service-role key (server only, bypasses RLS)
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Fallback: anon key (public — safe ONLY because RLS is enabled in schema.sql)
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
};
