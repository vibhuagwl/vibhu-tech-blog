import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function usePagination(defaultSize = 20) {
  const [params, setParams] = useSearchParams()

  const page = Number.parseInt(params.get('page') ?? '0', 10) || 0
  const size =
    Number.parseInt(params.get('size') ?? String(defaultSize), 10) ||
    defaultSize

  const setPage = useCallback(
    (next: number) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('page', String(Math.max(0, next)))
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setSize = useCallback(
    (next: number) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('size', String(next))
          p.set('page', '0')
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return useMemo(
    () => ({ page, size, setPage, setSize }),
    [page, size, setPage, setSize],
  )
}
