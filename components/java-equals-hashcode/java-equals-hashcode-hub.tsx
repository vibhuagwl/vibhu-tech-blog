'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
import {
  CHM_ATOMICS,
  CHEAT_SHEET,
  COMPARATOR_CORNERS,
  CORE_ROWS,
  ENUM_CODE,
  EQ_VS_CMP,
  EXERCISES,
  FAILURES,
  HASHMAP_LOOKUP,
  HASHTABLE_NOTE,
  IDENTITY_CODE,
  LRU_CODE,
  PERF_ROWS,
  RECORD_CODE,
  SKIPLIST_NOTE,
  TREEMAP_CODE,
  USE_CASES,
} from '@/lib/java-equals-hashcode/advanced';
import {COMBOS, CONTRACT_RULES, MAP_COMPARE, QUICK_FACTS} from '@/lib/java-equals-hashcode/combos';
import {EQHC_TOC} from '@/lib/java-equals-hashcode/toc';
import CodePanel from './code-panel';
import InterviewMode from './interview-mode';
import StickyToc from './sticky-toc';

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-3xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">{title}</h2>
      {lead && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniTable({headers, rows}: {headers: string[]; rows: string[][]}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 uppercase tracking-[.08em] text-slate-500 dark:bg-slate-900">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200 dark:border-slate-800">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 align-top ${i === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function JavaEqualsHashcodeHub() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Senior · Lead · Java 21 · Custom objects as Map keys
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          Custom Objects as Keys — Complete Collections Lab
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          HashMap, ConcurrentHashMap, LinkedHashMap, TreeMap, Hashtable, ConcurrentSkipListMap — plus
          IdentityHashMap, EnumMap, records, mutable-key failures, Comparators, exercises, and interview
          drills. OpenJDK-verified combo matrix included.
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          Hash maps: hashCode → bucket → equals. Sorted maps: compareTo/Comparator (hashCode unused for
          placement). compare==0 must agree with equals — or TreeMap/SkipList silently drop keys.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          <Link href="/java-compiler" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Compiler
          </Link>
          {' · '}
          <Link href="/complexity/hashmap-hashset-complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            HashMap complexity
          </Link>
          {' · '}
          <Link href="/java-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Locking
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={EQHC_TOC} />
        <div className="min-w-0 space-y-16">
          <Section id="overview" title="00. Overview" lead="Interview-grade map of every structure that accepts a custom key.">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart TB
  key[Custom key object] --> hm[HashMap / LHM / CHM / Hashtable]
  key --> sorted[TreeMap / ConcurrentSkipListMap]
  key --> special[IdentityHashMap / EnumMap]
  hm --> he[hashCode + equals]
  sorted --> cmp[compareTo / Comparator]
  special --> id[== or ordinal]`}
              />
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {QUICK_FACTS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Section>

          <Section id="core" title="01. Core concepts" lead="How maps locate keys — hashing vs ordering.">
            <MiniTable headers={['Concept', 'Role', 'Rule']} rows={CORE_ROWS} />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Mutable keys: if a field used in hashCode/equals/compare changes after put, the entry can be
              lost or the tree corrupted. Prefer final fields or records.
            </p>
          </Section>

          <Section id="contract" title="02. equals / hashCode contract">
            <MiniTable headers={['Rule', 'Meaning']} rows={CONTRACT_RULES} />
            <div className="mt-4">
              <CodePanel
                title="Canonical key"
                tone="ok"
                code={`public final class Employee {
  private final String name;
  public Employee(String name) { this.name = name; }
  @Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    return Objects.equals(name, ((Employee) o).name);
  }
  @Override public int hashCode() { return Objects.hashCode(name); }
}
// Prefer: public record Employee(String name) {}`}
              />
            </div>
          </Section>

          <Section
            id="combos"
            title="03. All equals × hashCode combinations"
            lead="Classic interview experiment: put(a), put(b), put(a), get(new a) — verified on four maps."
          >
            <div className="space-y-8">
              {COMBOS.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{c.title}</h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        c.contractOk
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      }`}
                    >
                      {c.contractOk ? 'Contract OK' : 'Contract broken'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    hashCode: {c.hashCode} · equals: {c.equals}
                  </p>
                  <div className="mt-4">
                    <MiniTable
                      headers={['Map', 'size', 'get(a)', 'buckets', 'Note']}
                      rows={c.results.map((r) => [r.map, String(r.size), r.get, r.buckets, r.note])}
                    />
                  </div>
                  <div className="mt-4">
                    <CodePanel title="Snippet" code={c.java} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="hashmap" title="04. HashMap deep dive" lead="hashCode → bucket → equals. Null key allowed (one). Not thread-safe.">
            <CodePanel title="Lookup process" tone="ok" code={HASHMAP_LOOKUP} />
            <div className="mt-4">
              <MiniTable
                headers={['Combo', 'size', 'get']}
                rows={COMBOS.map((c) => {
                  const r = c.results.find((x) => x.map === 'HashMap')!;
                  return [c.title, String(r.size), r.get];
                })}
              />
            </div>
          </Section>

          <Section id="chm" title="05. ConcurrentHashMap" lead="Same key equality as HashMap; concurrent atomics; no nulls.">
            <CodePanel title="Atomic ops" tone="ok" code={CHM_ATOMICS} />
            <div className="mt-4">
              <MiniTable
                headers={['Combo', 'CHM size', 'CHM get']}
                rows={COMBOS.map((c) => {
                  const r = c.results.find((x) => x.map === 'ConcurrentHashMap')!;
                  return [c.title, String(r.size), r.get];
                })}
              />
            </div>
          </Section>

          <Section id="linked" title="06. LinkedHashMap + LRU" lead="Same equals/hashCode; preserves insertion or access order.">
            <CodePanel title="LRU (access-order)" tone="ok" code={LRU_CODE} />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Order does not fix a broken key contract — size/get failures match HashMap.
            </p>
          </Section>

          <Section id="treemap" title="07. TreeMap" lead="Completely different mechanism: ordering, not hashing.">
            <CodePanel title="Comparable + Comparator" tone="ok" code={TREEMAP_CODE} />
          </Section>

          <Section id="skiplist" title="08. ConcurrentSkipListMap">
            <CodePanel title="Notes" code={SKIPLIST_NOTE} />
          </Section>

          <Section id="hashtable" title="09. Hashtable">
            <CodePanel title="Legacy" code={HASHTABLE_NOTE} />
          </Section>

          <Section id="identity" title="10. IdentityHashMap" lead="Corner case: reference equality, not equals().">
            <CodePanel title="== vs equals" tone="danger" code={IDENTITY_CODE} />
          </Section>

          <Section id="enummap" title="11. EnumMap">
            <CodePanel title="Ordinal array map" tone="ok" code={ENUM_CODE} />
          </Section>

          <Section id="records" title="12. Records as keys" lead="Immutable + generated equals/hashCode — still need ordering for TreeMap.">
            <CodePanel title="record EmployeeKey" tone="ok" code={RECORD_CODE} />
          </Section>

          <Section
            id="eq-vs-cmp"
            title="13. equals vs compareTo corner case"
            lead="a.equals(b)==false but a.compareTo(b)==0 — HashMap keeps both; TreeMap collapses."
          >
            <CodePanel title="Inconsistency demo" tone="danger" code={EQ_VS_CMP} />
          </Section>

          <Section id="comparators" title="14. Comparator corner cases">
            <MiniTable headers={['Topic', 'Pattern', 'Risk / fix']} rows={COMPARATOR_CORNERS} />
          </Section>

          <Section id="failures" title="15. Failure scenarios" lead="Expect → actual → why → fix.">
            <div className="space-y-4">
              {FAILURES.map((f) => (
                <div key={f.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <strong>Expect:</strong> {f.expect}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Actual:</strong> {f.actual}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Why:</strong> {f.why}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <strong>Fix:</strong> {f.fix}
                  </p>
                  <div className="mt-3">
                    <CodePanel title="Code" code={f.code} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="usecases" title="16. Real-world choices">
            <MiniTable headers={['Map', 'Use when']} rows={USE_CASES} />
          </Section>

          <Section id="perf" title="17. Performance matrix" lead="Averages assume good hashes / balanced compares. Caveats matter in interviews.">
            <MiniTable headers={['Map', 'Key mechanism', 'Ordering', 'Avg lookup', 'Thread-safe']} rows={PERF_ROWS} />
            <div className="mt-4">
              <MiniTable headers={['Map', 'Lookup basis', 'Null key', 'Order', 'Concurrency']} rows={MAP_COMPARE} />
            </div>
          </Section>

          <Section id="exercises" title="18. Coding exercises" lead="Level 1 → 10 production design.">
            <div className="space-y-4">
              {EXERCISES.map((e) => (
                <div key={e.level} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Level {e.level}: {e.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{e.problem}</p>
                  <p className="text-xs text-slate-500">
                    Expected: {e.expected} · Constraints: {e.constraints} · Complexity: {e.complexity}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <CodePanel title="Starter" code={e.starter} />
                    <CodePanel title="Solution" tone="ok" code={e.solution} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Edges: {e.edges}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="cheatsheet" title="19. Cheat sheet">
            <CodePanel title="Final sheet" tone="ok" code={CHEAT_SHEET} />
          </Section>

          <Section id="demo" title="20. Runnable demo" lead="java-equals-hashcode-demo — expand with EqHashMapLab + corner cases.">
            <CodePanel
              title="Build & run"
              tone="ok"
              code={`cd java-equals-hashcode-demo
javac -d out src/*.java
java -cp out EqHashMapLab
java -cp out CornerCasesLab`}
            />
          </Section>

          <Section id="interview" title="21. Interview bank" lead="30+ Senior / Architect / Rapid prompts.">
            <InterviewMode />
          </Section>
        </div>
      </div>
    </div>
  );
}
