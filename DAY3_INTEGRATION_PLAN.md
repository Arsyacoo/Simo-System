# Day 3 Integration Plan

## Current Frontend Structure Summary

- React 19 and Vite 8 application entry is `src/main.jsx`.
- `src/App.jsx` owns routing, shell layout, sidebar navigation, and the Day 1 role switcher.
- `src/context/AppDataContext.jsx` is the central data provider. It currently loads seed data into localStorage, exposes derived metrics, tracks the active demo user, and provides local mutations for production status and QC checklist submissions.
- `src/context/AppDataCore.js` exports the shared React context and `useAppData` hook.
- `src/data/seedData.js` contains demo roles, users, projects, warehouses, work items, QC checklists, audit logs, and status constants.
- Page-level features currently available:
  - `src/pages/Dashboard.jsx`: production metrics, project progress, warehouse progress, QC shipping gate.
  - `src/pages/Warehouses.jsx`: work item status board and local status updates.
  - `src/pages/QualityControl.jsx`: digital QC checklist form and local QC gate update.
  - `src/pages/AuditLogs.jsx`: audit log table, filtering, CSV export.
  - `src/pages/Logistics.jsx`: static logistics demo view.
- Missing before Day 3 implementation:
  - `src/pages/Login.jsx`
  - `src/context/AuthContext.jsx`
  - `src/services/authApi.js`
  - `src/services/projectsApi.js`
  - `src/services/warehousesApi.js`

## Current Backend Structure Summary

- Backend exists under `server/` and was implemented as a Day 2 foundation.
- `server/index.js` starts the Express app on `PORT` or `3001`.
- `server/app.js` configures Express, CORS, JSON parsing, health check, route modules, 404 handling, and error envelopes.
- `server/db/database.js` wraps sqlite3 with promise helpers and schema initialization.
- `server/db/schema.sql` defines tables for roles, users, projects, warehouses, work items, QC checklists, and audit logs.
- `server/seed/seedDatabase.js` seeds Day 1 demo data into SQLite idempotently.
- `server/utils/auditLogger.js` resolves an actor from `userId` and writes server-side audit logs.
- `server/utils/http.js` provides API error and response helpers.
- `server/utils/serializers.js` maps snake_case database rows into frontend-friendly camelCase payloads.
- `server/tests/api.test.js` covers health, collection endpoints, detail endpoints, nested endpoints, mutations, audit behavior, validation, and seed idempotency.
- Backend auth routes do not exist yet.
- Backend does not currently store password hashes or demo login codes.

## Available API Endpoints

From the existing route code and README, these endpoints are available:

- `GET /api/health`
- `GET /api/roles`
- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/projects/:projectId/warehouses`
- `GET /api/warehouses`
- `GET /api/warehouses/:id`
- `GET /api/warehouses/:warehouseId/work-items`
- `GET /api/work-items`
- `GET /api/work-items/:id`
- `PATCH /api/work-items/:id/status`
- `GET /api/qc-checklists`
- `GET /api/qc-checklists/:id`
- `POST /api/qc-checklists`
- `GET /api/audit-logs`

## Missing API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- Optional future endpoints not required for Day 3:
  - Backend-enforced logout/session revocation.
  - Backend RBAC middleware per route.
  - Evidence photo upload.
  - Logistics manifests and shipment events.

## Existing localStorage Fallback Behavior

- Local data is stored under `simo-mugi-jaya-demo-state`.
- The active Day 1 role-switcher user is stored under `simo-mugi-jaya-active-user`.
- If localStorage is empty or unreadable, `createInitialDemoState()` deep-copies `seedData`.
- `updateWorkItemStatus()` mutates local work items and prepends a local audit log.
- `submitQcChecklist()` inserts a local QC checklist, updates the selected work item QC status, applies the shipping gate, and prepends a local audit log.
- `resetDemoData()` restores seed data and returns active user to Owner.
- The fallback behavior must remain available when the backend is offline or `VITE_USE_BACKEND_API` is false.

## Login/RBAC Implementation Plan

- Add simple backend auth routes:
  - `POST /api/auth/login` accepts `email` and `password` or `demoCode`.
  - `GET /api/auth/me` accepts a lightweight bearer token and returns the current user profile.
- Keep auth demo-friendly:
  - Use deterministic demo credentials derived from known seed users.
  - Avoid committing real secrets.
  - Document that the token and password strategy is not production-ready.
- Add `AuthContext.jsx`:
  - Load stored session from localStorage.
  - Try backend login when API is enabled and available.
  - Fall back to local demo users if backend is unavailable.
  - Expose `currentUser`, `currentRoleId`, `login`, `logout`, `isAuthenticated`, and `authMode`.
- Keep `AppDataContext.jsx` as the operational data provider:
  - Read the authenticated user from `AuthContext`.
  - Continue supporting the Day 1 role switcher as a demo fallback only.
  - Use backend data first when API is enabled and reachable.
  - Keep localStorage mutations as fallback.
- Add protected routing:
  - Unauthenticated users go to `/login`.
  - Authenticated users cannot access pages outside their role menu.
- Role menu visibility:
  - Owner: Dashboard, Audit Logs.
  - Production Manager: Dashboard, Warehouses, Audit Logs.
  - Foreman: Warehouses.
  - QC Inspector: QC.
  - Admin: Dashboard, Warehouses, QC, Audit Logs, Logistics.

## Sprint Breakdown

### Sprint 1 - API Readiness and Frontend API Client

- Verify the backend can seed and run.
- Verify Day 2 endpoints by direct HTTP checks.
- Improve `apiClient.js` with base URL, timeout, JSON handling, and token support.
- Add service modules for auth, projects, warehouses, work items, QC, and audit logs.
- Keep API failures recoverable so the app can stay on localStorage data.

### Sprint 2 - Dashboard and Production API Integration

- Update `AppDataContext.jsx` to load roles, users, projects, warehouses, work items, QC checklists, and audit logs from the API when enabled.
- Preserve localStorage as fallback data.
- Update work item status through `PATCH /api/work-items/:id/status` when possible.
- Refresh work items and audit logs after successful backend mutations.
- Keep progress calculations unchanged so they work with both backend and fallback data.

### Sprint 3 - QC Checklist API Integration

- Submit QC checklists to `POST /api/qc-checklists` when possible.
- Include the active user id for server-side audit logs.
- Refresh QC checklists, work items, and audit logs after successful backend submissions.
- Preserve local QC submission behavior when API calls fail.

### Sprint 4 - Basic Login and RBAC

- Create `Login.jsx` and `AuthContext.jsx`.
- Create backend auth route file and mount it in `server/app.js`.
- Add protected route handling and role-specific menu visibility.
- Keep role switcher visible only as a fallback/demo control when useful.
- Document demo credentials and security limitations.

### Sprint 5 - End-to-End Flow Testing

- Production monitoring flow:
  - Login as Foreman.
  - Update a work item status.
  - Login as Owner or Production Manager.
  - Confirm dashboard progress and audit log changed.
- QC flow:
  - Login as QC Inspector.
  - Submit Passed QC and Rework checklists.
  - Confirm only Passed QC items are Ready.
  - Confirm audit logs exist.
- RBAC flow:
  - Confirm Foreman cannot access QC or admin-only pages.
  - Confirm QC Inspector can access QC.
  - Confirm Owner can access Dashboard and Audit Logs.

### Sprint 6 - Documentation and Verification

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run test:server` after backend auth changes.
- Update README with Day 3 usage, demo accounts, RBAC table, API fallback behavior, and limitations.
- Update or create `DAILY_PROGRESS.md`.
- Create `DAY3_INTEGRATION_SUMMARY.md`.

## Technical Risks

- The backend currently uses sqlite3 callbacks, not `better-sqlite3`; this is acceptable for Day 3 but should be documented as the actual implementation.
- Auth will be demo-level unless a proper password hash column and secret management are added.
- `VITE_USE_BACKEND_API=false` remains the safe default, so backend integration must be opt-in and graceful.
- React Router DOM is version 7, but the existing app uses familiar `BrowserRouter`, `Routes`, `Route`, and `Navigate` APIs successfully.
- Backend and localStorage data can diverge during fallback mode. The UI should clearly expose whether backend or fallback mode is active.
- Since there is no automated browser E2E suite yet, manual flow checks are required after build and endpoint tests.

## Safe Rollback Plan

- Keep the existing localStorage data shape and local mutation functions intact.
- Keep `VITE_USE_BACKEND_API=false` as the default in `.env.example`.
- If backend integration fails, run the frontend with `npm run dev` and no `.env` changes to use local demo mode.
- If the SQLite database becomes inconsistent, remove `server/db/simo.sqlite` and run `npm run db:seed`.
- Auth can fall back to local demo users if backend auth is unavailable.
- Avoid destructive Git operations and keep changes reviewable by feature area.
