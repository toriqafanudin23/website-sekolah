/** Dilempar bila backend belum dikonfigurasi atau tidak bisa dihubungi. UI menampilkan pesan "belum aktif". */
export class ServiceUnavailableError extends Error {
  constructor() {
    super('Layanan belum aktif.')
  }
}

/** Server menolak isian (HTTP 4xx selain 401 dan 429). `message` sudah berbahasa Indonesia dan aman ditampilkan. */
export class RejectedError extends Error {}

/** Data yang diminta tidak ada (HTTP 404). */
export class NotFoundError extends Error {
  constructor() {
    super('Tidak ditemukan.')
  }
}
