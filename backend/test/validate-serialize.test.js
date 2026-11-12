import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RESOURCES } from '../src/lib/registry.js'
import { itemToRow, rowToItem } from '../src/lib/serialize.js'
import { validate } from '../src/lib/validate.js'

const noUpload = async (_spec, value) => ({ path: value ? `uploaded/${value.slice(0, 4)}` : null })

test('validate: wajib, enum, tanggal, jam, int, uuid', () => {
  const fields = {
    title: { type: 'text', required: true, max: 5, label: 'Judul' },
    kind: { type: 'enum', values: ['a', 'b'], label: 'Jenis' },
    day: { type: 'date', label: 'Tanggal' },
    at: { type: 'time', label: 'Jam' },
    grade: { type: 'int', min: 1, hi: 6, label: 'Kelas' },
    ref: { type: 'uuid', label: 'Acuan' },
  }
  assert.equal(validate(fields, { title: '' }).errors.title, 'Isi judul dulu.')
  assert.match(validate(fields, { title: 'terlalu panjang' }).errors.title, /terlalu panjang/)
  assert.ok(validate(fields, { title: 'ok', kind: 'z' }).errors.kind)
  assert.ok(validate(fields, { title: 'ok', day: '2026-13-01' }).errors.day)
  assert.ok(validate(fields, { title: 'ok', at: '25:00' }).errors.at)
  assert.ok(validate(fields, { title: 'ok', grade: '7' }).errors.grade)
  assert.ok(validate(fields, { title: 'ok', ref: 'bukan-uuid' }).errors.ref)
  const good = validate(fields, { title: ' ok ', kind: 'a', day: '2026-11-09', at: '07:30', grade: '3', ref: '123e4567-e89b-42d3-a456-426614174000' })
  assert.equal(good.ok, true)
  assert.equal(good.value.title, 'ok')
})

test('validate partial hanya memeriksa kolom yang dikirim', () => {
  const fields = { a: { type: 'text', required: true, label: 'A' }, b: { type: 'text', required: true, label: 'B' } }
  assert.equal(validate(fields, { a: 'x' }, { partial: true }).ok, true)
  assert.equal(validate(fields, { a: '' }, { partial: true }).ok, false)
  assert.equal(validate(fields, { a: 'x' }).ok, false)
})

test('berita: Item panel -> kolom database', async () => {
  const result = await itemToRow(
    RESOURCES.news,
    { id: 'abaikan', title: 'Judul', category: 'Kegiatan', date: '2026-11-06', body: '', imageUrl: '', status: 'terbit' },
    { partial: false, materialize: noUpload },
  )
  assert.equal(result.ok, true)
  assert.deepEqual(result.values, {
    title: 'Judul', category: 'Kegiatan', published_on: '2026-11-06', body: '', cover_path: null, status: 'terbit',
  })
})

test('berita: kategori tidak sah ditolak dan kolom id tidak ikut tersimpan', async () => {
  const bad = await itemToRow(RESOURCES.news, { title: 'x', category: 'Gosip', date: '2026-11-06', status: 'terbit' }, { partial: false, materialize: noUpload })
  assert.equal(bad.ok, false)
  assert.ok(bad.errors.category)
})

test('pesan: kolom isi pesan tidak bisa diubah lewat API (readonly)', async () => {
  const result = await itemToRow(RESOURCES.messages, { name: 'Peretas', message: 'diubah', status: 'dibaca' }, { partial: true, materialize: noUpload })
  assert.equal(result.ok, true)
  assert.deepEqual(result.values, { status: 'dibaca' })
})

test('jadwal: grade dan hari menjadi angka, guru kosong menjadi null', async () => {
  const result = await itemToRow(
    RESOURCES.schedules,
    { grade: '3', weekday: '2', startTime: '07:00', endTime: '07:35', subject: 'Matematika', staffId: '' },
    { partial: false, materialize: noUpload },
  )
  assert.equal(result.ok, true)
  assert.equal(result.values.grade, 3)
  assert.equal(result.values.weekday, 2)
  assert.equal(result.values.staff_id, null)
})

test('unduhan: status draf/terbit <-> is_published', async () => {
  const written = await itemToRow(RESOURCES.downloads, { name: 'Brosur', fileUrl: 'data:application/pdf;base64,AAAA', status: 'draf' }, { partial: false, materialize: noUpload })
  assert.equal(written.values.is_published, false)
  const item = rowToItem(RESOURCES.downloads, { id: 'i1', name: 'Brosur', file_path: 'downloads/x.pdf', is_published: true })
  assert.equal(item.status, 'terbit')
})

test('rowToItem: null menjadi teks kosong, tanggal dan jam dipotong', () => {
  const item = rowToItem(RESOURCES.schedules, {
    id: 's1', grade: 3, weekday: 2, start_time: '07:00:00', end_time: '07:35:00', subject: 'IPA', staff_id: null,
  })
  assert.deepEqual(item, { id: 's1', grade: '3', weekday: '2', startTime: '07:00', endTime: '07:35', subject: 'IPA', staffId: '' })
  const message = rowToItem(RESOURCES.messages, { id: 'm1', name: 'A', reply_contact: 'a@b.id', created_at: '2026-11-09T10:00:00+00:00', message: 'hai', status: 'baru' })
  assert.equal(message.date, '2026-11-09')
})
