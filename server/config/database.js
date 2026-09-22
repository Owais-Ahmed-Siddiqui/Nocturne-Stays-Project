// Lazy Supabase client.
// SECURITY: prefers the SERVICE_ROLE key (server-side secret, bypasses RLS).
// Falls back to the anon key (works only for read-only catalog access thanks to RLS).
const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let client = null;

function getKey() {
  return env.supabaseServiceKey || env.supabaseAnonKey;
}

function getDb() {
  if (!env.supabaseUrl || !getKey()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, getKey(), {
      auth: { persistSession: false }
    });
    if (env.supabaseServiceKey) {
      console.log('✅ Supabase client initialized (service_role key)');
    } else {
      console.warn(
        '⚠️  SUPABASE_SERVICE_ROLE_KEY not set — using anon key. ' +
        'Bookings will fail (RLS blocks writes). Set the service key in .env / Render.'
      );
    }
  }
  return client;
}

function isConfigured() {
  return Boolean(env.supabaseUrl && getKey());
}

module.exports = { getDb, isConfigured };
