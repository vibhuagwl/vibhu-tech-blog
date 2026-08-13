import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringDdosDiagrams from '@/components/spring-ddos-diagrams';
import {
  buildSpringWebAttacksDemoTree,
  listSpringWebAttacksDemoFiles,
} from '@/lib/spring-web-attacks-demo-source';

export const metadata = {
  title: 'DDoS Defenses — Spring Security',
  description:
    'DDoS defense interview guide: volumetric vs application layer, CDN/WAF/rate limits, Spring IpRateLimitFilter → HTTP 429. Defense only — no attack how-to.',
};

export default function SpringDdosDemoPage() {
  const files = listSpringWebAttacksDemoFiles();
  const tree = buildSpringWebAttacksDemoTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('IpRateLimitFilter.java'))?.path ??
    files.find((f) => f.path === 'README.md')?.path ??
    files[0]?.path ??
    '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">
          Spring Security · DDoS Defenses
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          DDoS — defenses only
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Interview focus: classify the layer (volumetric vs application), then stack CDN, WAF, gateway quotas,
          app rate limits, and autoscaling. Lab shows a defensive{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">IpRateLimitFilter</code>{' '}
          returning <strong>HTTP 429</strong> on port <strong>8093</strong>. This page does not describe how to
          attack.
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
            Defenses →
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
          <a href="#ddos-source" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
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
          What is a DDoS (in interview terms)?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          A distributed denial of service overwhelms a target so legitimate users cannot get service —
          exhausting bandwidth, connection tables, CPU, thread pools, or downstream databases. Your job as a
          Staff engineer is to <strong>detect, absorb, and shed load</strong> at the right layer — not to
          generate traffic.
        </p>
      </section>

      <section id="types" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Types (high level)
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">What is stressed</th>
                <th className="px-4 py-3 font-semibold">Typical defenses</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Volumetric (L3/L4)</td>
                <td className="px-4 py-3">Bandwidth, packets/sec, SYN backlog</td>
                <td className="px-4 py-3">CDN / Anycast scrubbing, SYN cookies, provider blackhole/scrub</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Protocol / state</td>
                <td className="px-4 py-3">Firewall / load-balancer connection state</td>
                <td className="px-4 py-3">SYN cookies, conntrack tuning, edge filtering</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Application (L7)</td>
                <td className="px-4 py-3">HTTP workers, auth, search, expensive APIs</td>
                <td className="px-4 py-3">WAF, rate limits, caching, auth challenges, autoscaling</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          SYN cookies (high level): the server avoids allocating full connection state until the handshake
          completes, reducing damage from half-open floods — usually at OS / LB / CDN, not in Spring MVC.
        </p>
      </section>

      <section id="when" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          When to talk about it
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>Public internet-facing APIs and login / search / checkout paths.</li>
          <li>Incident reviews: latency cliffs, 5xx storms, thread-pool exhaustion under traffic spikes.</li>
          <li>Architecture reviews: “what happens if QPS ×10?” — CDN, quotas, backpressure.</li>
          <li>Do not confuse with a single-client bug that loops; DDoS implies many sources or spoofed volume.</li>
        </ul>
      </section>

      <section id="impact" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Impact & trade-offs
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Defense</th>
                <th className="px-4 py-3 font-semibold">Pros</th>
                <th className="px-4 py-3 font-semibold">Cons / watch-outs</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">CDN / Anycast</td>
                <td className="px-4 py-3">Absorbs volumetric noise near the edge</td>
                <td className="px-4 py-3">Cost; origin still needs auth / WAF for L7</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">WAF</td>
                <td className="px-4 py-3">Blocks known bad patterns / bots</td>
                <td className="px-4 py-3">False positives; tune rules carefully</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Rate limits (429)</td>
                <td className="px-4 py-3">Protects expensive app paths per IP/key</td>
                <td className="px-4 py-3">NAT sharing; need distributed stores in prod</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Autoscaling</td>
                <td className="px-4 py-3">Buys capacity for legitimate spikes</td>
                <td className="px-4 py-3">Alone cannot outrun unbounded L7 abuse</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="fixes" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Defense catalog (Spring + platform)
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              1) App-layer fixed-window filter → 429 (lab)
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`if (window.count.get() > props.requestsPerWindow()) {
  response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // 429
  response.setHeader("Retry-After", String.valueOf(props.windowSeconds()));
  response.getWriter().write("{\"error\":\"rate_limited\",...}");
  return; // do not call filterChain
}
filterChain.doFilter(request, response);`}</pre>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Demo uses an in-memory <code>ConcurrentHashMap</code>. Production: Redis / Bucket4j / API gateway —
              not a single-node map.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">2) Scope the filter to sensitive paths</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
  String path = request.getRequestURI();
  return path == null || !path.startsWith("/ddos/");
}`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">3) Properties</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">{`@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(int requestsPerWindow, int windowSeconds) {}

# application.yml (example)
app.rate-limit.requests-per-window: 30
app.rate-limit.window-seconds: 10`}</pre>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">4) Platform layers (say these in interviews)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              <li>CDN / Anycast — absorb volumetric traffic before origin</li>
              <li>WAF — bot scores, geo/IP reputation, known bad signatures</li>
              <li>API gateway — token-bucket per API key / IP</li>
              <li>Autoscaling + circuit breakers / bulkheads — protect core dependencies</li>
              <li>SYN cookies / TCP tuning — OS and load balancer, not Spring controllers</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="lab" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Lab endpoints (port 8093) — defensive demo
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-web-attacks-demo
mvn test
mvn spring-boot:run

# Healthy call
curl -i http://127.0.0.1:8093/ddos/ping

# Exceed the configured window from the same IP → HTTP 429
# (repeat the curl within the window; no attack tooling required)`}</pre>
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
                <td className="px-4 py-3"><code>/ddos/ping</code></td>
                <td className="px-4 py-3">200 when under budget; rate-limited by <code>IpRateLimitFilter</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Over limit</td>
                <td className="px-4 py-3">
                  <strong>HTTP 429</strong> + <code>Retry-After</code> + JSON <code>rate_limited</code>
                </td>
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
                <td className="px-4 py-3">Volumetric vs L7?</td>
                <td className="px-4 py-3">Pipes/packets vs expensive HTTP / app resources</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">First platform lever?</td>
                <td className="px-4 py-3">CDN/scrubbing for volume; WAF + rate limits for L7</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">App signal?</td>
                <td className="px-4 py-3">HTTP 429 Too Many Requests + Retry-After</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Spring demo?</td>
                <td className="px-4 py-3"><code>IpRateLimitFilter</code> on <code>/ddos/**</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Prod rate limit store?</td>
                <td className="px-4 py-3">Redis / gateway — not a single JVM map</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">SYN cookies?</td>
                <td className="px-4 py-3">Defer full TCP state until handshake completes (edge/OS)</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">Autoscaling alone?</td>
                <td className="px-4 py-3">Helps legitimate spikes; does not replace edge + quotas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <SpringDdosDiagrams />

      <div id="ddos-source" className="mt-10 scroll-mt-24">
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
              routeBase="/spring-ddos-demo"
              ariaLabel="Spring DDoS defense demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
