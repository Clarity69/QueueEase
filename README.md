# QueueEase – Smart Queue (Supabase Edition)

Starter project sistem antrean digital: React + Vite + Tailwind CSS, Express.js, dan PostgreSQL yang di-host di Supabase.

## Preview aplikasi

Tangkapan layar berikut menggunakan data contoh.

### Dasbor mahasiswa

Mahasiswa dapat melihat nomor yang sedang dipanggil, status tiket, dan jumlah antrean di depannya.

![Dasbor mahasiswa dengan tiket S001 dan satu antrean di depan](docs/previews/dasbor-mahasiswa.webp)

### Panel petugas

Petugas dapat melihat statistik antrean, memanggil nomor berikutnya, dan menyelesaikan layanan.

![Panel petugas dengan statistik, nomor yang sedang dipanggil, dan daftar antrean](docs/previews/panel-petugas.webp)

## Fitur
- Login dan pendaftaran mahasiswa dengan NIM unik serta kata sandi. Sesi memakai cookie HttpOnly selama 24 jam.
- Dasbor mahasiswa (`/dashboard`): tiket hari ini, kode UUID unik, status, dan jumlah antrean di depan. Tiket tetap tersedia setelah muat ulang.
- Satu antrean aktif per mahasiswa per hari. NIM dan kode tiket hanya terlihat oleh pemilik dan petugas.
- Halaman mahasiswa (`/`): mengambil nomor antrean dan melihat daftar antrean.
- Halaman petugas (`/admin`): melihat statistik, memanggil antrean berikutnya, dan menyelesaikan antrean.
- Data diperbarui otomatis setiap 5 detik.
- Nomor antrean harian per keperluan: Konsultasi Akademik K001, Surat Aktif Kuliah S001, Legalisir Dokumen L001, Pengajuan Cuti C001, dan Lainnya U001. Setiap jenis memiliki urutan sendiri.

## A. Persiapan
1. Install Node.js LTS: https://nodejs.org/
2. Siapkan akun Supabase: https://supabase.com/
3. Siapkan Visual Studio Code: https://code.visualstudio.com/

**Tidak perlu menginstal PostgreSQL lokal atau pgAdmin.** Database PostgreSQL disediakan oleh Supabase.

## B. Buat project Supabase
1. Login ke https://supabase.com/dashboard
2. Klik **New project**.
3. Pilih organisasi, isi nama project `queueease`, buat database password, dan pilih region yang sesuai (misalnya Singapore jika tersedia).
4. Klik **Create new project** dan tunggu sampai project siap.
5. Buka **SQL Editor** di menu sebelah kiri.
6. Klik **New query**.
7. Buka file `database/schema.sql` dari folder project, salin seluruh isinya ke SQL Editor.
8. Klik **Run**.
9. Buka **Table Editor** dan pastikan tabel `public.antrean` sudah muncul.

Simpan database password dengan aman. Jangan mengunggah password atau connection string ke GitHub.

## C. Ambil connection string Supabase
1. Di dashboard project Supabase, klik **Connect** (atau buka pengaturan Database/Connection string jika tampilan dashboard berbeda).
2. Pilih tab **Connection string**.
3. Pilih mode **Session pooler** dan format **URI**. Session pooler cocok untuk koneksi aplikasi Node.js yang berjalan terus-menerus dari laptop; bila opsi ini tidak tersedia, ikuti opsi koneksi yang direkomendasikan dashboard Supabase.
4. Salin URI yang ditampilkan. Jangan gunakan contoh URI di bawah sebagai alamat sungguhan.

Bentuk URI biasanya seperti:
`postgresql://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres`

Jika password mengandung karakter khusus seperti `@`, `#`, `/`, atau `:`, gunakan URL-encoding pada password. Jangan mengubah host, username, port, atau nama database yang diberikan Supabase.

## D. Konfigurasi backend
1. Extract ZIP.
2. Buka folder `queueease-supabase` di VS Code.
3. Buka terminal: **Terminal > New Terminal**.
4. Masuk ke backend:
   - Jika terminal berada di folder utama: `cd backend`
5. Install package:
   `npm install`
6. Salin `.env.example` menjadi `.env`.
   Windows CMD: `copy .env.example .env`
   PowerShell: `Copy-Item .env.example .env`
7. Buka `backend/.env`, lalu ganti `DATABASE_URL` dengan URI asli dari Supabase:

`PORT=5000`
`DATABASE_URL=postgresql://...URI_ASLI_DARI_SUPABASE...`

Jangan beri tanda kutip. Jangan membagikan file `.env` atau memasukkannya ke repository publik.

8. Jalankan backend:
   `npm run dev`

Backend seharusnya menampilkan:
`QueueEase API berjalan di http://localhost:5000`

9. Tes koneksi melalui browser:
   `http://localhost:5000/api/health`

Jika sukses, akan muncul JSON dengan status `ok` dan pesan bahwa API dan PostgreSQL terhubung.

## E. Jalankan frontend
1. Buka terminal baru di VS Code (**Terminal > New Terminal**). Biarkan terminal backend tetap berjalan.
2. Masuk ke folder frontend:
   `cd frontend`
   (Jika terminal baru dimulai dari folder utama, perintah ini langsung benar.)
3. Install package:
   `npm install`
4. Jalankan:
   `npm run dev`
5. Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## F. Halaman aplikasi
- Mahasiswa: http://localhost:5173/
- Petugas: http://localhost:5173/admin

## G. Uji alur antrean
1. Buka `/login`, daftar menggunakan nama, NIM 5–20 digit, dan kata sandi minimal 8 karakter. Lalu pilih keperluan di halaman mahasiswa.
2. Klik **Ambil Nomor Antrean**. Nomor seperti K001 akan muncul sesuai keperluan.
3. Masuk menggunakan akun yang sudah diberi peran petugas, lalu buka `/admin`.
4. Klik **Panggil Berikutnya**.
5. Status antrean berubah menjadi **Dipanggil**.
6. Klik **Selesaikan** pada antrean yang ingin diselesaikan.
7. Data pada kedua halaman diperbarui otomatis setiap 5 detik.

## H. Menjalankan kembali pada hari berikutnya
Tidak perlu install ulang. Jalankan dua terminal:

Terminal 1:
`cd backend`
`npm run dev`

Terminal 2:
`cd frontend`
`npm run dev`

## Troubleshooting
- `DATABASE_URL belum diatur`: pastikan file bernama `.env` (bukan `.env.example`) ada di folder `backend`.
- `password authentication failed`: cek password dan URI Supabase.
- `ENOTFOUND` atau timeout: cek koneksi internet, host, port, dan mode pooler dari URI.
- `self-signed certificate` atau masalah SSL: gunakan konfigurasi `ssl` yang sudah tersedia di `backend/src/config/db.js`; jangan menambahkan opsi SSL lain tanpa memeriksa konfigurasi.
- `EADDRINUSE 5000`: port 5000 sedang dipakai aplikasi lain.
- `Network Error`: pastikan backend berjalan dan alamat API frontend tetap `http://localhost:5000/api`.

## Catatan keamanan dan pembelajaran
- Frontend tidak menyimpan password database.
- Express menjadi perantara antara React dan PostgreSQL.
- Connection string database hanya berada di `backend/.env`; jangan commit file ini ke GitHub.
- Backend menggunakan koneksi PostgreSQL dengan hak server. RLS diaktifkan dan akses Data API untuk `anon`/`authenticated` dicabut; otorisasi mahasiswa dan petugas diperiksa di Express.
- Kata sandi di-hash menggunakan scrypt; token sesi disimpan sebagai SHA-256 di database. Login dan pendaftaran dibatasi 30 percobaan per IP per 15 menit. Gunakan HTTPS dan `NODE_ENV=production` saat dipublikasikan.
- Refresh otomatis 5 detik menggunakan polling, bukan WebSocket.

## Peningkatan database dan akun petugas

Untuk instalasi lama, jalankan kembali seluruh `database/schema.sql` di SQL Editor Supabase sebelum menjalankan aplikasi versi ini. Data antrean lama dipertahankan, tetapi tidak ditautkan otomatis ke akun baru.

Semua pendaftaran menghasilkan akun mahasiswa. Untuk membuat petugas, daftarkan akun terlebih dahulu, lalu jalankan SQL berikut menggunakan NIM akun yang dipilih:

```sql
UPDATE public.app_users SET role = 'admin' WHERE nim = 'NIM_PETUGAS';
```

Tidak ada akun atau kata sandi petugas bawaan. Login ulang setelah mengubah peran agar navigasi diperbarui.

Konfigurasi opsional: `FRONTEND_URL` di backend (default `http://localhost:5173`), `VITE_API_URL` di frontend (default `http://localhost:5000/api`). Frontend dan API harus berada pada situs yang sama agar cookie SameSite Strict berfungsi saat deployment.

Jalankan pemeriksaan: `cd backend && npm test`, serta `cd frontend && npm run build` dari folder utama. Tes backend memakai database tiruan untuk memeriksa login, sesi, akses petugas, privasi tiket, dan logout; koneksi database nyata harus diverifikasi terpisah dengan `npm run db:check`.

## Kode antrean per keperluan

Untuk database yang sudah terpasang, jalankan `database/queue-service-codes.sql` di SQL Editor Supabase, lalu restart backend. Instalasi baru cukup menjalankan `database/schema.sql`.

Nomor lama akan diberi nomor per keperluan berdasarkan urutan kedatangan. Kode UUID tetap tersedia. Setiap jenis dimulai dari 001 setiap hari; misalnya K001, S001, K002. Pemanggilan petugas tetap mengikuti urutan kedatangan seluruh jenis pada satu loket. Jumlah antrean di depan juga memakai urutan kedatangan, bukan angka pada kode layanan.
