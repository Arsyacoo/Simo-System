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

Service API tersedia di `src/services`, tetapi belum dihubungkan ke `AppDataContext`. Default `VITE_USE_BACKEND_API=false`, sehingga seluruh demo Day 1 tetap memakai localStorage.

## Demo Accounts

Role login masih disimulasikan melalui role switcher di top bar.

| User | Role | Demo Use |
| --- | --- | --- |
| Rina Wijaya | Owner | Melihat dashboard dan audit trail. |
| Budi Santoso | Production Manager | Monitoring produksi dan update work item. |
| Joko Anwar | Foreman | Update status pekerjaan produksi. |
| Siti Nurhaliza | QC Inspector | Submit Digital QC Checklist. |
| Dewi Lestari | Admin | Akses demo penuh. |

## Halaman Aplikasi

| Route | Halaman | Deskripsi |
| --- | --- | --- |
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

## Demo Flow

1. Pilih `Joko Anwar - Foreman`.
2. Buka `Warehouses`.
3. Ubah status work item menjadi `In-Progress` atau `Done`.
4. Pilih `Rina Wijaya - Owner` atau `Budi Santoso - Production Manager`.
5. Buka `Dashboard` dan cek progress produksi.
6. Pilih `Siti Nurhaliza - QC Inspector`.
7. Buka `QC`.
8. Submit checklist dengan status `Passed QC` atau `Rework`.
9. Buka `Audit Logs` dan cek riwayat aktivitas.

## Unfinished Features

- Frontend belum membaca atau menulis ke backend API.
- Authentication masih simulasi role switcher.
- Evidence photo masih berupa filename/reference, belum upload file.
- Logistics masih halaman statis.
- Full RBAC dan hardening production belum tersedia.
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
