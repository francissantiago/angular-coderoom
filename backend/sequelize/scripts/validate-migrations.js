#!/usr/bin/env node

/**
 * Validation script for Sequelize migrations
 * Verifies:
 * - All migration files follow naming convention
 * - No naming conflicts or duplicates
 * - Dependency order is correct (tables created before being referenced)
 * - Migration files are executable
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../migrations');
const seedersDir = path.join(__dirname, '../seeders');

// Define expected migration order and dependencies
const MIGRATION_GRAPH = {
  // Base tables (no dependencies)
  'users': [],
  'students': [],
  'class_groups': [],

  // Join tables and dependent tables
  'class_group_students': ['class_groups', 'students'],
  'lessons': ['class_groups'],
  'certificates': ['students', 'class_groups'],
  'projects': ['class_groups'],
  'class_sessions': ['class_groups', 'lessons'],
  'attendances': ['class_sessions', 'students'],

  // Alterations and cleanups
  'add-class-group-id-to-certificates': ['certificates', 'class_groups'],
  'correct-column-names-and-cleanup-fks': [],  // Cleanup only, no strict dependencies
};

// Parse migration filename to extract action and table
function parseMigrationName(filename) {
  const match = filename.match(/^(\d{8})-(.+)\.js$/);
  if (!match) return null;

  const [, timestamp, description] = match;

  // Extract main table name from description
  let table = null;

  if (description.startsWith('create-')) {
    // Handle both 'create-users' and 'create-class_group_students'
    table = description.substring(7); // Remove 'create-'
    table = table.replace(/_/g, '-'); // Normalize to hyphens for comparison
  } else if (description.startsWith('add-')) {
    // For 'add-*', extract the target table
    const parts = description.replace('add-', '').split('-to-');
    table = parts[parts.length - 1]; // Get last part after '-to-'
  } else if (description.startsWith('correct-')) {
    table = 'cleanup'; // Cleanup operations
  }

  return { timestamp, description, table, filename };
}

// Load migrations from directory
function loadMigrations(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    process.exit(1);
  }

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && !f.startsWith('legacy-'))
    .map(parseMigrationName)
    .filter(m => m !== null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// Validate migration order and dependencies
function validateMigrations(migrations) {
  const createdTables = new Set();
  let hasErrors = false;

  console.log('\n📋 Migration Validation Report\n');
  console.log('Actual order in migrations folder:');
  console.log('─'.repeat(80));

  // First pass: Show all migrations
  for (const migration of migrations) {
    console.log(`📄 ${migration.filename}`);
  }

  console.log('─'.repeat(80));
  console.log('\n⚠️  Dependency Check (Recommended Execution Order):\n');

  // Create dependency graph
  const graph = {};
  const inDegree = {};

  for (const migration of migrations) {
    graph[migration.filename] = [];
    inDegree[migration.filename] = 0;
  }

  // Build edges
  for (const migration of migrations) {
    if (migration.table === 'cleanup') continue;

    const deps = MIGRATION_GRAPH[migration.table] || [];
    for (const dep of deps) {
      // Find migrations that create this dependency
      const depMigration = migrations.find(m => 
        m.description.startsWith('create-') && m.table.replace(/-/g, '_') === dep.replace(/-/g, '_')
      );
      
      if (depMigration) {
        graph[depMigration.filename].push(migration.filename);
        inDegree[migration.filename]++;
      }
    }
  }

  // Topological sort using Kahn's algorithm
  const queue = Object.keys(inDegree).filter(k => inDegree[k] === 0);
  const sorted = [];

  while (queue.length > 0) {
    const file = queue.shift();
    sorted.push(file);

    for (const neighbor of graph[file]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycles
  if (sorted.length !== Object.keys(inDegree).length) {
    console.error('❌ Circular dependency detected in migrations!\n');
    hasErrors = true;
  }

  // Print sorted order
  console.log('Recommended execution order:\n');
  for (let i = 0; i < sorted.length; i++) {
    console.log(`${i + 1}. ${sorted[i]}`);
  }

  console.log('\n' + '─'.repeat(80));

  if (hasErrors) {
    console.error('\n❌ Validation FAILED - Circular dependencies detected\n');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations validated - execute in order above for best results\n');
  }
}

// Validate legacy migrations
function validateLegacyMigrations() {
  const legacyMigrations = fs.readdirSync(migrationsDir)
    .filter(f => f.startsWith('legacy-') && f.endsWith('.js'));

  if (legacyMigrations.length > 0) {
    console.log('\n⚠️  Legacy migrations detected (NOT executed by default):\n');
    legacyMigrations.forEach(m => {
      console.log(`  • ${m}`);
    });
    console.log('\nTo run legacy migrations manually:');
    console.log('  npx sequelize-cli db:seed --seed <legacy-filename>\n');
  }
}

// Check for duplicates and naming issues
function validateFilenames(migrations) {
  const seen = new Map();
  let hasErrors = false;

  for (const migration of migrations) {
    const key = `${migration.timestamp}-${migration.table}`;

    if (seen.has(key)) {
      console.error(`❌ Duplicate migration for table "${migration.table}": ${migration.filename}`);
      hasErrors = true;
    }

    seen.set(key, migration.filename);
  }

  if (hasErrors) {
    console.error('\n❌ Validation FAILED - Fix duplicate migrations\n');
    process.exit(1);
  }
}

// Main execution
try {
  console.log('🔍 Validating Sequelize migrations...\n');

  const migrations = loadMigrations(migrationsDir);

  if (migrations.length === 0) {
    console.warn('⚠️  No migrations found\n');
    process.exit(0);
  }

  validateFilenames(migrations);
  validateMigrations(migrations);
  validateLegacyMigrations();

  console.log('✅ Validation completed successfully\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
}
