import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { KeyValueList, type KeyValue } from '@/components/ui/KeyValueList'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { RejectedError, ServiceUnavailableError } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import {
  fetchAdmissionDetail,
  saveAdmissionDecision,
  setDocumentVerified,
  type AdmissionDetail,
  type AdmissionDocumentInfo,
} from '../api'
import { DEMO_ENABLED } from '../demo'
import { labelOf, type Item, type ResourceDef } from '../resources'

interface AdmissionDetailDialogProps {
  def: ResourceDef
  item: Item
  /** Dipanggil setelah keputusan tersimpan, untuk memuat ulang daftar. */
  onSaved: () => Promise<void>
  onClose: () => void
}

type Load = { kind: 'loading' } | { kind: 'ready'; detail: AdmissionDetail } | { kind: 'unavailable' }

/**
 * Rincian satu pendaftar PPDB: data, pratinjau berkas (tautan sementara dari server), verifikasi per berkas,
 * dan keputusan (status dan catatan). Hanya peran admin yang bisa membukanya di server.
 */
export function AdmissionDetailDialog({ def, item, onSaved, onClose }: AdmissionDetailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [load, setLoad] = useState<Load>({ kind: 'loading' })
  const [documents, setDocuments] = useState<readonly AdmissionDocumentInfo[]>([])
  const [status, setStatus] = useState(item.status ?? 'baru')
  const [note, setNote] = useState(item.statusNote ?? '')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchAdmissionDetail(item).then(
      (detail) => {
        if (cancelled) return
        setLoad({ kind: 'ready', detail })
        setDocuments(detail.documents)
        setStatus(detail.item.status ?? 'baru')
        setNote(detail.item.statusNote ?? '')
      },
      () => {
        if (!cancelled) setLoad({ kind: 'unavailable' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [item])

  const current = load.kind === 'ready' ? load.detail.item : item
  const field = (name: string) => def.fields.find((f) => f.name === name)
  const rows: KeyValue[] = [
    { label: 'Nomor pendaftaran', value: current.registrationNumber || '-' },
    { label: 'Jalur', value: labelOf(field('track'), current.track ?? '') || '-' },
    { label: 'Nama murid', value: current.fullName ?? '-' },
    { label: 'Tanggal lahir', value: current.birthDate ? formatDate(current.birthDate) : '-' },
    { label: 'Alamat', value: current.address || '-' },
    { label: 'Desa atau kelurahan', value: current.village || '-' },
    { label: 'Orang tua atau wali', value: current.guardianName ?? '-' },
    { label: 'Nomor WhatsApp', value: current.guardianPhone ?? '-' },
  ]

  const toggleVerified = async (doc: AdmissionDocumentInfo, verified: boolean) => {
    setMessage(undefined)
    try {
      await setDocumentVerified(item.id, doc.docType, verified)
      setDocuments((list) => list.map((d) => (d.docType === doc.docType ? { ...d, verified } : d)))
    } catch (error) {
      if (!(error instanceof ServiceUnavailableError) && !(error instanceof RejectedError)) throw error
      setMessage('Verifikasi berkas belum tersimpan. Coba lagi.')
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage(undefined)
    try {
      await saveAdmissionDecision(item.id, { status, statusNote: note.trim() })
      await onSaved()
      onClose()
    } catch (error) {
      if (error instanceof RejectedError) setMessage(error.message)
      else if (error instanceof ServiceUnavailableError) setMessage('Belum tersimpan karena server tidak bisa dihubungi. Coba lagi nanti.')
      else throw error
      setPending(false)
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="admission-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-2.5rem)] max-w-2xl overflow-y-auto border-2 border-ink bg-white p-5 text-ink backdrop:bg-ink/60 md:p-6"
    >
      <h2 id="admission-title" className="mb-4 text-2xl">
        Detail pendaftar
      </h2>

      {load.kind === 'ready' && load.detail.possibleDuplicate ? (
        <p role="status" className="mb-4 border-l-4 border-brand bg-surface p-3.5 text-[15px]">
          Kemungkinan pendaftaran ganda: ada pendaftar lain dengan nama, tanggal lahir, dan nomor WhatsApp wali yang sama
          pada periode ini. Periksa sebelum memberi keputusan.
        </p>
      ) : null}

      <KeyValueList items={rows} stackOnMobile />

      <h3 className="mt-6 mb-2 text-xl">Berkas</h3>
      {load.kind === 'loading' ? <p className="text-muted">Memuat berkas…</p> : null}
      {load.kind === 'unavailable' ? (
        <p className="text-muted">
          {DEMO_ENABLED ? 'Mode demo: berkas pendaftar hanya tampil bila panel terhubung ke server.' : 'Berkas belum bisa dimuat. Tutup lalu buka lagi.'}
        </p>
      ) : null}
      {load.kind === 'ready' && documents.length === 0 ? <p className="text-muted">Pendaftar belum mengunggah berkas.</p> : null}
      {documents.length > 0 ? (
        <ul>
          {documents.map((doc) => (
            <li key={doc.docType} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line py-3">
              <span className="font-bold">{doc.label}</span>
              {doc.uploaded && doc.url ? (
                <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4 hover:no-underline">
                    Buka berkas<span className="sr-only"> {doc.label}</span>
                  </a>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={doc.verified}
                      onChange={(event) => toggleVerified(doc, event.target.checked)}
                      className="size-5 accent-brand"
                    />
                    Terverifikasi
                  </label>
                </span>
              ) : (
                <span className="text-muted">Belum terunggah</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <h3 className="text-xl">Keputusan</h3>
        <SelectField
          label="Status pendaftaran"
          value={status}
          options={field('status')?.options ?? []}
          onChange={(event) => setStatus(event.target.value)}
        />
        <TextField
          multiline
          rows={3}
          label="Catatan untuk pendaftar"
          hint="Tampil di halaman Cek status. Contoh: berkas akta kurang jelas, mohon unggah ulang."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <div aria-live="polite">{message ? <p className="border-l-4 border-danger bg-surface p-3.5 text-[15px]">{message}</p> : null}</div>

        <div className="grid gap-3 md:flex">
          <Button type="submit" variant="dark" disabled={pending}>
            {pending ? 'Menyimpan…' : 'Simpan keputusan'}
          </Button>
          <Button variant="outlineDark" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </form>
    </dialog>
  )
}
