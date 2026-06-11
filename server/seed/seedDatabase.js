import { pathToFileURL } from 'node:url';
import { seedData } from '../../src/data/seedData.js';
import { closeDatabase, createDatabase, run, withTransaction } from '../db/database.js';

const roleDescriptions = {
  owner: 'Business owner with operational visibility.',
  'production-manager': 'Manages production progress and delivery readiness.',
  foreman: 'Updates production work item execution.',
  'qc-inspector': 'Submits material quality inspections.',
  admin: 'Demo administrator with full operational access.',
};

const userEmails = {
  'usr-owner': 'rina.wijaya@simo.test',
  'usr-pm': 'budi.santoso@simo.test',
  'usr-foreman': 'joko.anwar@simo.test',
  'usr-qc': 'siti.nurhaliza@simo.test',
  'usr-admin': 'dewi.lestari@simo.test',
};

const projectLocations = {
  'prj-ikn-a': 'IKN Sector 4',
  'prj-ikn-b': 'IKN Residential District',
  'prj-sby-mall': 'Surabaya',
};

function findUserByName(name) {
  return seedData.users.find((user) => user.name === name);
}

function inferAuditModule(log) {
  return log.table === 'qc_checklists' ? 'QualityControl' : 'Production';
}

function inferAuditActionType(log) {
  return log.table === 'qc_checklists' ? 'SUBMIT_QC_CHECKLIST' : 'UPDATE_WORK_STATUS';
}

export async function seedDatabase({ databasePath, db: providedDb } = {}) {
  const db = providedDb || await createDatabase(databasePath);

  try {
    await withTransaction(db, async () => {
      for (const role of seedData.roles) {
        await run(
          db,
          'INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)',
          [role.id, role.name, roleDescriptions[role.id] || ''],
        );
      }

      for (const user of seedData.users) {
        await run(
          db,
          `INSERT OR IGNORE INTO users
            (id, name, email, role_id, site, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
          [user.id, user.name, userEmails[user.id], user.roleId, user.site],
        );
      }

      for (const project of seedData.projects) {
        await run(
          db,
          `INSERT OR IGNORE INTO projects
            (id, code, name, client_name, location, status, due_date, priority, created_at)
           VALUES (?, ?, ?, ?, ?, 'Active', ?, ?, CURRENT_TIMESTAMP)`,
          [
            project.id,
            project.code,
            project.name,
            project.client,
            projectLocations[project.id] || '',
            project.dueDate,
            project.priority,
          ],
        );
      }

      for (const warehouse of seedData.warehouses) {
        await run(
          db,
          `INSERT OR IGNORE INTO warehouses
            (id, project_id, code, name, location, category, status, created_at)
           VALUES (?, NULL, ?, ?, ?, ?, 'Active', CURRENT_TIMESTAMP)`,
          [warehouse.id, warehouse.code, warehouse.name, warehouse.name, warehouse.category],
        );
      }

      for (const item of seedData.workItems) {
        await run(
          db,
          `INSERT OR IGNORE INTO work_items
            (id, project_id, warehouse_id, name, category, material_name, quantity, unit,
             status, progress_weight, qc_status, ready_to_ship, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`,
          [
            item.id,
            item.projectId,
            item.warehouseId,
            item.taskName,
            item.materialName,
            item.materialName,
            item.quantity,
            item.unit,
            item.status,
            item.qcStatus,
            item.readyToShip ? 1 : 0,
          ],
        );
      }

      for (const checklist of seedData.qcChecklists) {
        const inspector = findUserByName(checklist.createdBy);

        await run(
          db,
          `INSERT OR IGNORE INTO qc_checklists
            (id, project_id, warehouse_id, work_item_id, material_name, length, width,
             thickness, qc_status, notes, evidence_photo_reference, inspector_user_id,
             inspector_name, inspector_role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            checklist.id,
            checklist.projectId,
            checklist.warehouseId,
            checklist.workItemId,
            checklist.materialName,
            checklist.length,
            checklist.width,
            checklist.thickness,
            checklist.qcStatus,
            checklist.notes,
            checklist.evidencePhoto,
            inspector?.id || null,
            checklist.createdBy,
            checklist.createdByRole,
            checklist.createdAt,
          ],
        );
      }

      for (const log of seedData.auditLogs) {
        const user = findUserByName(log.user);

        await run(
          db,
          `INSERT OR IGNORE INTO audit_logs
            (id, user_id, user_name, role_name, module, action_type, action, entity_type,
             entity_id, table_name, previous_value, new_value, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            log.id,
            user?.id || null,
            log.user,
            log.role,
            inferAuditModule(log),
            inferAuditActionType(log),
            log.action,
            log.table,
            log.recordId,
            log.table,
            log.previousValue,
            log.newValue,
            log.description,
            log.timestamp,
          ],
        );
      }
    });

    return db;
  } finally {
    if (!providedDb) {
      await closeDatabase(db);
    }
  }
}

const isMainModule = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  seedDatabase()
    .then(() => console.log('SIMO demo database seeded successfully.'))
    .catch((error) => {
      console.error('Failed to seed SIMO demo database.', error);
      process.exitCode = 1;
    });
}
