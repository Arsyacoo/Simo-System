import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { all, get, run, withTransaction } from '../db/database.js';
import { resolveActor, writeAuditLog } from '../utils/auditLogger.js';
import {
  asyncHandler,
  HttpError,
  requireNonEmptyString,
  requireNonNegativeNumber,
  requireRecord,
  sendData,
} from '../utils/http.js';
import { serializeQcChecklist } from '../utils/serializers.js';

const QC_STATUS_OPTIONS = ['Pending', 'Passed QC', 'Rework'];

export function createQcChecklistsRouter(db) {
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const rows = await all(db, 'SELECT * FROM qc_checklists ORDER BY created_at DESC, id DESC');
    sendData(res, rows.map(serializeQcChecklist), { meta: { count: rows.length } });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = requireRecord(
      await get(db, 'SELECT * FROM qc_checklists WHERE id = ?', [req.params.id]),
      'QC checklist',
    );
    sendData(res, serializeQcChecklist(row));
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const workItemId = requireNonEmptyString(payload.workItemId, 'workItemId');
    const materialName = requireNonEmptyString(payload.materialName, 'materialName');
    const notes = requireNonEmptyString(payload.notes, 'notes');
    const length = requireNonNegativeNumber(payload.length, 'length');
    const width = requireNonNegativeNumber(payload.width, 'width');
    const thickness = requireNonNegativeNumber(payload.thickness, 'thickness');

    if (!QC_STATUS_OPTIONS.includes(payload.qcStatus)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `qcStatus must be one of: ${QC_STATUS_OPTIONS.join(', ')}.`,
        { field: 'qcStatus', allowedValues: QC_STATUS_OPTIONS },
      );
    }

    const workItem = requireRecord(
      await get(db, 'SELECT * FROM work_items WHERE id = ?', [workItemId]),
      'Work item',
    );
    const actor = await resolveActor(db, payload.userId);
    const checklistId = `qc-${randomUUID()}`;
    const evidenceReference = String(
      payload.evidencePhotoReference ?? payload.evidencePhoto ?? '',
    ).trim();

    const checklist = await withTransaction(db, async () => {
      await run(
        db,
        `INSERT INTO qc_checklists
          (id, project_id, warehouse_id, work_item_id, material_name, length, width,
           thickness, qc_status, notes, evidence_photo_reference, inspector_user_id,
           inspector_name, inspector_role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          checklistId,
          workItem.project_id,
          workItem.warehouse_id,
          workItem.id,
          materialName,
          length,
          width,
          thickness,
          payload.qcStatus,
          notes,
          evidenceReference,
          actor.id,
          actor.name,
          actor.roleName,
        ],
      );

      await run(
        db,
        `UPDATE work_items
         SET qc_status = ?, ready_to_ship = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [payload.qcStatus, payload.qcStatus === 'Passed QC' ? 1 : 0, workItem.id],
      );

      await writeAuditLog(db, {
        actor,
        module: 'QualityControl',
        actionType: 'SUBMIT_QC_CHECKLIST',
        action: 'INSERT',
        entityType: 'qc_checklists',
        entityId: checklistId,
        tableName: 'qc_checklists',
        previousValue: workItem.qc_status,
        newValue: payload.qcStatus,
        description: `Submitted QC checklist for ${materialName}.`,
      });

      return get(db, 'SELECT * FROM qc_checklists WHERE id = ?', [checklistId]);
    });

    sendData(res, serializeQcChecklist(checklist), { status: 201 });
  }));

  return router;
}
