import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringNPlusOneDiagrams from '@/components/spring-n-plus-one-diagrams';
import {buildSpringNPlusOneDemoTree,listSpringNPlusOneDemoFiles} from '@/lib/spring-n-plus-one-demo-source';

export const metadata={
  title:'JPA N+1 Problem — Spring Data',
  description:'N+1 query problem explained: root cause, detection, JOIN FETCH, EntityGraph, @BatchSize, DTO projections — with Mermaid diagrams and a runnable Spring Boot lab.',
};

export default function SpringNPlusOnePage(){
  const files=listSpringNPlusOneDemoFiles();
  const tree=buildSpringNPlusOneDemoTree(files);
  const defaultPath=files.find((f)=>f.path.includes('AuthorController.java'))?.path
    ?? files.find((f)=>f.path.includes('AuthorRepository.java'))?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Spring · JPA / Hibernate
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          The N+1 query problem
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Why list APIs melt under Hibernate lazy loading — root cause, how to detect it, every common fix
          in Spring Data JPA, plus runnable code in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-n-plus-one-demo/</code>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#what" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">What →</a>
          <span className="text-slate-300">·</span>
          <a href="#root-cause" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Root cause →</a>
          <span className="text-slate-300">·</span>
          <a href="#fixes" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Fixes →</a>
          <span className="text-slate-300">·</span>
          <a href="#n1-problem" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Diagrams →</a>
          <span className="text-slate-300">·</span>
          <a href="#source" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Source →</a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring hub →
          </Link>
        </div>
      </header>

      <section id="what" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          What is the N+1 problem?
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          You run <strong>1 query</strong> to load a list of parent rows (e.g. 50 authors), then the ORM runs{' '}
          <strong>N extra queries</strong> (one per parent) to load a lazy association (e.g. each author’s books).
          Total SQL ≈ <code>1 + N</code>. With 50 parents that is 51 round-trips instead of 1–2.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`1  SELECT * FROM authors                         -- load parents
+N SELECT * FROM books WHERE author_id = ?       -- once per author when you touch books
= 1 + N queries`}</pre>
        <blockquote className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <strong>Say this:</strong> “N+1 is not a wrong result — it is a wrong <em>access pattern</em>.
          Lazy collections are fine until a loop touches them after a list query.”
        </blockquote>
      </section>

      <section id="root-cause" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Root cause
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Ingredient</th>
                <th className="px-4 py-3 font-semibold">What happens</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Lazy association</td>
                <td className="px-4 py-3"><code>@OneToMany(fetch = LAZY)</code> / default collection laziness — proxy, not loaded</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">List query without fetch</td>
                <td className="px-4 py-3"><code>findAll()</code> / <code>select a from Author a</code> loads parents only</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Loop touches association</td>
                <td className="px-4 py-3">Mapper/JSON/DTO code calls <code>author.getBooks()</code> per row → N SELECTs</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Open session</td>
                <td className="px-4 py-3">Inside <code>@Transactional</code> (or worse, Open Session In View) lazy loads “work” silently</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`// Looks innocent — causes N+1
List<Author> authors = authorRepository.findAll();
return authors.stream()
    .map(a -> new AuthorDto(a.getName(), a.getBooks().size())) // ← N queries
    .toList();`}</pre>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <strong>OSIV trap:</strong> <code>spring.jpa.open-in-view=true</code> (Boot default) keeps the session open
          during view rendering, so N+1 often hides in the web layer. This lab sets <code>open-in-view: false</code>.
        </p>
      </section>

      <section id="detect" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          How to detect
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>Log SQL: <code>org.hibernate.SQL=DEBUG</code> — same shape, different bind id, N times</li>
          <li>Datasource proxy / p6spy / FlexyPool — count statements per request</li>
          <li>Hibernate statistics / custom <code>StatementInspector</code> (this lab)</li>
          <li>APM (slow span + high DB call count on one endpoint)</li>
          <li>Unit/integration test asserting max query count (see <code>NPlusOneQueryCountTest</code>)</li>
        </ul>
      </section>

      <section id="fixes" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Ways to fix (implementations)
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Approach</th>
                <th className="px-4 py-3 font-semibold">Spring / JPA tool</th>
                <th className="px-4 py-3 font-semibold">Trade-off</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">1</td>
                <td className="px-4 py-3 font-semibold">JOIN FETCH</td>
                <td className="px-4 py-3"><code>@Query(&quot;… join fetch a.books&quot;)</code></td>
                <td className="px-4 py-3">Best for one collection; watch cartesian product with 2+ bags</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">2</td>
                <td className="px-4 py-3 font-semibold">EntityGraph</td>
                <td className="px-4 py-3"><code>@EntityGraph(attributePaths=&quot;books&quot;)</code></td>
                <td className="px-4 py-3">Declarative; per-query fetch plan</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">3</td>
                <td className="px-4 py-3 font-semibold">Batch lazy load</td>
                <td className="px-4 py-3"><code>@BatchSize</code> / <code>default_batch_fetch_size</code></td>
                <td className="px-4 py-3">Still lazy, but N → ~N/batchSize queries</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">4</td>
                <td className="px-4 py-3 font-semibold">DTO / projection</td>
                <td className="px-4 py-3">Interface/class projection <code>@Query</code></td>
                <td className="px-4 py-3">No entity graph walk; best for read APIs</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">5</td>
                <td className="px-4 py-3 font-semibold">@SqlResultSetMapping / native join</td>
                <td className="px-4 py-3">Native SQL + mapping</td>
                <td className="px-4 py-3">Full SQL control; more boilerplate</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">6</td>
                <td className="px-4 py-3 font-semibold">Two queries + map in memory</td>
                <td className="px-4 py-3">Load ids, then <code>WHERE author_id IN (...)</code></td>
                <td className="px-4 py-3">Avoids cartesian blow-up on multi-collections</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">7</td>
                <td className="px-4 py-3 font-semibold">EAGER (usually wrong)</td>
                <td className="px-4 py-3"><code>FetchType.EAGER</code> on association</td>
                <td className="px-4 py-3">Global; over-fetches; do not “fix” N+1 this way</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">8</td>
                <td className="px-4 py-3 font-semibold">Disable OSIV + explicit fetch</td>
                <td className="px-4 py-3"><code>open-in-view: false</code></td>
                <td className="px-4 py-3">Forces fetch in service layer; surfaces bugs early</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Real Spring Data code</h3>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`// BAD — N+1
@Query("select a from Author a order by a.id")
List<Author> findAllAuthors();

// FIX 1 — join fetch
@Query("select distinct a from Author a left join fetch a.books order by a.id")
List<Author> findAllWithBooksJoinFetch();

// FIX 2 — entity graph
@EntityGraph(attributePaths = "books")
@Query("select a from Author a order by a.id")
List<Author> findAllWithBooksEntityGraph();

// FIX 3 — session.setFetchBatchSize(16) before lazy touch (see AuthorController.batch)

// FIX 4 — DTO projection (no lazy entity navigation)
@Query("""
  select a.name as authorName, b.title as bookTitle
  from Author a left join a.books b
  order by a.id, b.id
  """)
List<AuthorBookRow> findAuthorBookRows();`}</pre>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Lab endpoints
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-n-plus-one-demo
mvn test
mvn spring-boot:run
# :8092
curl -s http://localhost:8092/api/authors/bad
curl -s http://localhost:8092/api/authors/join-fetch
curl -s http://localhost:8092/api/authors/entity-graph
curl -s http://localhost:8092/api/authors/batch
curl -s http://localhost:8092/api/authors/dto`}</pre>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Watch the console: <code>/bad</code> prints many <code>books</code> selects; join-fetch / entity-graph print one join.
        </p>
      </section>

      <SpringNPlusOneDiagrams />

      <section className="mt-10 max-w-5xl">
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
                <td className="px-4 py-3">What is N+1?</td>
                <td className="px-4 py-3">1 parent query + N lazy child queries</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Root cause?</td>
                <td className="px-4 py-3">Lazy association touched in a loop after a list load</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">First fix?</td>
                <td className="px-4 py-3"><code>join fetch</code> or <code>@EntityGraph</code> for that use-case</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Read API best practice?</td>
                <td className="px-4 py-3">DTO / projection — do not serialize full entity graphs</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Why not EAGER everywhere?</td>
                <td className="px-4 py-3">Over-fetch, harder to control, still joins unexpectedly</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">How prove a fix?</td>
                <td className="px-4 py-3">SQL logs or a test that caps statement count</td>
              </tr>
            </tbody>
          </table>
        </div>
        <blockquote className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm leading-7 text-slate-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-slate-200">
          <strong>20-second answer:</strong> “N+1 is one query for parents plus one lazy query per parent.
          I detect it with SQL logs and a query-count test. I fix list endpoints with{' '}
          <code>join fetch</code> / <code>@EntityGraph</code>, use <code>@BatchSize</code> when laziness must stay,
          and prefer DTO projections for read APIs. I keep <code>open-in-view</code> false so fetch stays in the service layer.”
        </blockquote>
      </section>

      <div id="source" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Source explorer
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Start at <code>AuthorController.java</code> and <code>AuthorRepository.java</code>, then{' '}
          <code>NPlusOneQueryCountTest.java</code>.
        </p>
        {files.length===0?(
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Source folder not found at build time.
          </div>
        ):(
          <Suspense fallback={<div className="text-sm text-slate-500">Loading source explorer…</div>}>
            <OAuthCodeExplorer
              files={files}
              tree={tree}
              defaultPath={defaultPath}
              routeBase="/spring-n-plus-one"
              ariaLabel="Spring N+1 demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
