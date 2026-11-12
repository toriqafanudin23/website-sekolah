import type { NewsPost } from '@/features/home/types'
import type { StaffMember } from '@/features/profile/types'

/** Bentuk respons API publik untuk berita dan galeri (lihat repo API (sdn1kembaran-api): src/routes/public.js). */
export interface ApiNewsListItem {
  id: string
  slug: string
  title: string
  category: string
  /** `YYYY-MM-DD` */
  date: string
  coverUrl: string
}

export interface ApiNewsDetail extends ApiNewsListItem {
  /** Teks biasa; paragraf dipisah baris kosong. */
  body: string
}

export interface ApiGalleryItem {
  id: string
  caption: string
  imageUrl: string
}

export interface ApiAnnouncement {
  id: string
  title: string
  body: string
  /** `YYYY-MM-DD` */
  date: string
}

export interface ApiAgendaItem {
  id: string
  title: string
  /** `YYYY-MM-DD` */
  date: string
  location: string
}

export interface ApiDownload {
  id: string
  name: string
  /** Alamat penuh berkas PDF. */
  href: string
}

export interface ApiStaffMember {
  id: string
  name: string
  role: string
  category: StaffMember['category']
  imageUrl: string
}

/** Berita API -> bentuk yang dipakai kartu berita (Beranda dan Informasi). */
export const newsPostFromApi = (item: ApiNewsListItem): NewsPost => ({
  slug: item.slug,
  category: item.category,
  date: item.date,
  title: item.title,
  photo: item.coverUrl ? { src: item.coverUrl, alt: item.title } : undefined,
})

export const staffFromApi = (item: ApiStaffMember): StaffMember => ({
  id: item.id,
  name: item.name,
  role: item.role,
  category: item.category,
  photo: item.imageUrl ? { src: item.imageUrl, alt: `${item.name}, ${item.role}` } : undefined,
})
