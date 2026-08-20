# Smart Bendahara
## Product Requirements Document — v2.0

> **Status:** Draft · **Versi:** 2.0.0 · **Tanggal:** Juli 2025
> **Tipe Produk:** SaaS Multi-Tenant — Web Application
> **Target Pasar:** Sekolah SD/SMP/SMA/SMK seluruh Indonesia
> **Perubahan v2.0:** Tambah ERD Database, Spesifikasi WA Notifikasi, User Flow, Tech Stack

---

## Daftar Isi

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Pengguna & Persona](#3-target-pengguna--persona)
4. [Tujuan Produk & Metrik](#4-tujuan-produk--metrik-keberhasilan)
5. [Spesifikasi 14 Fitur Inti](#5-spesifikasi-14-fitur-inti)
6. [User Flow](#6-user-flow)
7. [Arsitektur Multi-Tenant](#7-arsitektur-multi-tenant)
8. [Database Schema & ERD](#8-database-schema--erd)
9. [Spesifikasi Sistem Notifikasi WhatsApp](#9-spesifikasi-sistem-notifikasi-whatsapp)
10. [Tech Stack & Arsitektur](#10-tech-stack--arsitektur)
11. [User Stories Prioritas Tinggi](#11-user-stories-prioritas-tinggi)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Roadmap Pengembangan](#13-roadmap-pengembangan)
14. [Model Bisnis & Monetisasi](#14-model-bisnis--monetisasi)
15. [Risiko & Mitigasi](#15-risiko--mitigasi)
16. [Glosarium](#16-glosarium)

---

## 1. Executive Summary

Smart Bendahara adalah aplikasi manajemen keuangan sekolah berbasis SaaS multi-tenant yang menyelesaikan masalah nyata bendahara sekolah di seluruh Indonesia: pencatatan manual, kehilangan data, laporan mendadak, dan kesulitan menagih tunggakan secara personal kepada orang tua.

Dengan 14 fitur inti, notifikasi WhatsApp otomatis, dan arsitektur multi-tenant yang memastikan data setiap sekolah sepenuhnya terisolasi, Smart Bendahara hadir sebagai solusi terpadu yang bisa dijual ke ribuan sekolah.

### Nilai Utama Produk

| Nilai | Deskripsi |
|-------|-----------|
| **Efisiensi** | Proses yang biasanya membutuhkan berjam-jam kini selesai dalam hitungan menit |
| **Akurasi** | Kalkulasi otomatis menghilangkan risiko human error pada pencatatan manual |
| **Transparansi** | Orang tua dapat memantau keuangan anak kapan saja melalui portal mandiri |
| **Solusi "Sungkan Nagih"** | Pengingat tunggakan H+7 berjalan 100% otomatis atas nama sekolah |
| **Skalabilitas** | Satu platform untuk ribuan sekolah, data sepenuhnya terisolasi per tenant |
| **Keamanan Data** | Backup cloud otomatis, Row-Level Security di level database |

---

## 2. Problem Statement

### 2.1 Masalah Utama

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Buku tabungan siswa sering hilang | Data tidak sinkron, konflik saat pengambilan |
| 2 | Pencatatan SPP manual di buku atau Excel terpisah | Sulit melihat siapa yang belum bayar |
| 3 | Tidak ada pengingat otomatis untuk tunggakan | Penagihan bergantung pada keberanian bendahara |
| 4 | Kepala sekolah minta laporan mendadak | Bendahara keteteran merangkum dari berbagai sumber |
| 5 | Data hilang jika komputer rusak | Risiko kehilangan riwayat keuangan tahunan |
| 6 | Kenaikan kelas sangat manual | Butuh berjam-jam memperbarui seluruh data siswa |
| 7 | Tidak ada transparansi ke orang tua | Orang tua tidak tahu saldo tabungan atau tunggakan |
| 8 | Tagihan insidental tidak terstruktur | Susah tracking siapa yang sudah/belum membayar |

### 2.2 Pernyataan Masalah Utama

> *"Bendahara sekolah membutuhkan satu sistem terpadu yang menggantikan pencatatan manual, mengotomatiskan komunikasi ke orang tua termasuk pengingat tunggakan, dan menghasilkan laporan akurat kapan saja — sementara kepala sekolah dan orang tua pun bisa memantau kondisi keuangan secara real-time."*

---

## 3. Target Pengguna & Persona

### 3.1 Segmen Pasar

- Sekolah Dasar (SD) — swasta dan negeri
- Sekolah Menengah Pertama (SMP) — swasta dan negeri
- Sekolah Menengah Atas/Kejuruan (SMA/SMK) — swasta dan negeri
- Madrasah (MI/MTs/MA)

### 3.2 Persona Pengguna

#### Persona 1 — Bu Sari, Bendahara Sekolah

| Atribut | Detail |
|---------|--------|
| Usia | 38 tahun |
| Latar Belakang | Guru merangkap bendahara, bukan dari latar akuntansi |
| Pain Points | Keteteran saat nagih SPP, takut laporan salah |
| Goals | Selesaikan pekerjaan cepat, laporan akurat |
| Frekuensi Pakai | Harian (input transaksi), Bulanan (laporan) |

#### Persona 2 — Pak Andi, Kepala Sekolah

| Atribut | Detail |
|---------|--------|
| Usia | 47 tahun |
| Peran | Pembaca laporan, penerima ringkasan keuangan |
| Pain Points | Tidak bisa memantau keuangan sekolah real-time |
| Goals | Laporan tersedia kapan pun tanpa minta ke bendahara |
| Frekuensi Pakai | Mingguan (dashboard) |

#### Persona 3 — Ibu Dewi, Orang Tua Siswa

| Atribut | Detail |
|---------|--------|
| Usia | 34 tahun |
| Peran | Penerima notifikasi, pengguna portal orang tua |
| Pain Points | Tidak tahu saldo tabungan anak, lupa jadwal SPP |
| Goals | Pantau keuangan anak dari HP, terima reminder |
| Frekuensi Pakai | Sesuai kebutuhan (portal mandiri) |

---

## 4. Tujuan Produk & Metrik Keberhasilan

### 4.1 Tujuan Bisnis

- Membangun SaaS yang dapat digunakan banyak sekolah secara bersamaan dengan data terisolasi
- Menghasilkan recurring revenue dari langganan bulanan/tahunan per sekolah
- Menjadi solusi #1 manajemen keuangan sekolah di Indonesia

### 4.2 Key Performance Indicators

| KPI | Target 6 Bulan | Target 12 Bulan |
|-----|---------------|----------------|
| Sekolah aktif berlangganan | 50 sekolah | 250 sekolah |
| Churn rate bulanan | < 3% | < 2% |
| Waktu onboarding per sekolah | < 2 jam | < 1 jam |
| NPS (Net Promoter Score) | > 40 | > 55 |
| Uptime sistem | 99.5% | 99.9% |
| Adoptasi notifikasi WA | > 70% sekolah aktif | > 85% sekolah aktif |
| Transaksi rata-rata/sekolah/bulan | > 100 | > 200 |

---

## 5. Spesifikasi 14 Fitur Inti

Seluruh fitur tersedia dalam satu platform per sekolah (tenant). Setiap sekolah hanya bisa mengakses datanya sendiri.

### F-01 · Data Siswa

- Input manual atau import massal via template Excel
- Validasi duplikat NISN, pencarian nama, filter per kelas
- Export daftar siswa ke PDF atau Excel
- Audit trail setiap perubahan data siswa

**Acceptance Criteria:**
- Import 300 siswa sekaligus selesai dalam < 5 detik
- Template Excel tersedia untuk diunduh langsung
- Data gagal import ditampilkan dalam laporan error

---

### F-02 · Manajemen SPP

- Tabel bulanan per kelas: baris = siswa, kolom = bulan (Jan–Des)
- Input pembayaran dengan pencarian nama dan filter kelas
- Dukungan cicilan: sistem menyimpan sisa tagihan otomatis
- Tanda terima digital yang bisa dicetak atau dikirim via WA
- Rekap tunggakan: daftar siswa belum bayar beserta jumlahnya

---

### F-03 · Tabungan Siswa

- Input setoran dan penarikan tabungan digital (menggantikan buku fisik)
- Saldo real-time diperbarui setiap transaksi
- Riwayat mutasi per siswa, validasi saldo cukup sebelum tarik
- Export mutasi setara buku tabungan digital

---

### F-04 · Tagihan Insidental & Kustom

- Tambah tagihan baru: nama, nominal, jatuh tempo, assign per kelas atau pilih siswa
- Dukungan cicilan dengan kalkulasi sisa otomatis
- Status tagihan: Belum Bayar / Sebagian / Lunas
- Arsip tagihan yang sudah selesai tanpa menghapus riwayat

---

### F-05 · Laporan & Export

- Laporan SPP, tabungan, tagihan, dan rekap pemasukan harian/bulanan/tahunan
- Export PDF: layout siap cetak, berlogo sekolah
- Export Excel: data mentah untuk analisis lebih lanjut

---

### F-06 · Notifikasi WhatsApp Otomatis

> Detail lengkap spesifikasi WA ada di **Bagian 9** dokumen ini.

- Auto-kirim WA saat pembayaran SPP, setor/tarik tabungan, tagihan baru
- Pengingat tunggakan H-3, H-0, H+7 berjalan otomatis tanpa aksi bendahara
- Pesan dikirim atas nama sekolah — **solusi masalah "sungkan nagih"**
- Template pesan bisa dikustomisasi per sekolah

---

### F-07 · Audit Log / Riwayat Aktivitas

- Setiap aksi tercatat: siapa, apa, kapan, data sebelum dan sesudah perubahan
- Filter per pengguna, tanggal, atau jenis aksi
- Export audit log ke PDF/Excel untuk kebutuhan auditor

---

### F-08 · Backup Cloud Otomatis

- Backup otomatis harian ke cloud storage, retensi 30 hari
- Admin bisa memicu backup manual kapan saja
- Notifikasi email jika backup gagal

---

### F-09 · Multi Tahun Ajaran

- Admin membuat tahun ajaran baru tanpa menghapus data lama
- Riwayat tahun ajaran sebelumnya tetap bisa diakses dan diexport

---

### F-10 · Kenaikan Kelas Massal

- Proses kenaikan kelas satu klik dengan preview sebelum konfirmasi
- Siswa kelas akhir otomatis ditandai alumni

---

### F-11 · Pembayaran Parsial / Cicilan

- Berlaku untuk SPP dan tagihan insidental
- Setiap cicilan dicatat, sisa tagihan dihitung otomatis
- Status berubah menjadi "Lunas" saat sisa tagihan mencapai 0

---

### F-12 · Dashboard / Portal Orang Tua

- Login dengan OTP via WA
- Akses: status SPP, saldo tabungan, riwayat transaksi, tagihan aktif
- Tampilan mobile-first, responsif untuk layar HP

---

### F-13 · Rekonsiliasi Kas

- Input kas fisik, sistem tampilkan: kas sistem vs fisik vs selisih
- Selisih ditandai merah, catatan penjelasan wajib diisi
- Riwayat rekonsiliasi tersimpan untuk keperluan audit

---

### F-14 · Pengingat Otomatis Terjadwal

- Jadwal H-3, H-0, H+7 dikonfigurasi per sekolah
- Cron job harian 08:00 WIB mengecek dan mengirim tanpa aksi manual

---

## 6. User Flow

### 6.1 Flow Pelanggan Baru (Registrasi & Onboarding)

```
[1] Temukan Smart Bendahara
     Landing page, referral, komunitas guru
          ↓
[2] Daftar Akun
     Nama sekolah, email admin, buat password
          ↓
[3] Verifikasi Email
     Klik tautan konfirmasi di inbox
          ↓
[4] Onboarding Wizard (4 Langkah)
     Step 1: Data sekolah (nama, alamat, logo)
     Step 2: Konfigurasi nominal SPP per kelas
     Step 3: Import data siswa (Excel / manual)
     Step 4: Setup WhatsApp gateway (opsional)
          ↓
[5] Dashboard Aktif — Trial 14 Hari Gratis
     Semua fitur tersedia, tidak perlu kartu kredit
          ↓
[6] Pilih Paket Berlangganan
     Starter · Professional · Enterprise
```

### 6.2 Flow Bendahara Harian (Admin Tenant)

```
Login → Dashboard Overview
              ↓
   ┌──────────┼──────────┐
   ↓          ↓          ↓
[Jalur A]  [Jalur B]  [Jalur C]
Input SPP  Tabungan   Tagihan
   │          │          │
   ↓          ↓          ↓
Notif WA   Update      Track
Otomatis   Saldo       Status
   └──────────┼──────────┘
              ↓
     Generate Laporan
              ↓
     Export PDF / Excel
```

#### Jalur A — Input SPP
1. Cari siswa berdasarkan nama atau filter kelas
2. Pilih bulan yang dibayar, input nominal
3. Konfirmasi → sistem mencatat dan mengirim WA konfirmasi otomatis

#### Jalur B — Kelola Tabungan
1. Cari siswa, pilih jenis transaksi (setor atau tarik)
2. Input nominal → saldo diperbarui real-time
3. WA konfirmasi terkirim otomatis ke orang tua

#### Jalur C — Buat Tagihan Insidental
1. Buat tagihan baru: nama, nominal, jatuh tempo
2. Assign ke seluruh kelas atau pilih siswa tertentu
3. Track status cicilan hingga lunas

---

## 7. Arsitektur Multi-Tenant

### 7.1 Konsep Utama

Satu instance aplikasi melayani banyak sekolah (tenant), namun data setiap sekolah sepenuhnya terisolasi. Sekolah A tidak pernah bisa melihat data sekolah B.

### 7.2 Strategi Isolasi Data

- Setiap tabel transaksi menyimpan `tenant_id` secara langsung (bukan hanya via join)
- **Row-Level Security (RLS)** di PostgreSQL: pengguna hanya bisa mengakses baris dengan `tenant_id` milik sekolahnya
- Middleware autentikasi memvalidasi `tenant_id` di setiap request API
- File upload disimpan di folder terpisah per tenant di cloud storage
- Token JWT menyimpan `tenant_id` dan di-decode di setiap request

### 7.3 Hierarki Peran Pengguna

| Peran | Hak Akses |
|-------|-----------|
| **Super Admin (Vendor)** | Kelola semua tenant, statistik global, billing |
| **Admin Sekolah** | Full akses data sekolah sendiri, tambah pengguna, laporan lengkap |
| **Bendahara** | Input & edit transaksi, generate laporan, kirim notifikasi WA |
| **Kepala Sekolah** | Read-only: lihat laporan dan dashboard keuangan |
| **Orang Tua** | Read-only: lihat data keuangan anak sendiri via portal |

---

## 8. Database Schema & ERD

### 8.1 Ringkasan Desain

Database terdiri dari **16 tabel utama** yang diorganisasi dalam empat kelompok:

| Kelompok | Tabel |
|----------|-------|
| Tenant & Konfigurasi | `TENANTS`, `WA_CONFIGS`, `USERS` |
| Struktur Akademik | `ACADEMIC_YEARS`, `CLASSES`, `STUDENTS`, `STUDENT_ENROLLMENTS`, `PARENT_CONTACTS` |
| Keuangan | `SPP_PAYMENTS`, `SAVINGS_ACCOUNTS`, `SAVINGS_TRANSACTIONS`, `CUSTOM_BILLS`, `BILL_ASSIGNMENTS`, `BILL_PAYMENTS` |
| Audit & Log | `NOTIFICATION_LOGS`, `ACTIVITY_LOGS` |

### 8.2 Relasi Antar Tabel (ERD)

```
TENANTS ─────────────────────────────────────────┐
  │                                               │
  ├──(1:N)──► USERS                              │
  ├──(1:N)──► ACADEMIC_YEARS                     │
  │               └──(1:N)──► CLASSES            │
  │                               └──(M:N)──►  STUDENT_ENROLLMENTS ◄──(M:N)──┐
  ├──(1:N)──► STUDENTS ──────────────────────────────────────────────────────┘
  │               ├──(1:N)──► PARENT_CONTACTS
  │               ├──(1:N)──► SPP_PAYMENTS
  │               ├──(1:1)──► SAVINGS_ACCOUNTS
  │               │               └──(1:N)──► SAVINGS_TRANSACTIONS
  │               ├──(1:N)──► BILL_ASSIGNMENTS ◄──(1:N)──┐
  │               │               └──(1:N)──► BILL_PAYMENTS │
  │               └──(1:N)──► NOTIFICATION_LOGS            │
  ├──(1:N)──► CUSTOM_BILLS ─────────────────────────────────┘
  ├──(1:N)──► ACTIVITY_LOGS ◄──(1:N)── USERS
  └──(1:1)──► WA_CONFIGS
```

### 8.3 Definisi Tabel Detail

#### TENANTS
Data utama setiap sekolah yang berlangganan Smart Bendahara.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier tenant |
| `name` | VARCHAR(255) | | Nama sekolah |
| `slug` | VARCHAR(100) | | URL-friendly identifier |
| `plan` | ENUM | | `starter` / `professional` / `enterprise` |
| `status` | ENUM | | `trial` / `active` / `suspended` / `cancelled` |
| `trial_ends_at` | TIMESTAMP | | Tanggal berakhir masa trial 14 hari |
| `created_at` | TIMESTAMP | | Waktu pendaftaran akun sekolah |

#### WA_CONFIGS
Konfigurasi WhatsApp gateway per sekolah.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id |
| `gateway` | ENUM | | `fonnte` / `wablas` / `other` |
| `api_key` | TEXT | | API key dari penyedia gateway (dienkripsi at-rest) |
| `sender_number` | VARCHAR(20) | | Nomor WA pengirim (nomor resmi sekolah) |
| `is_active` | BOOLEAN | | Apakah konfigurasi ini aktif |
| `updated_at` | TIMESTAMP | | Waktu terakhir perubahan konfigurasi |

#### USERS
Pengguna yang memiliki akses ke dashboard sekolah.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `name` | VARCHAR(255) | | Nama lengkap pengguna |
| `email` | VARCHAR(255) | | Email untuk login (unik per platform) |
| `role` | ENUM | | `admin` / `treasurer` / `principal` |
| `is_active` | BOOLEAN | | Status akun pengguna |
| `last_login_at` | TIMESTAMP | | Waktu login terakhir |

#### ACADEMIC_YEARS
Tahun ajaran per sekolah. Mendukung multi-tahun tanpa menghapus data lama.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id |
| `name` | VARCHAR(20) | | Nama tahun ajaran, contoh: `2024/2025` |
| `start_date` | DATE | | Tanggal mulai tahun ajaran |
| `end_date` | DATE | | Tanggal akhir tahun ajaran |
| `is_active` | BOOLEAN | | Hanya satu aktif per tenant |

#### CLASSES
Kelas per tahun ajaran. Menyimpan nominal SPP yang berlaku.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `academic_year_id` | UUID | FK | Referensi ke ACADEMIC_YEARS.id |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS) |
| `name` | VARCHAR(20) | | Nama kelas, contoh: `4A`, `7B` |
| `grade` | VARCHAR(5) | | Jenjang numerik, contoh: `4`, `7` |
| `spp_amount` | INTEGER | | Nominal SPP bulanan kelas ini (rupiah) |

#### STUDENTS
Data siswa aktif dan alumni per sekolah.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `nisn` | VARCHAR(20) | | Nomor Induk Siswa Nasional (unik per tenant) |
| `name` | VARCHAR(255) | | Nama lengkap siswa |
| `status` | ENUM | | `active` / `alumni` / `transferred` |
| `enrollment_date` | DATE | | Tanggal masuk sekolah |

#### STUDENT_ENROLLMENTS
Junction table: penempatan siswa di kelas tertentu per tahun ajaran.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id |
| `class_id` | UUID | FK | Referensi ke CLASSES.id |
| `is_active` | BOOLEAN | | Status enrollment saat ini |

#### PARENT_CONTACTS
Kontak orang tua/wali siswa. Mendukung lebih dari satu kontak per siswa.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id |
| `name` | VARCHAR(255) | | Nama orang tua atau wali |
| `relationship` | ENUM | | `mother` / `father` / `guardian` |
| `phone_wa` | VARCHAR(20) | | Nomor WhatsApp (format: `628xxx`) |
| `wa_enabled` | BOOLEAN | | Toggle pengiriman notifikasi WA |
| `is_primary` | BOOLEAN | | Apakah ini kontak utama |

#### SPP_PAYMENTS
Catatan pembayaran SPP per siswa per bulan. Mendukung cicilan.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id |
| `academic_year_id` | UUID | FK | Referensi ke ACADEMIC_YEARS.id |
| `month` | SMALLINT | | Bulan pembayaran (1–12) |
| `year` | SMALLINT | | Tahun pembayaran |
| `amount_due` | INTEGER | | Nominal SPP yang harus dibayar (rupiah) |
| `amount_paid` | INTEGER | | Total yang sudah dibayar termasuk cicilan |
| `remaining` | INTEGER | | Sisa tagihan (dikalkulasi otomatis) |
| `status` | ENUM | | `unpaid` / `partial` / `paid` |
| `recorded_by` | UUID | FK | Referensi ke USERS.id yang menginput |
| `paid_at` | TIMESTAMP | | Waktu pembayaran terakhir dicatat |

#### SAVINGS_ACCOUNTS
Rekening tabungan digital per siswa. Satu siswa satu rekening.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id (UNIQUE) |
| `balance` | INTEGER | | Saldo terkini dalam rupiah (non-negatif) |
| `created_at` | TIMESTAMP | | Waktu rekening dibuat |
| `updated_at` | TIMESTAMP | | Waktu saldo terakhir diperbarui |

#### SAVINGS_TRANSACTIONS
Riwayat setiap transaksi tabungan: setor dan tarik.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `savings_account_id` | UUID | FK | Referensi ke SAVINGS_ACCOUNTS.id |
| `type` | ENUM | | `deposit` / `withdrawal` |
| `amount` | INTEGER | | Jumlah transaksi dalam rupiah (selalu positif) |
| `balance_after` | INTEGER | | Saldo setelah transaksi ini |
| `notes` | TEXT | | Catatan opsional (alasan penarikan, dsb) |
| `recorded_by` | UUID | FK | Referensi ke USERS.id yang menginput |
| `transacted_at` | TIMESTAMP | | Waktu transaksi dicatat |

#### CUSTOM_BILLS
Definisi tagihan insidental: ujian, seragam, study tour, dsb.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `name` | VARCHAR(255) | | Nama tagihan, contoh: `Uang Ujian Semester 1` |
| `description` | TEXT | | Keterangan tambahan tagihan |
| `default_amount` | INTEGER | | Nominal default (bisa di-override per siswa) |
| `due_date` | DATE | | Tanggal jatuh tempo pembayaran |
| `status` | ENUM | | `active` / `archived` |
| `created_by` | UUID | FK | Referensi ke USERS.id yang membuat tagihan |

#### BILL_ASSIGNMENTS
Penugasan tagihan ke siswa. Satu tagihan bisa di-assign ke banyak siswa.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `custom_bill_id` | UUID | FK | Referensi ke CUSTOM_BILLS.id |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id |
| `amount_due` | INTEGER | | Nominal khusus untuk siswa ini |
| `amount_paid` | INTEGER | | Total yang sudah dibayar termasuk cicilan |
| `remaining` | INTEGER | | Sisa tagihan (dikalkulasi otomatis) |
| `status` | ENUM | | `unpaid` / `partial` / `paid` |

#### BILL_PAYMENTS
Riwayat setiap pembayaran (cicilan) untuk satu assignment tagihan.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `bill_assignment_id` | UUID | FK | Referensi ke BILL_ASSIGNMENTS.id |
| `amount` | INTEGER | | Jumlah yang dibayar pada cicilan ini |
| `recorded_by` | UUID | FK | Referensi ke USERS.id yang menginput |
| `paid_at` | TIMESTAMP | | Waktu pembayaran cicilan dicatat |

#### NOTIFICATION_LOGS
Log setiap pesan WA yang dikirim atau gagal. Digunakan untuk audit dan retry.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `student_id` | UUID | FK | Referensi ke STUDENTS.id |
| `event_type` | ENUM | | `spp_paid` / `savings_deposit` / `savings_withdrawal` / `bill_created` / `bill_paid` / `spp_reminder_h3` / `spp_reminder_h0` / `spp_overdue_h7` |
| `recipient_phone` | VARCHAR(20) | | Nomor WA tujuan pengiriman |
| `message_sent` | TEXT | | Teks pesan yang dikirimkan |
| `status` | ENUM | | `queued` / `sent` / `failed` / `delivered` / `skipped_no_gateway` |
| `retry_count` | SMALLINT | | Jumlah percobaan pengiriman (maks 3) |
| `error_message` | TEXT | | Pesan error dari gateway jika gagal |
| `sent_at` | TIMESTAMP | | Waktu pengiriman berhasil |
| `created_at` | TIMESTAMP | | Waktu log dibuat pertama kali |

#### ACTIVITY_LOGS
Audit trail seluruh aksi pengguna di dalam sistem.

| Field | Tipe | Key | Deskripsi |
|-------|------|-----|-----------|
| `id` | UUID | PK | Unique identifier |
| `tenant_id` | UUID | FK | Referensi ke TENANTS.id (RLS key) |
| `user_id` | UUID | FK | Referensi ke USERS.id yang melakukan aksi |
| `action` | ENUM | | `create` / `update` / `delete` / `export` / `login` / `logout` |
| `entity_type` | VARCHAR(50) | | Nama tabel yang terpengaruh |
| `entity_id` | UUID | | ID record yang terpengaruh |
| `before_data` | JSONB | | Snapshot data sebelum perubahan |
| `after_data` | JSONB | | Snapshot data sesudah perubahan |
| `ip_address` | VARCHAR(45) | | IP address pengguna saat melakukan aksi |
| `created_at` | TIMESTAMP | | Waktu aksi dilakukan |

### 8.4 Strategi Row-Level Security (RLS)

```sql
-- Enable RLS pada setiap tabel transaksi
ALTER TABLE spp_payments ENABLE ROW LEVEL SECURITY;

-- Policy: pengguna hanya baca data tenant sendiri
CREATE POLICY "tenant_isolation" ON spp_payments
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Kebijakan yang sama diterapkan pada seluruh tabel transaksi.
-- Dengan RLS, bahkan jika ada bug di level aplikasi,
-- data sekolah lain tetap tidak bisa diakses.
```

---

## 9. Spesifikasi Sistem Notifikasi WhatsApp

### 9.1 Mengapa WhatsApp — Solusi Masalah Sosial

Masalah "sungkan nagih" bukan masalah teknis — ini masalah relasi interpersonal. Dengan sistem notifikasi otomatis Smart Bendahara:

- Pengingat tunggakan H+7 berjalan **tanpa aksi manual bendahara**
- Pesan dikirim **atas nama sekolah** melalui nomor WA resmi institusi
- Orang tua menerima **notifikasi resmi**, bukan tagihan personal
- Tidak ada rasa canggung di kedua belah pihak

### 9.2 Pipeline Notifikasi Real-Time

```
[1] Bendahara input transaksi (SPP / tabungan / tagihan)
          ↓
[2] Notification Service dipanggil secara asynchronous
          ↓
[3] Fetch kontak orang tua dari PARENT_CONTACTS
    (cek wa_enabled = true)
          ↓
[4] Format pesan menggunakan template per tenant
          ↓
[5] Pesan masuk ke antrian BullMQ (Redis)
    — terisolasi per tenant
          ↓
[6] WA Worker memproses antrian
    HTTP call ke Fonnte / Wablas API
          ↓
[7] Gateway mengirimkan pesan ke nomor WA orang tua
          ↓
[8] Status diperbarui di NOTIFICATION_LOGS
    sent / failed / delivered
```

### 9.3 Pipeline Pengingat Terjadwal (Cron)

```
[Cron Job — 08:00 WIB setiap hari]
          ↓
[1] Query semua SPP_PAYMENTS dengan status
    unpaid atau partial per tenant aktif
          ↓
[2] Kalkulasi: berapa hari sebelum/sesudah due date
          ↓
[3] Cocokkan dengan konfigurasi reminder_schedules
    per tenant (H-3, H-0, H+7)
          ↓
[4] Masukkan ke antrian BullMQ
    — pipeline yang sama seperti real-time
          ↓
[5] Log hasil pengiriman ke NOTIFICATION_LOGS
```

### 9.4 Mekanisme Retry & Keandalan

| Parameter | Nilai |
|-----------|-------|
| Jumlah retry maksimal | 3 kali |
| Delay retry ke-1 | 1 menit setelah gagal pertama |
| Delay retry ke-2 | 5 menit setelah gagal kedua |
| Delay retry ke-3 | 15 menit setelah gagal ketiga |
| Setelah 3× gagal | Status: `failed`, alert email ke admin sekolah |
| Rate limiting | Maks 30 pesan/menit per tenant |
| Timeout per request | 10 detik per call ke gateway API |
| Nomor tidak valid | Skip dengan status `skipped_no_gateway` |

### 9.5 Trigger Event Lengkap

| Event Type | Nama Notifikasi | Waktu Kirim | Mode |
|------------|----------------|-------------|------|
| `spp_payment recorded` | Konfirmasi pembayaran SPP | Real-time | Otomatis |
| `savings_deposit recorded` | Konfirmasi setor tabungan | Real-time | Otomatis |
| `savings_withdrawal recorded` | Konfirmasi tarik tabungan | Real-time | Otomatis |
| `bill_created + assigned` | Pemberitahuan tagihan baru | Real-time | Otomatis |
| `bill_payment recorded` | Konfirmasi pembayaran tagihan | Real-time | Otomatis |
| `cron H-3` | Pengingat SPP — 3 hari sebelum jatuh tempo | 08:00 WIB | Terjadwal |
| `cron H-0` | Pengingat SPP — hari jatuh tempo | 08:00 WIB | Terjadwal |
| `cron H+7` | **Pemberitahuan tunggakan** (solusi sungkan nagih) | 08:00 WIB | Terjadwal |

### 9.6 Template Pesan WhatsApp

#### ✅ Konfirmasi Pembayaran SPP
```
✅ Konfirmasi Pembayaran SPP

Yth. Orang tua/wali [Nama Siswa]
Kelas [Kelas] — [Nama Sekolah]

Bulan     : [Bulan Tahun]
Jumlah    : Rp [Jumlah]
Status    : Lunas ✓

Terima kasih atas pembayarannya.
🏫 [Nama Sekolah]
```
> **Trigger:** `spp_payment recorded`

---

#### 💰 Konfirmasi Tabungan Masuk
```
💰 Tabungan Bertambah

[Nama Siswa] (Kls [Kelas])

Setoran    : + Rp [Jumlah]
Saldo kini : Rp [Saldo Terkini]
Tanggal    : [Tanggal]

🏫 [Nama Sekolah]
```
> **Trigger:** `savings_deposit recorded`

---

#### ⏰ Pengingat SPP — H-3 Sebelum Jatuh Tempo
```
⏰ Pengingat Pembayaran SPP

Yth. Orang tua/wali [Nama Siswa]
Kelas [Kelas]

SPP [Bulan Tahun]  : Rp [Jumlah]
Jatuh tempo        : [Tanggal Jatuh Tempo]
                     (3 hari lagi)

Mohon segera dilunasi ke bendahara sekolah.

🏫 [Nama Sekolah]
```
> **Trigger:** `cron H-3` — berjalan otomatis pukul 08:00 WIB

---

#### ❗ Pemberitahuan Tunggakan SPP — H+7 (Solusi "Sungkan Nagih")
```
❗ Pemberitahuan Tunggakan SPP

Yth. Orang tua/wali [Nama Siswa]
Kelas [Kelas]

SPP [Bulan Tahun]  : Rp [Jumlah]
Telah jatuh tempo  : 7 hari yang lalu

Mohon segera selesaikan pembayaran ke
bendahara [Nama Sekolah].

Terima kasih atas perhatiannya.
— Sistem Smart Bendahara
```
> **Trigger:** `cron H+7` — **berjalan 100% otomatis, bendahara tidak perlu tindakan apapun**

### 9.7 Konfigurasi Per Sekolah

- Tanggal jatuh tempo SPP bulanan dikonfigurasi per sekolah (misal: tanggal 10 tiap bulan)
- Jadwal pengingat (H-3, H-0, H+7) bisa diubah menjadi H-5, H-1, H+14, dll.
- Template pesan bisa dikustomisasi sendiri oleh admin sekolah
- Toggle `wa_enabled` per orang tua — beberapa mungkin tidak punya WA aktif
- Laporan pengiriman tersedia: total terkirim, total gagal, detail per siswa

### 9.8 Setup Gateway WhatsApp

1. Daftar ke **Fonnte** (fonnte.com) atau **Wablas** (wablas.com)
2. Hubungkan nomor WA **bisnis resmi sekolah** ke gateway (bukan nomor pribadi)
3. Salin API key dari dashboard gateway, masukkan ke pengaturan WA di Smart Bendahara
4. Lakukan pengiriman percobaan untuk verifikasi koneksi
5. **Biaya gateway:** ~Rp 100.000–300.000/bulan per nomor pengirim

> **Catatan:** Untuk sekolah yang belum setup gateway, sistem tetap berjalan normal. Notifikasi di-skip dengan status `skipped_no_gateway` di `NOTIFICATION_LOGS` — tidak ada error yang memblokir proses transaksi.

---

## 10. Tech Stack & Arsitektur

| Layer | Nama | Teknologi |
|-------|------|-----------|
| **Frontend** | Presentation Layer | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Zustand, React Query |
| **Backend / API** | Application Layer | Node.js, Fastify, tRPC, Supabase Auth (JWT), Multi-tenant middleware |
| **Services** | Service Layer | BullMQ + Redis (queue), node-cron (scheduler), Fonnte/Wablas (WA), ExcelJS, Puppeteer (PDF) |
| **Database** | Data Layer | PostgreSQL + Supabase RLS, Redis (cache), Supabase Storage (per-tenant) |
| **Infrastructure** | Infra Layer | Vercel (frontend), Railway (backend), Supabase, Cloudflare, Sentry, PostHog, GitHub Actions |

---

## 11. User Stories Prioritas Tinggi

| ID | Sebagai… | Saya ingin… | Agar… |
|----|----------|-------------|-------|
| US-01 | Bendahara | Input pembayaran SPP dengan cari nama dan pilih bulan | Data terupdate langsung tanpa buku manual |
| US-02 | Bendahara | Lihat tabel SPP per kelas dengan status tiap bulan | Langsung tahu siapa yang belum bayar |
| US-03 | Bendahara | Input setoran tabungan siswa harian | Saldo selalu akurat tanpa buku fisik |
| US-04 | Bendahara | Generate laporan SPP dan export ke PDF | Siap lapor ke kepala sekolah dalam detik |
| US-05 | Orang Tua | Terima WA otomatis setelah bayar SPP | Langsung dapat konfirmasi tanpa menunggu |
| US-06 | Orang Tua | Terima WA pengingat H-3 sebelum jatuh tempo | Tidak pernah lupa bayar |
| US-07 | Orang Tua | Terima WA tunggakan H+7 tanpa dihubungi personal | Pembayaran diselesaikan tanpa rasa canggung |
| US-08 | Bendahara | Buat tagihan ujian untuk seluruh kelas 6 sekaligus | Tidak perlu input satu per satu per siswa |
| US-09 | Kepala Sekolah | Buka dashboard dan lihat rekap pemasukan bulan ini | Memantau keuangan sekolah kapan saja |
| US-10 | Admin Sekolah | Jalankan kenaikan kelas massal awal tahun ajaran | Tidak perlu edit data siswa satu per satu |

---

## 12. Non-Functional Requirements

| Kategori | Requirement |
|----------|-------------|
| **Performa** | Halaman utama < 2 detik pada 4G. Import 500 siswa < 10 detik |
| **Keamanan** | HTTPS wajib. Enkripsi at-rest dan in-transit. Password bcrypt. Rate limiting login |
| **Skalabilitas** | Mendukung 1.000+ tenant aktif bersamaan tanpa degradasi performa |
| **Ketersediaan** | Target uptime 99.9%. Maintenance di luar jam operasional sekolah |
| **Backup & Recovery** | Backup otomatis harian. RTO < 4 jam. RPO < 24 jam |
| **Kompatibilitas** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ (desktop & mobile) |
| **WA Notification** | Delivery rate > 95%. Retry 3× dengan exponential backoff. Log lengkap |
| **RLS Database** | Setiap query difilter `tenant_id` via RLS. Zero cross-tenant data leakage |
| **Audit Trail** | Setiap aksi destructive tersimpan minimal 3 tahun |
| **Privacy** | Data siswa tidak dibagikan ke pihak ketiga selain gateway WA yang digunakan |

---

## 13. Roadmap Pengembangan

### Phase 1 — MVP (Bulan 1–3)
Fokus: fitur inti yang menyelesaikan pain point terbesar bendahara.

- [x] F-01: Data siswa (manual + import Excel)
- [x] F-02: Manajemen SPP + cicilan
- [x] F-03: Tabungan siswa
- [x] F-05: Laporan PDF & Excel
- [x] F-07: Audit log
- [x] F-08: Backup cloud otomatis
- [x] F-09: Multi tahun ajaran
- [x] Autentikasi multi-tenant + RLS database

### Phase 2 — Growth (Bulan 4–5)
Fokus: fitur yang meningkatkan adopsi dan nilai produk.

- [ ] F-06: Notifikasi WA otomatis (konfirmasi + pengingat H-3, H-0, H+7)
- [ ] F-04: Tagihan insidental kustom
- [ ] F-10: Kenaikan kelas massal
- [ ] F-11: Pembayaran parsial / cicilan
- [ ] F-14: Cron job pengingat terjadwal

### Phase 3 — Full Product (Bulan 6–8)
Fokus: fitur premium yang meningkatkan retensi.

- [ ] F-12: Dashboard portal orang tua (PWA)
- [ ] F-13: Rekonsiliasi kas
- [ ] Laporan trend tahunan dan perbandingan antar periode
- [ ] Mobile app opsional (React Native atau PWA lanjutan)

---

## 14. Model Bisnis & Monetisasi

| Paket | Kapasitas | Harga/Bulan | Fitur Utama |
|-------|-----------|-------------|-------------|
| **Starter** | ≤ 200 siswa | Rp 149.000 | SPP & tabungan, laporan PDF & Excel, notif WA 500 pesan/bln, backup cloud |
| **Professional** | ≤ 500 siswa | Rp 299.000 | Semua Starter + portal orang tua, tagihan kustom, audit log, notif WA unlimited |
| **Enterprise** | Unlimited | Rp 499.000 | Semua Pro + custom branding, notif WA unlimited, priority support, SLA 99.9% |

- Diskon 2 bulan untuk pembayaran tahunan (bayar 10 bulan, dapat 12 bulan)
- Trial 14 hari gratis tanpa kartu kredit untuk sekolah baru
- Onboarding gratis termasuk bantuan migrasi data dari Excel

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Kemungkinan | Mitigasi |
|--------|--------|-------------|----------|
| Adopsi lambat karena kebiasaan manual | Tinggi | Sedang | Onboarding & pelatihan gratis, UI sangat intuitif |
| Keamanan data siswa bocor | Sangat Tinggi | Rendah | RLS PostgreSQL, enkripsi, audit log, penetration testing berkala |
| Gateway WA tidak stabil | Sedang | Sedang | Multi-gateway fallback, retry queue, log lengkap |
| Biaya server melebihi proyeksi | Sedang | Rendah | Monitoring cost per tenant, batasi resource paket Starter |
| Kompetitor dengan fitur serupa | Sedang | Tinggi | Fokus UX terbaik, notif WA otomatis sebagai diferensiasi utama |

---

## 16. Glosarium

| Istilah | Definisi |
|---------|----------|
| **SaaS** | Software as a Service — model perangkat lunak berbasis langganan yang diakses via internet |
| **Multi-Tenant** | Satu aplikasi melayani banyak klien (sekolah) dengan data yang terisolasi satu sama lain |
| **Tenant** | Satu instansi sekolah yang menggunakan Smart Bendahara |
| **RLS** | Row-Level Security — fitur PostgreSQL yang memastikan setiap query hanya mengakses data milik tenant yang login |
| **SPP** | Sumbangan Pembinaan Pendidikan — iuran bulanan wajib siswa |
| **BullMQ** | Library queue berbasis Redis untuk Node.js, digunakan untuk antrian pengiriman WA |
| **WA Gateway** | Layanan pihak ketiga (Fonnte/Wablas) yang memungkinkan pengiriman WA via API |
| **Cron Job** | Tugas terjadwal yang berjalan otomatis pada waktu tertentu (misal: setiap hari 08:00) |
| **ERD** | Entity Relationship Diagram — diagram visual yang menggambarkan struktur database |
| **PK** | Primary Key — field unik yang mengidentifikasi setiap baris dalam tabel |
| **FK** | Foreign Key — field yang merujuk ke PK di tabel lain untuk membuat relasi |
| **JWT** | JSON Web Token — format token autentikasi yang digunakan untuk verifikasi pengguna |
| **PWA** | Progressive Web App — web app yang bisa diinstal seperti aplikasi native di HP |
| **MRR** | Monthly Recurring Revenue — total pendapatan berulang per bulan dari semua tenant |
| **Churn Rate** | Persentase pelanggan yang berhenti berlangganan per periode tertentu |

---

*Akhir Dokumen PRD Smart Bendahara v2.0*

*Dokumen ini mencakup: 14 Core Features · ERD 16 Tabel · Spesifikasi WA Notifikasi · User Flow · Tech Stack · Roadmap · Model Bisnis*
