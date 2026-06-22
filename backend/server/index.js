import { createApp } from './app.js';
import {
  closeDatabase,
  createDatabase,
  formatDatabaseConnectionError,
} from './db/database.js';

const port = Number(process.env.PORT) || 3001;
let db;

try {
  db = await createDatabase();
} catch (error) {
  console.error(formatDatabaseConnectionError(error));
  process.exitCode = 1;
  process.exit();
}

const app = createApp({ db });

const server = app.listen(port, () => {
  console.log(`SIMO API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing SIMO API.`);
  server.close(async () => {
    await closeDatabase(db);
    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
