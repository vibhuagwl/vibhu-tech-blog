import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringSqliDiagrams from '@/components/spring-sqli-diagrams';
import {
  buildSpringWebAttacksDemoTree,
  listSpringWebAttacksDemoFiles,
} from '@/lib/spring-web-attacks-demo-source';

export const metadata = {
  title: 'SQL Injection Defense — Spring Security',
  description:
    'SQL injection interview guide: string concat vs PreparedStatement, OR 1=1 bypass, JdbcTemplate parameterized queries, lab on port 8093.',
};

export default function SpringSqlInjectionDemoPage() {
  const files = listSpringWebAttacksDemoFiles();
  const tree = buildSpringWebAttacksDemoTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('SqlInjectionController.java'))?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Spring Security · SQL Injection Defense
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          SQL Injection (SQLi)
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Staff answer: treat SQL as code + data; never let user input become code. Lab compares string
          concatenation vs <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">PreparedStatement</code>{' '}
          in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            spring-web-attacks-demo/
          </code>{' '}
          on port <strong>8093</strong>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#what" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            What →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#root-cause" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Root cause →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#when" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            When →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#impact" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Impact →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#fixes" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Fixes →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#lab" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Lab →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#cheat-sheet" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Cheat sheet →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#sqli-source" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Source →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <section id="what" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          What is SQL injection?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          SQLi happens when untrusted input is interpolated into a SQL string so the database parses attacker
          text as SQL syntax — changing predicates, unions, or statements — instead of treating it as a bound
          value.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`# Intended
SELECT id, name, category FROM products WHERE category = 'electronics'

# After q = electronics' OR '1'='1
SELECT id, name, category FROM products WHERE category = 'electronics' OR '1'='1'
# → every row matches`}</pre>
      </section>

      <section id="root-cause" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Root cause & classic patterns
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Pattern</th>
                <th className="px-4 py-3 font-semibold">What goes wrong</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">String concat / format</td>
                <td className="px-4 py-3"><code>&quot;... &apos;&quot; + q + &quot;&apos;&quot;</code> or <code>String.format</code> into SQL</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">OR &apos;1&apos;=&apos;1&apos; bypass</td>
                <td className="px-4 py-3">Turns WHERE into a tautology — auth or filter bypass</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Dynamic ORDER BY / identifiers</td>
                <td className="px-4 py-3">Placeholders cannot bind column names — use allowlists</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Native queries with concat</td>
                <td className="px-4 py-3">JPA/Hibernate <code>createNativeQuery</code> with string glue</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="when" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          When it shows up
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>Legacy JDBC or “quick” search endpoints that build WHERE clauses by hand.</li>
          <li>Reporting / admin filters with many optional predicates.</li>
          <li>Raw native SQL for performance that skipped bind parameters.</li>
          <li>Less common with Spring Data method names / Criteria — still watch native SQL and sort fields.</li>
        </ul>
      </section>

      <section id="impact" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Impact
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Impact</th>
                <th className="px-4 py-3 font-semibold">Example</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Confidentiality</td>
                <td className="px-4 py-3">Dump all products / users via tautology or UNION</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Integrity</td>
                <td className="px-4 py-3">UPDATE/DELETE if stacked queries or writable paths exist</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Auth bypass</td>
                <td className="px-4 py-3">Login WHERE user=&apos;x&apos; OR &apos;1&apos;=&apos;1&apos; --</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Compliance</td>
                <td className="px-4 py-3">PII / PCI breach from a single searchable field</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="fixes" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Fixes catalog (Spring / JDBC)
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/40">
            <p className="font-semibold text-red-900 dark:text-red-200">BAD — concatenate user input</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-red-100">{`@GetMapping("/bad")
public List<Map<String, Object>> bad(@RequestParam String q) {
  String sql = "SELECT id, name, category FROM products WHERE category = '" + q + "'";
  return jdbc.queryForList(sql);
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              GOOD — PreparedStatement via JdbcTemplate <code>?</code>
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@GetMapping("/good")
public List<Map<String, Object>> good(@RequestParam String q) {
  return jdbc.queryForList(
      "SELECT id, name, category FROM products WHERE category = ?",
      q);
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">JPA named params / Criteria</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@Query("select p from Product p where p.category = :category")
List<Product> findByCategory(@Param("category") String category);

// Dynamic filters → Criteria API / Spec — still bind values, never glue SQL`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">Identifiers (ORDER BY)</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`Set<String> allowed = Set.of("name", "category", "id");
if (!allowed.contains(sort)) throw new ResponseStatusException(BAD_REQUEST);
// then append the allowlisted column name only`}</pre>
          </div>
        </div>
      </section>

      <section id="lab" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Lab endpoints (port 8093)
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-web-attacks-demo
mvn test
mvn spring-boot:run`}</pre>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Endpoint</th>
                <th className="px-4 py-3 font-semibold">Behavior</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>/sqli/bad?q=electronics</code></td>
                <td className="px-4 py-3">String-concat SQL — vulnerable</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">
                  <code>/sqli/bad?q=electronics&apos; OR &apos;1&apos;=&apos;1</code>
                </td>
                <td className="px-4 py-3">Returns all rows (demo of bypass)</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>/sqli/good?q=electronics</code></td>
                <td className="px-4 py-3">Parameterized — safe</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">
                  <code>/sqli/good?q=electronics&apos; OR &apos;1&apos;=&apos;1</code>
                </td>
                <td className="px-4 py-3">Treated as literal category — no bypass</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="cheat-sheet" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Interview cheat sheet
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Answer</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Root cause?</td>
                <td className="px-4 py-3">Untrusted input becomes SQL syntax via concatenation</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Primary fix?</td>
                <td className="px-4 py-3">Parameterized queries / PreparedStatement / bind params</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">OR 1=1?</td>
                <td className="px-4 py-3">Tautology that bypasses filters or auth WHEN clauses</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Spring tool?</td>
                <td className="px-4 py-3"><code>JdbcTemplate</code> with <code>?</code>; JPA <code>@Param</code>; Criteria</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Can&apos;t bind column names?</td>
                <td className="px-4 py-3">Allowlist identifiers; never interpolate raw sort/filter names</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">ORM safe by default?</td>
                <td className="px-4 py-3">Mostly — until native SQL or string-built HQL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <SpringSqliDiagrams />

      <div id="sqli-source" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Source explorer
        </h2>
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ) : (
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/spring-sql-injection-demo"
              ariaLabel="Spring SQL injection demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
