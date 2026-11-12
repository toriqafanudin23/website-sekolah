// Membuat akun admin pertama: akun Supabase Auth + baris admin_profiles.
// Pakai: npm run create-admin -- email@sekolah.sch.id "Kata sandi kuat" "Nama Lengkap" admin
import { requireSupabaseConfig } from '../src/config.js'
import { db } from '../src/supabase.js'

const [email, password, name, role = 'admin'] = process.argv.slice(2)
if (!email || !password || !name || !['admin', 'editor'].includes(role)) {
  console.error('Pemakaian: npm run create-admin -- <email> <kata-sandi> "<nama>" [admin|editor]')
  process.exit(1)
}
if (password.length < 10) {
  console.error('Kata sandi minimal 10 karakter.')
  process.exit(1)
}

requireSupabaseConfig()
const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true })
if (error) {
  console.error('Gagal membuat akun:', error.message)
  process.exit(1)
}

const profile = await db().from('admin_profiles').insert({ id: data.user.id, name, role })
if (profile.error) {
  await db().auth.admin.deleteUser(data.user.id) // jangan tinggalkan akun tanpa profil
  console.error('Gagal membuat profil admin:', profile.error.message)
  process.exit(1)
}
console.log(`Akun ${role} dibuat: ${email}`)
