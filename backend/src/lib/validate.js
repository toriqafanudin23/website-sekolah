import { isRealDate } from './pure.js'

/**
 * Validator kecil berbasis spesifikasi kolom. Setiap kolom: { type, required, max, values, min, hi }.
 * Tipe: text, date, time, int, enum, uuid, image, file. Semua masukan dari panel berupa teks.
 * Mengembalikan { value, errors }: `value` hanya berisi kolom yang lolos.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function check(spec, label, raw) {
  const text = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw)
  if (text === '') return spec.required ? { error: `Isi ${label} dulu.` } : { value: '' }

  switch (spec.type) {
    case 'text':
      if (text.length > (spec.max ?? 500)) return { error: `${label} terlalu panjang (maksimal ${spec.max ?? 500} karakter).` }
      return { value: text }
    case 'date':
      return isRealDate(text) ? { value: text } : { error: `${label} harus berupa tanggal yang benar.` }
    case 'time':
      return TIME.test(text) ? { value: text } : { error: `${label} harus berformat jam, contoh 07:30.` }
    case 'int': {
      const number = Number(text)
      const ok = Number.isInteger(number) && number >= (spec.min ?? 0) && number <= (spec.hi ?? 1_000_000)
      return ok ? { value: text } : { error: `${label} tidak valid.` }
    }
    case 'enum':
      return spec.values.includes(text) ? { value: text } : { error: `${label} tidak valid.` }
    case 'uuid':
      return UUID.test(text) ? { value: text } : { error: `${label} tidak valid.` }
    case 'image':
    case 'file':
      // Isi diperiksa saat dipindahkan ke storage (jenis berkas, ukuran, byte awal).
      return text.length > 6_000_000 ? { error: `${label} terlalu besar.` } : { value: text }
    default:
      return { error: `${label} tidak dikenali.` }
  }
}

/**
 * @param fields  { namaApi: spesifikasi } dengan `label` opsional
 * @param input   objek masukan
 * @param partial true = hanya kolom yang ada di `input` yang diperiksa (ubah data)
 */
export function validate(fields, input, { partial = false } = {}) {
  const value = {}
  const errors = {}
  const source = input && typeof input === 'object' ? input : {}

  for (const [name, spec] of Object.entries(fields)) {
    if (partial && !(name in source)) continue
    const result = check(spec, (spec.label ?? name).toLowerCase(), source[name])
    if (result.error) errors[name] = result.error
    else value[name] = result.value
  }
  return { value, errors, ok: Object.keys(errors).length === 0 }
}

export const firstError = (errors) => Object.values(errors)[0]
