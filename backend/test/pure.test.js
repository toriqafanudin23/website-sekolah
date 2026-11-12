import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detectMime, escapeLike, isRealDate, normalizePhone, registrationNumber, safeEqual, sha256, slugify, todayInJakarta } from '../src/lib/pure.js'

test('slugify: huruf kecil, tanpa aksen, tanpa simbol, tidak kosong', () => {
  assert.equal(slugify('Kegiatan Jumat Bersih di Sekolah!'), 'kegiatan-jumat-bersih-di-sekolah')
  assert.equal(slugify("  Prestasi Murid: Juara 1 'Lomba' "), 'prestasi-murid-juara-1-lomba')
  assert.equal(slugify('Çafé Résumé'), 'cafe-resume')
  assert.equal(slugify('!!!'), 'berita')
  assert.ok(slugify('a'.repeat(300)).length <= 80)
})

test('registrationNumber: format PPDB27-XXXXXX tanpa karakter yang mudah tertukar', () => {
  for (let i = 0; i < 200; i += 1) assert.match(registrationNumber('2027/2028'), /^PPDB27-[A-HJKMNP-Z2-9]{6}$/)
  assert.notEqual(registrationNumber('2027/2028'), registrationNumber('2027/2028'))
})

test('detectMime membaca byte awal, bukan nama atau header', () => {
  const pad = Buffer.alloc(16)
  assert.equal(detectMime(Buffer.concat([Buffer.from('%PDF-1.7\n'), pad])), 'application/pdf')
  assert.equal(detectMime(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), pad])), 'image/jpeg')
  assert.equal(detectMime(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), pad])), 'image/png')
  assert.equal(detectMime(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), pad])), 'image/webp')
  assert.equal(detectMime(Buffer.from('<script>alert(1)</script>............')), null)
  assert.equal(detectMime(Buffer.from('%PD')), null)
})

test('normalizePhone menyeragamkan ke 08...', () => {
  assert.equal(normalizePhone('0812-3456-7890'), '081234567890')
  assert.equal(normalizePhone('+62 812 3456 7890'), '081234567890')
  assert.equal(normalizePhone('6281234567890'), '081234567890')
  assert.equal(normalizePhone('0212345678'), null)
  assert.equal(normalizePhone('abc'), null)
})

test('isRealDate menolak tanggal yang tidak ada', () => {
  assert.equal(isRealDate('2026-11-09'), true)
  assert.equal(isRealDate('2026-02-30'), false)
  assert.equal(isRealDate('09-11-2026'), false)
})

test('safeEqual dan sha256', () => {
  assert.equal(safeEqual(sha256('abc'), sha256('abc')), true)
  assert.equal(safeEqual(sha256('abc'), sha256('abd')), false)
  assert.equal(safeEqual('a', 'ab'), false)
})

test('escapeLike melolos-kan karakter khusus', () => {
  assert.equal(escapeLike('50%_off\\'), '50\\%\\_off\\\\')
})

test('todayInJakarta memakai zona WIB (UTC+7)', () => {
  assert.equal(todayInJakarta(new Date('2026-11-10T20:00:00Z')), '2026-11-11')
  assert.equal(todayInJakarta(new Date('2026-11-10T16:59:00Z')), '2026-11-10')
})
