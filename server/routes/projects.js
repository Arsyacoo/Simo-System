import { Router } from 'express';
import { all, get } from '../db/database.js';
import { asyncHandler, requireRecord, sendData } from '../utils/http.js';
import { serializeProject } from '../utils/serializers.js';

export function createProjectsRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM projects ORDER BY due_date, code');
    sendData(res, rows.map(serializeProject), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(
      await get(db, 'SELECT * FROM projects WHERE id = ?', [req.params.id]),
      'Project',
    );
    sendData(res, serializeProject(row));
  }));

  return router;
}
