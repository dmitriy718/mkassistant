// Database initialization script for mkassistant
// This script initializes the database and then exits
const { initDatabase } = require('./dist/database');

console.log('🗄️  Initializing mkassistant database...');
console.log('='.repeat(60));

try {
  initDatabase();
  console.log('✅ Database initialized successfully!');
  console.log('📍 Database location: data/mkassistant.db');
  console.log('='.repeat(60));
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}
