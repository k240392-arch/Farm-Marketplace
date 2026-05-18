// scripts/run-migration-001.js
// Run from project root:    node server/scripts/run-migration-001.js
// Or from server folder:    node scripts/run-migration-001.js
//
// What this does:
//   • Reads the migration_001_add_products_catalog.sql file
//   • Connects to your existing MySQL DB using the same credentials as the app
//   • Executes the migration statement-by-statement
//   • Prints progress + a summary at the end
//
// Safe to re-run — the migration is idempotent.

const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SQL_FILE = path.join(__dirname, '..', 'db', 'migration_001_add_products_catalog.sql');

async function run() {
  console.log('\n🌿 FarmMarket — Migration 001 (Products Catalog)\n');

  // 1. Sanity checks
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ Could not find migration file at:', SQL_FILE);
    console.error('   Make sure migration_001_add_products_catalog.sql is in server/db/');
    process.exit(1);
  }
  if (!process.env.DB_HOST) {
    console.error('❌ DB_HOST not set in .env — cannot connect to database.');
    process.exit(1);
  }

  // 2. Read SQL
  const sqlText = fs.readFileSync(SQL_FILE, 'utf8');
  console.log(`📄 Loaded migration: ${path.basename(SQL_FILE)} (${sqlText.length} chars)`);

  // 3. Connect (with multipleStatements so we can run the whole file at once)
  const conn = await mysql.createConnection({
    host:                process.env.DB_HOST,
    user:                process.env.DB_USER,
    password:            process.env.DB_PASSWORD,
    database:            process.env.DB_NAME,
    multipleStatements:  true,
  });
  console.log(`✅ Connected to ${process.env.DB_HOST}/${process.env.DB_NAME}\n`);

  // 4. Execute
  try {
    console.log('⏳ Running migration...\n');
    const [results] = await conn.query(sqlText);

    // mysql2 returns an array of result sets when multipleStatements=true
    // Filter to just the SELECT results that returned rows we want to print
    const printable = (Array.isArray(results) ? results : [results])
      .filter(r => Array.isArray(r) && r.length > 0 && r[0].result)
      .flat();

    if (printable.length) {
      console.log('───────────────────────────────────────────');
      printable.forEach(row => {
        const v = row.result || row.message;
        if (v) console.log('  ' + v);
      });
      console.log('───────────────────────────────────────────\n');
    }

    // Show category breakdown
    const [catBreakdown] = await conn.query(`
      SELECT c.name AS category, COUNT(p.product_id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.category_id
      GROUP BY c.category_id, c.name
      ORDER BY product_count DESC
    `);
    console.log('📊 Products per category:');
    catBreakdown.forEach(r => {
      const bar = '▓'.repeat(Math.min(r.product_count, 30));
      console.log(`   ${r.category.padEnd(22)} ${String(r.product_count).padStart(3)} ${bar}`);
    });

    // Show seasonal breakdown
    const [seasonal] = await conn.query(`
      SELECT season, COUNT(*) AS count
      FROM products
      WHERE is_seasonal = 1
      GROUP BY season
      ORDER BY season
    `);
    if (seasonal.length) {
      console.log('\n🌱 Seasonal products:');
      seasonal.forEach(r => console.log(`   ${r.season.padEnd(10)} ${r.count}`));
    }

    console.log('\n✅ Migration 001 complete.');
    console.log('   Next step: backend API endpoints for the catalog (Step 2).\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.sqlMessage) console.error('   SQL error:', err.sqlMessage);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});