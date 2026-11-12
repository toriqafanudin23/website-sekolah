# API SDN 1 Kembaran

Express + Supabase (Postgres, Auth, Storage). Repositori ini hanya backend; frontend ada di repositori terpisah `sdn1kembaran-web`. Dideploy sebagai proyek Vercel sendiri.
Rancangan lengkap (PRD, ERD, alasan keputusan) ada di dokumen PRD, ERD, dan Rencana Backend; skema di `supabase/migrations/`, diagram di `docs/erd.md`.

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env      # isi SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev               # http://localhost:3001  (cek: /health)
npm test                  # tes logika murni, tanpa jaringan
```

Frontend (repo `sdn1kembaran-web`): salin `.env.example` menjadi `.env.local`, lalu `npm run dev`. Vite meneruskan `/api/*` ke port 3001.

## Menyiapkan Supabase (M0)

1. Buat proyek di supabase.com (wilayah Singapore paling dekat). Catat Project URL dan kunci API (Project Settings, API Keys):
   kunci **publishable** (`sb_publishable_...`) untuk `SUPABASE_ANON_KEY` dan kunci **secret** (`sb_secret_...`) untuk `SUPABASE_SERVICE_ROLE_KEY`.
   Kunci lama (`anon`/`service_role`) masih berfungsi tetapi dijadwalkan dihentikan akhir 2026.
2. Jalankan dua migrasi berurutan (SQL Editor, atau `supabase db push`):
   - `supabase/migrations/0001_init.sql`: tabel, RLS, tiga bucket (`media`, `downloads`, `admission`), periode PPDB 2027/2028 (tertutup).
   - `supabase/migrations/0002_data_api_grants_and_indexes.sql`: hak akses eksplisit hanya untuk `service_role` (anon/authenticated dicabut),
     `search_path` fungsi pemicu, dan indeks kunci asing. Wajib: sejak 30 Okt 2026 Supabase tidak lagi memberi grant otomatis pada tabel baru
     di proyek yang memakai pengaturan baru, sehingga tanpa ini API bisa gagal dengan `42501 permission denied`.
   Advisor Supabase akan menampilkan info "RLS Enabled No Policy" untuk 16 tabel: itu disengaja (hanya backend yang boleh mengakses).
3. Buat admin pertama: `npm run create-admin -- email@sekolah.sch.id "KataSandiKuat123" "Nama Lengkap" admin`.
   Peran `editor` hanya untuk konten; `admin` juga mengelola PPDB dan pengaturan.
4. Verifikasi sambungan: `npm run check`. Tambahkan `-- --api http://localhost:3001` untuk menguji API yang berjalan,
   atau `-- --api http://localhost:5173/api` untuk menguji rantai frontend, proxy, API, dan Supabase.

## Deploy ke Vercel (M6)

1. Vercel, Add New Project, impor repositori ini (Root Directory dibiarkan kosong). Framework: Other.
2. Isi Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV=production`,
   `ALLOWED_ORIGINS=https://<domain-frontend>` (dan domain kustom bila ada), `COOKIE_SAMESITE=lax`.
3. Deploy, lalu cek `https://<domain-api>/health`.
4. Di proyek **frontend** (repo `sdn1kembaran-web`): ganti `GANTI-DENGAN-DOMAIN-API.vercel.app` di `vercel.json` dengan domain API, isi env `VITE_API_URL=/api` dan `VITE_ADMIN_DEMO=false`, deploy ulang.
   Dengan rewrite ini browser hanya melihat satu domain, sehingga cookie sesi admin tidak diblokir sebagai cookie pihak ketiga.

## Endpoint ringkas

| Kelompok | Endpoint |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Publik (cache 60 dtk) | `GET /public/news`, `/public/news/:slug`, `/announcements`, `/agenda`, `/gallery`, `/staff`, `/downloads`, `/academic`, `/schedules`, `/settings` |
| PPDB publik | `POST /registrations`, `PUT /registrations/:nomor/documents/:jenis`, `POST /registrations/:nomor/complete`, `GET /registrations/:nomor` |
| Kontak | `POST /messages` |
| Admin (peran admin atau editor) | `GET/POST /{key}`, `PUT/DELETE /{key}/:id` untuk `news announcements agenda gallery staff downloads extracurriculars schedules calendar messages`; `GET /dashboard` |
| Admin (peran admin saja) | `GET /admission`, `GET/PUT /admission/:id`, `PATCH /admission/:id/documents/:jenis`, `PATCH /admission`, `GET/PUT /settings` |

Menambah modul konten baru: satu entri di `src/lib/registry.js` (dan satu di repo `sdn1kembaran-web`: `src/features/admin/resources.ts`); CRUD, validasi, dan unggah foto ikut otomatis.

## Catatan keamanan dan batasan

- Kunci service-role hanya ada di sini. RLS aktif tanpa kebijakan: kunci anon tidak bisa membaca tabel apa pun.
- Berkas pendaftaran masuk bucket privat; admin membukanya lewat tautan bertanda tangan 5 menit. Isi berkas diperiksa dari byte awal, bukan dari nama atau header.
- Pembatas laju memakai memori per instance fungsi, jadi hanya melunakkan penyalahgunaan. Untuk jaminan keras, pindahkan ke penyimpanan bersama (mis. Upstash).
- Fungsi Vercel menolak badan permintaan di atas 4,5 MB; karena itu berkas PPDB dikirim satu per satu (maks. 2 MB) dan JSON dibatasi 4 MB.
- Pendaftaran PPDB hanya diterima bila periode terbuka dan tanggal dalam rentang. Untuk uji coba di luar rentang, set `ADMISSION_ENFORCE_DATES=false`.
