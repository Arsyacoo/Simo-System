import { Router } from 'express';
import { all, get } from '../db/database.js';
import { asyncHandler, requireRecord, sendData } from '../utils/http.js';
import { serializeWarehouse } from '../utils/serializers.js';

export function createWarehousesRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM warehouses ORDER BY code');
    sendData(res, rows.map(serializeWarehouse), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(
      await get(db, 'SELECT * FROM warehouses WHERE id = ?', [req.params.id]),
      'Warehouse',
    );
    sendData(res, serializeWarehouse(row));
  }));

  return router;
}

export function createProjectWarehousesRouter(db) {
  const router = Router({ mergeParams: true });

  router.get('/', asyncHandler(async (req, res) => {
    requireRecord(
      await get(db, 'SELECT id FROM projects WHERE id = ?', [req.params.projectId]),
      'Project',
    );

    const rows = await all(
      db,
      `SELECT DISTINCT w.*
       FROM warehouses w
       JOIN work_items wi ON wi.warehouse_id = w.id
       WHERE wi.project_id = ?
       ORDER BY w.code`,
      [req.params.projectId],
    );

    sendData(res, rows.map(serializeWarehouse), { meta: { count: rows.length } });
  }));

  return router;
}
