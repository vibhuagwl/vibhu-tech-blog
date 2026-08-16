'use client';

import {
  API_COVERAGE,
  API_COVERAGE_GROUPS,
  COVERAGE_LEGEND,
  coverageScore,
  coverageSummary,
  type ApiCoverageRow,
} from '@/lib/java-streams/api-coverage';

function Flag({ok, label}: {ok: boolean; label: string}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
        ok
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600'
      }`}
      title={label}
    >
      {ok ? '✅' : '○'} {label}
    </span>
  );
}

function Row({row}: {row: ApiCoverageRow}) {
  const score = coverageScore(row);
  return (
    <tr className="border-t border-slate-100 align-top dark:border-slate-800">
      <td className="py-2.5 pr-3 font-mono text-[12px] font-semibold text-slate-900 dark:text-slate-100">
        {row.api}
        <div className="mt-0.5 font-sans text-[10px] font-normal text-slate-400">Java {row.since}</div>
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex flex-wrap gap-1">
          <Flag ok={row.flags.program} label="program" />
          <Flag ok={row.flags.edgeCase} label="edge" />
          <Flag ok={row.flags.interview} label="interview" />
          <Flag ok={row.flags.performance} label="perf" />
        </div>
        {row.notes && <p className="mt-1 text-[11px] leading-4 text-slate-500">{row.notes}</p>}
      </td>
      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-500">
        {row.problemIds.length ? row.problemIds.join(', ') : '—'}
      </td>
      <td className="py-2.5 text-right text-[12px] font-semibold text-slate-700 dark:text-slate-300">
        {score}/4
      </td>
    </tr>
  );
}

export default function ApiCoverageChecklist() {
  const summary = coverageSummary();
  return (
    <div className="space-y-6">
      <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-5 text-slate-100 dark:border-slate-800">
        {COVERAGE_LEGEND}
      </pre>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
        <strong className="text-slate-900 dark:text-white">
          {summary.full}/{summary.total}
        </strong>{' '}
        APIs at full 4/4 coverage ·{' '}
        <strong className="text-slate-900 dark:text-white">{summary.withProgram}</strong> with a dedicated
        program · {summary.pctFull}% complete for Staff/Principal interview readiness.
      </p>
      {API_COVERAGE_GROUPS.map((group) => {
        const rows = API_COVERAGE.filter((r) => r.group === group);
        return (
          <div key={group}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group}</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
                    <th className="px-3 py-2 font-semibold">API</th>
                    <th className="px-3 py-2 font-semibold">Coverage</th>
                    <th className="px-3 py-2 font-semibold">Problem IDs</th>
                    <th className="px-3 py-2 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody className="px-3">
                  {rows.map((row) => (
                    <Row key={row.api} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
