'use client';

import {useState} from 'react';

type Mode = 'CP' | 'AP';

type LogLine = {tone: 'ok' | 'warn' | 'err' | 'info'; text: string};

const START = 1000;
const WITHDRAW = 800;

export default function PartitionSimulator() {
  const [connected, setConnected] = useState(true);
  const [mode, setMode] = useState<Mode>('CP');
  const [balA, setBalA] = useState(START);
  const [balB, setBalB] = useState(START);
  const [log, setLog] = useState<LogLine[]>([
    {tone: 'info', text: 'Both nodes healthy. Balances synced at ₹1000.'},
  ]);
  const [lastResult, setLastResult] = useState<{
    title: string;
    detail: string;
    flags: {c: boolean; a: boolean; p: boolean};
  } | null>(null);

  const push = (line: LogLine) => setLog((prev) => [...prev.slice(-8), line]);

  const reset = () => {
    setConnected(true);
    setBalA(START);
    setBalB(START);
    setLastResult(null);
    setLog([{tone: 'info', text: 'Reset. Network connected. Balances ₹1000 / ₹1000.'}]);
  };

  const toggleNetwork = () => {
    if (connected) {
      setConnected(false);
      push({tone: 'warn', text: 'Network BROKEN between Node A (Bangalore) and Node B (Mumbai).'});
      setLastResult(null);
    } else {
      setConnected(true);
      // heal: sync B toward A (teaching model — last-writer on A wins)
      setBalB(balA);
      push({
        tone: 'ok',
        text: `Network restored. Replicated → Node A = Node B = ₹${balA}.`,
      });
      setLastResult({
        title: 'Partition healed',
        detail: `Anti-entropy synced balances to ₹${balA}.`,
        flags: {c: true, a: true, p: true},
      });
    }
  };

  const withdrawOnA = () => {
    if (balA < WITHDRAW) {
      push({tone: 'err', text: 'Insufficient funds on Node A.'});
      return;
    }

    if (connected) {
      const next = balA - WITHDRAW;
      setBalA(next);
      setBalB(next);
      push({tone: 'ok', text: `Healthy path: withdrew ₹${WITHDRAW}. Both nodes = ₹${next}.`});
      setLastResult({
        title: 'Request accepted (healthy)',
        detail: 'Replication succeeded. Strong agreement.',
        flags: {c: true, a: true, p: true},
      });
      return;
    }

    if (mode === 'CP') {
      push({
        tone: 'err',
        text: 'CP: rejected withdraw — cannot guarantee consistency with Node B.',
      });
      setLastResult({
        title: 'Request rejected (CP)',
        detail: '503-style: Correct data preferred over a maybe-wrong debit.',
        flags: {c: true, a: false, p: true},
      });
      return;
    }

    // AP
    const nextA = balA - WITHDRAW;
    setBalA(nextA);
    push({
      tone: 'warn',
      text: `AP: accepted on Node A → ₹${nextA}. Node B still ₹${balB} (stale).`,
    });
    setLastResult({
      title: 'Request accepted (AP)',
      detail: 'Temporary inconsistency. After heal, Node B catches up.',
      flags: {c: false, a: true, p: true},
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500">
          CAP Theorem Simulator
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Break the network, pick CP or AP, withdraw ₹{WITHDRAW} on Node A — watch the engineering fork.
        </p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Network:</span>
            <span
              className={`rounded-md px-2 py-1 text-xs font-bold ${
                connected
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
              }`}
            >
              {connected ? 'CONNECTED' : 'PARTITIONED'}
            </span>
            <button
              type="button"
              onClick={toggleNetwork}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {connected ? 'Break network' : 'Restore network'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              Reset
            </button>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Mode</p>
            <div className="mt-2 flex gap-2">
              {(['CP', 'AP'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    mode === m
                      ? m === 'CP'
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {mode === 'CP'
                ? 'CP: reject if peers unreachable — stay correct.'
                : 'AP: accept locally — may be temporarily stale.'}
            </p>
          </div>

          <button
            type="button"
            onClick={withdrawOnA}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Withdraw ₹{WITHDRAW} on Node A
          </button>

          <div className="grid grid-cols-2 gap-3">
            <NodeCard
              name="Node A · Bangalore"
              balance={balA}
              side="left"
              partitioned={!connected}
            />
            <NodeCard
              name="Node B · Mumbai"
              balance={balB}
              side="right"
              partitioned={!connected}
            />
          </div>

          {!connected && (
            <p className="text-center text-xs font-semibold tracking-wide text-rose-700 dark:text-rose-300">
              ❌ network partition — A cannot talk to B
            </p>
          )}
        </div>

        <div className="space-y-3">
          {lastResult && (
            <div
              className={`rounded-xl border p-4 ${
                lastResult.flags.a === false
                  ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40'
                  : lastResult.flags.c === false
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
                    : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
              }`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">{lastResult.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {lastResult.detail}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <Flag ok={lastResult.flags.c} label="C Consistency" />
                <Flag ok={lastResult.flags.a} label="A Availability" />
                <Flag ok={lastResult.flags.p} label="P Partition tol." />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500">Event log</p>
            <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto font-mono text-[11px] leading-5">
              {log.map((l, i) => (
                <li
                  key={`${i}-${l.text}`}
                  className={
                    l.tone === 'err'
                      ? 'text-rose-700 dark:text-rose-300'
                      : l.tone === 'warn'
                        ? 'text-amber-800 dark:text-amber-200'
                        : l.tone === 'ok'
                          ? 'text-emerald-800 dark:text-emerald-200'
                          : 'text-slate-600 dark:text-slate-400'
                  }
                >
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeCard({
  name,
  balance,
  side,
  partitioned,
}: {
  name: string;
  balance: number;
  side: 'left' | 'right';
  partitioned: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        partitioned
          ? 'border-dashed border-rose-300 dark:border-rose-800'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{name}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">₹{balance}</p>
      {partitioned && side === 'left' && (
        <p className="mt-1 text-[10px] text-slate-500">May accept (AP) or reject (CP)</p>
      )}
      {partitioned && side === 'right' && (
        <p className="mt-1 text-[10px] text-slate-500">May serve stale reads (AP)</p>
      )}
    </div>
  );
}

function Flag({ok, label}: {ok: boolean; label: string}) {
  return (
    <span
      className={`rounded-md px-2 py-1 ${
        ok
          ? 'bg-emerald-200/80 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100'
          : 'bg-slate-200/80 text-slate-600 line-through dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {ok ? '✅' : '❌'} {label}
    </span>
  );
}
