export const SITE = {
  name: 'SDN 1 Kembaran',
  type: 'Sekolah Dasar Negeri',
  tagline: 'Belajar ceria, tumbuh cerdas, dan berkarakter.',
  description:
    'Sekolah dasar negeri di Desa Kembaran, Kecamatan Kalikajar, Kabupaten Wonosobo. Ramah anak, berkurikulum merdeka, dengan guru yang mendampingi tiap murid.',
} as const

export const PPDB = {
  year: '2027/2028',
  period: '1 Maret sampai 30 April 2027',
} as const

/**
 * TODO: ganti dengan data resmi sekolah. Nilai di bawah masih placeholder
 * sesuai desain, sengaja tidak diisi data karangan.
 */
export const CONTACT = {
  address: '[Alamat lengkap], Desa Kembaran, Kec. Kalikajar, Kab. Wonosobo, Jawa Tengah',
  phone: '[Nomor telepon / WhatsApp sekolah]',
  email: '[Email sekolah]',
} as const

/**
 * Peta lokasi sekolah (halaman Kontak). Selama `placeUrl` dan `embedUrl` kosong, peta dicari lewat
 * `query` (nama sekolah + wilayah). TODO: untuk titik yang tepat, buka sekolah di Google Maps lalu:
 * - `placeUrl`: tempel tautan dari Bagikan > Salin link (mis. https://maps.app.goo.gl/...).
 * - `embedUrl`: tempel nilai `src` dari Bagikan > Sematkan peta (https://www.google.com/maps/embed?pb=...).
 */
export const MAP = {
  query: 'SD Negeri 1 Kembaran, Kalikajar, Wonosobo, Jawa Tengah',
  placeUrl: '',
  embedUrl: '',
} as const

/**
 * Alamat dasar API backend (proyek Vercel terpisah, repositori terpisah `sdn1kembaran-api`).
 * Produksi dan pengembangan lokal: `/api`. Di produksi, `vercel.json` meneruskan `/api/*` ke API sehingga
 * cookie sesi admin tetap satu domain; di lokal, proxy Vite meneruskannya ke http://localhost:3001.
 * Isi lewat env `VITE_API_URL`. Kosong = pendaftaran, pesan, dan login menampilkan "belum aktif",
 * panel admin memakai mode demo, dan halaman publik memakai data statis di `content.ts`.
 */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/** Satu API untuk semua layanan; tiga nama dipertahankan agar kontrak di tiap `api.ts` tetap terbaca. */
export const ADMISSION_API_URL = API_URL
export const CONTACT_API_URL = API_URL
export const ADMIN_API_URL = API_URL
