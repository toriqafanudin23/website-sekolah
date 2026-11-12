import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { RejectedError, ServiceUnavailableError } from '@/lib/errors'
import { listItems } from '../api'
import { RESOURCES, type Item, type Option, type ResourceDef, type ResourceField } from '../resources'

interface ItemDialogProps {
  def: ResourceDef
  /** `undefined` = tambah baru. */
  item?: Item
  onSave: (item: Item) => Promise<void>
  onClose: () => void
}

/** Kecilkan foto ke sisi terpanjang 800px (JPEG) agar muat di penyimpanan dan ringan dimuat. */
async function shrinkImage(file: File, max = 800): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

const CONTROL = 'block w-full border-2 bg-white px-3.5 text-base text-ink md:text-[17px]'

interface SelectFieldProps {
  field: ResourceField
  value: string
  onChange: (value: string) => void
  options?: readonly Option[]
}

function SelectField({ field, value, onChange, options = field.options }: SelectFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold">
        {field.label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${CONTROL} h-12 border-ink`}>
        {(!value || !field.required) && <option value="">{field.required ? 'Pilih…' : 'Tidak dipilih'}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Pilihan yang diambil dari modul lain, mis. guru pengampu dari modul Guru. */
function RelationSelect({ field, value, onChange }: SelectFieldProps) {
  const [options, setOptions] = useState<readonly Option[]>([])
  const relation = field.optionsFrom

  useEffect(() => {
    const source = relation && RESOURCES.find((resource) => resource.key === relation.key)
    if (!relation || !source) return
    let cancelled = false
    listItems(source)
      .then((items) => {
        if (!cancelled) setOptions(items.map((item) => ({ value: item.id, label: item[relation.labelField] || item.id })))
      })
      .catch(() => undefined) // Server belum terhubung: daftar pilihan tetap kosong.
    return () => {
      cancelled = true
    }
  }, [relation])

  return <SelectField field={field} value={value} onChange={onChange} options={options} />
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Unggah PDF (maks. 2 MB). Nilainya data URL; server memindahkannya ke penyimpanan lalu mengganti dengan alamat berkas. */
function FileUploadField({ field, value, error, onChange }: { field: ResourceField; value: string; error?: string; onChange: (value: string) => void }) {
  const [problem, setProblem] = useState<string>()
  return (
    <div>
      <p className="mb-1.5 text-[15px] font-bold">{field.label}</p>
      {value.startsWith('http') ? (
        <p className="mb-2 text-sm">
          <a href={value} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4 hover:no-underline">
            Buka berkas saat ini
          </a>
        </p>
      ) : value ? (
        <p className="mb-2 text-sm text-muted">Berkas baru sudah dipilih.</p>
      ) : null}
      <input
        type="file"
        accept="application/pdf,.pdf"
        aria-label={`Pilih ${field.label.toLowerCase()}`}
        aria-invalid={error || problem ? true : undefined}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          if (file.type !== 'application/pdf') return setProblem('Berkas harus berformat PDF.')
          if (file.size > MAX_UPLOAD_BYTES) return setProblem('Ukuran berkas melebihi 2 MB. Perkecil lalu pilih lagi.')
          try {
            onChange(await readAsDataUrl(file))
            setProblem(undefined)
          } catch {
            setProblem('Berkas tidak bisa dibaca. Pilih berkas lain.')
          }
        }}
        className="block w-full text-[15px] file:mr-3 file:border-2 file:border-ink file:bg-white file:px-3 file:py-2 file:font-bold"
      />
      {field.hint && <p className="mt-1.5 text-sm text-muted">{field.hint}</p>}
      {(error || problem) && <p className="mt-1.5 text-sm font-bold text-danger">{problem ?? error}</p>}
    </div>
  )
}

function ImageField({ field, value, error, onChange }: { field: ResourceField; value: string; error?: string; onChange: (value: string) => void }) {
  const [failed, setFailed] = useState(false)
  return (
    <div>
      <p className="mb-1.5 text-[15px] font-bold">{field.label}</p>
      {value && <img src={value} alt="" className="mb-2 h-32 w-auto max-w-full border border-line object-cover" />}
      <input
        type="file"
        accept="image/*"
        aria-label={`Pilih ${field.label.toLowerCase()}`}
        aria-invalid={error || failed ? true : undefined}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          try {
            onChange(await shrinkImage(file))
            setFailed(false)
          } catch {
            setFailed(true)
          }
        }}
        className="block w-full text-[15px] file:mr-3 file:border-2 file:border-ink file:bg-white file:px-3 file:py-2 file:font-bold"
      />
      {field.hint && <p className="mt-1.5 text-sm text-muted">{field.hint}</p>}
      {(error || failed) && <p className="mt-1.5 text-sm font-bold text-danger">{failed ? 'Foto tidak bisa dibaca. Pilih berkas JPG atau PNG.' : error}</p>}
    </div>
  )
}

/** Formulir tambah/ubah di dalam `<dialog>`: fokus terkunci dan Esc menutup. Isian dibuat dari `def.fields`. */
export function ItemDialog({ def, item, onSave, onClose }: ItemDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const isNew = !item
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      def.fields.map((f) => [f.name, item?.[f.name] ?? (f.name === 'status' ? f.options?.[0]?.value ?? '' : '')]),
    ),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState(false)
  const [rejection, setRejection] = useState<string>()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const set = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    for (const f of def.fields) {
      if (f.required && !values[f.name]?.trim()) found[f.name] =
        f.kind === 'image' ? 'Pilih foto dulu.' : f.kind === 'file' ? 'Pilih berkas dulu.' : f.kind === 'select' ? `Pilih ${f.label.toLowerCase()} dulu.` : `Isi ${f.label.toLowerCase()} dulu.`
    }
    setErrors(found)
    if (Object.keys(found).length > 0) {
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    setPending(true)
    setFailure(false)
    setRejection(undefined)
    try {
      await onSave({ ...item, ...values, id: item?.id ?? (crypto.randomUUID?.() ?? Date.now().toString(36)) })
    } catch (error) {
      if (error instanceof RejectedError) {
        setRejection(error.message)
        setPending(false)
        return
      }
      if (!(error instanceof ServiceUnavailableError)) throw error
      setFailure(true)
      setPending(false)
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="item-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-2.5rem)] max-w-xl overflow-y-auto border-2 border-ink bg-white p-5 text-ink backdrop:bg-ink/60 md:p-6"
    >
      <form noValidate onSubmit={handleSubmit}>
        <h2 id="item-title" className="mb-5 text-2xl">
          {isNew ? `Tambah ${def.singular}` : `Ubah ${def.singular}`}
        </h2>

        <div className="grid gap-4">
          {def.fields.map((f) => {
            const locked = !isNew && f.lockedOnEdit
            if (f.kind === 'select') {
              if (locked) return null
              return f.optionsFrom ? (
                <RelationSelect key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
              ) : (
                <SelectField key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
              )
            }
            if (f.kind === 'file') {
              return <FileUploadField key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
            }
            if (f.kind === 'image') {
              return <ImageField key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} />
            }
            return (
              <TextField
                key={f.name}
                label={f.label}
                type={f.kind === 'date' || f.kind === 'time' || f.kind === 'tel' ? f.kind : 'text'}
                multiline={f.kind === 'textarea'}
                rows={f.kind === 'textarea' ? 5 : undefined}
                hint={f.hint}
                error={errors[f.name]}
                readOnly={locked}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                className={locked ? 'bg-surface' : undefined}
              />
            )
          })}
        </div>

        <div aria-live="polite">
          {rejection && <p className="mt-4 border-l-4 border-danger bg-surface p-3.5 text-[15px]">{rejection}</p>}
          {failure && (
            <p className="mt-4 border-l-4 border-danger bg-surface p-3.5 text-[15px]">
              Belum tersimpan karena server tidak bisa dihubungi. Coba lagi nanti.
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:flex">
          <Button type="submit" variant="dark" disabled={pending}>
            {pending ? 'Menyimpan…' : 'Simpan'}
          </Button>
          <Button variant="outlineDark" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </dialog>
  )
}
