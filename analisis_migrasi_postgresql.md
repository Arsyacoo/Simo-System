# Analisis Arsitektur: Migrasi SQLite ke PostgreSQL
**Topik**: Analisis Kelayakan, Dampak, dan Strategi Migrasi Database  
**Peran**: Software Architecture Specialist  
**Tanggal**: 18 Juni 2026

---

## 1. Analisis Perbandingan: SQLite vs PostgreSQL

Untuk sistem berskala operasional seperti **SIMO Mugi Jaya**, pemilihan database sangat mempengaruhi proses deployment di cloud dan manajemen konkurensi data.

| Parameter | SQLite (Saat Ini) | PostgreSQL (Usulan) | Analisis Arsitektur |
|---|---|---|---|
| **Penyimpanan** | Berbasis file lokal tunggal (`simo.sqlite`). | Server-client database terpisah. | SQLite sangat ringkas untuk lokal, tetapi sulit dideploy di cloud hosting serverless (seperti Render/Vercel/Heroku) karena file system cloud bersifat *ephemeral* (data hilang setiap kali server restart). PostgreSQL adalah standar industri untuk cloud database. |
| **Konkurensi** | Mendukung banyak *readers*, tetapi mengunci seluruh file saat melakukan *writing* (single-writer). | Kontrol konkurensi tingkat lanjut (MVCC) dengan penguncian baris (*row-level locking*). | Jika sistem diakses oleh banyak pengguna secara bersamaan (Owner, PM, Foreman, QC), SQLite berpotensi mengalami error `SQLITE_BUSY` (database locked). PostgreSQL mengizinkan ribuan transaksi tulis simultan tanpa masalah. |
| **Integrasi Cloud** | Sulit di-scale, memerlukan setup khusus seperti Litestream. | Didukung oleh semua provider cloud database gratis/murah (Supabase, Neon, Railway, AWS RDS). | Menghubungkan PostgreSQL di cloud hanya memerlukan satu baris string koneksi: `DATABASE_URL=postgres://user:pass@host:port/db`. |
| **Setup Lokal** | Sangat mudah (nol konfigurasi, langsung jalan). | Memerlukan instalasi server PG lokal atau menjalankan Docker Compose. | PostgreSQL menambah kompleksitas lingkungan pengembangan lokal (*local development environment setup*). |

---

## 2. Mengapa Migrasi Langsung di Hackathon 1 Jam Sangat Berisiko?

Melakukan migrasi dialek database dari SQLite ke PostgreSQL di bawah tekanan waktu **60 menit** adalah keputusan yang kurang bijaksana secara arsitektur (*architectural anti-pattern*). Berikut alasannya:

1. **Perbedaan Sintaks SQL (Dialect Differences)**:
   * SQLite menggunakan `PRAGMA foreign_keys = ON;`, sedangkan PostgreSQL mengaturnya secara otomatis.
   * SQLite menggunakan integer `0/1` untuk boolean, sedangkan PostgreSQL memiliki tipe data `BOOLEAN` murni (`true/false`).
   * Skema [schema.sql](file:///d:/Tugas%20kuliah/SEM%206/PROYEK%20PEMRO/Simo-System/server/db/schema.sql) saat ini harus ditulis ulang untuk menyesuaikan tipe data Postgres (misalnya mengganti constraint `CHECK` tertentu atau tipe autoincrement).
2. **Ketergantungan Infrastruktur**:
   * Anda harus menginstal PostgreSQL di laptop Anda, atau membuat database cloud instant di Neon.tech / Supabase secara terburu-buru. Jika terjadi kegagalan jaringan saat hackathon, development lokal akan terhenti.
3. **Pemberesan Driver Backend**:
   * Anda harus mengganti library `sqlite3` dengan driver `pg` di Express, serta menulis ulang modul koneksi database di [database.js](file:///d:/Tugas%20kuliah/SEM%206/PROYEK%20PEMRO/Simo-System/server/db/database.js).

*Kesimpulan: Seluruh waktu 1 jam hackathon akan habis hanya untuk membereskan error koneksi database dan instalasi library, sehingga fitur integrasi frontend-backend tidak akan selesai.*

---

## 3. Rekomendasi Strategi Migrasi Terbaik (Roadmap 3 Tahap)

Agar migrasi berjalan mulus tanpa mengorbankan waktu hackathon, berikut adalah rencana jalan (*roadmap*) yang direkomendasikan:

```mermaid
graph LR
    Step1[Tahap 1: Hackathon Hari Ini] -->|SQLite + API Bridge| Step2[Tahap 2: Abstraksi ORM]
    Step2 -->|Migrasi Kode ke Knex/Prisma| Step3[Tahap 3: Cloud Postgres]
    Step3 -->|Deployment di Supabase/Neon| Prod[Sistem Siap Produksi]
```

### Tahap 1: Hubungkan API dengan SQLite Terlebih Dahulu (Hackathon Sekarang)
* Selesaikan target integrasi jembatan API menggunakan SQLite yang sudah berjalan stabil di backend.
* **Hasil**: Dosen melihat aplikasi full-stack berfungsi dengan baik secara lokal sebelum hackathon selesai.

### Tahap 2: Terapkan Database Abstraction Layer (Prisma atau Knex.js)
* Setelah pertemuan hackathon selesai, ganti query SQL mentah di backend menggunakan **ORM (Prisma)** atau **Query Builder (Knex.js)**.
* **Mengapa ORM/Knex?**
  Prisma/Knex mendefinisikan skema secara agnostik (tidak memihak database tertentu). Anda tidak perlu menulis query SQL secara manual. Jika ingin pindah database dari SQLite ke PostgreSQL, Anda hanya perlu mengubah konfigurasi koneksi di file environment:
  ```env
  # Pindah dari SQLite ke Postgres hanya butuh ubah baris ini di Prisma/Knex:
  DATABASE_URL="postgresql://johndoe:mypassword@localhost:5432/mydb?schema=public"
  ```
  Prisma/Knex akan secara otomatis mengonversi kode query javascript Anda menjadi dialek SQL yang sesuai dengan database aktif.

### Tahap 3: Luncurkan PostgreSQL di Cloud
* Buat database PostgreSQL gratis di **Supabase** (supabase.com) atau **Neon** (neon.tech).
* Masukkan URL koneksi ke file `.env` di server hosting (seperti Render atau Railway).
* Jalankan perintah migrasi (`npx prisma migrate deploy` atau `knex migrate:latest`).
* **Hasil**: Sistem terdeploy secara global tanpa perlu mengonfigurasi file SQLite lokal di cloud storage.

---

## 4. Pendapat Akhir & Argumen untuk Dosen

**"Gunakan SQLite untuk kecepatan prototyping di hackathon lokal hari ini, tetapi presentasikan ke dosen bahwa tim Anda sudah merancang arsitektur transisi ke PostgreSQL menggunakan ORM/Knex untuk mendukung cloud deployment pasca-hackathon."**

Strategi ini menunjukkan kedewasaan berpikir dalam rekayasa perangkat lunak (*software engineering maturity*). Dosen akan sangat mengapresiasi karena Anda tidak hanya memikirkan kemudahan saat ini, tetapi juga menjaga stabilitas kode program dan merencanakan skalabilitas jangka panjang sistem.
