import { ADMIN_API_URL } from '@/config/site'
import { RejectedError, ServiceUnavailableError } from '@/lib/errors'
import {
  DEMO_CREDENTIALS,
  DEMO_ENABLED,
  endDemoSession,
  isDemoSignedIn,
  startDemoSession,
} from './demo'
import {
  demoDashboard,
  demoList,
  demoRemove,
  demoSave,
  demoSaveSettings,
  demoSetAdmission,
  demoSettings,
  demoUpdateAdmission,
} from './demoStore'
import type { Item, ResourceDef } from './resources'

export interface Credentials {
  email: string
  password: string
  /** Pertahankan sesi di perangkat ini. */
  remember: boolean
}

/** Dilempar bila server menjawab bahwa email atau kata sandi tidak cocok. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email atau kata sandi tidak cocok.')
  }
}

/**
 * Kontrak yang diharapkan: POST {ADMIN_API_URL}/auth/login (JSON) -> 2xx dan sesi dipasang server
 * lewat cookie HttpOnly (sengaja tanpa token di JavaScript); 401 bila tidak cocok.
 */
export async function signIn(credentials: Credentials): Promise<void> {
  if (DEMO_ENABLED) {
    const matches =
      credentials.email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
      credentials.password === DEMO_CREDENTIALS.password
    if (!matches) throw new InvalidCredentialsError()
    startDemoSession()
    return
  }
  if (!ADMIN_API_URL) throw new ServiceUnavailableError()

  let response: Response
  try {
    response = await fetch(`${ADMIN_API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
  } catch {
    throw new ServiceUnavailableError()
  }

  if (response.status === 401) throw new InvalidCredentialsError()
  if (!response.ok) throw new ServiceUnavailableError()
}

export interface AdminSession {
  /** Nama admin untuk bilah atas; kosong pada mode pratinjau. */
  name?: string
  /** `admin` boleh semua; `editor` hanya konten (tanpa PPDB dan Pengaturan situs). Kosong pada mode demo = admin. */
  role?: 'admin' | 'editor'
  /** True pada sesi mode demo (lihat demo.ts): data hanya contoh. */
  isDemo?: boolean
}

export interface DashboardData {
  pendingRegistrations: number
  publishedNews: number
  upcomingAgenda: number
  newMessages: number
  followUps: { pendingFiles: number; draftNews: number; undatedAgenda: number }
  admission: { open: boolean }
  activity: readonly { admin: string; action: string }[]
}

export async function adminRequest(path: string, init?: RequestInit): Promise<Response> {
  if (!ADMIN_API_URL) throw new ServiceUnavailableError()
  let response: Response
  try {
    response = await fetch(`${ADMIN_API_URL}${path}`, { credentials: 'include', ...init })
  } catch {
    throw new ServiceUnavailableError()
  }
  // Sesi habis di tengah pekerjaan: kembali ke halaman login (kecuali pemeriksaan sesi itu sendiri).
  if (response.status === 401 && path !== '/auth/me') window.location.assign('/admin/masuk')
  return response
}

/** Pesan galat dari server untuk penolakan 4xx (isian tidak sah, tidak punya akses). */
async function rejectionOf(response: Response): Promise<RejectedError | ServiceUnavailableError> {
  if (response.status >= 400 && response.status < 500 && response.status !== 401) {
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) return new RejectedError(body.error)
    } catch {
      // Badan bukan JSON.
    }
  }
  return new ServiceUnavailableError()
}

/**
 * GET {ADMIN_API_URL}/auth/me -> { name: string, role: 'admin' | 'editor' } | 401.
 * `null` berarti belum masuk.
 */
export async function fetchSession(): Promise<AdminSession | null> {
  if (DEMO_ENABLED) return isDemoSignedIn() ? { name: 'Admin Demo', role: 'admin', isDemo: true } : null
  const response = await adminRequest('/auth/me')
  if (response.status === 401) return null
  if (!response.ok) throw new ServiceUnavailableError()
  return (await response.json()) as AdminSession
}

/** POST {ADMIN_API_URL}/auth/logout -> 2xx (server menghapus cookie sesi). */
export async function signOut(): Promise<void> {
  if (DEMO_ENABLED) return endDemoSession()
  const response = await adminRequest('/auth/logout', { method: 'POST' })
  if (!response.ok) throw new ServiceUnavailableError()
}

/** GET {ADMIN_API_URL}/dashboard -> DashboardData. */
export async function fetchDashboard(): Promise<DashboardData> {
  if (DEMO_ENABLED) return demoDashboard()
  const response = await adminRequest('/dashboard')
  if (!response.ok) throw new ServiceUnavailableError()
  return (await response.json()) as DashboardData
}

/** PATCH {ADMIN_API_URL}/admission { open: boolean } -> 2xx. */
export async function setAdmissionOpen(open: boolean): Promise<void> {
  if (DEMO_ENABLED) return demoSetAdmission(open)
  const response = await adminRequest('/admission', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ open }),
  })
  if (!response.ok) throw new ServiceUnavailableError()
}

/** GET {ADMIN_API_URL}/{key} -> Item[]. */
export async function listItems(def: ResourceDef): Promise<Item[]> {
  if (DEMO_ENABLED) return demoList(def)
  const response = await adminRequest(`/${def.key}`)
  if (!response.ok) throw new ServiceUnavailableError()
  return (await response.json()) as Item[]
}

/** Baru: POST {ADMIN_API_URL}/{key} (JSON, tanpa `id`) -> Item. Ubah: PUT {ADMIN_API_URL}/{key}/{id}. */
export async function saveItem(def: ResourceDef, item: Item, isNew: boolean): Promise<void> {
  if (DEMO_ENABLED) return demoSave(def, item, isNew)
  const response = await adminRequest(isNew ? `/${def.key}` : `/${def.key}/${item.id}`, {
    method: isNew ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!response.ok) throw await rejectionOf(response)
}

/** DELETE {ADMIN_API_URL}/{key}/{id} -> 2xx. */
export async function deleteItem(def: ResourceDef, id: string): Promise<void> {
  if (DEMO_ENABLED) return demoRemove(def, id)
  const response = await adminRequest(`/${def.key}/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new ServiceUnavailableError()
}

export interface AdmissionDocumentInfo {
  docType: string
  label: string
  uploaded: boolean
  verified: boolean
  /** Tautan bertanda tangan yang kedaluwarsa dalam beberapa menit; kosong bila belum terunggah. */
  url?: string
}

export interface AdmissionDetail {
  item: Item
  documents: readonly AdmissionDocumentInfo[]
  /** Nama, tanggal lahir, dan WhatsApp wali sama dengan pendaftar lain di periode yang sama. */
  possibleDuplicate: boolean
}

/** GET {ADMIN_API_URL}/admission/{id} -> AdmissionDetail. Mode demo: tanpa berkas. */
export async function fetchAdmissionDetail(item: Item): Promise<AdmissionDetail> {
  if (DEMO_ENABLED) return { item, documents: [], possibleDuplicate: false }
  const response = await adminRequest(`/admission/${item.id}`)
  if (!response.ok) throw new ServiceUnavailableError()
  return (await response.json()) as AdmissionDetail
}

/** PUT {ADMIN_API_URL}/admission/{id} { status, statusNote } -> 2xx. Hanya peran admin. */
export async function saveAdmissionDecision(id: string, decision: { status: string; statusNote: string }): Promise<void> {
  if (DEMO_ENABLED) return demoUpdateAdmission(id, decision)
  const response = await adminRequest(`/admission/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  })
  if (!response.ok) throw await rejectionOf(response)
}

/** PATCH {ADMIN_API_URL}/admission/{id}/documents/{docType} { verified } -> 2xx. */
export async function setDocumentVerified(id: string, docType: string, verified: boolean): Promise<void> {
  if (DEMO_ENABLED) return
  const response = await adminRequest(`/admission/${id}/documents/${docType}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified }),
  })
  if (!response.ok) throw await rejectionOf(response)
}

/** Pengaturan situs: kunci berpola `kelompok.nama` (lihat settings.ts), nilai teks. */
export type Settings = Record<string, string>

/** GET {ADMIN_API_URL}/settings -> Settings. */
export async function fetchSettings(): Promise<Settings> {
  if (DEMO_ENABLED) return demoSettings()
  const response = await adminRequest('/settings')
  if (!response.ok) throw new ServiceUnavailableError()
  return (await response.json()) as Settings
}

/** PUT {ADMIN_API_URL}/settings (Settings) -> 2xx. Hanya peran admin. */
export async function saveSettings(values: Settings): Promise<void> {
  if (DEMO_ENABLED) return demoSaveSettings(values)
  const response = await adminRequest('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!response.ok) throw await rejectionOf(response)
}
