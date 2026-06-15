# Daily Progress

## Day 3 - Frontend-Backend Integration, Login, and RBAC

Date: 2026-06-15

## Completed Work

- Scanned the existing project before application code changes.
- Confirmed Day 2 backend foundation already existed.
- Created `DAY3_INTEGRATION_PLAN.md`.
- Added backend demo auth endpoints:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Added simple signed demo token support for backend auth.
- Added shared demo auth metadata and demo login codes.
- Added frontend auth context and login page.
- Added protected route behavior.
- Added role-based sidebar visibility.
- Improved frontend API client with base URL config, timeout handling, token support, and structured errors.
- Added API service modules for auth, projects, warehouses, users, and roles.
- Updated existing work item, QC, and audit service modules to return unwrapped API data.
- Integrated `AppDataContext` with backend reads when `VITE_USE_BACKEND_API=true`.
- Preserved localStorage fallback when backend mode is off or API calls fail.
- Integrated production status updates with backend `PATCH /api/work-items/:id/status`.
- Integrated QC checklist submission with backend `POST /api/qc-checklists`.
- Refreshed backend audit logs after backend-backed mutations.
- Updated UI mutation states for Warehouses and QC.
- Updated README with Day 3 setup, demo accounts, RBAC table, fallback behavior, and limitations.

## Bugs Found and Fixed

- `npm ci` failed because `package-lock.json` was missing optional `@emnapi/*` entries. Ran `npm install` to reconcile the lockfile.
- React 19 hook lint flagged synchronous state updates inside effects. Reworked active user derivation and scheduled backend refresh after render.
- Initial Vite background launch commands did not preserve environment variable quotes in PowerShell. Relaunched Vite with corrected quoting.
- A draft auth helper endpoint would have exposed demo codes; removed it before verification.

## Verification Results

- `npm run lint`: passed.
- `npm run build`: passed with default fallback configuration.
- `VITE_USE_BACKEND_API=true npm run build`: passed with backend-enabled configuration.
- `npm run test:server`: passed, 9 tests.
- `npm run db:seed`: passed.
- Live backend endpoint checks passed:
  - `GET /api/health`
  - `GET /api/users`
  - `GET /api/roles`
  - `GET /api/projects`
  - `GET /api/warehouses`
  - `GET /api/work-items`
  - `GET /api/qc-checklists`
  - `GET /api/audit-logs`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `PATCH /api/work-items/wi-006/status`
  - `POST /api/qc-checklists`
- Frontend HTTP smoke check passed at `http://localhost:5173/`.

## Known Limitations

- Backend RBAC enforcement is not implemented yet; route access is enforced in the frontend.
- Demo auth uses email plus demo code, not production password hashing.
- Backend token is a signed demo token, not a full JWT implementation.
- localStorage fallback can diverge from SQLite data after offline/demo use.
- Evidence photo remains a text reference, not a file upload.
- Logistics remains a static demo page.
- Browser UI automation could not be executed because the Browser Node bridge tool was not exposed in this session.

## Suggested Next Sprint

- Add backend RBAC middleware for protected API mutations and sensitive reads.
- Add proper password hash storage or switch to a real auth provider.
- Add QC evidence upload storage and validation.
- Add logistics manifest and shipment event models.
- Add automated frontend E2E tests for login, production update, QC submission, and RBAC redirects.
- Add migration tooling before expanding the database schema further.
