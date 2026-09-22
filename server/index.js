const app = require('./app');
const env = require('./config/env');
const { isConfigured } = require('./config/database');

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀 Nocturne Stays server running on http://localhost:${env.port}`);
  console.log(`📊 Health check: http://localhost:${env.port}/api/health`);
  if (!isConfigured()) {
    console.log('⚠️  SUPABASE_URL / SUPABASE_ANON_KEY not set — copy .env.example to .env and fill in your credentials.');
  }
});
