import { useEffect, useRef, useState } from 'react'
import type { PaymentEvent } from '../types/payment'
import { getStoredToken } from '../services/apiClient'

/**
 * SSE payment events — mirrors Spring SseEmitter / WebFlux Flux.
 * Falls back silently if backend has no /api/payments/events stream.
 */
export function usePaymentEvents(enabled = true) {
  const [lastEvent, setLastEvent] = useState<PaymentEvent | null>(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled) return

    const base = import.meta.env.VITE_API_URL || ''
    const token = getStoredToken()
    // EventSource cannot set Authorization headers — token query is lab-only.
    const url = `${base}/api/payments/events${token ? `?access_token=${encodeURIComponent(token)}` : ''}`

    let es: EventSource
    try {
      es = new EventSource(url)
    } catch {
      return
    }
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => {
      setConnected(false)
      es.close()
    }
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as PaymentEvent
        setLastEvent(data)
      } catch {
        /* ignore malformed */
      }
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
  }, [enabled])

  return { lastEvent, connected }
}
