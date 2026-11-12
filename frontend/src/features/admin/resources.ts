export type FieldKind = 'text' | 'textarea' | 'date' | 'time' | 'tel' | 'select' | 'image' | 'file'

export interface Option {
  value: string
  label: string
}

export interface ResourceField {
  name: string
  label: string
  kind: FieldKind
  required?: boolean
  options?: readonly Option[]
  hint?: string
  /** Tidak bisa diubah admin setelah dibuat (data yang masuk dari formulir publik). */
  lockedOnEdit?: boolean
  /** Pilihan diambil dari modul lain (mis. guru pengampu dari modul Guru); nilai = id item. */
  optionsFrom?: { key: string; labelField: string }
}

export type Item = { id: string } & Record<string, string>

/** Satu modul pengelolaan konten (Berita, Agenda, dst.). Satu definisi = satu halaman panel. */
export interface ResourceDef {
  /** Nama koleksi; juga jalur API: `{ADMIN_API_URL}/{key}`. */
  key: string
  /** Segmen rute di bawah /admin. */
  path: string
  title: string
  singular: string
  titleField: string
  /** Kolom yang ditampilkan di bawah judul pada daftar. */
  metaFields: readonly string[]
  statusField?: string
  fields: readonly ResourceField[]
  canCreate: boolean
  exportable?: boolean
  empty: string
  /** Data contoh untuk mode demo. */
  seed: readonly Item[]
  /** Modul yang tampil sebagai tab di halaman gabungan (bukan halaman sendiri). */
  group?: 'akademik'
  /** Bentuk dialog rincian khusus; tanpa ini dipakai dialog ubah umum. */
  detail?: 'admission'
}

const PUBLISH: readonly Option[] = [
  { value: 'draf', label: 'Draf' },
  { value: 'terbit', label: 'Terbit' },
]

const TRACKS: readonly Option[] = [
  { value: 'domisili', label: 'Jalur Domisili' },
  { value: 'afirmasi', label: 'Jalur Afirmasi' },
  { value: 'perpindahan', label: 'Jalur Perpindahan' },
]

const GRADES: readonly Option[] = [1, 2, 3, 4, 5, 6].map((grade) => ({ value: String(grade), label: `Kelas ${grade}` }))

/** `value` 1 sampai 6 = Senin sampai Sabtu, sama dengan `weekday` di database. */
const WEEKDAYS: readonly Option[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((label, index) => ({
  value: String(index + 1),
  label,
}))

export const RESOURCES: readonly ResourceDef[] = [
  {
    key: 'news',
    path: 'berita',
    title: 'Berita',
    singular: 'berita',
    titleField: 'title',
    metaFields: ['category', 'date'],
    statusField: 'status',
    canCreate: true,
    empty: 'Belum ada berita. Tulis berita pertama Anda.',
    fields: [
      { name: 'title', label: 'Judul', kind: 'text', required: true },
      {
        name: 'category',
        label: 'Kategori',
        kind: 'select',
        required: true,
        options: [
          { value: 'Pengumuman', label: 'Pengumuman' },
          { value: 'Kegiatan', label: 'Kegiatan' },
          { value: 'Prestasi', label: 'Prestasi' },
        ],
      },
      { name: 'date', label: 'Tanggal', kind: 'date', required: true },
      { name: 'body', label: 'Isi berita', kind: 'textarea', hint: 'Pisahkan paragraf dengan satu baris kosong.' },
      { name: 'imageUrl', label: 'Foto sampul', kind: 'image', hint: 'JPG atau PNG. Foto dikecilkan otomatis.' },
      { name: 'status', label: 'Status', kind: 'select', required: true, options: PUBLISH },
    ],
    seed: [
      { id: 'n1', title: 'Contoh: Kegiatan Jumat Bersih di sekolah', category: 'Kegiatan', date: '2026-11-06', body: '', status: 'terbit' },
      { id: 'n2', title: 'Contoh: Informasi jadwal ujian semester', category: 'Pengumuman', date: '2026-11-03', body: '', status: 'terbit' },
      { id: 'n3', title: 'Contoh: Draf berita prestasi murid', category: 'Prestasi', date: '2026-11-08', body: '', status: 'draf' },
    ],
  },
  {
    key: 'announcements',
    path: 'pengumuman',
    title: 'Pengumuman',
    singular: 'pengumuman',
    titleField: 'title',
    metaFields: ['date'],
    statusField: 'status',
    canCreate: true,
    empty: 'Belum ada pengumuman.',
    fields: [
      { name: 'title', label: 'Judul pengumuman', kind: 'text', required: true },
      { name: 'date', label: 'Tanggal', kind: 'date', required: true },
      { name: 'body', label: 'Isi pengumuman', kind: 'textarea' },
      { name: 'status', label: 'Status', kind: 'select', required: true, options: PUBLISH },
    ],
    seed: [{ id: 'a1', title: 'Contoh: Libur semester ganjil', date: '2026-11-07', body: '', status: 'terbit' }],
  },
  {
    key: 'agenda',
    path: 'agenda',
    title: 'Agenda',
    singular: 'agenda',
    titleField: 'title',
    metaFields: ['date'],
    canCreate: true,
    empty: 'Belum ada agenda.',
    fields: [
      { name: 'title', label: 'Nama kegiatan', kind: 'text', required: true },
      { name: 'date', label: 'Tanggal', kind: 'date', required: true },
    ],
    seed: [
      { id: 'g1', title: 'Peringatan Hari Guru Nasional', date: '2026-11-25' },
      { id: 'g2', title: 'Pembagian rapor semester ganjil', date: '2026-12-18' },
    ],
  },
  {
    key: 'gallery',
    path: 'galeri',
    title: 'Galeri',
    singular: 'foto',
    titleField: 'caption',
    metaFields: [],
    canCreate: true,
    empty: 'Belum ada foto. Unggah foto kegiatan sekolah.',
    fields: [
      { name: 'caption', label: 'Keterangan foto', kind: 'text', required: true },
      { name: 'imageUrl', label: 'Foto', kind: 'image', required: true, hint: 'JPG atau PNG. Foto dikecilkan otomatis.' },
    ],
    seed: [],
  },
  {
    key: 'staff',
    path: 'guru',
    title: 'Guru dan tendik',
    singular: 'guru atau tendik',
    titleField: 'name',
    metaFields: ['role', 'category'],
    canCreate: true,
    empty: 'Belum ada data guru dan tenaga kependidikan.',
    fields: [
      { name: 'name', label: 'Nama', kind: 'text', required: true },
      { name: 'role', label: 'Jabatan', kind: 'text', required: true },
      {
        name: 'category',
        label: 'Kategori',
        kind: 'select',
        required: true,
        options: [
          { value: 'kepala-sekolah', label: 'Kepala sekolah' },
          { value: 'guru-kelas', label: 'Guru kelas' },
          { value: 'guru-mapel', label: 'Guru mapel' },
          { value: 'tendik', label: 'Tenaga kependidikan' },
        ],
      },
      { name: 'imageUrl', label: 'Foto', kind: 'image' },
    ],
    seed: [
      { id: 's1', name: 'Contoh Kepala Sekolah', role: 'Kepala sekolah', category: 'kepala-sekolah', imageUrl: '' },
      { id: 's2', name: 'Contoh Guru Kelas 1', role: 'Guru kelas', category: 'guru-kelas', imageUrl: '' },
    ],
  },
  {
    key: 'admission',
    path: 'ppdb',
    title: 'Pendaftar PPDB',
    singular: 'pendaftar',
    titleField: 'fullName',
    metaFields: ['registrationNumber', 'birthDate', 'guardianName', 'guardianPhone'],
    statusField: 'status',
    canCreate: false,
    exportable: true,
    detail: 'admission',
    empty: 'Belum ada pendaftar.',
    fields: [
      { name: 'registrationNumber', label: 'Nomor pendaftaran', kind: 'text', lockedOnEdit: true },
      { name: 'track', label: 'Jalur', kind: 'select', options: TRACKS, lockedOnEdit: true },
      { name: 'fullName', label: 'Nama murid', kind: 'text', lockedOnEdit: true },
      { name: 'birthDate', label: 'Tanggal lahir', kind: 'date', lockedOnEdit: true },
      { name: 'address', label: 'Alamat', kind: 'textarea', lockedOnEdit: true },
      { name: 'village', label: 'Desa atau kelurahan', kind: 'text', lockedOnEdit: true },
      { name: 'guardianName', label: 'Orang tua atau wali', kind: 'text', lockedOnEdit: true },
      { name: 'guardianPhone', label: 'Nomor WhatsApp', kind: 'tel', lockedOnEdit: true },
      {
        name: 'status',
        label: 'Status pendaftaran',
        kind: 'select',
        required: true,
        options: [
          { value: 'baru', label: 'Menunggu verifikasi' },
          { value: 'terverifikasi', label: 'Berkas terverifikasi' },
          { value: 'diterima', label: 'Diterima' },
          { value: 'ditolak', label: 'Ditolak' },
        ],
      },
      { name: 'statusNote', label: 'Catatan untuk pendaftar', kind: 'textarea' },
    ],
    seed: [
      { id: 'p1', registrationNumber: 'PPDB27-DEMO01', track: 'domisili', village: 'Kembaran', fullName: 'Contoh Calon Murid A', birthDate: '2021-03-12', address: 'Desa Kembaran', guardianName: 'Contoh Wali A', guardianPhone: '081200000001', status: 'baru' },
      { id: 'p2', registrationNumber: 'PPDB27-DEMO02', track: 'afirmasi', village: 'Kembaran', fullName: 'Contoh Calon Murid B', birthDate: '2021-07-30', address: 'Desa Kembaran', guardianName: 'Contoh Wali B', guardianPhone: '081200000002', status: 'terverifikasi' },
    ],
  },
  {
    key: 'downloads',
    path: 'unduhan',
    title: 'Unduhan',
    singular: 'berkas unduhan',
    titleField: 'name',
    metaFields: [],
    statusField: 'status',
    canCreate: true,
    empty: 'Belum ada berkas unduhan. Unggah brosur, kalender, atau tata tertib dalam bentuk PDF.',
    fields: [
      { name: 'name', label: 'Nama berkas', kind: 'text', required: true },
      { name: 'fileUrl', label: 'Berkas PDF', kind: 'file', required: true, hint: 'PDF, maksimal 2 MB.' },
      { name: 'status', label: 'Status', kind: 'select', required: true, options: PUBLISH },
    ],
    seed: [],
  },
  {
    key: 'extracurriculars',
    path: 'akademik',
    group: 'akademik',
    title: 'Ekstrakurikuler',
    singular: 'ekstrakurikuler',
    titleField: 'name',
    metaFields: ['schedule'],
    canCreate: true,
    empty: 'Belum ada ekstrakurikuler.',
    fields: [
      { name: 'name', label: 'Nama kegiatan', kind: 'text', required: true },
      { name: 'schedule', label: 'Hari dan jam', kind: 'text', hint: 'Contoh: Jumat, 14.00 sampai 15.30.' },
      { name: 'description', label: 'Keterangan', kind: 'textarea' },
    ],
    seed: [
      { id: 'x1', name: 'Pramuka', schedule: '', description: '' },
      { id: 'x2', name: 'Seni', schedule: '', description: '' },
    ],
  },
  {
    key: 'schedules',
    path: 'akademik',
    group: 'akademik',
    title: 'Jadwal pelajaran',
    singular: 'jam pelajaran',
    titleField: 'subject',
    metaFields: ['grade', 'weekday', 'startTime'],
    canCreate: true,
    empty: 'Belum ada jadwal pelajaran.',
    fields: [
      { name: 'grade', label: 'Kelas', kind: 'select', required: true, options: GRADES },
      { name: 'weekday', label: 'Hari', kind: 'select', required: true, options: WEEKDAYS },
      { name: 'startTime', label: 'Jam mulai', kind: 'time', required: true },
      { name: 'endTime', label: 'Jam selesai', kind: 'time', required: true },
      { name: 'subject', label: 'Mata pelajaran', kind: 'text', required: true },
      { name: 'staffId', label: 'Guru pengampu', kind: 'select', optionsFrom: { key: 'staff', labelField: 'name' } },
    ],
    seed: [],
  },
  {
    key: 'calendar',
    path: 'akademik',
    group: 'akademik',
    title: 'Kalender akademik',
    singular: 'kegiatan kalender',
    titleField: 'label',
    metaFields: ['startsOn', 'endsOn'],
    canCreate: true,
    empty: 'Belum ada kegiatan di kalender akademik.',
    fields: [
      { name: 'label', label: 'Kegiatan', kind: 'text', required: true, hint: 'Contoh: Semester ganjil, Pembagian rapor.' },
      { name: 'startsOn', label: 'Tanggal mulai', kind: 'date', required: true },
      { name: 'endsOn', label: 'Tanggal selesai', kind: 'date', hint: 'Kosongkan bila hanya satu hari.' },
      {
        name: 'semester',
        label: 'Semester',
        kind: 'select',
        options: [
          { value: 'ganjil', label: 'Ganjil' },
          { value: 'genap', label: 'Genap' },
        ],
      },
    ],
    seed: [{ id: 'c1', label: 'Pembagian rapor', startsOn: '2026-12-18', endsOn: '', semester: 'ganjil' }],
  },
  {
    key: 'messages',
    path: 'pesan',
    title: 'Pesan masuk',
    singular: 'pesan',
    titleField: 'name',
    metaFields: ['reply', 'date'],
    statusField: 'status',
    canCreate: false,
    empty: 'Belum ada pesan.',
    fields: [
      { name: 'name', label: 'Pengirim', kind: 'text', lockedOnEdit: true },
      { name: 'reply', label: 'Email atau WhatsApp', kind: 'text', lockedOnEdit: true },
      { name: 'date', label: 'Tanggal', kind: 'date', lockedOnEdit: true },
      { name: 'message', label: 'Pesan', kind: 'textarea', lockedOnEdit: true },
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        required: true,
        options: [
          { value: 'baru', label: 'Baru' },
          { value: 'dibaca', label: 'Sudah dibaca' },
          { value: 'dibalas', label: 'Sudah dibalas' },
        ],
      },
    ],
    seed: [{ id: 'm1', name: 'Contoh Pengirim', reply: 'contoh@email.test', date: '2026-11-09', message: 'Contoh: kapan pendaftaran PPDB dibuka?', status: 'baru' }],
  },
]

export const labelOf = (field: ResourceField | undefined, value: string): string =>
  field?.options?.find((option) => option.value === value)?.label ?? value
