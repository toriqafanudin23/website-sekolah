import { useEffect, useState } from 'react'
import { API_URL } from '@/config/site'
import { NotFoundError, ServiceUnavailableError } from '@/lib/errors'

/** Permintaan GET yang sama dari beberapa komponen berbagi satu fetch (deduplikasi). Kegagalan tidak disimpan. */
const requests = new Map<string, Promise<unknown>>()

export function fetchPublic<T>(path: string): Promise<T> {
  if (!API_URL) return Promise.reject(new ServiceUnavailableError())

  let request = requests.get(path) as Promise<T> | undefined
  if (!request) {
    request = fetch(`${API_URL}${path}`)
      .then((response) => {
        if (response.status === 404) throw new NotFoundError()
        if (!response.ok) throw new ServiceUnavailableError()
        return response.json() as Promise<T>
      })
      .catch((error: unknown) => {
        requests.delete(path)
        throw error instanceof NotFoundError ? error : new ServiceUnavailableError()
      })
    requests.set(path, request)
  }
  return request
}

export type Remote<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; data: T }
  | { kind: 'missing' }
  | { kind: 'unavailable' }

/**
 * Memuat data publik dari API. `unavailable` berarti API belum dikonfigurasi atau gagal: pemanggil
 * memakai data statis di `content.ts` sebagai cadangan. Hasil milik `path` lain tidak pernah dipakai
 * (state turunan saat render, tanpa effect untuk mereset).
 */
export function useRemote<T>(path: string): Remote<T> {
  const [settled, setSettled] = useState<{ path: string; result: Remote<T> }>()

  useEffect(() => {
    if (!API_URL) return
    let cancelled = false
    fetchPublic<T>(path).then(
      (data) => {
        if (!cancelled) setSettled({ path, result: { kind: 'ready', data } })
      },
      (error: unknown) => {
        if (cancelled) return
        const result: Remote<T> = error instanceof NotFoundError ? { kind: 'missing' } : { kind: 'unavailable' }
        setSettled({ path, result })
      },
    )
    return () => {
      cancelled = true
    }
  }, [path])

  if (!API_URL) return { kind: 'unavailable' }
  return settled?.path === path ? settled.result : { kind: 'loading' }
}

/**
 * Data yang dipakai tampilan: hasil API bila siap, `fallback` (data statis di `content.ts`) bila API belum
 * aktif atau gagal, dan `undefined` selama masih memuat. API yang aktif dan menjawab daftar kosong tetap
 * dianggap siap, sehingga isi placeholder tidak muncul di situs sungguhan.
 */
export function remoteOr<T, U>(remote: Remote<T>, fromApi: (data: T) => U, fallback: U): U | undefined {
  if (remote.kind === 'loading') return undefined
  return remote.kind === 'ready' ? fromApi(remote.data) : fallback
}
