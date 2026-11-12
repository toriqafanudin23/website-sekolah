import { config } from '../config.js'

export const publicUrl = (bucket, path) => `${config.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`

/** Kolom storage boleh berisi path (bucket publik) atau alamat penuh; keluarannya selalu alamat penuh. */
export function resolveUrl(bucket, stored) {
  if (!stored) return ''
  return /^https?:\/\//.test(stored) ? stored : publicUrl(bucket, stored)
}

/** Alamat publik milik kita dikembalikan jadi path agar tidak terikat domain Supabase. */
export function toStoredPath(bucket, value) {
  const prefix = publicUrl(bucket, '')
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}
