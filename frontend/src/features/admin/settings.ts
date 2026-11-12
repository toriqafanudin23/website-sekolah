/**
 * Pengaturan situs yang bisa diubah admin tanpa developer. Kunci `kelompok.nama` sama dengan
 * kunci di tabel `site_settings` (repo API (sdn1kembaran-api): src/routes/settings.js); nilai selalu teks.
 */
export interface SettingField {
  key: string
  label: string
  kind: 'text' | 'textarea'
  hint?: string
}

export interface SettingSection {
  title: string
  fields: readonly SettingField[]
}

export const SETTING_SECTIONS: readonly SettingSection[] = [
  {
    title: 'Kontak sekolah',
    fields: [
      { key: 'contact.address', label: 'Alamat lengkap', kind: 'textarea' },
      { key: 'contact.phone', label: 'Telepon atau WhatsApp', kind: 'text' },
      { key: 'contact.email', label: 'Email sekolah', kind: 'text' },
      { key: 'contact.hours', label: 'Jam layanan', kind: 'text', hint: 'Contoh: Senin sampai Jumat, 07.00 sampai 14.00.' },
    ],
  },
  {
    title: 'Sambutan kepala sekolah',
    fields: [
      { key: 'headmaster.name', label: 'Nama kepala sekolah', kind: 'text' },
      { key: 'headmaster.welcome', label: 'Isi sambutan', kind: 'textarea', hint: 'Pisahkan paragraf dengan satu baris kosong.' },
    ],
  },
  {
    title: 'Profil sekolah',
    fields: [
      { key: 'school.accreditation', label: 'Akreditasi', kind: 'text' },
      { key: 'school.history', label: 'Sejarah sekolah', kind: 'textarea' },
      { key: 'school.vision', label: 'Visi', kind: 'textarea' },
      { key: 'school.missions', label: 'Misi', kind: 'textarea', hint: 'Satu misi per baris.' },
    ],
  },
  {
    title: 'Angka di beranda',
    fields: [
      { key: 'stats.students', label: 'Peserta didik', kind: 'text' },
      { key: 'stats.staff', label: 'Guru dan tenaga kependidikan', kind: 'text' },
      { key: 'stats.classes', label: 'Rombongan belajar', kind: 'text' },
      { key: 'stats.achievements', label: 'Prestasi', kind: 'text' },
    ],
  },
]
