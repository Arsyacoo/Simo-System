import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const DEFAULT_DATABASE_PATH = 'server/db/simo.sqlite';
const SCHEMA_PATH = new URL('./schema.sql', import.meta.url);

export function resolveDatabasePath(databasePath = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH) {
  return databasePath === ':memory:' ? databasePath : path.resolve(process.cwd(), databasePath);
}

export async function openDatabase(databasePath) {
  const filename = resolveDatabasePath(databasePath);

  if (filename !== ':memory:') {
    await fs.mkdir(path.dirname(filename), { recursive: true });
  }

  const db = await new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(filename, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(connection);
      }
    });
  });

  await exec(db, 'PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  return db;
}

export async function initializeDatabase(db) {
  const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
  await exec(db, schema);
  return db;
}

export async function createDatabase(databasePath) {
  const db = await openDatabase(databasePath);
  await initializeDatabase(db);
  return db;
}

export function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
      } else {
        resolve(row);
      }
    });
  });
}

export function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
}

export function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function withTransaction(db, operation) {
  await exec(db, 'BEGIN IMMEDIATE TRANSACTION');

  try {
    const result = await operation();
    await exec(db, 'COMMIT');
    return result;
  } catch (error) {
    await exec(db, 'ROLLBACK');
    throw error;
  }
}
