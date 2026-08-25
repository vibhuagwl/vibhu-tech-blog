import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/apiClient'

/**
 * Generic fetch with AbortController — interview race-condition demo companion.
 * Prefer TanStack Query for real lists; keep this for teaching / one-offs.
 */
export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const gen = useRef(0)

  const reload = useCallback(() => {
    gen.current += 1
    const myGen = gen.current
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetcher(controller.signal)
      .then((res) => {
        if (myGen !== gen.current) return // stale
        setData(res)
      })
      .catch((e: unknown) => {
        if (myGen !== gen.current) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof ApiError ? e : new ApiError({
          code: 'UNKNOWN',
          message: e instanceof Error ? e.message : 'Error',
          status: 0,
        }))
      })
      .finally(() => {
        if (myGen === gen.current) setLoading(false)
      })

    return () => {
      controller.abort()
      gen.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => reload(), [reload])

  return { data, error, loading, reload }
}
