import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringCsrfSequenceDiagrams from '@/components/spring-csrf-sequence-diagrams';
import {buildSpringCsrfDemoTree,listSpringCsrfDemoFiles} from '@/lib/spring-csrf-demo-source';

export const metadata={
  title:'CSRF Protection — Spring Security',
  description:'CSRF attack live example with bank vs evil site URLs, HTTP 403 Invalid CSRF token response, Spring Security fix, and runnable demo source.',
};

export default function SpringCsrfDemoPage(){
  const files=listSpringCsrfDemoFiles();
  const tree=buildSpringCsrfDemoTree(files);
  const defaultPath=files.find((f)=>f.path.includes('SecurityConfig.java'))?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Spring Security · CSRF Protection
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          CSRF Protection
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Live attack with real URLs, the exact <strong>HTTP 403</strong> response, how to fix it in Spring Security,
          plus the runnable <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-csrf-demo/</code> source.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#csrf-live-example" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Live attack image →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#csrf-error" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            403 response →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#csrf-fix" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            How to fix →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#csrf-source" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Source explorer →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      {/* Live example image */}
      <section id="csrf-live-example" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Live CSRF example — URLs, request, 403, fix
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Two browser tabs. Same victim. Different websites.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Site</th>
                <th className="px-4 py-3 font-semibold">URL</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Real bank (victim logged in)</td>
                <td className="px-4 py-3"><code>https://bank.example.com/login</code> → <code>/transfer</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Attacker page</td>
                <td className="px-4 py-3"><code>https://evil-gifts.example/win-prize.html</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Local demo</td>
                <td className="px-4 py-3"><code>http://localhost:8090/transfer</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vibhu-tech-blog/images/spring-security/csrf-attack-live-example.svg"
            alt="CSRF attack live example with bank.example.com, evil-gifts.example forged POST, HTTP 403 Invalid CSRF token, and Spring Security _csrf fix"
            className="h-auto w-full"
          />
        </figure>
      </section>

      {/* Forged request */}
      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Forged request the browser sends
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Cookie is auto-attached. CSRF token is missing. Victim never clicked Transfer on the bank site.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`POST https://bank.example.com/transfer HTTP/1.1
Host: bank.example.com
Origin: https://evil-gifts.example
Referer: https://evil-gifts.example/win-prize.html
Cookie: JSESSIONID=A1B2C3D4
Content-Type: application/x-www-form-urlencoded

toAccount=ATTACKER&amount=9999
# missing: _csrf=...`}</pre>
      </section>

      {/* 403 error */}
      <section id="csrf-error" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Error you get when CSRF is ON
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Spring Security <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">CsrfFilter</code> rejects the request
          before your controller runs.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-red-200 dark:border-red-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Field</th>
                <th className="px-4 py-3 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">HTTP status</td>
                <td className="px-4 py-3"><strong>403 Forbidden</strong></td>
              </tr>
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">Typical body</td>
                <td className="px-4 py-3"><code>Invalid CSRF token found for https://bank.example.com/transfer</code></td>
              </tr>
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">Filter</td>
                <td className="px-4 py-3"><code>org.springframework.security.web.csrf.CsrfFilter</code></td>
              </tr>
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">Side effect</td>
                <td className="px-4 py-3">Balance / ledger <strong>unchanged</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Case</th>
                <th className="px-4 py-3 font-semibold">Response</th>
                <th className="px-4 py-3 font-semibold">Money moved?</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">POST without <code>_csrf</code> (evil site)</td>
                <td className="px-4 py-3"><strong>403 Forbidden</strong> — Invalid CSRF token</td>
                <td className="px-4 py-3">No</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">POST with valid <code>_csrf</code> (bank form)</td>
                <td className="px-4 py-3"><strong>302</strong> → /transfer</td>
                <td className="px-4 py-3">Yes</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">CSRF wrongly disabled</td>
                <td className="px-4 py-3">302 / 200 — attack succeeds</td>
                <td className="px-4 py-3"><strong>Yes (bad)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Fix */}
      <section id="csrf-fix" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          How to fix it
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">1) Keep CSRF enabled for cookie/session browser apps</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`http.csrf(Customizer.withDefaults());
// HttpSessionCsrfTokenRepository — token stored in session`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">2) Put the secret on the real bank form</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`<form action="https://bank.example.com/transfer" method="POST">
  <input type="hidden" name="_csrf" value="8f3a…c91e"/>
  <input name="toAccount" value="B"/>
  <input name="amount" value="100"/>
  <button type="submit">Transfer</button>
</form>`}</pre>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Thymeleaf: <code>{'<input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}"/>'}</code>
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">3) Valid request succeeds → 302 COMPLETED</p>
            <p className="mt-1">
              Evil site cannot read <code>_csrf</code> from <code>bank.example.com</code> (same-origin policy).
              Session cookie alone is no longer enough.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <strong>SPA variant:</strong> <code>CookieCsrfTokenRepository</code> → JS reads <code>XSRF-TOKEN</code> cookie
          and sends header <code>X-XSRF-TOKEN</code>. Missing header → same <strong>403</strong>.
        </p>
      </section>

      {/* Run lab */}
      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Run the live lab
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-csrf-demo
mvn test
mvn spring-boot:run`}</pre>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>Open <code>http://localhost:8090/login</code> — <code>alice</code> / <code>password</code></li>
          <li>Open <code>http://localhost:8090/transfer</code></li>
          <li>Submit normal Transfer → success (has <code>_csrf</code>)</li>
          <li>Click <strong>Forge transfer without CSRF</strong> → <strong>HTTP 403</strong></li>
        </ol>
      </section>

      <SpringCsrfSequenceDiagrams />

      <div id="csrf-source" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Source explorer
        </h2>
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
              routeBase="/spring-csrf-demo"
              ariaLabel="Spring CSRF protection demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
