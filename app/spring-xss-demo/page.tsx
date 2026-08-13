import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringXssDiagrams from '@/components/spring-xss-diagrams';
import {
  buildSpringWebAttacksDemoTree,
  listSpringWebAttacksDemoFiles,
} from '@/lib/spring-web-attacks-demo-source';

export const metadata = {
  title: 'XSS Defense — Spring Security',
  description:
    'Cross-site scripting (XSS) for interviews: reflected vs stored, Thymeleaf th:utext vs th:text, HtmlUtils.htmlEscape, lab on port 8093, and Mermaid flows.',
};

export default function SpringXssDemoPage() {
  const files = listSpringWebAttacksDemoFiles();
  const tree = buildSpringWebAttacksDemoTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('XssController.java'))?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Spring Security · XSS Defense
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Cross-Site Scripting (XSS)
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Staff-level guide: what XSS is, reflected vs stored, why browsers trust your origin, and how Spring /
          Thymeleaf stop it. Runnable lab in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">
            spring-web-attacks-demo/
          </code>{' '}
          on port <strong>8093</strong>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#what" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            What →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#types" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Types →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#when" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            When →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#impact" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Impact →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#fixes" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Fixes →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#lab" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Lab →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#cheat-sheet" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Cheat sheet →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#xss-source" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Source →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <section id="what" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          What is XSS?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          XSS is when an attacker gets the victim&apos;s browser to execute JavaScript (or inject HTML) in the
          context of <em>your</em> origin. The browser treats the page as trusted bank.com / app.com code, so the
          script can read cookies (if not HttpOnly), call authenticated APIs, rewrite the DOM, or phish inside
          your chrome.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          Root cause is almost always <strong>untrusted input rendered into HTML without encoding</strong> —
          query params, form fields, DB rows, or headers echoed into a template or string HTML response.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`# Victim opens (URL-encoded script in name)
GET http://127.0.0.1:8093/xss/bad?name=%3Cscript%3Ealert(1)%3C/script%3E

# BAD response body includes raw script tags → browser executes
# GOOD response shows the characters as text — no execution`}</pre>
      </section>

      <section id="types" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Types & root cause
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">How it lands</th>
                <th className="px-4 py-3 font-semibold">Interview one-liner</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Reflected</td>
                <td className="px-4 py-3">Payload in request (URL/form) echoed in the response</td>
                <td className="px-4 py-3">Victim must click a crafted link; nothing stored</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Stored</td>
                <td className="px-4 py-3">Payload saved (comment, bio, ticket) then served to others</td>
                <td className="px-4 py-3">One write, many victims — higher blast radius</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">DOM-based</td>
                <td className="px-4 py-3">Client JS writes location/hash into DOM unsafely</td>
                <td className="px-4 py-3">Server HTML may look fine; bug is in frontend sinks</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          In this lab, <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">th:utext</code> and raw
          string concatenation into HTML are the unsafe sinks. Safe sinks:{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">th:text</code> and{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">HtmlUtils.htmlEscape</code>.
        </p>
      </section>

      <section id="when" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          When it matters
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>Any server-rendered page that echoes user or third-party content into HTML.</li>
          <li>Support tools, admin UIs, markdown/HTML editors, error pages that print the query string.</li>
          <li>JSON APIs that accidentally return <code>text/html</code> with interpolated input.</li>
          <li>Less relevant for pure JSON APIs consumed only by carefully written clients — but still encode if you ever embed into HTML.</li>
        </ul>
      </section>

      <section id="impact" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Impact (interview framing)
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Impact</th>
                <th className="px-4 py-3 font-semibold">Why it hurts</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Session / account takeover</td>
                <td className="px-4 py-3">Script can call APIs as the victim; steal non-HttpOnly tokens</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Data exfiltration</td>
                <td className="px-4 py-3">Read DOM / fetch PII and post to attacker origin</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Defacement / phishing</td>
                <td className="px-4 py-3">Fake login forms inside your trusted UI</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Wormable stored XSS</td>
                <td className="px-4 py-3">Each viewer re-spreads the payload (comments, chat)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Pair with HttpOnly + Secure cookies, CSP, and CSRF tokens — defense in depth, not either/or.
        </p>
      </section>

      <section id="fixes" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Fixes catalog (Spring)
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              1) Thymeleaf — prefer <code>th:text</code>, never <code>th:utext</code> for untrusted data
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`<!-- BAD -->
<span th:utext="\${name}">name</span>

<!-- GOOD — HTML-escaped -->
<span th:text="\${name}">name</span>`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              2) String HTML APIs — <code>HtmlUtils.htmlEscape</code>
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@GetMapping("/api/good")
@ResponseBody
public String apiGood(@RequestParam String name) {
  return "<html><body>Hello " + HtmlUtils.htmlEscape(name) + "</body></html>";
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              3) Prefer JSON APIs + Content-Type
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@GetMapping(value = "/api/me", produces = MediaType.APPLICATION_JSON_VALUE)
public Map<String, String> me(@RequestParam String name) {
  return Map.of("name", name); // client must not innerHTML this blindly
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              4) Controllers in the lab
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@GetMapping("/bad")
public String bad(@RequestParam String name, Model model) {
  model.addAttribute("name", name); // template uses th:utext — UNSAFE
  return "xss-bad";
}

@GetMapping("/good")
public String good(@RequestParam String name, Model model) {
  model.addAttribute("name", name); // template uses th:text — SAFE
  return "xss-good";
}`}</pre>
          </div>
        </div>
      </section>

      <section id="lab" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Lab endpoints (port 8093)
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-web-attacks-demo
mvn test
mvn spring-boot:run
# http://127.0.0.1:8093/`}</pre>
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
                <td className="px-4 py-3"><code>/xss/bad?name=…</code></td>
                <td className="px-4 py-3">Thymeleaf <code>th:utext</code> — reflected XSS demo</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>/xss/good?name=…</code></td>
                <td className="px-4 py-3">Thymeleaf <code>th:text</code> — escaped</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>/xss/api/bad?name=…</code></td>
                <td className="px-4 py-3">Raw string HTML — unsafe</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>/xss/api/good?name=…</code></td>
                <td className="px-4 py-3"><code>HtmlUtils.htmlEscape</code> — safe</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Try the URL-encoded payload on <code>/xss/bad</code> then the same on <code>/xss/good</code> and compare.
        </p>
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
                <td className="px-4 py-3">What is XSS?</td>
                <td className="px-4 py-3">Attacker script runs in victim browser under your origin</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Reflected vs stored?</td>
                <td className="px-4 py-3">Echoed from request vs persisted and re-served</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Primary fix?</td>
                <td className="px-4 py-3">Context-aware output encoding (HTML entity escape)</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Spring / Thymeleaf?</td>
                <td className="px-4 py-3"><code>th:text</code>; avoid <code>th:utext</code>; <code>HtmlUtils.htmlEscape</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Extra layers?</td>
                <td className="px-4 py-3">CSP, HttpOnly cookies, sanitize rich HTML with a whitelist library</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">XSS vs CSRF?</td>
                <td className="px-4 py-3">XSS steals/runs in-page; CSRF forges cookie-auth writes from another site</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <SpringXssDiagrams />

      <div id="xss-source" className="mt-10 scroll-mt-24">
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
              routeBase="/spring-xss-demo"
              ariaLabel="Spring XSS demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
