import { ADMISSION_API_URL } from '@/config/site'
import type { DocumentId, FieldName } from './content'

/** Dilempar bila `ADMISSION_API_URL` belum diisi atau server tidak bisa dihubungi. */
export class AdmissionUnavailableError extends Error {
  constructor() {
    super('Layanan pendaftaran belum aktif.')
  }
}

/** Server menolak pendaftaran dengan alasan yang aman ditampilkan (mis. pendaftaran belum dibuka). */
export class AdmissionRejectedError extends Error {}

/** Pendaftaran sudah tercatat, tetapi sebagian berkas belum terunggah; bisa dicoba lagi dengan `retryUploads`. */
export class AdmissionUploadError extends Error {
  readonly receipt: SubmissionReceipt
  readonly missing: readonly DocumentId[]

  constructor(receipt: SubmissionReceipt, missing: readonly DocumentId[]) {
    super('Sebagian berkas belum terunggah.')
    this.receipt = receipt
    this.missing = missing
  }
}

export type StudentValues = Record<FieldName, string>
export type StudentFiles = Partial<Record<DocumentId, File>>

export interface SubmissionReceipt {
  registrationNumber: string
  /** Kunci sekali pakai untuk mengunggah berkas pendaftaran ini; hanya hidup selama halaman terbuka. */
  uploadToken: string
}

export interface StatusResult {
  /** Mis. "Diverifikasi", "Diterima". Teks apa adanya dari panitia. */
  status: string
  note?: string
}

/**
 * Kontrak API (repo API (sdn1kembaran-api): src/routes/admission.js). Berkas diunggah satu per satu karena fungsi Vercel
 * menolak badan permintaan di atas 4,5 MB, sedangkan lima berkas bisa mencapai 10 MB.
 *   POST {API}/registrations                          JSON  -> 201 { registrationNumber, uploadToken }
 *   PUT  {API}/registrations/:nomor/documents/:jenis  berkas mentah + header x-upload-token -> 204
 *   POST {API}/registrations/:nomor/complete          header x-upload-token -> { missing: DocumentId[] }
 *   GET  {API}/registrations/:nomor                   -> { status, note? } | 404
 */
async function request(path: string, init?: RequestInit): Promise<Response> {
  if (!ADMISSION_API_URL) throw new AdmissionUnavailableError()
  try {
    return await fetch(`${ADMISSION_API_URL}${path}`, init)
  } catch {
    throw new AdmissionUnavailableError()
  }
}

async function rejectionOf(response: Response): Promise<AdmissionRejectedError | AdmissionUnavailableError> {
  if (response.status >= 400 && response.status < 500 && response.status !== 429) {
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) return new AdmissionRejectedError(body.error)
    } catch {
      // Badan bukan JSON: perlakukan sebagai layanan tidak tersedia.
    }
  }
  return new AdmissionUnavailableError()
}

async function createRegistration(values: StudentValues, files: StudentFiles): Promise<SubmissionReceipt> {
  const trimmed = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value.trim()]))
  const fileMeta = Object.entries(files).flatMap(([docType, file]) =>
    file ? [{ docType, mimeType: file.type, size: file.size }] : [],
  )

  const response = await request('/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...trimmed, consent: true, files: fileMeta }),
  })
  if (!response.ok) throw await rejectionOf(response)
  return (await response.json()) as SubmissionReceipt
}

/** Unggah berkas secara paralel, lalu minta server memeriksa mana yang masih kurang. */
async function sendFiles(
  receipt: SubmissionReceipt,
  files: StudentFiles,
  only?: readonly DocumentId[],
): Promise<DocumentId[]> {
  const entries = (Object.entries(files) as [DocumentId, File | undefined][]).filter(
    (entry): entry is [DocumentId, File] => Boolean(entry[1]) && (!only || only.includes(entry[0])),
  )
  const base = `/registrations/${encodeURIComponent(receipt.registrationNumber)}`
  const headers = { 'x-upload-token': receipt.uploadToken }

  await Promise.all(
    entries.map(async ([id, file]) => {
      try {
        await request(`${base}/documents/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': file.type },
          body: file,
        })
      } catch {
        // Kegagalan tercermin pada daftar `missing` dari server di bawah.
      }
    }),
  )

  try {
    const response = await request(`${base}/complete`, { method: 'POST', headers })
    if (!response.ok) throw new AdmissionUnavailableError()
    return ((await response.json()) as { missing: DocumentId[] }).missing
  } catch {
    // Tidak bisa memastikan: anggap semua yang dikirim belum terunggah agar pengguna bisa mencoba lagi.
    return entries.map(([id]) => id)
  }
}

/** Mengembalikan nomor pendaftaran. Melempar `AdmissionUploadError` bila ada berkas yang belum masuk. */
export async function submitRegistration(values: StudentValues, files: StudentFiles): Promise<string> {
  const receipt = await createRegistration(values, files)
  const missing = await sendFiles(receipt, files)
  if (missing.length > 0) throw new AdmissionUploadError(receipt, missing)
  return receipt.registrationNumber
}

/** Mengulang unggahan hanya untuk berkas yang belum masuk. Mengembalikan berkas yang masih kurang. */
export function retryUploads(
  receipt: SubmissionReceipt,
  files: StudentFiles,
  missing: readonly DocumentId[],
): Promise<DocumentId[]> {
  return sendFiles(receipt, files, missing)
}

/** `null` bila nomor tidak ditemukan. */
export async function fetchStatus(registrationNumber: string): Promise<StatusResult | null> {
  const response = await request(`/registrations/${encodeURIComponent(registrationNumber.trim())}`)
  if (response.status === 404) return null
  if (!response.ok) throw new AdmissionUnavailableError()
  return (await response.json()) as StatusResult
}
