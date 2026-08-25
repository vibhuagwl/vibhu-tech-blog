import { describe, expect, it } from 'vitest'
import { mapHttpError } from '../services/apiClient'

describe('mapHttpError', () => {
  it('maps 401', () => {
    const body = mapHttpError(401, new Headers(), '')
    expect(body.code).toBe('UNAUTHORIZED')
    expect(body.status).toBe(401)
  })

  it('maps 429 with Retry-After', () => {
    const headers = new Headers({ 'Retry-After': '30', 'X-Trace-Id': 'abc-123' })
    const body = mapHttpError(429, headers, '')
    expect(body.code).toBe('RATE_LIMITED')
    expect(body.retryAfterSeconds).toBe(30)
    expect(body.traceId).toBe('abc-123')
    expect(body.message).toContain('30')
  })

  it('prefers JSON body message', () => {
    const body = mapHttpError(
      500,
      new Headers(),
      JSON.stringify({ code: 'DB_DOWN', message: 'Aurora unreachable' }),
    )
    expect(body.code).toBe('DB_DOWN')
    expect(body.message).toBe('Aurora unreachable')
  })
})
