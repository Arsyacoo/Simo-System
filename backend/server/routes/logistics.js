import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { all, get, run, withTransaction } from '../db/database.js';
import { requireAuth } from '../utils/auth.js';
import { resolveActor, writeAuditLog } from '../utils/auditLogger.js';
import {
  asyncHandler,
  HttpError,
  requireNonEmptyString,
  requireRecord,
  sendData,
} from '../utils/http.js';
import {
  serializeDeliveryCheckin,
  serializeLogisticsManifest,
} from '../utils/serializers.js';

const DELIVERY_STATUS_OPTIONS = ['Prepared', 'On Delivery', 'Arrived', 'Issue'];
const LOGISTICS_ROLES = ['Admin', 'Owner', 'Production Manager'];

function requireLogisticsRole(req, res, next) {
  if (!LOGISTICS_ROLES.includes(req.user?.roleName)) {
    throw new HttpError(403, 'FORBIDDEN', 'Akses logistik hanya tersedia untuk Admin, Owner, dan Production Manager.');
  }

  next();
}

function validateStatus(status) {
  if (!DELIVERY_STATUS_OPTIONS.includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `status must be one of: ${DELIVERY_STATUS_OPTIONS.join(', ')}.`, {
      field: 'status',
      allowedValues: DELIVERY_STATUS_OPTIONS,
    });
  }

  return status;
}

const manifestSelect = `
  SELECT lm.*,
    p.name AS project_name,
    p.code AS project_code,
    dc.id AS latest_checkin_id,
    dc.status AS latest_checkin_status,
    dc.location_text AS latest_checkin_location,
    dc.notes AS latest_checkin_notes,
    dc.checked_in_by AS latest_checkin_by,
    u.name AS latest_checkin_by_name,
    dc.checked_in_at AS latest_checkin_at
  FROM logistics_manifests lm
  LEFT JOIN projects p ON p.id = lm.project_id
  LEFT JOIN delivery_checkins dc ON dc.id = (
    SELECT id FROM delivery_checkins
    WHERE manifest_id = lm.id
    ORDER BY checked_in_at DESC, id DESC
    LIMIT 1
  )
  LEFT JOIN users u ON u.id = dc.checked_in_by
`;

async function getManifest(db, id) {
  return get(db, `${manifestSelect} WHERE lm.id = ?`, [id]);
}

export function createLogisticsRouter(db) {
  const router = Router();

  router.use(requireAuth, requireLogisticsRole);

  router.get('/manifests', asyncHandler(async (req, res) => {
    const rows = await all(db, `${manifestSelect} ORDER BY lm.updated_at DESC, lm.manifest_number ASC`);
    sendData(res, rows.map(serializeLogisticsManifest), { meta: { count: rows.length } });
  }));

  router.get('/manifests/:id', asyncHandler(async (req, res) => {
    const manifest = requireRecord(await getManifest(db, req.params.id), 'Logistics manifest');
    const checkins = await all(db, `SELECT dc.*, u.name AS checked_in_by_name
       FROM delivery_checkins dc
       LEFT JOIN users u ON u.id = dc.checked_in_by
       WHERE dc.manifest_id = ?
       ORDER BY dc.checked_in_at DESC, dc.id DESC`, [req.params.id]);

    sendData(res, {
      ...serializeLogisticsManifest(manifest),
      checkins: checkins.map(serializeDeliveryCheckin),
    });
  }));

  router.post('/manifests', asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const manifestNumber = requireNonEmptyString(payload.manifestNumber, 'manifestNumber');
    const driverName = requireNonEmptyString(payload.driverName, 'driverName');
    const vehiclePlate = requireNonEmptyString(payload.vehiclePlate, 'vehiclePlate');
    const origin = requireNonEmptyString(payload.origin, 'origin');
    const destination = requireNonEmptyString(payload.destination, 'destination');
    const deliveryStatus = validateStatus(payload.deliveryStatus || 'Prepared');
    const actor = await resolveActor(db, req.user.id);
    const id = `lm-${randomUUID()}`;

    if (payload.projectId) {
      requireRecord(await get(db, 'SELECT id FROM projects WHERE id = ?', [payload.projectId]), 'Project');
    }

    await withTransaction(db, async () => {
      await run(db, `INSERT INTO logistics_manifests
          (id, manifest_number, project_id, driver_name, driver_phone, vehicle_plate,
           vehicle_type, origin, destination, delivery_status, departure_time,
           arrival_time, notes, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
        id,
        manifestNumber,
        payload.projectId || null,
        driverName,
        payload.driverPhone || '',
        vehiclePlate,
        payload.vehicleType || '',
        origin,
        destination,
        deliveryStatus,
        payload.departureTime || null,
        payload.arrivalTime || null,
        payload.notes || '',
        actor.id,
      ]);

      await writeAuditLog(db, {
        actor,
        module: 'Logistics',
        actionType: 'CREATE_MANIFEST',
        action: 'INSERT',
        entityType: 'logistics_manifests',
        entityId: id,
        tableName: 'logistics_manifests',
        previousValue: null,
        newValue: deliveryStatus,
        description: `Created logistics manifest ${manifestNumber}.`,
      });
    });

    sendData(res, serializeLogisticsManifest(await getManifest(db, id)), { status: 201 });
  }));

  router.patch('/manifests/:id/status', asyncHandler(async (req, res) => {
    const nextStatus = validateStatus(req.body?.status);
    const manifest = requireRecord(await getManifest(db, req.params.id), 'Logistics manifest');
    const actor = await resolveActor(db, req.user.id);

    if (manifest.delivery_status === nextStatus) {
      sendData(res, serializeLogisticsManifest(manifest), { meta: { auditCreated: false } });
      return;
    }

    const updated = await withTransaction(db, async () => {
      await run(db, `UPDATE logistics_manifests
         SET delivery_status = ?, arrival_time = CASE WHEN ? = 'Arrived' THEN COALESCE(arrival_time, CURRENT_TIMESTAMP) ELSE arrival_time END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`, [nextStatus, nextStatus, manifest.id]);

      await writeAuditLog(db, {
        actor,
        module: 'Logistics',
        actionType: 'UPDATE_DELIVERY_STATUS',
        action: 'UPDATE',
        entityType: 'logistics_manifests',
        entityId: manifest.id,
        tableName: 'logistics_manifests',
        previousValue: manifest.delivery_status,
        newValue: nextStatus,
        description: `Updated ${manifest.manifest_number} from ${manifest.delivery_status} to ${nextStatus}.`,
      });

      return getManifest(db, manifest.id);
    });

    sendData(res, serializeLogisticsManifest(updated), { meta: { auditCreated: true } });
  }));

  router.post('/manifests/:id/checkins', asyncHandler(async (req, res) => {
    const manifest = requireRecord(await getManifest(db, req.params.id), 'Logistics manifest');
    const status = validateStatus(req.body?.status || manifest.delivery_status);
    const locationText = requireNonEmptyString(req.body?.locationText, 'locationText');
    const notes = req.body?.notes || '';
    const actor = await resolveActor(db, req.user.id);
    const id = `dci-${randomUUID()}`;

    const checkin = await withTransaction(db, async () => {
      await run(db, `INSERT INTO delivery_checkins
          (id, manifest_id, status, location_text, notes, checked_in_by, checked_in_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [id, manifest.id, status, locationText, notes, actor.id]);

      await run(db, 'UPDATE logistics_manifests SET delivery_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, manifest.id]);

      await writeAuditLog(db, {
        actor,
        module: 'Logistics',
        actionType: 'CREATE_DELIVERY_CHECKIN',
        action: 'INSERT',
        entityType: 'delivery_checkins',
        entityId: id,
        tableName: 'delivery_checkins',
        previousValue: manifest.delivery_status,
        newValue: status,
        description: `Manual check-in for ${manifest.manifest_number} at ${locationText}.`,
      });

      return get(db, `SELECT dc.*, u.name AS checked_in_by_name
         FROM delivery_checkins dc
         LEFT JOIN users u ON u.id = dc.checked_in_by
         WHERE dc.id = ?`, [id]);
    });

    sendData(res, serializeDeliveryCheckin(checkin), { status: 201, meta: { auditCreated: true } });
  }));

  return router;
}
