import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    )
    expect(result.current).toBe('a')
    rerender({ value: 'ab' })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('ab')
  })
})
