import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import SpringJwtSequenceDiagrams from '@/components/spring-jwt-sequence-diagrams';
import {buildSpringJwtDemoTree,listSpringJwtDemoFiles} from '@/lib/spring-jwt-demo-source';

export const metadata={
  title:'JWT Authentication — Spring Boot 3 / Security 6',
  description:'Production-style JWT access + refresh in Spring Boot: BCrypt, AuthenticationManager, JwtAuthenticationFilter, rotation, logout denylist, tests, curl.',
};

export default function SpringJwtDemoPage(){
  const files=listSpringJwtDemoFiles();
  const tree=buildSpringJwtDemoTree(files);
  const defaultPath=files.find((f)=>f.path.includes('SecurityConfig.java'))?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Spring Security · JWT
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          JWT authentication — access + refresh
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Runnable Spring Boot 3.4 / Security 6 / Java 21 lab. The <strong>app is the IdP</strong>:
          email+password → HS256 access JWT (15m) + opaque refresh token (7d, hashed, rotated).
          Not OAuth2 and not OIDC — those are{' '}
          <Link href="/oauth-jwt-demo" className="font-semibold underline dark:text-blue-400">OAuth + JWT</Link>
          {' '}and{' '}
          <Link href="/idanywhere-demo" className="font-semibold underline dark:text-blue-400">IDAnywhere OIDC</Link>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#jwt-stack" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Diagrams →</a>
          <span className="text-slate-300">·</span>
          <a href="#curl" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">curl →</a>
          <span className="text-slate-300">·</span>
          <a href="#checklist" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Checklist →</a>
          <span className="text-slate-300">·</span>
          <a href="#interview" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Interview →</a>
          <span className="text-slate-300">·</span>
          <a href="#source" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">Source →</a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          What this lab is
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Piece</th>
                <th className="px-4 py-3 font-semibold">Implementation</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Authn</td>
                <td className="px-4 py-3"><code>AuthenticationManager</code> + BCrypt — never compare passwords by hand</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Authz</td>
                <td className="px-4 py-3"><code>@PreAuthorize</code> + URL rules. USER vs ADMIN</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Access JWT</td>
                <td className="px-4 py-3">jjwt 0.12 HS256 — <code>sub iat exp iss aud jti roles</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Refresh</td>
                <td className="px-4 py-3">Opaque 256-bit, SHA-256 in DB, rotation + family reuse detection</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Filter</td>
                <td className="px-4 py-3"><code>addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter)</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Secret</td>
                <td className="px-4 py-3"><code>JWT_SECRET</code> env → <code>JwtSecretProvider</code> → optional AWS Secrets Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd spring-jwt-auth-demo
mvn test
mvn spring-boot:run
# http://127.0.0.1:8092
# user@example.com / admin@example.com   password StrongPassword123!`}</pre>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Authentication vs authorization
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Login answers <strong>who are you?</strong> Method security answers <strong>what may you do?</strong>
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`@GetMapping("/me")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public UserResponse me(@AuthenticationPrincipal CustomUserDetails principal) { ... }

@GetMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public List<UserResponse> listUsers() { ... }`}</pre>
      </section>

      <SpringJwtSequenceDiagrams />

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          CSRF, cookies, CORS
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Bearer header + stateless API:</strong> CSRF is disabled. Browsers do not attach
            <code> Authorization</code> on a forged cross-site form POST.
          </li>
          <li>
            <strong>JWT in an HttpOnly cookie:</strong> CSRF is back on — enable Spring CSRF (or SameSite=strict + extra header).
          </li>
          <li>
            <strong>CORS:</strong> allowlist from <code>security.cors.allowed-origins</code>. Never <code>*</code> with credentials.
          </li>
        </ul>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Storage</th>
                <th className="px-4 py-3 font-semibold">XSS</th>
                <th className="px-4 py-3 font-semibold">CSRF</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">localStorage</td>
                <td className="px-4 py-3">JS can steal token</td>
                <td className="px-4 py-3">No automatic cookie send</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">HttpOnly cookie</td>
                <td className="px-4 py-3">JS cannot read</td>
                <td className="px-4 py-3">Browser sends cookie — CSRF on</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Memory + Authorization header</td>
                <td className="px-4 py-3">Best XSS posture</td>
                <td className="px-4 py-3">CSRF off — <strong>this lab</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="curl" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          curl
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`BASE=http://127.0.0.1:8092

# register
curl -sS -X POST $BASE/api/auth/register -H 'Content-Type: application/json' \\
  -d '{"email":"newuser@example.com","password":"StrongPassword123!"}'

# login
curl -sS -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \\
  -d '{"email":"user@example.com","password":"StrongPassword123!"}'
# → accessToken, refreshToken, tokenType=Bearer, expiresIn=900

# me
curl -sS $BASE/api/users/me -H "Authorization: Bearer $ACCESS"

# admin (403 for user, 200 for admin@example.com)
curl -sS $BASE/api/admin/users -H "Authorization: Bearer $ACCESS"

# refresh (old refresh is revoked)
curl -sS -X POST $BASE/api/auth/refresh -H 'Content-Type: application/json' \\
  -d '{"refreshToken":"'$REFRESH'"}'

# logout
curl -sS -X POST $BASE/api/auth/logout -H "Authorization: Bearer $ACCESS" \\
  -H 'Content-Type: application/json' -d '{"refreshToken":"'$REFRESH'"}'`}</pre>
      </section>

      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Secrets — env vs AWS
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`ECS / EKS (preferred)
  AWS Secrets Manager  →  env JWT_SECRET  →  EnvironmentJwtSecretProvider  →  JwtService

Optional JVM fetch (profile aws-secrets)
  SecretsManagerClient.getSecretValue(prod/jwt-auth)  →  hmac JSON field

Key rotation
  JWT_SECRET = new key (sign + verify)
  JWT_PREVIOUS_SECRET = old key (verify only until access tokens expire)`}</pre>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          HS256 is enough when one service signs and verifies. Many resource servers that must not hold the signing secret should use RS256/ES256 + JWKS instead.
        </p>
      </section>

      <section id="checklist" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Production checklist
        </h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`[x] JWT secret/key is outside source code (env / Secrets Manager)
[ ] HTTPS enabled at the load balancer
[x] Short access-token lifetime (15m)
[x] Refresh-token rotation enabled
[x] Refresh-token revocation + reuse detection
[x] Password hashing (BCrypt 12)
[x] CORS restricted allowlist
[x] CSRF decision documented (Bearer → off; cookie → on)
[x] 401/403 JSON handlers
[x] JWT / password / Authorization not logged
[x] Rate limiting on /api/auth/login and /register
[x] Brute-force lockout after 5 failures
[x] Key rotation via JWT_PREVIOUS_SECRET
[x] Unit + integration tests
[ ] Secrets stored in Secrets Manager in the real account
[ ] Monitoring/alerts on 401 spikes and refresh reuse`}</pre>
      </section>

      <section id="interview" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Senior interview (short)
        </h2>
        <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <div><dt className="font-semibold">Why JWT?</dt><dd>APIs without sticky server sessions. Claims + signature travel with the request.</dd></div>
          <div><dt className="font-semibold">JWT vs session</dt><dd>Session is server state (easy kill, extra store). JWT is self-contained until you add a denylist or refresh table — this lab does both.</dd></div>
          <div><dt className="font-semibold">Access vs refresh</dt><dd>Access is short and sent on every call. Refresh is long-lived, hashed, used only at <code>/api/auth/refresh</code>.</dd></div>
          <div><dt className="font-semibold">Where SecurityContext is set</dt><dd><code>JwtAuthenticationFilter</code> after signature / exp / iss / aud / subject checks.</dd></div>
          <div><dt className="font-semibold">Roles → authorities</dt><dd>Filter reloads <code>UserDetails</code>; <code>ROLE_*</code> from DB become <code>GrantedAuthority</code>. JWT roles are not trusted alone so a disabled user is rejected immediately.</dd></div>
          <div><dt className="font-semibold">Logout</dt><dd>Revoke refresh + denylist access <code>jti</code>. Deleting the client copy does not invalidate a still-unexpired access JWT by itself.</dd></div>
          <div><dt className="font-semibold">Rotation / replay</dt><dd>A revoked refresh presented again revokes the whole family.</dd></div>
          <div><dt className="font-semibold">HS256 vs RS256</dt><dd>One secret vs private-sign / public-verify. Use RS256 when many services verify tokens they did not issue.</dd></div>
          <div><dt className="font-semibold">Risks</dt><dd>Secret in git, <code>alg=none</code>, long-lived access tokens, JWT in localStorage + XSS, PII in claims, logging the Authorization header.</dd></div>
        </dl>
      </section>

      <div id="source" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Source explorer
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Start at <code>SecurityConfig.java</code>, <code>JwtService.java</code>, <code>JwtAuthenticationFilter.java</code>,
          then <code>AuthService.java</code> and <code>RefreshTokenService.java</code>.
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
              routeBase="/spring-jwt-demo"
              ariaLabel="JWT auth demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
