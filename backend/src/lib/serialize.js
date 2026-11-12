import { resolveUrl } from './urls.js'
import { validate } from './validate.js'

/** Baris database -> Item panel (semua nilai berupa teks, null menjadi ''). */
export function rowToItem(def, row) {
  const item = { id: row.id }
  for (const [name, spec] of Object.entries(def.fields)) {
    const raw = row[spec.col]
    let text
    if (spec.fromDb) text = spec.fromDb(raw)
    else if (spec.type === 'image' || spec.type === 'file') text = resolveUrl(spec.bucket, raw)
    else if (spec.type === 'date') text = raw ? String(raw).slice(0, 10) : ''
    else if (spec.type === 'time') text = raw ? String(raw).slice(0, 5) : ''
    else text = raw == null ? '' : String(raw)
    item[name] = text
  }
  return item
}

/**
 * Masukan panel -> nilai kolom database. `materialize(spec, value, folder)` memindahkan data URL ke storage
 * (disuntikkan agar fungsi ini bisa diuji tanpa Supabase). Mengembalikan { ok, errors } atau { ok, values }.
 */
export async function itemToRow(def, input, { partial, materialize }) {
  const editable = Object.fromEntries(Object.entries(def.fields).filter(([, spec]) => !spec.readonly))
  const { value, errors, ok } = validate(editable, input, { partial })
  if (!ok) return { ok: false, errors }

  const values = {}
  for (const [name, text] of Object.entries(value)) {
    const spec = editable[name]
    if (spec.type === 'image' || spec.type === 'file') {
      const { path } = await materialize(spec, text, def.folder ?? def.table)
      values[spec.col] = path
    } else if (text === '') {
      values[spec.col] = spec.emptyAs !== undefined ? spec.emptyAs : null
    } else {
      values[spec.col] = spec.toDb ? spec.toDb(text) : text
    }
  }
  return { ok: true, values }
}
