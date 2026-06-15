import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { SHARED_DEMO_CODE } from '../../src/data/demoAuth.js';
import { createApp } from '../app.js';
import { closeDatabase, createDatabase, get } from '../db/database.js';
import { seedDatabase } from '../seed/seedDatabase.js';

let db;
let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  db = await createDatabase(':memory:');
  await seedDatabase({ db });
  server = createApp({ db }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await closeDatabase(db);
});

test('health and collection endpoints return data envelopes', async () => {
  const paths = [
    '/api/health',
    '/api/auth/me',
    '/api/roles',
    '/api/users',
    '/api/projects',
    '/api/warehouses',
    '/api/work-items',
    '/api/qc-checklists',
    '/api/audit-logs',
  ];

  for (const path of paths) {
    if (path === '/api/auth/me') {
      const { response, body } = await request(path);
      assert.equal(response.status, 401, path);
      assert.ok('error' in body, path);
    } else {
      const { response, body } = await request(path);
      assert.equal(response.status, 200, path);
      assert.ok('data' in body, path);
    }
  }
});

test('demo auth login returns a profile and /me resolves the bearer token', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'joko.anwar@simo.test',
      demoCode: SHARED_DEMO_CODE,
    }),
  });

  assert.equal(login.response.status, 200);
  assert.equal(login.body.data.user.id, 'usr-foreman');
  assert.equal(login.body.data.user.roleId, 'foreman');
  assert.ok(login.body.data.token);

  const me = await request('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${login.body.data.token}`,
    },
  });

  assert.equal(me.response.status, 200);
  assert.equal(me.body.data.user.id, 'usr-foreman');
  assert.equal(me.body.data.authMode, 'backend-demo');
});

test('detail and nested endpoints return expected records', async () => {
  const details = [
    ['/api/users/usr-owner', 'usr-owner'],
    ['/api/projects/prj-ikn-a', 'prj-ikn-a'],
    ['/api/warehouses/wh-frame', 'wh-frame'],
    ['/api/work-items/wi-001', 'wi-001'],
    ['/api/qc-checklists/qc-001', 'qc-001'],
  ];

  for (const [path, expectedId] of details) {
    const { response, body } = await request(path);
    assert.equal(response.status, 200, path);
    assert.equal(body.data.id, expectedId);
  }

  const projectWarehouses = await request('/api/projects/prj-ikn-a/warehouses');
  assert.equal(projectWarehouses.response.status, 200);
  assert.ok(projectWarehouses.body.data.some((warehouse) => warehouse.id === 'wh-frame'));

  const warehouseItems = await request('/api/warehouses/wh-frame/work-items');
  assert.equal(warehouseItems.response.status, 200);
  assert.ok(warehouseItems.body.data.every((item) => item.warehouseId === 'wh-frame'));
});

test('audit logs support module and user filters', async () => {
  const { response, body } = await request('/api/audit-logs?module=Production&userId=usr-pm');
  assert.equal(response.status, 200);
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((log) => log.module === 'Production' && log.userId === 'usr-pm'));
});

test('work item status mutation creates one audit and no-op creates none', async () => {
  const beforeCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  const updated = await request('/api/work-items/wi-002/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Done', userId: 'usr-foreman' }),
  });

  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.status, 'Done');
  assert.equal(updated.body.meta.auditCreated, true);

  const afterUpdateCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  assert.equal(afterUpdateCount.count, beforeCount.count + 1);

  const noOp = await request('/api/work-items/wi-002/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Done', userId: 'usr-foreman' }),
  });
  assert.equal(noOp.response.status, 200);
  assert.equal(noOp.body.meta.auditCreated, false);

  const afterNoOpCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  assert.equal(afterNoOpCount.count, afterUpdateCount.count);
});

test('missing userId records the System actor', async () => {
  const updated = await request('/api/work-items/wi-006/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'In-Progress' }),
  });
  assert.equal(updated.response.status, 200);

  const audit = await get(
    db,
    `SELECT * FROM audit_logs
     WHERE entity_id = ? AND action_type = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    ['wi-006', 'UPDATE_WORK_STATUS'],
  );
  assert.equal(audit.user_name, 'System');
  assert.equal(audit.role_name, 'System');
});

test('QC submission updates shipping gate and creates an audit log', async () => {
  const beforeCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  const created = await request('/api/qc-checklists', {
    method: 'POST',
    body: JSON.stringify({
      workItemId: 'wi-003',
      materialName: 'Window Lockset A',
      length: 120,
      width: 40,
      thickness: 2,
      qcStatus: 'Passed QC',
      notes: 'Dimensions accepted.',
      evidencePhotoReference: 'lockset-a.jpg',
      userId: 'usr-qc',
    }),
  });

  assert.equal(created.response.status, 201);
  assert.equal(created.body.data.projectId, 'prj-ikn-a');
  assert.equal(created.body.data.warehouseId, 'wh-hardware');

  const item = await request('/api/work-items/wi-003');
  assert.equal(item.body.data.qcStatus, 'Passed QC');
  assert.equal(item.body.data.readyToShip, true);

  const afterCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  assert.equal(afterCount.count, beforeCount.count + 1);
});

test('invalid IDs, payloads, users, and routes return consistent errors', async () => {
  const cases = [
    ['/api/users/missing', {}, 404, 'NOT_FOUND'],
    ['/api/work-items/wi-001/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Invalid' }),
    }, 400, 'VALIDATION_ERROR'],
    ['/api/work-items/wi-001/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Done', userId: 'missing' }),
    }, 400, 'INVALID_USER'],
    ['/api/qc-checklists', {
      method: 'POST',
      body: JSON.stringify({ workItemId: 'wi-001' }),
    }, 400, 'VALIDATION_ERROR'],
    ['/api/missing', {}, 404, 'ROUTE_NOT_FOUND'],
  ];

  for (const [path, options, expectedStatus, expectedCode] of cases) {
    const { response, body } = await request(path, options);
    assert.equal(response.status, expectedStatus, path);
    assert.equal(body.error.code, expectedCode, path);
  }
});

test('seed command remains idempotent', async () => {
  const tables = [
    'roles',
    'users',
    'projects',
    'warehouses',
    'work_items',
    'qc_checklists',
    'audit_logs',
  ];
  const beforeCounts = {};

  for (const table of tables) {
    beforeCounts[table] = (await get(db, `SELECT COUNT(*) AS count FROM ${table}`)).count;
  }

  await seedDatabase({ db });
  await seedDatabase({ db });

  for (const table of tables) {
    const afterCount = (await get(db, `SELECT COUNT(*) AS count FROM ${table}`)).count;
    assert.equal(afterCount, beforeCounts[table], table);
  }
});
