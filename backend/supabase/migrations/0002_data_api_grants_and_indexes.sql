-- SDN 1 Kembaran: migrasi 0002. Jalankan SESUDAH 0001_init.sql.
--
-- Mengapa perlu: sejak 30 Okt 2026 Supabase tidak lagi memberi hak akses otomatis (anon, authenticated, service_role)
-- pada tabel baru di skema public. Tanpa GRANT eksplisit, API ini (yang memakai service_role lewat Data API)
-- gagal di setiap permintaan dengan galat 42501 "permission denied for table ...", walau RLS sudah benar.
-- Migrasi ini menjadikan hak akses eksplisit dan sama di proyek lama maupun baru:
--   - service_role : baca dan tulis semua tabel aplikasi (hanya backend; kuncinya tidak pernah ke browser)
--   - anon, authenticated : TIDAK punya hak atas tabel aplikasi (RLS tanpa kebijakan tetap jadi lapis kedua)
-- Daftar tabel ditulis eksplisit (bukan "all tables") agar aman dijalankan di proyek yang juga berisi tabel lain.
-- Aman dijalankan ulang.
--
-- Catatan advisor: Supabase akan menampilkan info "RLS Enabled No Policy" untuk tabel-tabel ini. Itu disengaja:
-- tidak ada kebijakan berarti hanya service_role (backend) yang bisa mengakses.

-- ---------- Hak akses Data API ----------
do $$
declare t text;
begin
  foreach t in array array[
    'admin_profiles', 'news', 'announcements', 'agenda', 'gallery_items', 'staff', 'downloads',
    'extracurriculars', 'class_schedules', 'academic_calendar', 'site_settings', 'admission_periods',
    'registrations', 'registration_documents', 'contact_messages', 'activity_logs'
  ] loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- ---------- Fungsi pemicu ----------
-- search_path kosong mencegah pembajakan lewat skema lain (now() ada di pg_catalog, selalu ditemukan).
-- Fungsi pemicu tidak perlu dipanggil siapa pun selain pemicunya sendiri.
alter function public.set_updated_at() set search_path = '';
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------- Indeks kunci asing ----------
-- Postgres tidak membuat indeks otomatis untuk kolom kunci asing. Tanpa ini, menghapus admin atau guru
-- (on delete set null) memindai seluruh tabel terkait.
create index if not exists news_author_idx on public.news (author_id);
create index if not exists announcements_author_idx on public.announcements (author_id);
create index if not exists gallery_items_uploaded_by_idx on public.gallery_items (uploaded_by);
create index if not exists class_schedules_staff_idx on public.class_schedules (staff_id);
create index if not exists registrations_decided_by_idx on public.registrations (decided_by);
create index if not exists site_settings_updated_by_idx on public.site_settings (updated_by);
create index if not exists contact_messages_handled_by_idx on public.contact_messages (handled_by);
create index if not exists activity_logs_admin_idx on public.activity_logs (admin_id);
