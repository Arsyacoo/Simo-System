# CODEBASE SCAN REPORT - SIMO Mugi Jaya

Scan date: 2026-06-08

## Project Tech Stack

- Frontend: React 19 with Vite.
- Routing: React Router DOM 7.
- Styling: Tailwind CSS 4 through `@tailwindcss/vite`.
- Icons: Lucide React.
- Quality tooling: ESLint 10.
- Package manager: npm with `package-lock.json`.
- Backend: Not found.
- Database: Not found.
- PHP/Laravel stack: Not found. No `composer.json`, controllers, models, migrations, or `.env.example` exist in the current repository.

## Main Directory Structure

```text
D:\SIMO
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── pages/
│   │   ├── AuditLogs.jsx
│   │   ├── Dashboard.jsx
│   │   └── Logistics.jsx
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
└── vite.config.js
```

Ignored/generated folders during scan:

- `.git`
- `node_modules`
- Future `dist` or `build` output folders

## Important Files Found

- `package.json`: Defines React/Vite scripts and dependencies.
- `vite.config.js`: Registers React and Tailwind Vite plugins.
- `eslint.config.js`: Uses recommended JavaScript, React Hooks, and React Refresh ESLint configs.
- `README.md`: Documents current frontend dashboard routes and setup.
- `src/main.jsx`: React entry point.
- `src/App.jsx`: App shell, sidebar navigation, top bar, and route definitions.
- `src/pages/Dashboard.jsx`: Hard-coded production progress dashboard.
- `src/pages/Logistics.jsx`: Static logistics tracking page.
- `src/pages/AuditLogs.jsx`: Static audit trail table.
- `src/index.css`: Tailwind import and base theme variables.
- `src/App.css`: Legacy/demo CSS that is not imported by the current app entry.

## Existing Modules

- Dashboard shell with sidebar navigation and top bar.
- Production dashboard with static project/warehouse summary cards.
- Static warehouse progress visualization.
- Static logistics tracking screen.
- Static audit log table.
- Placeholder routes for Warehouses and QC.

## Missing Modules

- Authentication/login flow.
- Role-based access controls for Owner, Production Manager, Foreman, QC Inspector, and Admin.
- Persistent database or API backend.
- Data models/entities for:
  - users
  - roles
  - projects
  - warehouses
  - work_items
  - qc_checklists
  - audit_logs
- Production work item update workflow.
- Digital QC Checklist form.
- Audit logging tied to actual user actions.
- Seed/demo data module.
- Warehouse page implementation.
- README documentation for demo accounts and Day 1 MVP flow.
- Automated tests.

## Structural Issues And Potential Errors

- The app is frontend-only, so Day 1 database requirements need to be represented as mock client-side data unless a backend is added later.
- Current data is duplicated inside individual page components, which makes cross-page updates and audit logging impossible without shared state.
- Navigation uses plain `<a href>` links in a React Router app; this works but triggers full page reloads instead of client-side navigation.
- `src/App.css` contains leftover scaffold styles and is not currently imported.
- The dashboard has hard-coded metrics, so progress percentages do not reflect work item status changes yet.
- QC route is only a placeholder, so the Digital QC Checklist flow cannot be demonstrated yet.
- Warehouse route is only a placeholder, so Foreman production updates cannot be demonstrated yet.
- Audit logs are static and are not generated when production or QC activities happen.
- No `.env.example` exists, but the current frontend-only app does not require runtime environment variables.

## Day 1 Development Recommendation

Use an MVP frontend-first approach:

1. Add a shared in-memory data layer with realistic demo seed data for users, roles, projects, warehouses, work items, QC checklists, and audit logs.
2. Add a simple role selector to simulate login for the classroom demo.
3. Replace static dashboard values with computed production metrics from the shared data.
4. Implement a Warehouses/Production page where Foremen can update work item statuses.
5. Implement audit log creation for every production status update.
6. Implement a QC Checklist page where QC Inspectors can submit checklist records.
7. Prevent non-passed QC records from being treated as ready to ship in the UI.
8. Replace static Audit Logs page data with shared audit log state.
9. Update README and create `DAILY_PROGRESS.md` with completed work, known gaps, and demo flow.

## Technical Risks

- No real backend means data resets on page refresh.
- No real authentication means role-based access is a demo simulation only.
- No database migrations can be created without introducing a backend stack.
- Browser-only state keeps the MVP fast for Day 1 but should not be treated as production-ready.
- React Router DOM 7 and React 19 are modern dependencies, so future library usage should follow installed versions rather than older examples.
- Automated testing is not configured; verification should at minimum include lint/build and manual demo flow checks.

## Sprint Development Plan

### Sprint 1 - MVP Foundation

- Create a shared app data context.
- Seed demo users, roles, projects, warehouses, work items, QC checklist records, and audit logs.
- Add simple role switching in the top bar.
- Document the simulated database approach in `DAILY_PROGRESS.md`.

### Sprint 2 - Production Progress Monitoring

- Implement the Warehouses page as the Foreman work update screen.
- Support status values: `To-Do`, `In-Progress`, and `Done`.
- Recompute dashboard project, warehouse, work item, completed item, and progress percentage metrics from shared data.
- Create an audit log entry whenever a work item status changes.

### Sprint 3 - Digital QC Checklist

- Implement the QC page with checklist fields:
  - project
  - warehouse
  - work item
  - material name
  - length
  - width
  - thickness
  - QC status
  - notes
  - evidence photo reference
- Support QC status values: `Pending`, `Passed QC`, and `Rework`.
- Record QC submissions in the audit log.
- Show which materials are ready to ship only when QC status is `Passed QC`.

### Sprint 4 - Testing, Demo Flow, And Documentation

- Run lint/build checks.
- Test the main demo flow:
  1. Select Foreman role.
  2. Update a work item status.
  3. Select Owner or Production Manager role.
  4. Review the production dashboard.
  5. Select QC Inspector role.
  6. Submit a QC checklist.
  7. Review the audit log.
- Update README with installation, run commands, demo accounts, completed features, unfinished features, and next sprint plan.
- Keep `DAILY_PROGRESS.md` updated with issues and technical decisions.
