# SIMO System

SIMO System adalah aplikasi dashboard web untuk memantau aktivitas operasional pabrik, mulai dari progres produksi warehouse, logistik, quality control, hingga audit trail. Project ini dibangun menggunakan React, Vite, Tailwind CSS, React Router, dan Lucide React untuk menghasilkan antarmuka yang modern, ringan, dan mudah dikembangkan.

## Fitur Utama

- **Dashboard Produksi**: Menampilkan ringkasan active projects, total warehouses, pending QC items, dan progres produksi setiap warehouse.
- **Monitoring Warehouse**: Visualisasi progress bar untuk berbagai kategori material dan tahap produksi.
- **Logistics Tracking**: Halaman logistik untuk memantau manifest, pengiriman, dan status distribusi.
- **Audit Trail**: Tabel activity log untuk mencatat perubahan data sistem berdasarkan timestamp, pengguna, aksi, dan tabel terdampak.
- **Navigasi Sidebar**: Layout dashboard dengan menu Dashboard, Warehouses, Logistics, QC, dan Audit Logs.
- **UI Responsif**: Tampilan bersih berbasis utility class Tailwind CSS yang nyaman digunakan pada berbagai ukuran layar.

## Tech Stack

- **React** - Library utama untuk membangun user interface.
- **Vite** - Development server dan build tool yang cepat.
- **Tailwind CSS** - Utility-first CSS framework untuk styling.
- **React Router DOM** - Routing antar halaman dashboard.
- **Lucide React** - Icon library untuk komponen visual.
- **ESLint** - Pemeriksaan kualitas dan konsistensi kode.

## Struktur Project

```text
MugiMugi/
├── public/                 # Static assets publik
├── src/
│   ├── assets/             # Asset gambar dan ikon aplikasi
│   ├── pages/              # Halaman utama aplikasi
│   │   ├── AuditLogs.jsx
│   │   ├── Dashboard.jsx
│   │   └── Logistics.jsx
│   ├── App.jsx             # Layout utama dan konfigurasi routing
│   ├── App.css             # Style tambahan aplikasi
│   ├── index.css           # Global style dan Tailwind import
│   └── main.jsx            # Entry point React
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Prasyarat

Pastikan perangkat sudah memiliki:

- Node.js versi 18 atau lebih baru
- npm versi 9 atau lebih baru

## Instalasi

Clone repository:

```bash
git clone https://github.com/username/simo-system.git
cd simo-system
```

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi di browser:

```text
http://localhost:5173/
```

## Script NPM

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi dalam mode development. |
| `npm run build` | Membuat build production ke folder `dist`. |
| `npm run preview` | Menjalankan preview dari hasil build production. |
| `npm run lint` | Menjalankan ESLint untuk memeriksa kualitas kode. |

## Halaman Aplikasi

| Route | Halaman | Deskripsi |
| --- | --- | --- |
| `/` | Dashboard | Ringkasan status produksi dan progress warehouse. |
| `/logistics` | Logistics | Monitoring data dan status aktivitas logistik. |
| `/audit` | Audit Logs | Riwayat aktivitas dan perubahan data sistem. |
| `/warehouses` | Warehouses | Placeholder untuk modul warehouse. |
| `/qc` | Quality Control | Placeholder untuk modul quality control. |

## Build Production

Untuk membuat versi production:

```bash
npm run build
```

Untuk melihat hasil build secara lokal:

```bash
npm run preview
```

## Rencana Pengembangan

- Integrasi backend API untuk data warehouse, logistik, dan audit log.
- Menambahkan autentikasi dan role-based access control.
- Menyediakan fitur export laporan dalam format CSV atau PDF.
- Menambahkan halaman detail untuk warehouse dan quality control.
- Menambahkan unit test dan end-to-end test.

## Kontribusi

Kontribusi sangat terbuka. Silakan lakukan fork repository, buat branch fitur baru, lalu ajukan pull request.

```bash
git checkout -b feature/nama-fitur
```

## Lisensi

Project ini belum menentukan lisensi resmi. Tambahkan file `LICENSE` sebelum digunakan untuk kebutuhan publik atau produksi.
