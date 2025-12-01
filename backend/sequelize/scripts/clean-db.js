#!/usr/bin/env node

/**
 * Clean database script
 * Drops all tables and resets SequelizeMeta for fresh migration
 * Use when migration file names have changed or database state is inconsistent
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function dropDatabase() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  };

  try {
    const connection = await mysql.createConnection(config);
    const dbName = process.env.MYSQL_DATABASE || 'coderoom_db';

    console.log(`🔄 Dropping database "${dbName}"...`);
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Database dropped`);

    console.log(`🔄 Creating database "${dbName}"...`);
    await connection.execute(`CREATE DATABASE \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database created`);

    await connection.end();
    console.log('\n✅ Database reset complete! Ready for fresh migrations.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropDatabase();
