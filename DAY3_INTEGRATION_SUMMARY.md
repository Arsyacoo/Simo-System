# Day 3 Integration Summary

## Frontend-Backend Integration Summary

Day 3 connected the React frontend to the existing Express and SQLite backend through a backend-first data provider. The app now attempts backend reads and writes when `VITE_USE_BACKEND_API=true`, while preserving the Day 1 localStorage demo fallback.

Integrated frontend areas:

- Dashboard reads projects, warehouses, work items, QC checklists, and audit logs through `AppDataContext`.
- Warehouses updates production status through the backend when available.
- QC submits inspection checklists through the backend when available.
- Audit logs refresh after backend-backed production and QC mutations.
- The UI exposes whether data is coming from Backend API, Local demo, or Local fallback.

## Auth/RBAC Summary

- Added `src/context/AuthContext.jsx` and `src/context/AuthCore.js`.
- Added `src/pages/Login.jsx`.
- Added backend auth routes in `server/routes/auth.js`.
- Added protected route handling in `src/App.jsx`.
- Added role-specific navigation visibility through `src/auth/roleAccess.js`.

Role visibility:

| Role | Allowed Pages |
| --- | --- |
| Owner | Dashboard, Audit Logs |
| Production Manager | Dashboard, Warehouses, Audit Logs |
| Foreman | Warehouses |
| QC Inspector | QC |
| Admin | Dashboard, Warehouses, QC, Audit Logs, Logistics |

Auth remains demo-level. Users log in with email and demo code. The shared demo code is `demo123`.

## API Integration Summary

Added or improved frontend service modules:

- `src/services/apiClient.js`
- `src/services/authApi.js`
- `src/services/projectsApi.js`
- `src/services/warehousesApi.js`
- `src/services/workItemsApi.js`
- `src/services/qcApi.js`
- `src/services/auditLogsApi.js`
- `src/services/usersApi.js`
- `src/services/rolesApi.js`

Backend endpoints verified:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/roles`
- `GET /api/projects`
- `GET /api/warehouses`
- `GET /api/work-items`
- `PATCH /api/work-items/:id/status`
- `GET /api/qc-checklists`
- `POST /api/qc-checklists`
- `GET /api/audit-logs`

## Demo Flow Steps

### Production Monitoring

1. Login as Foreman: `joko.anwar@simo.test`, code `demo123`.
2. Open Warehouses.
3. Update a work item from `To-Do` to `In-Progress` or `Done`.
4. Logout.
5. Login as Owner or Production Manager.
6. Open Dashboard and confirm production progress changed.
7. Open Audit Logs and confirm the production update is recorded.

### Quality Control

1. Login as QC Inspector: `siti.nurhaliza@simo.test`, code `demo123`.
2. Open QC.
3. Submit one checklist with `Passed QC`.
4. Submit another checklist with `Rework`.
5. Login as Owner, Production Manager, or Admin.
6. Open Audit Logs and confirm QC activity exists.
7. Confirm only `Passed QC` work items are marked Ready.

### RBAC

1. Login as Foreman and confirm only Warehouses is visible.
2. Login as QC Inspector and confirm only QC is visible.
3. Login as Owner and confirm Dashboard and Audit Logs are visible.
4. Login as Admin and confirm all pages are visible.

## Remaining Risks

- Backend RBAC enforcement is not implemented; frontend route guards are demo-level only.
- Demo token signing uses a fallback local secret if `AUTH_TOKEN_SECRET` is not set.
- No production password hashing exists because the current flow uses demo codes.
- SQLite schema is idempotent SQL, not migration-managed.
- Frontend and backend data can diverge if fallback mode is used after backend data is already seeded.
- Browser-driven UI verification could not be run because the Browser Node bridge tool was unavailable.

## Suggested Next Sprint

- Add backend RBAC middleware.
- Add hashed password storage or a real authentication provider.
- Add QC evidence file upload.
- Start logistics manifest and shipment status foundation.
- Add automated frontend E2E tests.
- Add migration tooling for database changes.
