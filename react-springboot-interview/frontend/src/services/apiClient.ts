import type { ApiErrorBody } from '../types/payment'

/**
 * Lab-only JWT storage.
 * Production: prefer HttpOnly Secure cookies set by Spring Security —
 * JS-readable tokens in localStorage are XSS-stealable.
 */
const TOKEN_KEY = 'poi_token'

const DEFAULT_TIMEOUT_MS = 15_000

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly traceId?: string
  readonly retryAfterSeconds?: number

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.status = body.status
    this.traceId = body.traceId
    this.retryAfterSeconds = body.retryAfterSeconds
  }

  toJSON(): ApiErrorBody {
    return {
      code: this.code,
      message: this.message,
      traceId: this.traceId,
      status: this.status,
      retryAfterSeconds: this.retryAfterSeconds,
    }
  }
}

function baseUrl(): string {
  return import.meta.env.VITE_API_URL || ''
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 429:
      return 'RATE_LIMITED'
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR'
    default:
      return 'HTTP_ERROR'
  }
}

function mapStatusToMessage(status: number, retryAfter?: number): string {
  switch (status) {
    case 401:
      return 'Session expired — please sign in again.'
    case 403:
      return 'You do not have permission for this action.'
    case 429: {
      const hint =
        retryAfter != null
          ? ` Retry after ${retryAfter}s.`
          : ''
      return `Too many requests.${hint}`
    }
    case 500:
    case 502:
    case 503:
      return 'Upstream service error. Check Spring logs with the trace id.'
    default:
      return `Request failed (${status}).`
  }
}

/** Exported for unit tests — maps Response (+ optional body) → ApiErrorBody */
export function mapHttpError(
  status: number,
  headers: Headers,
  bodyText: string,
): ApiErrorBody {
  const traceId = headers.get('X-Trace-Id') ?? undefined
  const retryRaw = headers.get('Retry-After')
  const retryAfterSeconds = retryRaw ? Number.parseInt(retryRaw, 10) : undefined
  const retry =
    retryAfterSeconds != null && !Number.isNaN(retryAfterSeconds)
      ? retryAfterSeconds
      : undefined

  let parsed: Partial<ApiErrorBody> = {}
  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText) as Partial<ApiErrorBody>
    } catch {
      /* non-JSON body — use status defaults */
    }
  }

  return {
    code: parsed.code ?? mapStatusToCode(status),
    message:
      parsed.message ?? mapStatusToMessage(status, retry),
    traceId: parsed.traceId ?? traceId,
    status,
    retryAfterSeconds: parsed.retryAfterSeconds ?? retry,
  }
}

export type RequestOptions = {
  method?: string
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
  headers?: Record<string, string>
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: extra = {},
  } = options

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)

  const token = getStoredToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extra,
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const text = await res.text()

    if (!res.ok) {
      const errBody = mapHttpError(res.status, res.headers, text)
      if (res.status === 401) {
        setStoredToken(null)
      }
      throw new ApiError(errBody)
    }

    if (!text) return undefined as T
    return JSON.parse(text) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError({
        code: 'TIMEOUT',
        message: 'Request timed out or was cancelled.',
        status: 0,
      })
    }
    throw new ApiError({
      code: 'NETWORK',
      message: e instanceof Error ? e.message : 'Network error',
      status: 0,
    })
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', onAbort)
  }
}
