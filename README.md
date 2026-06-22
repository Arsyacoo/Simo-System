# SIMO Mugi Jaya

SIMO Mugi Jaya is a full-stack Operational Management Information System for production, warehouse execution, quality control, audit logging, and logistics manifest monitoring.

The project is now organized as a clean monorepo with separate frontend and backend apps.

## Directory Structure

```text
simo-system/
├── frontend/              # React + Vite frontend
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── backend/               # Express + PostgreSQL backend
│   ├── server/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── docs/                  # Migration, sprint, and restructure notes
├── README.md
├── .gitignore
├── package.json           # Root convenience scripts
└── package-lock.json
```

## Tech Stack

- Frontend: React 19, Vite 8, React Router, Tailwind CSS v4, Lucide React, Vitest.
- Backend: Node.js, Express 5, PostgreSQL via `pg`, JWT auth, RBAC, Multer uploads.
- Database: PostgreSQL. SQLite is not used as the active database technology.

## Install

Install all packages from the root:

```bash
npm run install:all
```

Or install each app separately:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Environment Setup

Create local env files from examples. Do not commit real `.env` files. Restart the Vite dev server after changing `frontend/.env`.

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend defaults:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_BACKEND_API=true
```

Backend defaults to configure:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/simo_system
DATABASE_URL_TEST=postgresql://postgres:password@127.0.0.1:5432/simo_system_test
JWT_SECRET=change_this_secret
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=server/public/uploads
```

PostgreSQL must be running before starting the backend. If startup prints `PostgreSQL connection failed`, verify that `backend/.env` exists, `DATABASE_URL` points to an active database, and port `5432` is reachable.

## PostgreSQL Setup

1. Create a PostgreSQL database, for example `simo_system`.
2. Set `DATABASE_URL` in `backend/.env`.
3. Initialize and seed demo data:

```bash
npm run db:seed
```

The backend initializes tables from `backend/server/db/schema.sql` when the app/database helper starts.

## Run

From the root:

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:full
```

Or from each app:

```bash
npm --prefix frontend run dev
npm --prefix backend run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`
- Uploads: `http://localhost:3001/uploads/<filename>`

## Build, Lint, and Test

```bash
npm run lint:frontend
npm run build:frontend
npm run test:frontend
npm run test:backend
```

Backend tests require a reachable PostgreSQL database from `DATABASE_URL_TEST` or `DATABASE_URL`.

## Demo Login Accounts

All seeded users use password `password`.

- Owner: `rina.wijaya@simo.test`
- Production Manager: `budi.santoso@simo.test`
- Foreman: `joko.anwar@simo.test`
- QC Inspector: `siti.nurhaliza@simo.test`
- Admin: `dewi.lestari@simo.test`

## Modules

- Dashboard monitoring.
- Warehouse production work item updates.
- Digital QC checklist with evidence upload.
- Audit log tracking for production, QC, and logistics actions.
- Logistics manifest foundation with manual delivery check-ins.
- JWT authentication and role-based access control.

## Known Limitations

- Logistics check-ins are manual text entries; no live GPS yet.
- No geofencing or live map integration yet.
- Backend tests need a configured PostgreSQL instance.
- Vehicle and driver master data are still stored directly on logistics manifests.

## GitHub Push Notes

Before pushing to GitHub, keep only safe project files in version control.

- Commit `.env.example` files, not real `.env` files.
- Keep `backend/.env` and `frontend/.env` local only.
- Do not commit database passwords, JWT secrets, access tokens, or private connection strings.
- Use hosting environment variables for production credentials.
- Check ignored env files before pushing:

```bash
git check-ignore -v backend/.env frontend/.env
```

- Review pending files before commit:

```bash
git status --short
```

Recommended files to keep as examples:

- `backend/.env.example`
- `frontend/.env.example`

Recommended files to keep local only:

- `backend/.env`
- `frontend/.env`
- Local reports, notes, and generated documentation that are not needed to run the app.

## Documentation

See `docs/` for migration notes, progress reports, logistics sprint notes, and directory restructure details.


