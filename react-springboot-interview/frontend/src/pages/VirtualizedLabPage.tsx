import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type Row = { id: number; ref: string; amount: number; status: string }

function buildRows(n: number): Row[] {
  const statuses = ['SUCCESS', 'PENDING', 'FAILED', 'PROCESSING']
  const rows: Row[] = []
  for (let i = 0; i < n; i++) {
    rows.push({
      id: i,
      ref: `PAY-${String(i).padStart(6, '0')}`,
      amount: Math.round((Math.random() * 500 + 1) * 100) / 100,
      status: statuses[i % statuses.length]!,
    })
  }
  return rows
}

/** 10k-row virtualization — only ~visible DOM nodes exist. */
export function VirtualizedLabPage() {
  const parentRef = useRef<HTMLDivElement>(null)
  const [count] = useState(10_000)
  const rows = useMemo(() => buildRows(count), [count])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  })

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Virtualized table lab</h1>
          <p className="muted">
            {count.toLocaleString()} rows via @tanstack/react-virtual — scroll
            without melting the main thread
          </p>
        </div>
      </header>

      <div className="virtual-meta muted">
        Mounted rows: {virtualizer.getVirtualItems().length} / {rows.length}
      </div>

      <div ref={parentRef} className="virtual-scroll">
        <div
          className="virtual-inner"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((vRow) => {
            const row = rows[vRow.index]!
            return (
              <div
                key={row.id}
                className="virtual-row"
                style={{
                  transform: `translateY(${vRow.start}px)`,
                  height: `${vRow.size}px`,
                }}
              >
                <span>{row.ref}</span>
                <span>${row.amount.toFixed(2)}</span>
                <span>{row.status}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
