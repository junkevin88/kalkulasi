# Deploy ke Deno Deploy

Panduan singkat deploy aplikasi **Analisis Ordal** (API + frontend React) ke [Deno Deploy](https://deno.com/deploy).

## Persiapan

1. **Database: pakai Turso (wajib untuk Deno Deploy)**  
   Di Deno Deploy, filesystem tidak bisa dipakai untuk membuka file SQLite lokal, jadi aplikasi memakai **database remote** jika env `DATABASE_URL` diset.

   - Buat database di [Turso](https://turso.tech/) (gratis):
     - Daftar → buat database baru → ambil **Database URL** (format `libsql://...`) dan **Auth Token**.
   - Isi data ke Turso:
     - Di lokal, punya `data/database.sqlite` yang sudah di-import (jalankan `deno task ksei:import` dll).
     - Pakai [Turso CLI](https://docs.turso.tech/cli) atau [libsql CLI](https://github.com/libsql/libsql-cli) untuk push schema + data dari SQLite lokal ke Turso (backup/restore atau replicate).
   - Set **Environment Variables** di Deno Deploy:
     - `DATABASE_URL` = URL database Turso (mis. `libsql://<db-name>-<org>.turso.io`)
     - `DATABASE_AUTH_TOKEN` = token auth dari Turso (wajib untuk akses remote)

   Tanpa `DATABASE_URL`, server akan mencoba pakai `data/database.sqlite` (hanya jalan di lingkungan yang bisa akses file lokal).

2. **Data lain**  
   - **Conglomerate mapping**: sekarang di DB (tabel `ticker_conglomerate_mapping`). Jalankan `deno task conglomerate:sync` dari lokal (dengan `DATABASE_URL` ke Turso) untuk mengisi dari `data/ticker_conglomerate_mapping.csv`.
   - **Logo emiten**: server baca dari `sample/img/*.svg` (harus ada di repo).

2. **Build frontend**  
   Konfigurasi di `deno.json` sudah mengatur:
   - **Install:** `cd frontend && npm install`
   - **Build:** `cd frontend && npm run build`

   Deno Deploy akan menjalankan ini saat build, sehingga `frontend/dist` terbentuk dan ikut di-deploy.

## Langkah deploy

1. Buka [console.deno.com](https://console.deno.com/), buat organisasi kalau belum.
2. **New App** → pilih repo GitHub **kalkulasi**.
3. **App directory** (jika ada): kosongkan atau isi root repo (bukan subfolder).
4. Konfigurasi build bisa pakai dari **source code** (`deno.json` → bagian `deploy`):
   - Entrypoint: `web/server.ts`
   - Install: `cd frontend && npm install`
   - Build: `cd frontend && npm run build`
   - Runtime: **Dynamic**

   Jika Deno Deploy mendeteksi `deploy` di `deno.json`, setelan ini dipakai otomatis; kalau tidak, isi manual di dashboard:
   - **Framework preset:** No Preset
   - **Install command:** `cd frontend && npm install`
   - **Build command:** `cd frontend && npm run build`
   - **Runtime:** Dynamic  
   - **Entrypoint:** `web/server.ts`

5. Simpan → trigger deploy (atau push ke branch yang terhubung).

## Setelah deploy

- URL aplikasi: `https://<app-slug>.deno.dev` (atau domain kustom yang kamu atur).
- Frontend dilayani dari root; API di path `/api/...` (ownership, company, market, stats, img, dll).

## Catatan

- **Database:** `src/Database.ts` memakai `DATABASE_URL` (+ opsional `DATABASE_AUTH_TOKEN`) bila diset; kalau tidak, pakai file lokal `data/database.sqlite`. Di Deno Deploy **harus** set kedua env tersebut ke Turso agar tidak error `ConnectionFailed` (file lokal tidak bisa dibuka di platform ini).
- **Environment variables:** Tambah di Deno Deploy (Settings → Environment Variables). Untuk production set `DATABASE_URL` dan `DATABASE_AUTH_TOKEN` (Turso).
- **Mono-repo:** Jika repo ini di dalam mono-repo, atur **App directory** di dashboard ke path root aplikasi ini (tempat `deno.json` dan `web/server.ts` berada).
