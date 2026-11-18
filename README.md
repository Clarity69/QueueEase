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
- Mahasiswa dapat mengambil dan memantau tiket tanpa login. Formulir meminta nama, NIM, dan keperluan.
- Dasbor mahasiswa (`/dashboard`) menampilkan tiket hari ini, status, kode unik, dan jumlah antrean di depan. Buka di browser yang sama untuk melihat tiket setelah muat ulang.
- Satu antrean aktif per NIM per hari. Daftar publik menampilkan nomor, keperluan, dan status. Nama, NIM, dan kode unik bisa dilihat dari browser pemegang tiket atau oleh petugas.
- Login dengan username dan kata sandi tersedia untuk petugas. Sesi memakai cookie HttpOnly selama 24 jam.
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
1. Buka halaman mahasiswa (`/`), isi nama dan NIM 5–20 digit, lalu pilih keperluan.
2. Klik **Ambil Nomor Antrean**. Nomor seperti K001 akan muncul sesuai keperluan. Buka **Antrean Saya** di browser yang sama untuk memantau tiket.
3. Buka **Masuk Petugas** (`/login`) dan masuk menggunakan akun admin.
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
- Backend menggunakan koneksi PostgreSQL dengan hak server. RLS diaktifkan dan akses Data API untuk `anon`/`authenticated` dicabut; akses petugas dan detail tiket diperiksa di Express.
- Kata sandi di-hash menggunakan scrypt; token sesi disimpan sebagai SHA-256 di database. Login petugas dibatasi 30 percobaan per IP per 15 menit. Gunakan HTTPS dan `NODE_ENV=production` saat dipublikasikan.
- Refresh otomatis 5 detik menggunakan polling, bukan WebSocket.

## Akun petugas

Untuk database yang sudah ada, jalankan ulang [`database/schema.sql`](database/schema.sql) di SQL Editor Supabase sebelum menjalankan backend versi ini. Migrasi menyalin NIM lama ke kolom username untuk setiap admin yang belum memiliki username. Admin yang sudah ada masuk dengan username awal tersebut dan kata sandi sebelumnya.

Untuk membuat admin baru, jalankan perintah berikut dari folder `backend` setelah `backend/.env` dan skema database siap. Ganti nama dan username contoh dengan data petugas.

```bash
(
  read -rsp 'Kata sandi petugas (8–128 karakter): ' password
  printf '\n' >&2
  printf '%s' "$password" | npm run admin:create -- "Nama Petugas" loket.akademik
)
```

Username unik, berisi 3–32 karakter, dan dapat memakai huruf, angka, titik, garis bawah, atau tanda hubung. Huruf besar dan kecil diperlakukan sama. Tiket yang sudah ada tetap tampil di antrean sesuai tanggal, dan tiket baru terhubung ke browser yang mengambilnya.

Konfigurasi opsional: `FRONTEND_URL` di backend (default `http://localhost:5173`), `VITE_API_URL` di frontend (default `http://localhost:5000/api`). Frontend dan API harus berada pada situs yang sama agar cookie SameSite Strict berfungsi saat deployment.

Jalankan pemeriksaan: `cd backend && npm test`, serta `cd frontend && npm run build` dari folder utama. Tes backend memakai database tiruan untuk memeriksa pengambilan tiket tanpa login, privasi, pembatasan akses petugas, dan sesi admin; koneksi database nyata harus diverifikasi terpisah dengan `npm run db:check`.

## Kode antrean per keperluan

Untuk database yang sudah terpasang, jalankan `database/queue-service-codes.sql` di SQL Editor Supabase, lalu restart backend. Instalasi baru cukup menjalankan `database/schema.sql`.

Nomor lama akan diberi nomor per keperluan berdasarkan urutan kedatangan. Kode UUID tetap tersedia. Setiap jenis dimulai dari 001 setiap hari; misalnya K001, S001, K002. Pemanggilan petugas tetap mengikuti urutan kedatangan seluruh jenis pada satu loket. Jumlah antrean di depan juga memakai urutan kedatangan, bukan angka pada kode layanan.
