'use client';

import Link from 'next/link';
import Mermaid from '@/components/mermaid';
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
          Java 21 · Interview · HashMap · LinkedHashMap · ConcurrentHashMap · TreeMap
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em] text-slate-900 md:text-5xl dark:text-white">
          equals() &amp; hashCode() — Complete Map Lab
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Every equals × hashCode combination interviewers use — verified on HashMap, LinkedHashMap,
          ConcurrentHashMap, and TreeMap. Experiment: put(a), put(b), put(a), get(new a).
        </p>
        <p className="mt-3 max-w-3xl rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-7 text-white">
          hashCode finds the bucket. equals finds the entry. TreeMap ignores hashCode and uses compareTo /
          Comparator instead — that is why broken equals/hashCode still “works” on TreeMap if ordering is by name.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Run the demo in{' '}
          <Link href="/java-compiler" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Compiler
          </Link>
          {' · '}
          <Link href="/java-locking" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            Java Locking
          </Link>
          {' · '}
          <Link href="/complexity/hashmap-hashset-complexity" className="font-semibold text-slate-700 hover:underline dark:text-slate-300">
            HashMap complexity
          </Link>
        </p>
      </header>

      <div className="mt-10 grid gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
        <StickyToc items={EQHC_TOC} />
        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="00. Overview"
            lead="Curriculum inspired by classic equals/hashCode interview drills — expanded to four Map implementations with OpenJDK 21 verified outputs."
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <Mermaid
                chart={`flowchart LR
  put[put key] --> hc[hashCode]
  hc --> bucket[bucket / bin]
  bucket --> eq[equals walk]
  eq -->|match| replace[replace value]
  eq -->|no match| insert[new Entry]
  get[get key] --> hc2[hashCode]
  hc2 --> bucket2[bucket]
  bucket2 --> eq2[equals]
  eq2 -->|yes| value[return value]
  eq2 -->|no| null[null]`}
              />
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {QUICK_FACTS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Section>

          <Section id="contract" title="01. equals / hashCode contract" lead="Break the contract and HashMap silently lies.">
            <MiniTable headers={['Rule', 'Meaning']} rows={CONTRACT_RULES} />
            <div className="mt-4">
              <CodePanel
                title="Canonical Employee key (Java 21)"
                tone="ok"
                code={`public final class Employee {
  private final String name;
  public Employee(String name) { this.name = name; }

  @Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    return Objects.equals(name, ((Employee) o).name);
  }

  @Override public int hashCode() {
    return Objects.hashCode(name);
  }
}
// Prefer: public record Employee(String name) {}`}
              />
            </div>
          </Section>

          <Section
            id="buckets"
            title="02. HashMap buckets & Entry"
            lead="Bucket array → Entry chain (or tree). hashCode selects index; equals walks the chain."
          >
            <CodePanel
              title="Mental model"
              code={`bucket[] = array of bins
bin = linked nodes (or tree when collisions grow)
put: hash → index → walk equals → replace or append
get: hash → index → walk equals → value or null

If hashCodes differ for “equal” keys:
  get never visits the bin where put stored the entry.`}
            />
          </Section>

          <Section
            id="combos"
            title="03. All equals × hashCode combinations"
            lead="Seven classic overrides. For each: HashMap / LinkedHashMap / ConcurrentHashMap / TreeMap results after put(a), put(b), put(a), get(new a)."
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

          <Section
            id="hashmap"
            title="04. HashMap results"
            lead="Baseline: hash-based map. Correct both → size 2 + successful get. Any missing half of the pair → size 3 + null get (except the pathological always-equal case)."
          >
            <MiniTable
              headers={['Combo', 'size', 'get']}
              rows={COMBOS.map((c) => {
                const r = c.results.find((x) => x.map === 'HashMap')!;
                return [c.title, String(r.size), r.get];
              })}
            />
          </Section>

          <Section
            id="linked"
            title="05. LinkedHashMap"
            lead="Same equals/hashCode behavior as HashMap. Extra: insertion-order iteration (or access-order LRU mode)."
          >
            <CodePanel
              title="Order difference (combo: neither overridden)"
              code={`// HashMap iteration order: unspecified
// LinkedHashMap after put(a), put(b), put(a2):
//   Emp[a]=emp1, Emp[b]=emp2, Emp[a]=emp1 OVERRIDDEN
// size still 3; get(new a) still null`}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Do not confuse “ordered entries” with “logical key equality.” Order does not fix a broken contract.
            </p>
          </Section>

          <Section
            id="chm"
            title="06. ConcurrentHashMap"
            lead="Key equality rules match HashMap. Differences: no null keys/values; concurrent internals; not a drop-in for TreeMap."
          >
            <MiniTable
              headers={['Combo', 'CHM size', 'CHM get', 'Matches HashMap?']}
              rows={COMBOS.map((c) => {
                const h = c.results.find((x) => x.map === 'HashMap')!;
                const r = c.results.find((x) => x.map === 'ConcurrentHashMap')!;
                return [c.title, String(r.size), r.get, h.size === r.size && h.get === r.get ? 'Yes' : 'Check'];
              })}
            />
            <div className="mt-4">
              <CodePanel
                title="Null keys"
                tone="danger"
                code={`new ConcurrentHashMap<Employee,String>().put(null, "x"); // NPE
// HashMap allows one null key — CHM does not.`}
              />
            </div>
          </Section>

          <Section
            id="treemap"
            title="07. TreeMap — compareTo owns equality"
            lead="TreeMap does not use hashCode to place keys. With Comparable by name, broken equals/hashCode still yields size=2 and successful get."
          >
            <CodePanel
              title="TreeMap key"
              tone="ok"
              code={`final class Employee implements Comparable<Employee> {
  private final String name;
  public Employee(String name) { this.name = name; }
  @Override public int compareTo(Employee o) {
    return name.compareTo(o.name); // defines TreeMap "sameness"
  }
  // equals/hashCode may be broken — TreeMap still replaces "a"
}
// Or: new TreeMap<>(Comparator.comparing(Employee::name))`}
            />
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Staff rule: <code className="text-xs">compareTo == 0</code> should agree with{' '}
              <code className="text-xs">equals</code>. If they disagree, SortedMap/SortedSet contracts break.
              Without Comparable and without a Comparator, TreeMap throws ClassCastException.
            </p>
          </Section>

          <Section id="matrix" title="08. Cross-map matrix" lead="Pick the structure for the job — then still get equals/hashCode (or compareTo) right.">
            <MiniTable headers={['Map', 'Lookup basis', 'Null key', 'Order', 'Concurrency']} rows={MAP_COMPARE} />
          </Section>

          <Section id="prefer" title="09. Preferred key types" lead="Prefer types that already implement the contract.">
            <CodePanel
              title="Good keys"
              tone="ok"
              code={`String, Integer, Long, UUID, enum, record Employee(String id)
// Bad: mutable POJO, arrays (use Arrays.equals/hashCode carefully),
//      identity-only keys when you need business equality`}
            />
          </Section>

          <Section id="pitfalls" title="10. Pitfalls & anti-patterns">
            <ul className="grid gap-2 md:grid-cols-2">
              {[
                'Override equals without hashCode (or vice versa)',
                'Mutable fields in hashCode/equals after put',
                'hashCode() { return 1; } in production',
                'equals always true',
                'Relying on TreeMap to “fix” HashMap mistakes',
                'Using ConcurrentHashMap as a distributed cache',
                'compareTo inconsistent with equals',
                'instanceof equals with subclasses that add state',
                'Using float/double keys without care',
                'Assuming LinkedHashMap changes equality',
              ].map((p) => (
                <li
                  key={p}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="demo"
            title="11. Runnable demo"
            lead="Source under java-equals-hashcode-demo/ — run all combos on all four maps."
          >
            <CodePanel
              title="Build & run"
              tone="ok"
              code={`cd java-equals-hashcode-demo
javac -d out src/EqHashMapLab.java
java -cp out EqHashMapLab

# Or paste Employee snippets into /java-compiler`}
            />
          </Section>

          <Section id="interview" title="12. Interview drills">
            <InterviewMode />
          </Section>
        </div>
      </div>
    </div>
  );
}
