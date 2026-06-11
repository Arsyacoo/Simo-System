import { Router } from 'express';
import { all } from '../db/database.js';
import { asyncHandler, sendData } from '../utils/http.js';
import { serializeRole } from '../utils/serializers.js';

export function createRolesRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM roles ORDER BY name');
    sendData(res, rows.map(serializeRole), { meta: { count: rows.length } });
  }));

  return router;
}
