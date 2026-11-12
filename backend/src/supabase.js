import { createClient } from '@supabase/supabase-js'
import { config, requireSupabaseConfig } from './config.js'

const OPTIONS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

let admin
/** Klien service-role, dipakai ulang antar permintaan. Tidak pernah dipakai untuk login pengguna. */
export function db() {
  if (!admin) {
    requireSupabaseConfig()
    admin = createClient(config.supabaseUrl, config.serviceKey, OPTIONS)
  }
  return admin
}

/** Klien baru per panggilan: login menyimpan sesi di dalam klien, jadi tidak boleh dibagi antar permintaan. */
export function authClient() {
  requireSupabaseConfig()
  return createClient(config.supabaseUrl, config.anonKey, OPTIONS)
}
