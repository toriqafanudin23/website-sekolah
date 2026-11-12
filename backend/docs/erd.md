# ERD

Sumber kebenaran skema: `supabase/migrations/0001_init.sql`. Narasi lengkap ada di dokumen PRD, ERD, dan Rencana Backend.

```mermaid
erDiagram
  admin_profiles ||--o{ news : "menulis"
  admin_profiles ||--o{ announcements : "menulis"
  admin_profiles ||--o{ gallery_items : "mengunggah"
  admin_profiles ||--o{ activity_logs : "melakukan"
  admin_profiles ||--o{ registrations : "memutuskan"
  admin_profiles ||--o{ contact_messages : "menangani"
  admission_periods ||--o{ registrations : "memuat"
  registrations ||--o{ registration_documents : "memiliki"
  staff |o--o{ class_schedules : "mengampu"

  admin_profiles { uuid id PK "sama dengan auth.users.id" text name admin_role role bool is_active }
  news { uuid id PK text slug UK text title news_category category text body text cover_path content_status status date published_on uuid author_id FK }
  announcements { uuid id PK text title text body date published_on content_status status uuid author_id FK }
  agenda { uuid id PK text title date event_date "boleh kosong" text location }
  gallery_items { uuid id PK text caption text image_path int sort_order uuid uploaded_by FK }
  staff { uuid id PK text name text role_title staff_category category text photo_path int sort_order }
  downloads { uuid id PK text name text file_path bigint size_bytes bool is_published int sort_order }
  extracurriculars { uuid id PK text name text schedule_text text description }
  class_schedules { uuid id PK smallint grade smallint weekday time start_time time end_time text subject uuid staff_id FK }
  academic_calendar { uuid id PK text label date starts_on date ends_on semester_kind semester }
  site_settings { text key PK jsonb value uuid updated_by FK }
  admission_periods { uuid id PK text school_year UK date starts_on date ends_on bool is_open }
  registrations { uuid id PK text registration_number UK uuid period_id FK admission_track track text full_name date birth_date text address text village text guardian_name text guardian_phone registration_status status text status_note bool possible_duplicate timestamptz consent_at text upload_token_hash uuid decided_by FK timestamptz decided_at }
  registration_documents { uuid id PK uuid registration_id FK document_type doc_type text storage_path text mime_type bigint size_bytes bool uploaded bool verified }
  contact_messages { uuid id PK text name text reply_contact text message message_status status uuid handled_by FK }
  activity_logs { uuid id PK uuid admin_id FK text action text entity text entity_id }
```

## Bucket storage

| Bucket | Akses | Isi |
|---|---|---|
| media | Baca publik | Sampul berita, galeri, foto guru |
| downloads | Baca publik | PDF unduhan |
| admission | Privat (tautan bertanda tangan 5 menit) | `registrations/{id}/{doc_type}` |
