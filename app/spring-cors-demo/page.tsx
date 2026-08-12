import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringCorsSequenceDiagrams from '@/components/spring-cors-sequence-diagrams';
import {buildSpringCorsDemoTree,listSpringCorsDemoFiles} from '@/lib/spring-cors-demo-source';

export const metadata={
  title:'CORS Security — Spring Security',
  description:'CORS live example with frontend/API URLs, preflight, HTTP 403 Invalid CORS request, Spring Security allowlist fix, and runnable demo source.',
};

export default function SpringCorsDemoPage(){
  const files=listSpringCorsDemoFiles();
  const tree=buildSpringCorsDemoTree(files);
  const defaultPath=files.find((f)=>f.path.includes('SecurityConfig.java'))?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Spring Security · CORS Security
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          CORS Security
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Live cross-origin example with real URLs, preflight, the exact <strong>HTTP 403</strong> / browser error,
          how to fix it in Spring Security, plus runnable{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">spring-cors-demo/</code> source.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#cors-live-example" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Live example image →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#cors-error" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            403 / browser error →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#cors-fix" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            How to fix →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#cors-source" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Source explorer →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <section id="cors-live-example" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Live CORS example — URLs, preflight, allow / 403, fix
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Same laptop, different ports = different origins. Browser enforces CORS; Spring advertises the allowlist.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Piece</th>
                <th className="px-4 py-3 font-semibold">URL / Origin</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Frontend (JS page)</td>
                <td className="px-4 py-3"><code>http://localhost:5500</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">API</td>
                <td className="px-4 py-3"><code>http://localhost:8091/api/...</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Allowlisted origin</td>
                <td className="px-4 py-3"><code>http://localhost:5500</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Evil origin (blocked)</td>
                <td className="px-4 py-3"><code>http://evil.example</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vibhu-tech-blog/images/spring-security/cors-live-example.svg"
            alt="CORS live example with localhost:5500 frontend, localhost:8091 API, allowed ACAO headers, evil origin 403 Invalid CORS request, and Spring CorsConfigurationSource fix"
            className="h-auto w-full"
          />
        </figure>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Allowed request (works)
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`GET http://localhost:8091/api/public/ping HTTP/1.1
Host: localhost:8091
Origin: http://localhost:5500

← HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5500
Access-Control-Allow-Credentials: true
{"status":"ok","scope":"public"}`}</pre>
      </section>

      <section id="cors-error" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Errors you get when origin is not allowlisted
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Spring Security <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">CorsFilter</code> rejects
          disallowed origins. The browser also blocks JS from reading the body.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-red-200 dark:border-red-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Where</th>
                <th className="px-4 py-3 font-semibold">What you see</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">API response</td>
                <td className="px-4 py-3">
                  <strong>HTTP 403 Forbidden</strong>
                  <br/>
                  Body: <code>Invalid CORS request</code>
                  <br/>
                  No <code>Access-Control-Allow-Origin</code>
                </td>
              </tr>
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">Browser console</td>
                <td className="px-4 py-3">
                  <code>Access to fetch at &apos;http://localhost:8091/...&apos; from origin &apos;http://evil.example&apos; has been blocked by CORS policy</code>
                </td>
              </tr>
              <tr className="border-t border-red-100 dark:border-red-900">
                <td className="px-4 py-3 font-semibold">Preflight fail</td>
                <td className="px-4 py-3">OPTIONS rejected → real POST/PUT never leaves the browser</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`GET http://localhost:8091/api/public/ping HTTP/1.1
Origin: http://evil.example

← HTTP/1.1 403 Forbidden
Body: Invalid CORS request`}</pre>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Preflight for credentialed POST
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          JSON + <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">Authorization</code> is not a “simple” request.
          Browser sends <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">OPTIONS</code> first.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`OPTIONS /api/transfers HTTP/1.1
Origin: http://localhost:5500
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type

← HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5500
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With

# then the real POST runs`}</pre>
      </section>

      <section id="cors-fix" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          How to fix it
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">1) Enable CORS on the security filter chain</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`http.cors(Customizer.withDefaults());`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">2) Allowlist exact origins (never <code>*</code> with credentials)</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`CorsConfiguration cfg = new CorsConfiguration();
cfg.setAllowedOrigins(List.of("http://localhost:5500"));
cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
cfg.setExposedHeaders(List.of("X-Request-Id"));
cfg.setAllowCredentials(true);
source.registerCorsConfiguration("/api/**", cfg);`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">3) Permit OPTIONS for preflight</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()`}</pre>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Control</th>
                <th className="px-4 py-3 font-semibold">Protects against</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">CORS</td>
                <td className="px-4 py-3">Hostile JS reading cross-origin responses</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">CSRF</td>
                <td className="px-4 py-3">Hostile site triggering cookie-authenticated writes</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Authn / Authz</td>
                <td className="px-4 py-3">Who the caller is / what they may do</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Run the live lab
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-cors-demo
mvn test
mvn spring-boot:run

# other terminal — second origin
cd spring-cors-demo/frontend
python3 -m http.server 5500`}</pre>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>API lab: <code>http://localhost:8091</code></li>
          <li>Frontend: <code>http://localhost:5500</code> — click Public / Me / Transfer</li>
          <li>Allowed origin → JSON readable; evil origin → <strong>403 Invalid CORS request</strong></li>
        </ol>
      </section>

      <SpringCorsSequenceDiagrams />

      <div id="cors-source" className="mt-10 scroll-mt-24">
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
              routeBase="/spring-cors-demo"
              ariaLabel="Spring CORS security demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
