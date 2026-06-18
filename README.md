# SIMO Mugi Jaya

SIMO Mugi Jaya adalah *Operational Management Information System* (OMIS) tingkat produksi yang dirancang untuk mengelola dan memantau proses Produksi (*Production Progress Monitoring*), Logistik (*Logistics Tracking*), dan Pengendalian Kualitas (*Digital Quality Control Checklist*). 

Aplikasi ini dikembangkan dengan arsitektur terpisah (*decoupled architecture*) menggunakan React di frontend dan Express.js di backend, serta ditenagai oleh database relasional PostgreSQL untuk penyimpanan cloud-native.

---

## 🚀 Fitur Utama & Rangkaian Perkembangan

### 📦 Day 1: UI/UX MVP (Frontend Prototype)
* **Interactive Dashboard**: Visualisasi progres proyek manufaktur dan kapasitas muat gudang secara real-time.
* **Kanban Board Work Items**: Papan status seret-dan-lepas dinamis (To-Do, In-Progress, Done) untuk pengelolaan tugas lantai produksi.
* **Digital QC Form**: Formulir inspeksi kualitas dimensi material dengan status QC (Pending, Passed QC, Rework) terintegrasi ke gerbang pengiriman (*shipping gate*).
* **Audit Trail UI**: Log pencatatan aktivitas pengguna otomatis yang dilengkapi dengan filter pencarian dan opsi ekspor data ke berkas CSV.

### 🔌 Day 2: Integrasi Full-Stack & Skalabilitas Database
* **PostgreSQL Cloud Database**: Migrasi basis data dari SQLite lokal ke PostgreSQL (kompatibel dengan Supabase/Neon) untuk mendukung konkurensi data tingkat tinggi.
* **SQL Compatibility Layer**: Driver abstraksi dinamis yang menerjemahkan kueri SQLite ke dialek PostgreSQL secara runtime untuk menghindari proses refactoring query di router.
* **Transactional Safety**: Pengamanan transaksi database atomik pada rute QC dan perubahan status pekerjaan menggunakan modul bawaan Node.js **`AsyncLocalStorage`** untuk mengisolasi pool client per-request.
* **Otentikasi Stateless JWT**: Sistem login aman menggunakan JSON Web Tokens (JWT) dengan enkripsi 24 jam untuk melindungi data operasional perusahaan.
* **Role-Based Access Control (RBAC)**: Pembatasan menu antarmuka UI dan proteksi rute API server berdasarkan hak peran pengguna aktif (Owner, PM, Foreman, QC Inspector, Admin).
* **Unggah Foto QC Aktual**: Integrasi pustaka `multer` untuk memproses pengunggahan bukti fisik gambar inspeksi secara biner ke sistem penyimpanan berkas server statis.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend SPA**: React 19, Vite 8, Tailwind CSS v4, React Router DOM 7, Lucide React, @testing-library/react, jsdom.
* **Backend REST API**: Node.js 22.13+, Express 5, PostgreSQL (`pg` pool client), jsonwebtoken, multer, nodemon, concurrently.

---

## 📐 Arsitektur Sistem (System Architecture)

Sistem menggunakan desain client-server stateless dengan layer transaksi terisolasi dan layer kompatibilitas database terpadu:

```mermaid
graph TD
    subgraph Client [React SPA Client]
        UI[React UI Components] --> Router[React Router DOM 7]
        UI --> Context[AppDataContext State]
        Context --> Auth[JWT Storage]
        Context --> Bridge[API Service Bridge]
    end

    subgraph Server [Express RESTful API]
        Bridge -->|HTTP + Bearer Token| Express[Express 5 Server]
        Express --> AuthMW[requireAuth Middleware]
        Express --> RouterLayer[Modular Router Layer]
        RouterLayer --> DB[PostgreSQL Abstract Layer]
        DB --> ALS[AsyncLocalStorage Transaction Bound]
        ALS --> PG[(Cloud PostgreSQL / Neon / Supabase)]
    end
    
    subgraph Filesystem [Storage System]
        Express -.->|Binary Streams| Multer[Multer Disk Engine]
        Multer --> Uploads[/server/public/uploads/]
    end
```

---

## 📋 Struktur Skema Database
Sistem relasional data terdiri dari 7 tabel utama:
* `roles`: Manajemen peran operasional pengguna.
* `users`: Data identitas dan relasi lokasi kerja pengguna.
* `projects`: Informasi proyek manufaktur aktif.
* `warehouses`: Informasi gudang produksi terikat.
* `work_items`: Daftar pekerjaan perakitan material produksi.
* `qc_checklists`: Rekaman hasil inspeksi dan dimensi fisik material.
* `audit_logs`: Rekaman log audit otomatis kepatuhan operasional.

---

## ⚙️ Panduan Setup & Instalasi

### 1. Prasyarat
* Node.js versi 22.13 atau lebih baru
* npm versi 9 atau lebih baru
* Akun PostgreSQL (direkomendasikan menggunakan instance cloud gratis di [Neon.tech](https://neon.tech) atau [Supabase](https://supabase.com))

### 2. Pemasangan Dependencies
Kloning repository dan jalankan instalasi paket:
```bash
npm install
```

### 3. Konfigurasi Environment
Buat berkas `.env` pada direktori root proyek berdasarkan `.env.example`:
```env
# Koneksi PostgreSQL (Sesuaikan dengan Neon/Supabase Anda)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
DATABASE_URL_TEST="postgresql://user:password@host:port/test-dbname?sslmode=require"

# Konfigurasi Koneksi Frontend
VITE_USE_BACKEND_API=true
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Database Seeding
Jalankan script untuk mengonfigurasi skema awal dan mengisi demo data secara otomatis ke database cloud:
```bash
npm run db:seed
```

---

## 💻 NPM Scripts

Aplikasi menyediakan berbagai script siap pakai untuk pengembangan dan pengujian:

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan React frontend (Vite) saja. |
| `npm run dev:server` | Menjalankan Express backend dengan nodemon & pembacaan `.env`. |
| `npm run dev:all` | Menjalankan frontend dan backend secara bersamaan (*concurrently*). |
| `npm run start:server` | Menjalankan backend Express tanpa file watcher. |
| `npm run db:seed` | Membuat tabel awal dan menyuntikkan demo data idempotent ke database. |
| `npm run test:server` | Menjalankan pengujian integrasi REST API backend (`node:test`). |
| `npm run test:ui` | Menjalankan pengujian DOM React Component frontend (`vitest`). |
| `npm run build` | Membuat bundle kompilasi produksi frontend ke dalam folder `dist`. |
| `npm run lint` | Menjalankan ESLint untuk pengecekan kualitas kode. |

---

## 🧪 Strategi Pengujian (Testing Strategy)

Proyek ini memisahkan pengujian backend dan frontend untuk mengoptimalkan keandalan arsitektur:

### A. Backend Integration Testing
* **Metode**: Menggunakan modul pengujian bawaan Node.js (`node:test`).
* **Cakupan**: Memvalidasi integrasi route, translasi query database, kepatuhan transaksi atomik, validasi JSON, dan keandalan proteksi autentikasi token JWT.
* **Perintah**: `npm run test:server`

### B. Frontend DOM Testing
* **Metode**: Menggunakan **Vitest** dan **React Testing Library** dalam lingkungan browser virtual **jsdom**.
* **Cakupan**: Memverifikasi render antarmuka login, interaksi klik cepat demo akun (1-Click Fill), dan orkestrasi penyerahan (*submit*) formulir biner.
* **Perintah**: `npm run test:ui`

---

## 🔐 Akun Demo Operasional

Untuk login di antarmuka sistem (JWT Auth), gunakan akun di bawah dengan password default: **`password`**

| Nama Pengguna | Email Login | Hak Peran (Role) | Hak Akses Utama |
|---|---|---|---|
| **Rina Wijaya** | `rina.wijaya@simo.test` | Owner | Dashboard, Logistik, & Audit Trail. |
| **Budi Santoso** | `budi.santoso@simo.test` | Production Manager | Manajemen produksi, Update Work Item, & Audit Trail. |
| **Joko Anwar** | `joko.anwar@simo.test` | Foreman | Papan Produksi & Update status pekerjaan. |
| **Siti Nurhaliza** | `siti.nurhaliza@simo.test` | QC Inspector | Formulir Digital QC & QC Checklist History. |
| **Dewi Lestari** | `dewi.lestari@simo.test` | Admin | Akses operasional penuh sistem. |
