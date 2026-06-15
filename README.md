# SIMO Mugi Jaya

SIMO Mugi Jaya adalah prototype Operational Management Information System untuk Production, Logistics, dan Quality Control. MVP Day 1 berfokus pada Production Progress Monitoring, Digital QC Checklist, role demo sederhana, dan audit trail.

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4
- React Router DOM 7
- Lucide React
- Node.js 22.13+
- Express 5
- SQLite through `sqlite3`
- CORS
- Nodemon and Concurrently
- ESLint

## Prasyarat

- Node.js 22.13 atau lebih baru
- npm 9 atau lebih baru

## Instalasi

```bash
npm ci
```

Opsional, buat konfigurasi lokal dari `.env.example`. File `.env` nyata di-ignore oleh Git.

## Menjalankan Aplikasi

```bash
npm run dev
```

Perintah tersebut hanya menjalankan frontend Day 1 pada:

```text
http://localhost:5173/
```

Untuk menyiapkan database dan menjalankan backend:

```bash
npm run db:seed
npm run dev:server
```

Backend tersedia pada `http://localhost:3001/api`. Frontend dan backend dapat dijalankan bersama dengan:

```bash
npm run dev:all
```

Untuk menjalankan frontend dengan integrasi backend aktif, set konfigurasi berikut di `.env` lokal atau pada terminal yang menjalankan Vite:

```text
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_BACKEND_API=true
```

Default `.env.example` tetap memakai `VITE_USE_BACKEND_API=false` agar demo Day 1 dapat berjalan tanpa backend.

## Script NPM

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan frontend Vite saja. |
| `npm run dev:server` | Menjalankan backend dengan Nodemon. |
| `npm run dev:all` | Menjalankan frontend dan backend bersama. |
| `npm run start:server` | Menjalankan backend tanpa file watcher. |
| `npm run db:seed` | Membuat schema dan memasukkan demo data yang belum ada. |
| `npm run test:server` | Menjalankan integration test backend. |
| `npm run build` | Membuat build production ke folder `dist`. |
| `npm run preview` | Preview hasil build production. |
| `npm run lint` | Menjalankan ESLint. |

## Backend API Day 2

Backend memakai SQLite lokal di `server/db/simo.sqlite`. File database tidak dikomit dan dapat dibuat ulang dengan `npm run db:seed`.

Respons sukses menggunakan `{ "data": ..., "meta": ... }`. Respons gagal menggunakan `{ "error": { "code": "...", "message": "...", "details": ... } }`.

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| GET | `/api/health` | Health check API dan database. |
| POST | `/api/auth/login` | Login demo berbasis email dan demo code. |
| GET | `/api/auth/me` | Mengambil profil user dari bearer token demo. |
| GET | `/api/roles` | Daftar role. |
| GET | `/api/users` | Daftar user. |
| GET | `/api/users/:id` | Detail user. |
| GET | `/api/projects` | Daftar project. |
| GET | `/api/projects/:id` | Detail project. |
| GET | `/api/warehouses` | Daftar warehouse shared. |
| GET | `/api/warehouses/:id` | Detail warehouse. |
| GET | `/api/projects/:projectId/warehouses` | Warehouse yang digunakan project melalui work item. |
| GET | `/api/work-items` | Daftar work item. |
| GET | `/api/work-items/:id` | Detail work item. |
| GET | `/api/warehouses/:warehouseId/work-items` | Work item berdasarkan warehouse. |
| PATCH | `/api/work-items/:id/status` | Update status dan buat audit server-side. |
| GET | `/api/qc-checklists` | Daftar checklist QC. |
| GET | `/api/qc-checklists/:id` | Detail checklist QC. |
| POST | `/api/qc-checklists` | Submit QC, update shipping gate, dan buat audit. |
| GET | `/api/audit-logs` | Daftar audit; mendukung filter `module` dan `userId`. |

Contoh mutation:

```json
PATCH /api/work-items/wi-002/status
{
  "status": "Done",
  "userId": "usr-foreman"
}
```

```json
POST /api/qc-checklists
{
  "workItemId": "wi-003",
  "materialName": "Window Lockset A",
  "length": 120,
  "width": 40,
  "thickness": 2,
  "qcStatus": "Passed QC",
  "notes": "Dimensions accepted.",
  "evidencePhotoReference": "lockset-a.jpg",
  "userId": "usr-qc"
}
```

`userId` bersifat opsional dan menggunakan actor `System` jika tidak dikirim.

## Frontend API Bridge

Service API tersedia di `src/services` dan sudah dihubungkan secara bertahap ke `AppDataContext`. Saat `VITE_USE_BACKEND_API=true`, frontend mencoba membaca data roles, users, projects, warehouses, work items, QC checklists, dan audit logs dari backend.

Jika backend mati, request gagal, atau `VITE_USE_BACKEND_API=false`, aplikasi tetap memakai localStorage fallback agar demo Day 1 tidak rusak.

Mutation yang sudah backend-aware:

- `PATCH /api/work-items/:id/status` untuk update status produksi.
- `POST /api/qc-checklists` untuk submit QC checklist.
- Refresh audit logs setelah mutation backend berhasil.

## Authentication and RBAC - Day 3

Login demo tersedia di route `/login`.

Backend auth demo:

- `POST /api/auth/login`
- `GET /api/auth/me`

Auth memakai email dan demo code, lalu menyimpan session minimal di localStorage. Jika backend auth tidak tersedia, frontend memakai local demo users. Token backend adalah signed demo token sederhana, bukan JWT production.

## Demo Accounts

Shared demo code untuk semua akun: `demo123`.

| Email | User | Role | Demo Use |
| --- | --- | --- | --- |
| `rina.wijaya@simo.test` | Rina Wijaya | Owner | Melihat dashboard dan audit trail. |
| `budi.santoso@simo.test` | Budi Santoso | Production Manager | Monitoring produksi dan update work item. |
| `joko.anwar@simo.test` | Joko Anwar | Foreman | Update status pekerjaan produksi. |
| `siti.nurhaliza@simo.test` | Siti Nurhaliza | QC Inspector | Submit Digital QC Checklist. |
| `dewi.lestari@simo.test` | Dewi Lestari | Admin | Akses demo penuh. |

User-specific demo codes juga tersedia di kode untuk pengujian internal:

- `owner-demo`
- `pm-demo`
- `foreman-demo`
- `qc-demo`
- `admin-demo`

## Role Access Table

| Role | Dashboard | Warehouses | QC | Audit Logs | Logistics |
| --- | --- | --- | --- | --- | --- |
| Owner | Yes | No | No | Yes | No |
| Production Manager | Yes | Yes | No | Yes | No |
| Foreman | No | Yes | No | No | No |
| QC Inspector | No | No | Yes | No | No |
| Admin | Yes | Yes | Yes | Yes | Yes |

## Halaman Aplikasi

| Route | Halaman | Deskripsi |
| --- | --- | --- |
| `/login` | Login | Demo login berbasis email dan demo code. |
| `/` | Dashboard | Ringkasan project, warehouse, work item, progress produksi, dan shipping gate. |
| `/warehouses` | Production Work Items | Update status work item dan monitoring warehouse. |
| `/qc` | Digital QC Checklist | Submit checklist QC dan menentukan status ready to ship. |
| `/audit` | Audit Logs | Riwayat aktivitas produksi dan QC, termasuk export CSV. |
| `/logistics` | Logistics | Tampilan demo tracking logistik statis. |

## Completed Features - Day 1 MVP

- Shared demo data untuk users, roles, projects, warehouses, work items, QC checklists, dan audit logs.
- LocalStorage persistence untuk demo data.
- Role switcher untuk Owner, Production Manager, Foreman, QC Inspector, dan Admin.
- Dashboard produksi dengan progress project dan warehouse yang dihitung dari work items.
- Production Work Items board dengan status:
  - To-Do
  - In-Progress
  - Done
- Audit log otomatis untuk perubahan status produksi.
- Digital QC Checklist dengan field:
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
- QC status:
  - Pending
  - Passed QC
  - Rework
- Shipping gate: material hanya `Ready` jika status QC adalah `Passed QC`.
- Audit log otomatis untuk submission QC.
- CSV export untuk audit logs.
## Completed Features - Day 2 Backend Foundation

- Express REST API dan health check.
- SQLite schema untuk tujuh tabel inti.
- Idempotent seed dari data demo Day 1.
- Server-side audit logging untuk perubahan status produksi dan submission QC.
- QC shipping gate transaction.
- Konsisten JSON success/error envelope.
- Frontend API service bridge dengan feature flag nonaktif.
- Integration test backend berbasis `node:test`.
- Dokumentasi plan dan summary Day 2.

## Completed Features - Day 3 Frontend-Backend Integration

- `DAY3_INTEGRATION_PLAN.md` dibuat setelah scan direktori.
- API client layer ditingkatkan dengan base URL config, timeout, token support, dan error handling.
- Service file ditambahkan untuk auth, projects, warehouses, roles, dan users.
- Dashboard membaca data backend melalui `AppDataContext` saat API mode aktif.
- Warehouses page update status melalui backend dan tetap fallback ke localStorage jika gagal.
- QC page submit checklist melalui backend dan tetap fallback ke localStorage jika gagal.
- Audit logs direfresh setelah mutation backend berhasil.
- Login page ditambahkan.
- `AuthContext` dan protected route behavior ditambahkan.
- Sidebar menu mengikuti role login.
- Backend auth demo endpoint ditambahkan.
- Backend test ditambah untuk login dan `/api/auth/me`.

## Demo Flow

1. Login sebagai `joko.anwar@simo.test` dengan demo code `demo123`.
2. Buka `Warehouses`.
3. Ubah status work item menjadi `In-Progress` atau `Done`.
4. Logout.
5. Login sebagai `rina.wijaya@simo.test` atau `budi.santoso@simo.test`.
6. Buka `Dashboard` dan cek progress produksi.
7. Buka `Audit Logs` dan cek riwayat aktivitas.
8. Logout.
9. Login sebagai `siti.nurhaliza@simo.test`.
10. Buka `QC`.
11. Submit checklist dengan status `Passed QC` atau `Rework`.
12. Login sebagai user yang punya akses audit untuk melihat riwayat QC.

## Unfinished Features

- Backend RBAC enforcement belum tersedia; RBAC Day 3 masih di frontend.
- Password hashing belum digunakan karena auth memakai demo code, bukan password production.
- Evidence photo masih berupa filename/reference, belum upload file.
- Logistics masih halaman statis.
- Full auth hardening production belum tersedia.
- Schema memakai file SQL idempotent, belum memakai migration framework.

## Verification

Sudah dijalankan:

```bash
npm run lint
npm run build
npm run test:server
npm run db:seed
```

Seluruh perintah berhasil.

Day 3 juga diverifikasi dengan live backend endpoint checks untuk:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `GET /api/warehouses`
- `GET /api/work-items`
- `PATCH /api/work-items/:id/status`
- `POST /api/qc-checklists`
- `GET /api/audit-logs`

## Next Development Plan

- Hubungkan `AppDataContext` ke backend secara bertahap dengan localStorage fallback.
- Tambahkan login dan role-based access control yang sebenarnya.
- Tambahkan upload evidence photo untuk QC.
- Tambahkan migration framework sebelum schema production berkembang.
- Tambahkan detail page untuk project, warehouse, dan work item.
- Tambahkan end-to-end test untuk demo flow frontend.

## Safe Rollback

- `npm run dev` tetap frontend-only.
- `AppDataContext` dan halaman Day 1 tidak diubah.
- `VITE_USE_BACKEND_API=false` mempertahankan localStorage sebagai sumber data aktif.
- Database generated dapat dihapus dan dibuat ulang dengan `npm run db:seed`.
- Backend dapat dilepas tanpa mengubah flow demo frontend.
