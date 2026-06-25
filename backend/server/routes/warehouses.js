import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { all, get, run, withTransaction } from '../db/database.js';
import { requireAuth } from '../utils/auth.js';
import { resolveActor, writeAuditLog } from '../utils/auditLogger.js';
import { asyncHandler, HttpError, requireNonEmptyString, requireRecord, sendData } from '../utils/http.js';
import { serializeWarehouse } from '../utils/serializers.js';

const MASTER_DATA_ROLES = ['Admin', 'Owner', 'Production Manager'];
const WAREHOUSE_STATUS_OPTIONS = ['Active', 'Inactive', 'Maintenance'];

function requireMasterDataRole(req, res, next) {
  if (!MASTER_DATA_ROLES.includes(req.user?.roleName)) {
    throw new HttpError(403, 'FORBIDDEN', 'Master data hanya dapat dikelola oleh Admin, Owner, dan Production Manager.');
  }
  next();
}

function normalizeWarehousePayload(payload = {}) {
  const status = payload.status || 'Active';
  if (!WAREHOUSE_STATUS_OPTIONS.includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `status must be one of: ${WAREHOUSE_STATUS_OPTIONS.join(', ')}.`, {
      field: 'status',
      allowedValues: WAREHOUSE_STATUS_OPTIONS,
    });
  }

  return {
    projectId: payload.projectId || null,
    code: requireNonEmptyString(payload.code, 'code'),
    name: requireNonEmptyString(payload.name, 'name'),
    location: payload.location || '',
    category: payload.category || '',
    status,
  };
}

async function getWarehouse(db, id) {
  return get(db, 'SELECT * FROM warehouses WHERE id = ?', [id]);
}

async function ensureProjectExistsIfProvided(db, projectId) {
  if (!projectId) return;
  requireRecord(await get(db, 'SELECT id FROM projects WHERE id = ?', [projectId]), 'Project');
}

async function ensureWarehouseCanBeDeleted(db, id) {
  const references = await Promise.all([
    get(db, 'SELECT id FROM work_items WHERE warehouse_id = ? LIMIT 1', [id]),
    get(db, 'SELECT id FROM qc_checklists WHERE warehouse_id = ? LIMIT 1', [id]),
  ]);

  if (references.some(Boolean)) {
    throw new HttpError(409, 'RESOURCE_IN_USE', 'Warehouse masih dipakai oleh produksi atau QC. Arsipkan/ubah relasi data terkait sebelum menghapus.');
  }
}

export function createWarehousesRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM warehouses ORDER BY code');
    sendData(res, rows.map(serializeWarehouse), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(await getWarehouse(db, req.params.id), 'Warehouse');
    sendData(res, serializeWarehouse(row));
  }));

  router.use(requireAuth, requireMasterDataRole);

  router.post('/', asyncHandler(async (req, res) => {
    const payload = normalizeWarehousePayload(req.body);
    await ensureProjectExistsIfProvided(db, payload.projectId);
    const actor = await resolveActor(db, req.user.id);
    const id = `wh-${randomUUID()}`;

    await withTransaction(db, async () => {
      await run(db, `INSERT INTO warehouses
        (id, project_id, code, name, location, category, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
        id,
        payload.projectId,
        payload.code,
        payload.name,
        payload.location,
        payload.category,
        payload.status,
      ]);

      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'CREATE_WAREHOUSE',
        action: 'INSERT',
        entityType: 'warehouses',
        entityId: id,
        tableName: 'warehouses',
        previousValue: null,
        newValue: JSON.stringify(payload),
        description: `Created warehouse ${payload.code} - ${payload.name}.`,
      });
    });

    sendData(res, serializeWarehouse(await getWarehouse(db, id)), { status: 201 });
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const existing = requireRecord(await getWarehouse(db, req.params.id), 'Warehouse');
    const payload = normalizeWarehousePayload(req.body);
    await ensureProjectExistsIfProvided(db, payload.projectId);
    const actor = await resolveActor(db, req.user.id);

    await withTransaction(db, async () => {
      await run(db, `UPDATE warehouses
        SET project_id = ?, code = ?, name = ?, location = ?, category = ?, status = ?
        WHERE id = ?`, [
        payload.projectId,
        payload.code,
        payload.name,
        payload.location,
        payload.category,
        payload.status,
        existing.id,
      ]);

      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'UPDATE_WAREHOUSE',
        action: 'UPDATE',
        entityType: 'warehouses',
        entityId: existing.id,
        tableName: 'warehouses',
        previousValue: JSON.stringify(serializeWarehouse(existing)),
        newValue: JSON.stringify(payload),
        description: `Updated warehouse ${payload.code} - ${payload.name}.`,
      });
    });

    sendData(res, serializeWarehouse(await getWarehouse(db, existing.id)));
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const existing = requireRecord(await getWarehouse(db, req.params.id), 'Warehouse');
    await ensureWarehouseCanBeDeleted(db, existing.id);
    const actor = await resolveActor(db, req.user.id);

    await withTransaction(db, async () => {
      await run(db, 'DELETE FROM warehouses WHERE id = ?', [existing.id]);
      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'DELETE_WAREHOUSE',
        action: 'DELETE',
        entityType: 'warehouses',
        entityId: existing.id,
        tableName: 'warehouses',
        previousValue: JSON.stringify(serializeWarehouse(existing)),
        newValue: null,
        description: `Deleted warehouse ${existing.code} - ${existing.name}.`,
      });
    });

    sendData(res, { id: existing.id, deleted: true });
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
