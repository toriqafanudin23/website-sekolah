import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { KeyValueList } from '@/components/ui/KeyValueList'
import { Section } from '@/components/ui/Section'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { usePersistedState } from '@/hooks/usePersistedState'
import { PPDB, SITE } from '@/config/site'
import { cn } from '@/lib/cn'
import {
  AdmissionRejectedError,
  AdmissionUnavailableError,
  AdmissionUploadError,
  retryUploads,
  submitRegistration,
  type StudentFiles,
  type StudentValues,
  type SubmissionReceipt,
} from '../api'
import {
  ADMISSION_DOCUMENTS,
  FILES_STEP_INDEX,
  FORM_STEPS,
  REVIEW_STEP_INDEX,
  type DocumentId,
  type FieldName,
} from '../content'
import { validateField, validateFile } from '../validation'
import { FileField } from './FileField'

const EMPTY_VALUES: StudentValues = {
  track: '',
  fullName: '',
  birthDate: '',
  address: '',
  village: '',
  guardianName: '',
  guardianPhone: '',
}

type Errors = Partial<Record<FieldName | DocumentId | 'consent', string>>

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; registrationNumber: string }
  /** Pendaftaran tercatat, sebagian berkas belum terunggah. */
  | { kind: 'partial'; receipt: SubmissionReceipt; missing: readonly DocumentId[]; retrying: boolean }
  | { kind: 'rejected'; message: string }
  | { kind: 'unavailable' }

export function RegistrationFormSection() {
  const [values, setValues, clearDraft] = usePersistedState<StudentValues>('ppdb-draft', EMPTY_VALUES)
  // Berkas tidak bisa disimpan sebagai draf, jadi hanya hidup selama halaman terbuka.
  const [files, setFiles] = useState<StudentFiles>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasMoved = useRef(false)

  const step = FORM_STEPS[stepIndex]
  const isFilesStep = stepIndex === FILES_STEP_INDEX
  const isReviewStep = stepIndex === REVIEW_STEP_INDEX

  // Setelah pindah langkah, fokus ke judul kartu agar pengguna keyboard dan pembaca layar tidak tertinggal.
  useEffect(() => {
    if (hasMoved.current) headingRef.current?.focus()
    hasMoved.current = true
  }, [stepIndex])

  const setError = (key: FieldName | DocumentId | 'consent', message: string | undefined) =>
    setErrors((current) => ({ ...current, [key]: message }))

  const handleChange = (name: FieldName, value: string) => {
    setValues({ ...values, [name]: value })
    // Galat hilang begitu isian benar, tanpa menunggu pengguna keluar dari kolom.
    const definition = step.fields.find((field) => field.name === name)
    if (errors[name] && definition && !validateField(definition, value)) setError(name, undefined)
  }

  const handleBlur = (name: FieldName, value: string) => {
    const definition = step.fields.find((field) => field.name === name)
    if (definition) setError(name, validateField(definition, value))
  }

  const handleFile = (id: DocumentId, file: File | undefined) => {
    setFiles((current) => ({ ...current, [id]: file }))
    const document = ADMISSION_DOCUMENTS.find((item) => item.id === id)
    if (document) setError(id, validateFile(document, file))
  }

  /** Kembalikan galat langkah ini; kosong berarti boleh lanjut. */
  const validateStep = (): Errors => {
    const found: Errors = {}
    if (isFilesStep) {
      for (const document of ADMISSION_DOCUMENTS) {
        const message = validateFile(document, files[document.id])
        if (message) found[document.id] = message
      }
    } else {
      for (const field of step.fields) {
        const message = validateField(field, values[field.name])
        if (message) found[field.name] = message
      }
    }
    return found
  }

  const goTo = (index: number) => {
    setErrors({})
    setStepIndex(index)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isReviewStep) {
      const found = validateStep()
      setErrors(found)
      if (Object.keys(found).length > 0) {
        // Fokus ke kolom pertama yang bermasalah.
        event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
        return
      }
      goTo(stepIndex + 1)
      return
    }

    if (!consent) {
      setError('consent', 'Centang persetujuan dulu.')
      event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    setSubmit({ kind: 'sending' })
    try {
      const registrationNumber = await submitRegistration(values, files)
      clearDraft()
      setSubmit({ kind: 'done', registrationNumber })
    } catch (error) {
      if (error instanceof AdmissionUploadError) {
        // Data sudah tersimpan di server; hapus draf agar tidak terkirim dua kali.
        clearDraft()
        setSubmit({ kind: 'partial', receipt: error.receipt, missing: error.missing, retrying: false })
      } else if (error instanceof AdmissionRejectedError) {
        setSubmit({ kind: 'rejected', message: error.message })
      } else if (error instanceof AdmissionUnavailableError) {
        setSubmit({ kind: 'unavailable' })
      } else {
        throw error
      }
    }
  }

  const handleRetry = async () => {
    if (submit.kind !== 'partial') return
    const { receipt, missing } = submit
    setSubmit({ kind: 'partial', receipt, missing, retrying: true })
    const stillMissing = await retryUploads(receipt, files, missing)
    setSubmit(
      stillMissing.length === 0
        ? { kind: 'done', registrationNumber: receipt.registrationNumber }
        : { kind: 'partial', receipt, missing: stillMissing, retrying: false },
    )
  }

  return (
    <Section title="Formulir online" tone="dark" id="formulir">
      <div className="md:grid md:grid-cols-[1fr_1.9fr] md:gap-10">
        <div>
          <p className="mb-2 font-bold md:hidden">
            Langkah {stepIndex + 1} dari {FORM_STEPS.length}: {step.label}
          </p>
          <div aria-hidden="true" className="mb-5 flex gap-1 md:hidden">
            {FORM_STEPS.map(({ label }, index) => (
              <span key={label} className={cn('h-1.5 flex-1', index <= stepIndex ? 'bg-accent' : 'bg-white/30')} />
            ))}
          </div>

          <ol aria-label="Langkah pendaftaran" className="hidden md:block">
            {FORM_STEPS.map(({ label }, index) => {
              const isCurrent = index === stepIndex
              const canGoBack = index < stepIndex && submit.kind !== 'done'

              return (
                <li key={label} aria-current={isCurrent ? 'step' : undefined} className="py-1.5">
                  {canGoBack ? (
                    <button type="button" onClick={() => goTo(index)} className="text-left hover:underline">
                      {index + 1}. {label}
                    </button>
                  ) : (
                    <span className={cn(isCurrent ? 'font-bold' : 'text-tint')}>
                      {index + 1}. {label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <form noValidate onSubmit={handleSubmit} className="bg-white p-5 text-ink md:p-8">
          {submit.kind === 'done' ? (
            <Receipt registrationNumber={submit.registrationNumber} />
          ) : submit.kind === 'partial' ? (
            <div role="alert">
              <h3 className="text-2xl">Pendaftaran tercatat, berkas belum lengkap</h3>
              <p className="mt-3">
                Nomor pendaftaran Anda <strong>{submit.receipt.registrationNumber}</strong>. Berkas berikut belum
                terunggah:
              </p>
              <ul className="mt-2 list-disc pl-5">
                {submit.missing.map((id) => (
                  <li key={id}>{ADMISSION_DOCUMENTS.find((document) => document.id === id)?.label ?? id}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Jangan tutup halaman ini sebelum berkas terunggah. Bila tetap gagal, catat nomor di atas lalu hubungi
                panitia.
              </p>
              <div className="mt-5">
                <Button onClick={handleRetry} disabled={submit.retrying}>
                  {submit.retrying ? 'Mengunggah…' : 'Coba unggah lagi'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 ref={headingRef} tabIndex={-1} className="mb-5 text-2xl outline-none">
                {step.title}
              </h3>

              <div className="grid gap-5">
                {step.fields.map((field) =>
                  field.kind === 'select' ? (
                    <SelectField
                      key={field.name}
                      label={field.label}
                      hint={field.hint}
                      error={errors[field.name]}
                      options={field.options ?? []}
                      value={values[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      onBlur={(event) => handleBlur(field.name, event.target.value)}
                    />
                  ) : (
                  <TextField
                    key={field.name}
                    label={field.label}
                    hint={field.hint}
                    error={errors[field.name]}
                    multiline={field.kind === 'multiline'}
                    type={field.kind === 'multiline' ? undefined : field.kind}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    onBlur={(event) => handleBlur(field.name, event.target.value)}
                  />
                  ),
                )}

                {isFilesStep &&
                  ADMISSION_DOCUMENTS.map(({ id, label, required }) => (
                    <FileField
                      key={id}
                      label={label}
                      required={required}
                      file={files[id]}
                      error={errors[id]}
                      onChange={(file) => handleFile(id, file)}
                    />
                  ))}

                {isReviewStep ? (
                  <>
                    <Review values={values} files={files} />
                    <div>
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={consent}
                          aria-invalid={errors.consent ? true : undefined}
                          onChange={(event) => {
                            setConsent(event.target.checked)
                            if (event.target.checked) setError('consent', undefined)
                          }}
                          className="mt-1 size-5 shrink-0 accent-brand"
                        />
                        <span>
                          Saya orang tua atau wali murid, dan menyetujui data serta berkas ini dipakai panitia untuk
                          proses PPDB {SITE.name}.
                        </span>
                      </label>
                      {errors.consent ? <p className="mt-1.5 text-sm font-bold text-danger">{errors.consent}</p> : null}
                    </div>
                  </>
                ) : null}
              </div>

              {submit.kind === 'rejected' && (
                <p role="alert" className="mt-5 border-l-4 border-danger bg-surface p-3.5 text-[15px]">
                  {submit.message}
                </p>
              )}

              {submit.kind === 'unavailable' && (
                <p role="alert" className="mt-5 border-l-4 border-danger bg-surface p-3.5 text-[15px]">
                  Pengiriman online belum aktif, jadi pendaftaran belum terkirim. Data Anda tetap tersimpan
                  sebagai draf di perangkat ini. Silakan hubungi panitia lewat WhatsApp.
                </p>
              )}

              {!isReviewStep && <p className="mt-5 text-sm text-muted">Draf tersimpan otomatis di perangkat ini.</p>}

              <div className="mt-5 grid gap-3 md:flex">
                <Button type="submit" disabled={submit.kind === 'sending'}>
                  {submit.kind === 'sending' ? 'Mengirim…' : step.nextLabel}
                </Button>
                {stepIndex > 0 && (
                  <Button variant="outlineDark" onClick={() => goTo(stepIndex - 1)}>
                    Kembali
                  </Button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </Section>
  )
}

function Review({ values, files }: { values: StudentValues; files: StudentFiles }) {
  const fieldRows = FORM_STEPS.flatMap(({ fields }) => fields).map(({ name, label, options }) => {
    const text = values[name].trim()
    return { label, value: (options?.find((option) => option.value === text)?.label ?? text) || '-' }
  })
  const fileRows = ADMISSION_DOCUMENTS.map(({ id, label }) => ({ label, value: files[id]?.name ?? '-' }))

  return <KeyValueList items={[...fieldRows, ...fileRows]} stackOnMobile />
}

function Receipt({ registrationNumber }: { registrationNumber: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(registrationNumber)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div id="bukti-pendaftaran" role="status">
      <p className="hidden font-bold print:block">
        {SITE.name}, PPDB {PPDB.year}. Dicetak {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}.
      </p>
      <h3 className="text-2xl">Pendaftaran terkirim</h3>
      <p className="mt-3">Simpan nomor pendaftaran ini untuk cek status:</p>
      <p className="mt-2 font-display text-3xl">{registrationNumber}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
        <Button variant="dark" size="sm" onClick={copy}>
          Salin nomor
        </Button>
        <Button variant="outlineDark" size="sm" onClick={() => window.print()}>
          Cetak bukti
        </Button>
        <span className="text-sm text-muted">{copied ? 'Nomor disalin.' : ''}</span>
      </div>
    </div>
  )
}
