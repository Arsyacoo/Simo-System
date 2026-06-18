import fs from 'node:fs/promises';
import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

// Parse BIGINT (type OID 20) as standard Javascript integers
pg.types.setTypeParser(20, (val) => parseInt(val, 10));

const SCHEMA_PATH = new URL('./schema.sql', import.meta.url);
const txStorage = new AsyncLocalStorage();

export function translateSql(sql) {
  // Strip out any SQLite specific PRAGMA commands
  let translated = sql.replace(/PRAGMA\s+[^;]+;?/gi, '');
  
  // Replace SQLite placeholder "?" with PostgreSQL placeholder "$1", "$2", etc.
  let index = 1;
  translated = translated.replace(/\?/g, () => `$${index++}`);
  
  // Replace SQLite specific "INSERT OR IGNORE INTO" with PostgreSQL "INSERT INTO ... ON CONFLICT (id) DO NOTHING"
  if (translated.toUpperCase().includes('INSERT OR IGNORE INTO')) {
    translated = translated.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
    translated += ' ON CONFLICT (id) DO NOTHING';
  }
  return translated;
}

export async function openDatabase(databasePath = process.env.DATABASE_URL) {
  const connectionString = databasePath === ':memory:'
    ? (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/simo_test')
    : (databasePath || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/simo');

  const pool = new pg.Pool({ connectionString });
  
  // Quick sanity check to verify connection parameters
  const client = await pool.connect();
  client.release();
  
  return { pool };
}

export async function initializeDatabase(db, dropTables = false) {
  const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
  if (dropTables) {
    const tables = ['audit_logs', 'qc_checklists', 'work_items', 'warehouses', 'projects', 'users', 'roles'];
    for (const table of tables) {
      await exec(db, `DROP TABLE IF EXISTS ${table} CASCADE`);
    }
  }
  await exec(db, schema);
  return db;
}

export async function createDatabase(databasePath) {
  const db = await openDatabase(databasePath);
  const isTest = databasePath === ':memory:';
  await initializeDatabase(db, isTest);
  return db;
}

function getActiveClient(db) {
  const txClient = txStorage.getStore();
  return txClient || db.pool;
}

export async function run(db, sql, params = []) {
  const client = getActiveClient(db);
  const res = await client.query(translateSql(sql), params);
  return { lastID: null, changes: res.rowCount };
}

export async function get(db, sql, params = []) {
  const client = getActiveClient(db);
  const res = await client.query(translateSql(sql), params);
  return res.rows[0] || null;
}

export async function all(db, sql, params = []) {
  const client = getActiveClient(db);
  const res = await client.query(translateSql(sql), params);
  return res.rows;
}

export async function exec(db, sql) {
  const client = getActiveClient(db);
  await client.query(translateSql(sql));
}

export async function closeDatabase(db) {
  await db.pool.end();
}

export async function withTransaction(db, operation) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await txStorage.run(client, operation);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
