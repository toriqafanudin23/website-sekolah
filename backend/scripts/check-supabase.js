// Memeriksa sambungan ke Supabase: variabel lingkungan, hak akses tabel, bucket, akun admin, dan bahwa kunci anon
// tidak bisa membaca data. Opsional menguji API yang sedang berjalan. Keluar dengan kode 1 bila ada yang GAGAL.
//
// Pakai:
//   npm run check                                          Supabase saja
//   npm run check -- --api http://localhost:3001           ditambah uji API lokal
//   npm run check -- --api http://localhost:5173/api       uji rantai frontend -> proxy Vite -> API -> Supabase
//   npm run check -- --api https://<domain-frontend>/api   uji rantai produksi (rewrite vercel.json)
import { config, requireSupabaseConfig } from '../src/config.js'
import { authClient, db } from '../src/supabase.js'

const TABLES = [
  'admin_profiles', 'news', 'announcements', 'agenda', 'gallery_items', 'staff', 'downloads',
  'extracurriculars', 'class_schedules', 'academic_calendar', 'site_settings', 'admission_periods',
  'registrations', 'registration_documents', 'contact_messages', 'activity_logs',
]
/** id bucket -> publik? */
const BUCKETS = { media: true, downloads: true, admission: false }
/** Tabel yang tidak boleh terbaca oleh kunci anon. */
const PRIVATE_TABLES = ['registrations', 'contact_messages', 'admin_profiles']

let failures = 0
const ok = (text) => console.log(`  OK    ${text}`)
const todo = (text) => console.log(`  CEK   ${text}`)
const fail = (text) => {
  failures += 1
  console.log(`  GAGAL ${text}`)
}
const hint = (text) => console.log(`        -> ${text}`)

async function checkTables() {
  console.log('\nTabel (hak akses service_role)')
  let denied = false
  let missing = false
  for (const table of TABLES) {
    const { error } = await db().from(table).select('*', { count: 'exact', head: true })
    if (!error) {
      ok(table)
      continue
    }
    fail(`${table}: ${error.code ? `${error.code} ` : ''}${error.message}`)
    if (error.code === '42501') denied = true
    if (error.code === 'PGRST205' || error.code === '42P01') missing = true
  }
  if (denied) hint('Hak akses belum ada. Jalankan supabase/migrations/0002_data_api_grants_and_indexes.sql.')
  if (missing) hint('Tabel belum ada. Jalankan supabase/migrations/0001_init.sql, lalu 0002.')
}

async function checkAnonLocked() {
  console.log('\nKunci anon tidak boleh bisa membaca data')
  for (const table of PRIVATE_TABLES) {
    const { data, error } = await authClient().from(table).select('*').limit(1)
    if (error) ok(`${table}: ditolak (${error.code ?? error.message})`)
    else if (!data || data.length === 0) ok(`${table}: tidak ada baris yang terbaca`)
    else fail(`${table}: kunci anon BISA membaca data. Periksa RLS dan GRANT (0002).`)
  }
}

async function checkBuckets() {
  console.log('\nBucket Storage')
  const { data, error } = await db().storage.listBuckets()
  if (error) return fail(`tidak bisa membaca daftar bucket: ${error.message}`)
  for (const [id, wantPublic] of Object.entries(BUCKETS)) {
    const bucket = data.find((item) => item.id === id)
    if (!bucket) fail(`bucket ${id} belum ada (jalankan 0001_init.sql)`)
    else if (bucket.public !== wantPublic) fail(`bucket ${id} seharusnya ${wantPublic ? 'publik' : 'privat'}`)
    else ok(`${id} (${bucket.public ? 'publik' : 'privat'})`)
  }
}

async function checkData() {
  console.log('\nData awal')
  const admins = await db().from('admin_profiles').select('role').eq('is_active', true)
  if (admins.error) fail(`admin_profiles: ${admins.error.message}`)
  else if (!admins.data.some((row) => row.role === 'admin')) {
    todo('belum ada akun admin aktif')
    hint('npm run create-admin -- email@sekolah.sch.id "KataSandiKuat123" "Nama Lengkap" admin')
  } else ok(`${admins.data.length} akun aktif, termasuk admin`)

  const period = await db()
    .from('admission_periods')
    .select('school_year, starts_on, ends_on, is_open')
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (period.error) fail(`admission_periods: ${period.error.message}`)
  else if (!period.data) todo('belum ada periode PPDB (0001_init.sql membuatnya otomatis)')
  else ok(`periode PPDB ${period.data.school_year}: ${period.data.starts_on} s.d. ${period.data.ends_on}, ${period.data.is_open ? 'DIBUKA' : 'tertutup'}`)
}

/** Mengembalikan false bila SUPABASE_URL tidak sah (pemeriksaan ke Supabase tidak ada gunanya). */
function checkConfig() {
  console.log('\nKonfigurasi')
  let host
  try {
    host = new URL(config.supabaseUrl).host
  } catch {
    fail(`SUPABASE_URL bukan alamat yang sah: "${config.supabaseUrl}"`)
    return false
  }
  ok(`SUPABASE_URL: ${host}`)
  if (config.isProd && config.allowedOrigins.length === 0) {
    fail('ALLOWED_ORIGINS kosong: semua permintaan tulis dari browser akan ditolak (403)')
  } else {
    ok(`ALLOWED_ORIGINS: ${config.allowedOrigins.join(', ')}`)
  }
  return true
}

async function checkApi(base) {
  const root = base.replace(/\/+$/, '')
  console.log(`\nAPI yang berjalan: ${root}`)
  for (const path of ['/health', '/public/settings', '/public/news?limit=1']) {
    try {
      const response = await fetch(`${root}${path}`)
      const body = await response.json().catch(() => null)
      if (response.ok && body !== null) ok(`GET ${path} -> ${response.status}`)
      else fail(`GET ${path} -> ${response.status}${body?.error ? ` (${body.error})` : ''}`)
    } catch (error) {
      fail(`GET ${path}: tidak terhubung (${error.cause?.code ?? error.message})`)
    }
  }
}

const flag = process.argv.indexOf('--api')
const apiBase = flag > -1 ? process.argv[flag + 1] : undefined
if (flag > -1 && !apiBase) {
  console.error('Pemakaian: npm run check -- --api <alamat-api>')
  process.exit(1)
}

try {
  requireSupabaseConfig()
} catch (error) {
  console.error(error.message)
  console.error('Salin .env.example menjadi .env lalu isi SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (checkConfig()) {
  await checkTables()
  await checkAnonLocked()
  await checkBuckets()
  await checkData()
}
if (apiBase) await checkApi(apiBase)

console.log(failures === 0 ? '\nSemua pemeriksaan lolos.' : `\n${failures} pemeriksaan gagal.`)
process.exit(failures === 0 ? 0 : 1)
