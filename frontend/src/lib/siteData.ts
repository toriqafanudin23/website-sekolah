import type { KeyValue } from '@/components/ui/KeyValueList'
import { useRemote } from '@/lib/publicApi'

/** Pengaturan situs dari `GET /public/settings`: kunci `kelompok.nama` (lihat features/admin/settings.ts), nilai teks. */
export type SiteSettings = Readonly<Record<string, string>>

const NONE: SiteSettings = {}

/** Kosong selama memuat atau bila API belum aktif; pemanggil memakai nilai statis lewat `setting()`. */
export function useSettings(): SiteSettings {
  const remote = useRemote<SiteSettings>('/public/settings')
  return remote.kind === 'ready' ? remote.data : NONE
}

/** Nilai pengaturan, atau `fallback` bila belum diisi admin. */
export const setting = (settings: SiteSettings, key: string, fallback: string): string => settings[key]?.trim() || fallback

/** Paragraf dipisah baris kosong. */
export const paragraphsOf = (text: string | undefined): string[] =>
  (text ?? '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)

/** Satu butir per baris. */
export const linesOf = (text: string | undefined): string[] =>
  (text ?? '').split(/\r?\n/).map((part) => part.trim()).filter(Boolean)

/** Ganti `value` baris yang labelnya ada di `keys` dengan pengaturan terkait, bila admin sudah mengisinya. */
export const withSettings = (rows: readonly KeyValue[], settings: SiteSettings, keys: Readonly<Record<string, string>>): KeyValue[] =>
  rows.map((row) => (keys[row.label] ? { ...row, value: setting(settings, keys[row.label], row.value) } : row))
