# DAILY PROGRESS - 2026-06-08

Project: SIMO Mugi Jaya

## Completed Today

- Scanned the current repository and created `CODEBASE_SCAN_REPORT.md`.
- Confirmed the project is a React/Vite frontend without backend, database, migrations, or API routes.
- Added a shared demo data layer with localStorage persistence for:
  - users
  - roles
  - projects
  - warehouses
  - work_items
  - qc_checklists
  - audit_logs
- Added role switching in the top bar for classroom demo flow.
- Replaced the static dashboard with computed project, warehouse, work item, production progress, and shipping gate metrics.
- Implemented the Warehouses page as the Production Work Items board.
- Added status update values:
  - To-Do
  - In-Progress
  - Done
- Added audit logging for every production status update.
- Implemented the Digital QC Checklist page.
- Added QC status values:
  - Pending
  - Passed QC
  - Rework
- Added shipping gate behavior so materials are ready to ship only when QC status is `Passed QC`.
- Replaced static audit log rows with live demo audit records and CSV export.
- Updated global styling so the app uses a clean full-viewport layout.

## Verification

- `npm run lint` passed.
- `npm run build` passed.

## Bugs Found And Fixed

- React Fast Refresh reported that a component file exported both a provider component and a hook.
  - Fix: split the app data context/hook into `src/context/AppDataCore.js`.
- Vite build resolved the hook file incorrectly on Windows because of a case-insensitive filename collision.
  - Fix: renamed the shared context module to a distinct basename.

## Technical Decisions

- Used a frontend-first localStorage demo database for Day 1 because the repository does not contain a backend or database stack.
- Kept the MVP scoped to demoable classroom flows instead of adding a new backend framework mid-sprint.
- Used role switching rather than password authentication so the required roles can be demonstrated quickly.
- Logged production and QC actions through shared state so the audit trail reflects actual UI activity.

## Known Limitations

- Data persists only in browser localStorage and is not shared across devices.
- Authentication is simulated and should not be treated as secure role-based access control.
- Evidence photo is stored as a filename/reference only.
- No automated unit or end-to-end test framework is configured yet.
- Logistics remains a static demo page.

## Demo Flow

1. Select `Joko Anwar - Foreman`.
2. Open `Warehouses`.
3. Change a work item status to `In-Progress` or `Done`.
4. Select `Rina Wijaya - Owner` or `Budi Santoso - Production Manager`.
5. Open `Dashboard` and review updated production progress.
6. Select `Siti Nurhaliza - QC Inspector`.
7. Open `QC`.
8. Submit a checklist with `Passed QC` or `Rework`.
9. Open `Audit Logs` and confirm the production/QC entries.

## Suggested Next Sprint

- Add a real backend API and database migrations.
- Replace role switching with authentication.
- Add server-side audit logging.
- Add file upload storage for QC evidence photos.
- Add filters and detail pages for projects, warehouses, and work items.
- Add unit tests for data calculations and end-to-end tests for the demo flow.
