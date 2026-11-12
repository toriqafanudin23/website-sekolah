-- SDN 1 Kembaran: skema awal. Jalankan di Supabase (SQL Editor, atau `supabase db push`).
-- Semua akses data lewat API Express memakai service-role. RLS diaktifkan tanpa kebijakan publik
-- (tolak semua) sebagai lapisan pengaman kedua bila kunci anon bocor.

-- ---------- Tipe ----------
create type content_status as enum ('draf', 'terbit');
create type news_category as enum ('Pengumuman', 'Kegiatan', 'Prestasi');
create type staff_category as enum ('kepala-sekolah', 'guru-kelas', 'guru-mapel', 'tendik');
create type admin_role as enum ('admin', 'editor');
create type registration_status as enum ('baru', 'terverifikasi', 'diterima', 'ditolak');
create type admission_track as enum ('domisili', 'afirmasi', 'perpindahan');
create type document_type as enum ('birthCertificate', 'familyCard', 'photo', 'supporting', 'kindergarten');
create type message_status as enum ('baru', 'dibaca', 'dibalas');
create type semester_kind as enum ('ganjil', 'genap');

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Admin ----------
create table admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  role admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Konten ----------
create table news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 200),
  category news_category not null default 'Kegiatan',
  body text not null default '',
  cover_path text,
  status content_status not null default 'draf',
  published_on date not null default current_date,
  author_id uuid references admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index news_public_idx on news (status, published_on desc);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  published_on date not null default current_date,
  status content_status not null default 'draf',
  author_id uuid references admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_public_idx on announcements (status, published_on desc);

create table agenda (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  event_date date, -- boleh kosong: memicu tindak lanjut "Agenda belum bertanggal"
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agenda_date_idx on agenda (event_date);

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  caption text not null check (char_length(caption) between 1 and 200),
  image_path text not null,
  sort_order integer not null default 0,
  uploaded_by uuid references admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  role_title text not null check (char_length(role_title) between 1 and 120),
  category staff_category not null,
  photo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  file_path text not null,
  size_bytes bigint,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Akademik ----------
create table extracurriculars (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  schedule_text text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table class_schedules (
  id uuid primary key default gen_random_uuid(),
  grade smallint not null check (grade between 1 and 6),
  weekday smallint not null check (weekday between 1 and 6), -- 1 = Senin ... 6 = Sabtu
  start_time time not null,
  end_time time not null,
  subject text not null check (char_length(subject) between 1 and 120),
  staff_id uuid references staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (grade, weekday, start_time)
);
create index class_schedules_lookup_idx on class_schedules (grade, weekday, start_time);

create table academic_calendar (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 200),
  starts_on date not null,
  ends_on date,
  semester semester_kind,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references admin_profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------- PPDB ----------
create table admission_periods (
  id uuid primary key default gen_random_uuid(),
  school_year text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  period_id uuid not null references admission_periods (id),
  track admission_track not null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  birth_date date not null,
  address text not null,
  village text not null,
  guardian_name text not null check (char_length(guardian_name) between 1 and 120),
  guardian_phone text not null,
  status registration_status not null default 'baru',
  status_note text,
  possible_duplicate boolean not null default false,
  consent_at timestamptz not null,
  upload_token_hash text not null,
  decided_by uuid references admin_profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index registrations_status_idx on registrations (status, created_at desc);
create index registrations_period_idx on registrations (period_id);

create table registration_documents (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations (id) on delete cascade,
  doc_type document_type not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint,
  uploaded boolean not null default false,
  uploaded_at timestamptz,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (registration_id, doc_type)
);

-- ---------- Pesan dan log ----------
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  reply_contact text not null check (char_length(reply_contact) between 3 and 150),
  message text not null check (char_length(message) between 1 and 2000),
  status message_status not null default 'baru',
  handled_by uuid references admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_messages_status_idx on contact_messages (status, created_at desc);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_profiles (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);
create index activity_logs_recent_idx on activity_logs (created_at desc);

-- ---------- updated_at otomatis ----------
do $$
declare t text;
begin
  foreach t in array array[
    'admin_profiles', 'news', 'announcements', 'agenda', 'gallery_items', 'staff', 'downloads',
    'extracurriculars', 'class_schedules', 'academic_calendar', 'admission_periods', 'registrations',
    'contact_messages'
  ] loop
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ---------- RLS: aktif, tanpa kebijakan (hanya service-role yang lolos) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'admin_profiles', 'news', 'announcements', 'agenda', 'gallery_items', 'staff', 'downloads',
    'extracurriculars', 'class_schedules', 'academic_calendar', 'site_settings', 'admission_periods',
    'registrations', 'registration_documents', 'contact_messages', 'activity_logs'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 3145728, array['image/jpeg', 'image/png', 'image/webp']),
  ('downloads', 'downloads', true, 2097152, array['application/pdf']),
  ('admission', 'admission', false, 2097152, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- ---------- Data awal ----------
-- Periode PPDB disimpan tertutup; admin membukanya dari dashboard.
insert into admission_periods (school_year, starts_on, ends_on, is_open)
values ('2027/2028', '2027-03-01', '2027-04-30', false)
on conflict (school_year) do nothing;
