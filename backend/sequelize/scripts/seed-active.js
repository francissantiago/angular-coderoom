#!/usr/bin/env node

/**
 * Seed only non-legacy seeders
 * Legacy seeders (prefixed with 'legacy-') are skipped unless SEED_LEGACY_DATA=true
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const seedersDir = path.join(__dirname, '../seeders');
const seedLegacy = process.env.SEED_LEGACY_DATA === 'true';

console.log('🌱 Loading seeders...\n');

const seeders = fs.readdirSync(seedersDir)
  .filter(f => f.endsWith('.js'))
  .sort();

const activeSeeders = seeders.filter(f => !f.startsWith('legacy-'));
const legacySeeders = seeders.filter(f => f.startsWith('legacy-'));

console.log(`✅ Active seeders (${activeSeeders.length}):`);
activeSeeders.forEach(s => console.log(`   • ${s}`));

if (legacySeeders.length > 0) {
  console.log(`\n⚠️  Legacy seeders (${legacySeeders.length}) - ${seedLegacy ? 'ENABLED' : 'DISABLED'}:`);
  legacySeeders.forEach(s => console.log(`   • ${s}`));
  console.log(`   Set SEED_LEGACY_DATA=true to enable\n`);
}

// Build seed command - only execute active seeders
const seedersToRun = seedLegacy ? seeders : activeSeeders;

if (seedersToRun.length === 0) {
  console.log('No seeders to run\n');
  process.exit(0);
}

console.log(`\n🚀 Running ${seedersToRun.length} seeder(s)...\n`);

try {
  const config = path.resolve(__dirname, '../config/config.js');
  const seedersPath = path.resolve(__dirname, '../seeders');

  for (const seeder of seedersToRun) {
    const cmd = `npx sequelize-cli db:seed --seed ${seeder.replace('.js', '')} --config ${config} --seeders-path ${seedersPath}`;
    console.log(`⏳ Running: ${seeder}`);
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log('\n✅ Seeding completed successfully\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
}
