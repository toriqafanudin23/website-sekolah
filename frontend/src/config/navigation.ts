export const ROUTES = {
  home: '/',
  profile: '/profil',
  academic: '/akademik',
  information: '/informasi',
  admission: '/ppdb',
  admissionStatus: '/ppdb/status',
  contact: '/kontak',
  gallery: '/galeri',
  adminLogin: '/admin/masuk',
  adminDashboard: '/admin',
} as const

export interface NavItem {
  label: string
  to: string
}

/** Menu utama (navbar desktop dan menu ponsel). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Beranda', to: ROUTES.home },
  { label: 'Profil', to: ROUTES.profile },
  { label: 'Akademik', to: ROUTES.academic },
  { label: 'Informasi', to: ROUTES.information },
  { label: 'PPDB', to: ROUTES.admission },
  { label: 'Kontak', to: ROUTES.contact },
]

export const FOOTER_LINKS: readonly NavItem[] = [
  { label: 'Profil sekolah', to: ROUTES.profile },
  { label: 'Akademik', to: ROUTES.academic },
  { label: 'Berita dan agenda', to: ROUTES.information },
  { label: 'Galeri', to: ROUTES.gallery },
  { label: 'PPDB online', to: ROUTES.admission },
]

export const ADMIN_ROUTES = {
  news: '/admin/berita',
  newsNew: '/admin/berita/baru',
  announcements: '/admin/pengumuman',
  agenda: '/admin/agenda',
  agendaNew: '/admin/agenda/baru',
  gallery: '/admin/galeri',
  galleryUpload: '/admin/galeri/unggah',
  staff: '/admin/guru',
  academic: '/admin/akademik',
  admission: '/admin/ppdb',
  settings: '/admin/pengaturan',
  messages: '/admin/pesan',
  downloads: '/admin/unduhan',
} as const

/** Menu panel admin (sidebar desktop dan menu ponsel). Urutan = urutan tampil. */
export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: ROUTES.adminDashboard },
  { label: 'Berita', to: ADMIN_ROUTES.news },
  { label: 'Pengumuman', to: ADMIN_ROUTES.announcements },
  { label: 'Agenda', to: ADMIN_ROUTES.agenda },
  { label: 'Galeri', to: ADMIN_ROUTES.gallery },
  { label: 'Guru dan tendik', to: ADMIN_ROUTES.staff },
  { label: 'Akademik', to: ADMIN_ROUTES.academic },
  { label: 'Unduhan', to: ADMIN_ROUTES.downloads },
  { label: 'Pesan masuk', to: ADMIN_ROUTES.messages },
  { label: 'PPDB', to: ADMIN_ROUTES.admission },
  { label: 'Pengaturan situs', to: ADMIN_ROUTES.settings },
]

/** Id rute /admin di router.tsx; anak rute membaca sesi dari loader-nya (features/admin/session.ts). */
export const ADMIN_ROUTE_ID = 'admin'

/** Menu yang hanya boleh dibuka peran admin; API menjawab 403 untuk editor. */
export const ADMIN_ONLY_ROUTES: readonly string[] = [ADMIN_ROUTES.admission, ADMIN_ROUTES.settings]

const navItem = (to: string): NavItem => ADMIN_NAV_ITEMS.find((item) => item.to === to) ?? ADMIN_NAV_ITEMS[0]

/** Tiga pintasan di tab bawah ponsel; tab keempat ("Menu") membuka semua menu. */
export const ADMIN_TAB_ITEMS: readonly NavItem[] = [
  navItem(ROUTES.adminDashboard),
  navItem(ADMIN_ROUTES.news),
  navItem(ADMIN_ROUTES.admission),
]

/** Pintasan tab bawah untuk editor: tanpa PPDB. */
export const EDITOR_TAB_ITEMS: readonly NavItem[] = [
  navItem(ROUTES.adminDashboard),
  navItem(ADMIN_ROUTES.news),
  navItem(ADMIN_ROUTES.messages),
]
