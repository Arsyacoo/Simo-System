import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createApp } from '../app.js';
import { closeDatabase, createDatabase, get } from '../db/database.js';
import { seedDatabase } from '../seed/seedDatabase.js';

let db;
let server;
let baseUrl;
let currentToken = null;

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (currentToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${currentToken}`;
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
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

beforeEach(() => {
  currentToken = null;
});

test('health and collection endpoints return data envelopes', async () => {
  const paths = [
    '/api/health',
    '/api/roles',
    '/api/users',
    '/api/projects',
    '/api/warehouses',
    '/api/work-items',
    '/api/qc-checklists',
    '/api/audit-logs',
  ];

  for (const path of paths) {
    const { response, body } = await request(path);
    assert.equal(response.status, 200, path);
    assert.ok('data' in body, path);
  }
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
  // Login as foreman
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'joko.anwar@simo.test', password: 'password' }),
  });
  currentToken = loginRes.body.data.token;

  const beforeCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  const updated = await request('/api/work-items/wi-002/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Done' }),
  });

  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.status, 'Done');
  assert.equal(updated.body.meta.auditCreated, true);

  const afterUpdateCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  assert.equal(afterUpdateCount.count, beforeCount.count + 1);

  const noOp = await request('/api/work-items/wi-002/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Done' }),
  });
  assert.equal(noOp.response.status, 200);
  assert.equal(noOp.body.meta.auditCreated, false);

  const afterNoOpCount = await get(db, 'SELECT COUNT(*) AS count FROM audit_logs');
  assert.equal(afterNoOpCount.count, afterUpdateCount.count);
  
  currentToken = null; // reset
});

test('unauthorized or invalid token requests return 401 errors', async () => {
  // Try status patch without token
  const noToken = await request('/api/work-items/wi-006/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'In-Progress' }),
  });
  assert.equal(noToken.response.status, 401);
  assert.equal(noToken.body.error.code, 'UNAUTHORIZED');

  // Try status patch with invalid token
  const invalidToken = await request('/api/work-items/wi-006/status', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer invalid-token-value' },
    body: JSON.stringify({ status: 'In-Progress' }),
  });
  assert.equal(invalidToken.response.status, 401);
  assert.equal(invalidToken.body.error.code, 'INVALID_TOKEN');
});

test('QC submission updates shipping gate and creates an audit log', async () => {
  // Login as QC inspector
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'siti.nurhaliza@simo.test', password: 'password' }),
  });
  currentToken = loginRes.body.data.token;

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

  currentToken = null; // reset
});

test('invalid IDs, payloads, users, and routes return consistent errors', async () => {
  // Login as admin
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dewi.lestari@simo.test', password: 'password' }),
  });
  currentToken = loginRes.body.data.token;

  const cases = [
    ['/api/users/missing', {}, 404, 'NOT_FOUND'],
    ['/api/work-items/wi-001/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Invalid' }),
    }, 400, 'VALIDATION_ERROR'],
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

  currentToken = null; // reset
});

test('seed command remains idempotent', async () => {
  const tables = [
    'roles',
    'users',
    'projects',
    'warehouses',
    'work_items',
    'qc_checklists',
    'logistics_manifests',
    'delivery_checkins',
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

