/**
 * Registri modul admin. Nama kolom API (kiri) sama dengan `name` di repo web (sdn1kembaran-web): src/features/admin/resources.ts;
 * `col` adalah kolom database. Satu definisi menghasilkan GET/POST/PUT/DELETE /{key}.
 *
 * Opsi kolom: type, required, max, values, col, bucket (image/file), readonly (tidak bisa diubah via API),
 * emptyAs (nilai DB untuk isian kosong; bawaan null), toDb/fromDb (konversi nilai).
 */
const STATUS = { col: 'status', type: 'enum', values: ['draf', 'terbit'], required: true, label: 'Status' }
const PUBLISHED = {
  col: 'is_published',
  type: 'enum',
  values: ['draf', 'terbit'],
  required: true,
  label: 'Status',
  toDb: (value) => value === 'terbit',
  fromDb: (flag) => (flag ? 'terbit' : 'draf'),
}

export const RESOURCES = {
  news: {
    table: 'news',
    singular: 'berita',
    folder: 'news',
    order: [['published_on', false], ['created_at', false]],
    slugFrom: 'title',
    authorCol: 'author_id',
    fields: {
      title: { col: 'title', type: 'text', required: true, max: 200, label: 'Judul' },
      category: { col: 'category', type: 'enum', values: ['Pengumuman', 'Kegiatan', 'Prestasi'], required: true, label: 'Kategori' },
      date: { col: 'published_on', type: 'date', required: true, label: 'Tanggal' },
      body: { col: 'body', type: 'text', max: 50_000, emptyAs: '', label: 'Isi berita' },
      imageUrl: { col: 'cover_path', type: 'image', bucket: 'media', label: 'Foto sampul' },
      status: STATUS,
    },
  },
  announcements: {
    table: 'announcements',
    singular: 'pengumuman',
    order: [['published_on', false], ['created_at', false]],
    authorCol: 'author_id',
    fields: {
      title: { col: 'title', type: 'text', required: true, max: 200, label: 'Judul pengumuman' },
      date: { col: 'published_on', type: 'date', required: true, label: 'Tanggal' },
      body: { col: 'body', type: 'text', max: 20_000, emptyAs: '', label: 'Isi pengumuman' },
      status: STATUS,
    },
  },
  agenda: {
    table: 'agenda',
    singular: 'agenda',
    order: [['event_date', false], ['created_at', false]],
    fields: {
      title: { col: 'title', type: 'text', required: true, max: 200, label: 'Nama kegiatan' },
      date: { col: 'event_date', type: 'date', label: 'Tanggal' },
      location: { col: 'location', type: 'text', max: 200, label: 'Lokasi' },
    },
  },
  gallery: {
    table: 'gallery_items',
    singular: 'foto',
    folder: 'gallery',
    order: [['sort_order', true], ['created_at', false]],
    authorCol: 'uploaded_by',
    fields: {
      caption: { col: 'caption', type: 'text', required: true, max: 200, label: 'Keterangan foto' },
      imageUrl: { col: 'image_path', type: 'image', bucket: 'media', required: true, label: 'Foto' },
    },
  },
  staff: {
    table: 'staff',
    singular: 'guru atau tendik',
    folder: 'staff',
    order: [['sort_order', true], ['name', true]],
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120, label: 'Nama' },
      role: { col: 'role_title', type: 'text', required: true, max: 120, label: 'Jabatan' },
      category: { col: 'category', type: 'enum', values: ['kepala-sekolah', 'guru-kelas', 'guru-mapel', 'tendik'], required: true, label: 'Kategori' },
      imageUrl: { col: 'photo_path', type: 'image', bucket: 'media', label: 'Foto' },
    },
  },
  downloads: {
    table: 'downloads',
    singular: 'berkas unduhan',
    folder: 'downloads',
    order: [['sort_order', true], ['created_at', false]],
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 200, label: 'Nama berkas' },
      fileUrl: { col: 'file_path', type: 'file', bucket: 'downloads', required: true, label: 'Berkas PDF' },
      status: PUBLISHED,
    },
  },
  extracurriculars: {
    table: 'extracurriculars',
    singular: 'ekstrakurikuler',
    order: [['name', true]],
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120, label: 'Nama kegiatan' },
      schedule: { col: 'schedule_text', type: 'text', max: 200, emptyAs: '', label: 'Hari dan jam' },
      description: { col: 'description', type: 'text', max: 2000, emptyAs: '', label: 'Keterangan' },
    },
  },
  schedules: {
    table: 'class_schedules',
    singular: 'jam pelajaran',
    order: [['grade', true], ['weekday', true], ['start_time', true]],
    fields: {
      grade: { col: 'grade', type: 'int', min: 1, hi: 6, required: true, label: 'Kelas', toDb: Number },
      weekday: { col: 'weekday', type: 'int', min: 1, hi: 6, required: true, label: 'Hari', toDb: Number },
      startTime: { col: 'start_time', type: 'time', required: true, label: 'Jam mulai' },
      endTime: { col: 'end_time', type: 'time', required: true, label: 'Jam selesai' },
      subject: { col: 'subject', type: 'text', required: true, max: 120, label: 'Mata pelajaran' },
      staffId: { col: 'staff_id', type: 'uuid', label: 'Guru pengampu' },
    },
  },
  calendar: {
    table: 'academic_calendar',
    singular: 'kegiatan kalender',
    order: [['starts_on', true]],
    fields: {
      label: { col: 'label', type: 'text', required: true, max: 200, label: 'Kegiatan' },
      startsOn: { col: 'starts_on', type: 'date', required: true, label: 'Tanggal mulai' },
      endsOn: { col: 'ends_on', type: 'date', label: 'Tanggal selesai' },
      semester: { col: 'semester', type: 'enum', values: ['ganjil', 'genap'], label: 'Semester' },
    },
  },
  messages: {
    table: 'contact_messages',
    singular: 'pesan',
    order: [['created_at', false]],
    createDisabled: true,
    handledByCol: 'handled_by',
    fields: {
      name: { col: 'name', type: 'text', readonly: true, label: 'Pengirim' },
      reply: { col: 'reply_contact', type: 'text', readonly: true, label: 'Kontak' },
      date: { col: 'created_at', type: 'date', readonly: true, label: 'Tanggal' },
      message: { col: 'message', type: 'text', readonly: true, label: 'Pesan' },
      status: { col: 'status', type: 'enum', values: ['baru', 'dibaca', 'dibalas'], required: true, label: 'Status' },
    },
  },
}
