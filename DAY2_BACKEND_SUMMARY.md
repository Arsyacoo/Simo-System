# DAY 2 BACKEND SUMMARY - SIMO MUGI JAYA

Summary date: 2026-06-11

## Backend Architecture

- Express 5 REST API under `server/`.
- SQLite database accessed through `sqlite3`.
- Express app is separated from the HTTP listener for integration testing.
- Success responses use `{ data, meta? }`; errors use `{ error: { code, message, details? } }`.
- CORS is open for hackathon development.
- Frontend Day 1 remains localStorage-first and unchanged.

## Database Schema

The idempotent schema creates:

- `roles`
- `users`
- `projects`
- `warehouses`
- `work_items`
- `qc_checklists`
- `audit_logs`

Warehouses are shared resources. Project-to-warehouse relationships are derived from work items. Run `npm run db:seed` to create the local database and insert missing demo records safely.

## API Summary

- Read endpoints expose roles, users, projects, warehouses, work items, QC checklists, and audit logs.
- Nested endpoints expose project warehouses and warehouse work items.
- `PATCH /api/work-items/:id/status` validates status, updates the work item, and creates a production audit log.
- `POST /api/qc-checklists` derives project and warehouse from the work item, stores the checklist, updates the shipping gate, and creates a QC audit log.
- Audit logs support combined `module` and `userId` filters.

## Audit Logging

Critical mutations use SQLite transactions so the resource update and audit record succeed or roll back together. Missing `userId` values use the `System` actor; invalid user IDs return `400`.

## Manual Backend Test

```bash
npm ci
npm run db:seed
npm run start:server
```

In another terminal:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/users
curl http://localhost:3001/api/projects
curl http://localhost:3001/api/warehouses
curl http://localhost:3001/api/work-items
curl "http://localhost:3001/api/audit-logs?module=Production"
```

Mutation examples are documented in `README.md`. Automated verification is available through:

```bash
npm run test:server
npm run lint
npm run build
```

## Known Limitations

- No real authentication or RBAC.
- Frontend services are not connected to shared state yet.
- No evidence file upload or real logistics tracking.
- No migration framework or production CORS policy.
