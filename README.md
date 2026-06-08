# SIMO Mugi Jaya

SIMO Mugi Jaya adalah prototype Operational Management Information System untuk Production, Logistics, dan Quality Control. MVP Day 1 berfokus pada Production Progress Monitoring, Digital QC Checklist, role demo sederhana, dan audit trail.

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4
- React Router DOM 7
- Lucide React
- ESLint

## Prasyarat

- Node.js 18 atau lebih baru
- npm 9 atau lebih baru

## Instalasi

```bash
npm install
```

## Menjalankan Aplikasi

```bash
npm run dev
```

Buka aplikasi di:

```text
http://localhost:5173/
```

Jika port 5173 sedang dipakai, Vite akan memberikan port lain di terminal.

## Script NPM

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan development server. |
| `npm run build` | Membuat build production ke folder `dist`. |
| `npm run preview` | Preview hasil build production. |
| `npm run lint` | Menjalankan ESLint. |

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
- Dokumentasi scan dan progress:
  - `CODEBASE_SCAN_REPORT.md`
  - `DAILY_PROGRESS.md`

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

- Backend API belum tersedia.
- Database/migration belum tersedia.
- Authentication masih simulasi role switcher.
- Evidence photo masih berupa filename/reference, belum upload file.
- Logistics masih halaman statis.
- Automated tests belum dikonfigurasi.

## Verification

Sudah dijalankan:

```bash
npm run lint
npm run build
```

Keduanya berhasil.

## Next Development Plan

- Tambahkan backend API dan database migrations.
- Ganti role switcher dengan login dan role-based access control yang sebenarnya.
- Pindahkan audit logging ke server.
- Tambahkan upload evidence photo untuk QC.
- Tambahkan detail page untuk project, warehouse, dan work item.
- Tambahkan test untuk kalkulasi progress, QC gate, audit log, dan demo flow.
