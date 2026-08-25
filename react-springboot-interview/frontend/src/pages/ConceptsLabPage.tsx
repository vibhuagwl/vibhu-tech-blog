import {
  memo,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from 'react'

/** Live demos of React interview traps — keep tiny and readable. */
export function ConceptsLabPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>React concepts lab</h1>
          <p className="muted">
            Functional updates · stale closures · AbortController · transitions
            · deferred values · memo
          </p>
        </div>
      </header>

      <div className="lab-grid">
        <FunctionalUpdateDemo />
        <StaleClosureDemo />
        <AbortRaceDemo />
        <TransitionDemo />
        <DeferredValueDemo />
        <MemoDemo />
      </div>
    </div>
  )
}

function LabCard({
  title,
  tip,
  children,
}: {
  title: string
  tip: string
  children: ReactNode
}) {
  return (
    <section className="panel lab-card">
      <h2>{title}</h2>
      <p className="muted tip">{tip}</p>
      {children}
    </section>
  )
}

function FunctionalUpdateDemo() {
  const [count, setCount] = useState(0)
  return (
    <LabCard
      title="useState functional update"
      tip="setCount(c => c + 1) reads the latest state — required when batching multiple updates."
    >
      <p>
        Count: <strong>{count}</strong>
      </p>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            // Broken if you use setCount(count + 1) three times in one handler
            setCount((c) => c + 1)
            setCount((c) => c + 1)
            setCount((c) => c + 1)
          }}
        >
          +3 (functional)
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCount(0)}
        >
          Reset
        </button>
      </div>
    </LabCard>
  )
}

function StaleClosureDemo() {
  const [n, setN] = useState(0)
  const latest = useRef(n)
  latest.current = n

  useEffect(() => {
    const id = window.setInterval(() => {
      // Stale: setN(n + 1) would freeze at first render's n
      // Fresh: read ref or use functional update
      setN(latest.current + 1)
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <LabCard
      title="Stale closure"
      tip="Effects capture props/state from the render that created them. Use refs or functional updates."
    >
      <p>
        Auto-increment (2s): <strong>{n}</strong>
      </p>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setN((x) => x + 10)}
      >
        Jump +10
      </button>
    </LabCard>
  )
}

function AbortRaceDemo() {
  const [query, setQuery] = useState('pay')
  const [result, setResult] = useState<string>('—')
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const started = query
    setLog((L) => [`fetch start: ${started}`, ...L].slice(0, 5))

    const timer = window.setTimeout(async () => {
      try {
        // Fake latency — slower for shorter queries to force races
        await new Promise((r, rej) => {
          const t = window.setTimeout(r, 400 + (3 - started.length) * 300)
          controller.signal.addEventListener('abort', () => {
            window.clearTimeout(t)
            rej(new DOMException('Aborted', 'AbortError'))
          })
        })
        if (controller.signal.aborted) return
        setResult(`Results for “${started}”`)
        setLog((L) => [`commit: ${started}`, ...L].slice(0, 5))
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          setLog((L) => [`aborted: ${started}`, ...L].slice(0, 5))
        }
      }
    }, 0)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  return (
    <LabCard
      title="AbortController race"
      tip="Cancel in-flight work on dep change so a slow older response cannot overwrite a newer one."
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to race…"
      />
      <p>
        Shown: <strong>{result}</strong>
      </p>
      <ul className="mini-log">
        {log.map((line, i) => (
          <li key={`${line}-${i}`}>{line}</li>
        ))}
      </ul>
    </LabCard>
  )
}

function TransitionDemo() {
  const [input, setInput] = useState('')
  const [list, setList] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInput(v) // urgent — keep input snappy
    startTransition(() => {
      const next: string[] = []
      for (let i = 0; i < 8_000; i++) next.push(`${v}-${i}`)
      setList(next)
    })
  }

  return (
    <LabCard
      title="useTransition"
      tip="Mark heavy renders as non-urgent so typing stays responsive (isPending = true while deferred)."
    >
      <input value={input} onChange={onChange} placeholder="Filter…" />
      {isPending && <p className="muted">Rendering list…</p>}
      <p className="muted">{list.length} items (showing 5)</p>
      <ul className="mini-log">
        {list.slice(0, 5).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </LabCard>
  )
}

function DeferredValueDemo() {
  const [text, setText] = useState('')
  const deferred = useDeferredValue(text)
  const stale = deferred !== text

  const items = useMemoHeavy(deferred)

  return (
    <LabCard
      title="useDeferredValue"
      tip="Defer derived work from a fast-changing value — sibling pattern to useTransition."
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type…"
      />
      <p className={stale ? 'muted' : ''}>
        Deferred: <strong>{deferred || '∅'}</strong>
        {stale ? ' (catching up)' : ''}
      </p>
      <p className="muted">Derived count: {items}</p>
    </LabCard>
  )
}

function useMemoHeavy(seed: string) {
  let n = 0
  for (let i = 0; i < 20_000; i++) n += (seed + i).length
  return n
}

const ExpensiveRow = memo(function ExpensiveRow({
  label,
  tick,
}: {
  label: string
  tick: number
}) {
  const renders = useRef(0)
  renders.current += 1
  return (
    <div className="memo-row">
      {label} · tick {tick} · renders {renders.current}
    </div>
  )
})

function MemoDemo() {
  const [tick, setTick] = useState(0)
  const [noise, setNoise] = useState(0)

  return (
    <LabCard
      title="React.memo"
      tip="memo skips re-render when props are shallow-equal — parent noise should not re-render the child."
    >
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setTick((t) => t + 1)}
        >
          Bump tick (prop)
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setNoise((n) => n + 1)}
        >
          Parent noise ({noise})
        </button>
      </div>
      <ExpensiveRow label="memo child" tick={tick} />
    </LabCard>
  )
}
