import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { all, get, run, withTransaction } from '../db/database.js';
import { requireAuth } from '../utils/auth.js';
import { resolveActor, writeAuditLog } from '../utils/auditLogger.js';
import { asyncHandler, HttpError, requireNonEmptyString, requireRecord, sendData } from '../utils/http.js';
import { serializeProject } from '../utils/serializers.js';

const MASTER_DATA_ROLES = ['Admin', 'Owner', 'Production Manager'];
const PROJECT_STATUS_OPTIONS = ['Active', 'On Hold', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

function requireMasterDataRole(req, res, next) {
  if (!MASTER_DATA_ROLES.includes(req.user?.roleName)) {
    throw new HttpError(403, 'FORBIDDEN', 'Master data hanya dapat dikelola oleh Admin, Owner, dan Production Manager.');
  }
  next();
}

function optionalEnum(value, field, allowedValues, fallback) {
  const normalized = value || fallback;
  if (!allowedValues.includes(normalized)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be one of: ${allowedValues.join(', ')}.`, {
      field,
      allowedValues,
    });
  }
  return normalized;
}

function normalizeProjectPayload(payload = {}) {
  return {
    code: requireNonEmptyString(payload.code, 'code'),
    name: requireNonEmptyString(payload.name, 'name'),
    clientName: requireNonEmptyString(payload.clientName || payload.client, 'clientName'),
    location: payload.location || '',
    status: optionalEnum(payload.status, 'status', PROJECT_STATUS_OPTIONS, 'Active'),
    dueDate: payload.dueDate || null,
    priority: optionalEnum(payload.priority, 'priority', PRIORITY_OPTIONS, 'Medium'),
  };
}

async function getProject(db, id) {
  return get(db, 'SELECT * FROM projects WHERE id = ?', [id]);
}

async function ensureProjectCanBeDeleted(db, id) {
  const references = await Promise.all([
    get(db, 'SELECT id FROM warehouses WHERE project_id = ? LIMIT 1', [id]),
    get(db, 'SELECT id FROM work_items WHERE project_id = ? LIMIT 1', [id]),
    get(db, 'SELECT id FROM qc_checklists WHERE project_id = ? LIMIT 1', [id]),
    get(db, 'SELECT id FROM logistics_manifests WHERE project_id = ? LIMIT 1', [id]),
  ]);

  if (references.some(Boolean)) {
    throw new HttpError(409, 'RESOURCE_IN_USE', 'Project masih dipakai oleh warehouse, produksi, QC, atau logistics. Arsipkan/ubah relasi data terkait sebelum menghapus.');
  }
}

export function createProjectsRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM projects ORDER BY due_date, code');
    sendData(res, rows.map(serializeProject), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(await getProject(db, req.params.id), 'Project');
    sendData(res, serializeProject(row));
  }));

  router.use(requireAuth, requireMasterDataRole);

  router.post('/', asyncHandler(async (req, res) => {
    const payload = normalizeProjectPayload(req.body);
    const actor = await resolveActor(db, req.user.id);
    const id = `prj-${randomUUID()}`;

    await withTransaction(db, async () => {
      await run(db, `INSERT INTO projects
        (id, code, name, client_name, location, status, due_date, priority, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [
        id,
        payload.code,
        payload.name,
        payload.clientName,
        payload.location,
        payload.status,
        payload.dueDate,
        payload.priority,
      ]);

      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'CREATE_PROJECT',
        action: 'INSERT',
        entityType: 'projects',
        entityId: id,
        tableName: 'projects',
        previousValue: null,
        newValue: JSON.stringify(payload),
        description: `Created project ${payload.code} - ${payload.name}.`,
      });
    });

    sendData(res, serializeProject(await getProject(db, id)), { status: 201 });
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const existing = requireRecord(await getProject(db, req.params.id), 'Project');
    const payload = normalizeProjectPayload(req.body);
    const actor = await resolveActor(db, req.user.id);

    await withTransaction(db, async () => {
      await run(db, `UPDATE projects
        SET code = ?, name = ?, client_name = ?, location = ?, status = ?, due_date = ?, priority = ?
        WHERE id = ?`, [
        payload.code,
        payload.name,
        payload.clientName,
        payload.location,
        payload.status,
        payload.dueDate,
        payload.priority,
        existing.id,
      ]);

      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'UPDATE_PROJECT',
        action: 'UPDATE',
        entityType: 'projects',
        entityId: existing.id,
        tableName: 'projects',
        previousValue: JSON.stringify(serializeProject(existing)),
        newValue: JSON.stringify(payload),
        description: `Updated project ${payload.code} - ${payload.name}.`,
      });
    });

    sendData(res, serializeProject(await getProject(db, existing.id)));
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const existing = requireRecord(await getProject(db, req.params.id), 'Project');
    await ensureProjectCanBeDeleted(db, existing.id);
    const actor = await resolveActor(db, req.user.id);

    await withTransaction(db, async () => {
      await run(db, 'DELETE FROM projects WHERE id = ?', [existing.id]);
      await writeAuditLog(db, {
        actor,
        module: 'Master Data',
        actionType: 'DELETE_PROJECT',
        action: 'DELETE',
        entityType: 'projects',
        entityId: existing.id,
        tableName: 'projects',
        previousValue: JSON.stringify(serializeProject(existing)),
        newValue: null,
        description: `Deleted project ${existing.code} - ${existing.name}.`,
      });
    });

    sendData(res, { id: existing.id, deleted: true });
  }));

  return router;
}
