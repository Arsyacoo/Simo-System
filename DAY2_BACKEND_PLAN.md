# DAY 2 BACKEND PLAN - SIMO MUGI JAYA

Plan date: 2026-06-11

## Current Project Structure

- React 19 and Vite 8 frontend with Tailwind CSS 4.
- React Router routes for Dashboard, Warehouses, Logistics, Quality Control, and Audit Logs.
- Shared demo state is defined in `src/data/seedData.js` and managed by `src/context/AppDataContext.jsx`.
- Demo state and active user persist in browser localStorage.
- No backend, database, API routes, migrations, or real authentication currently exist.

## Existing Day 1 Features

- Demo role switcher with lightweight frontend permissions.
- Dynamic production and warehouse progress metrics.
- Work item status updates with local audit logs.
- Digital QC checklist with QC shipping gate behavior.
- Dynamic audit log filtering and CSV export.
- LocalStorage persistence and reset-to-seed behavior.

## Backend Architecture Decision

- Add an Express 5 REST API under `server/` while keeping the frontend and localStorage flow unchanged.
- Keep the Express app separate from the HTTP listener so integration tests can use an ephemeral port.
- Use consistent JSON envelopes:
  - Success: `{ "data": ..., "meta": ... }`
  - Error: `{ "error": { "code": "...", "message": "...", "details": ... } }`
- Use camelCase fields in API responses to remain compatible with Day 1 frontend data.
- Use CORS for development and Node.js 22.13 or newer.

## Database Design Plan

- Use SQLite through `sqlite3`.
- Store generated databases locally and ignore them in Git.
- Use an idempotent `schema.sql` instead of a migration framework for Day 2.
- Create tables for roles, users, projects, warehouses, work items, QC checklists, and audit logs.
- Preserve Day 1 TEXT IDs such as `wi-001`.
- Keep warehouses shared across projects. A warehouse may have a nullable owner project, while project-to-warehouse API queries derive active relationships through work items.
- Preserve Day 1 fields needed by the current demo, including due dates, priorities, warehouse codes/categories, quantities, units, QC status, and shipping readiness.
- Make the seed command safe to run repeatedly by inserting only missing records.

## API Endpoint Plan

- Health: `GET /api/health`
- Roles: `GET /api/roles`
- Users: `GET /api/users`, `GET /api/users/:id`
- Projects: `GET /api/projects`, `GET /api/projects/:id`
- Warehouses: `GET /api/warehouses`, `GET /api/warehouses/:id`, `GET /api/projects/:projectId/warehouses`
- Work items: `GET /api/work-items`, `GET /api/work-items/:id`, `GET /api/warehouses/:warehouseId/work-items`, `PATCH /api/work-items/:id/status`
- QC checklists: `GET /api/qc-checklists`, `GET /api/qc-checklists/:id`, `POST /api/qc-checklists`
- Audit logs: `GET /api/audit-logs` with optional `module` and `userId` filters

## Sprint Breakdown

1. Add backend dependencies, scripts, environment example, and server structure.
2. Add schema, database helpers, and idempotent seed mapping from frontend demo data.
3. Add REST routes, validation, transactions, server-side audit logging, and error handling.
4. Add frontend API client/services behind a disabled feature flag.
5. Add integration tests, documentation, and final verification.

## Technical Risks

- `sqlite3` is a native dependency and requires a supported Node.js runtime.
- The Day 1 frontend and backend use different storage sources until a later integration sprint.
- CORS is intentionally open for development and is not production hardened.
- Role switching and user IDs are trusted demo inputs, not authentication.
- SQLite is suitable for the hackathon foundation but not yet designed for concurrent production workloads.

## Safe Rollback Plan

- Keep `npm run dev` as frontend-only and do not modify `AppDataContext`.
- Keep `VITE_USE_BACKEND_API=false` by default.
- Keep localStorage as the only active frontend data source.
- Ignore generated SQLite files so backend state can be recreated with the seed command.
- Backend files and scripts can be removed independently without changing the Day 1 UI flow.
