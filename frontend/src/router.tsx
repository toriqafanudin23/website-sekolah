import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/components/layout/MainLayout'
import { ADMIN_ROUTE_ID, ROUTES } from '@/config/navigation'
import { RESOURCES } from '@/features/admin/resources'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'

/**
 * Halaman baru: tambahkan satu rute di sini. Untuk halaman besar gunakan
 * `lazy: async () => ({ Component: (await import('...')).default })`.
 * Halaman Beranda dimuat langsung karena menjadi pintu masuk utama (LCP).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      {
        path: ROUTES.profile,
        lazy: async () => ({ Component: (await import('@/pages/ProfilePage')).default }),
      },
      {
        path: ROUTES.academic,
        lazy: async () => ({ Component: (await import('@/pages/AcademicPage')).default }),
      },
      {
        path: ROUTES.information,
        lazy: async () => ({ Component: (await import('@/pages/InformationPage')).default }),
      },
      {
        path: `${ROUTES.information}/:slug`,
        lazy: async () => ({ Component: (await import('@/pages/NewsDetailPage')).default }),
      },
      {
        path: ROUTES.gallery,
        lazy: async () => ({ Component: (await import('@/pages/GalleryPage')).default }),
      },
      {
        path: ROUTES.admission,
        lazy: async () => ({ Component: (await import('@/pages/AdmissionPage')).default }),
      },
      {
        path: ROUTES.admissionStatus,
        lazy: async () => ({ Component: (await import('@/pages/AdmissionPage')).default }),
      },
      {
        path: ROUTES.contact,
        lazy: async () => ({ Component: (await import('@/pages/ContactPage')).default }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  // Panel admin memakai kerangka sendiri (tanpa navbar dan footer publik) dan wajib login.
  {
    id: ADMIN_ROUTE_ID,
    path: ROUTES.adminDashboard,
    lazy: async () => {
      const [{ AdminLayout }, { requireAdmin }] = await Promise.all([
        import('@/features/admin/components/AdminLayout'),
        import('@/features/admin/session'),
      ])
      return { Component: AdminLayout, loader: requireAdmin }
    },
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/pages/AdminDashboardPage')).default }),
      },
      // Modul konten admin (Berita, Pengumuman, Agenda, Galeri, Guru, PPDB): satu halaman, satu definisi.
      ...RESOURCES.filter((def) => !def.group).map((def) => ({
        path: `${def.path}/*`,
        lazy: async () => {
          const [{ default: AdminResourcePage }, { AdminOnly }] = await Promise.all([
            import('@/pages/AdminResourcePage'),
            import('@/features/admin/components/AdminOnly'),
          ])
          // PPDB hanya untuk admin; editor dikembalikan ke dashboard.
          const page = <AdminResourcePage def={def} />
          return { Component: () => (def.detail === 'admission' ? <AdminOnly>{page}</AdminOnly> : page) }
        },
      })),
      // Akademik: tiga sub-modul (ekstrakurikuler, jadwal, kalender) dalam satu halaman bertab.
      {
        path: 'akademik',
        lazy: async () => ({ Component: (await import('@/pages/AdminAcademicPage')).default }),
      },
      {
        path: 'pengaturan',
        lazy: async () => {
          const [{ default: AdminSettingsPage }, { AdminOnly }] = await Promise.all([
            import('@/pages/AdminSettingsPage'),
            import('@/features/admin/components/AdminOnly'),
          ])
          return {
            Component: () => (
              <AdminOnly>
                <AdminSettingsPage />
              </AdminOnly>
            ),
          }
        },
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/AdminComingSoonPage')).default }),
      },
    ],
  },
  {
    path: ROUTES.adminLogin,
    lazy: async () => ({ Component: (await import('@/pages/AdminLoginPage')).default }),
  },
])
