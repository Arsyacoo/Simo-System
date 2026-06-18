import { Router } from 'express';
import { all, get, run, withTransaction } from '../db/database.js';
import { requireAuth } from '../utils/auth.js';
import { resolveActor, writeAuditLog } from '../utils/auditLogger.js';
import {
  asyncHandler,
  HttpError,
  requireRecord,
  sendData,
} from '../utils/http.js';
import { serializeWorkItem } from '../utils/serializers.js';

const WORK_STATUS_OPTIONS = ['To-Do', 'In-Progress', 'Done'];

export function createWorkItemsRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM work_items ORDER BY id');
    sendData(res, rows.map(serializeWorkItem), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(
      await get(db, 'SELECT * FROM work_items WHERE id = ?', [req.params.id]),
      'Work item',
    );
    sendData(res, serializeWorkItem(row));
  }));

  router.patch('/:id/status', requireAuth, asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    const userId = req.user.id;

    if (!WORK_STATUS_OPTIONS.includes(status)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `status must be one of: ${WORK_STATUS_OPTIONS.join(', ')}.`,
        { field: 'status', allowedValues: WORK_STATUS_OPTIONS },
      );
    }

    const workItem = requireRecord(
      await get(db, 'SELECT * FROM work_items WHERE id = ?', [req.params.id]),
      'Work item',
    );
    const actor = await resolveActor(db, userId);

    if (workItem.status === status) {
      sendData(res, serializeWorkItem(workItem), { meta: { auditCreated: false } });
      return;
    }

    const updatedItem = await withTransaction(db, async () => {
      await run(
        db,
        'UPDATE work_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, workItem.id],
      );

      await writeAuditLog(db, {
        actor,
        module: 'Production',
        actionType: 'UPDATE_WORK_STATUS',
        action: 'UPDATE',
        entityType: 'work_items',
        entityId: workItem.id,
        tableName: 'work_items',
        previousValue: workItem.status,
        newValue: status,
        description: `Updated ${workItem.material_name} from ${workItem.status} to ${status}.`,
      });

      return get(db, 'SELECT * FROM work_items WHERE id = ?', [workItem.id]);
    });

    sendData(res, serializeWorkItem(updatedItem), { meta: { auditCreated: true } });
  }));

  return router;
}

export function createWarehouseWorkItemsRouter(db) {
  const router = Router({ mergeParams: true });

  router.get('/', asyncHandler(async (req, res) => {
    requireRecord(
      await get(db, 'SELECT id FROM warehouses WHERE id = ?', [req.params.warehouseId]),
      'Warehouse',
    );

    const rows = await all(
      db,
      'SELECT * FROM work_items WHERE warehouse_id = ? ORDER BY id',
      [req.params.warehouseId],
    );

    sendData(res, rows.map(serializeWorkItem), { meta: { count: rows.length } });
  }));

  return router;
}
