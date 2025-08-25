import { readFile } from 'fs/promises';
import { join } from 'path';
import pool from '../db/index.js';

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute each migration file
    const migrationFiles = [
      '001_create_reviews_table.sql',
      // Add more migration files here as needed
    ];

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = await readFile(join(__dirname, 'migrations', file), 'utf8');
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('Migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
