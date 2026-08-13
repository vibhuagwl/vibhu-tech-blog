import {Suspense} from 'react';
import Link from 'next/link';
import OAuthCodeExplorer from '@/components/oauth-code-explorer';
import IdAnywhereSequenceDiagrams from '@/components/idanywhere-sequence-diagrams';
import {buildIdAnywhereDemoTree,listIdAnywhereDemoFiles} from '@/lib/idanywhere-demo-source';

export const metadata={
  title:'IDAnywhere / ADFS / OIDC SSO — Spring Security',
  description:'OIDC SSO explained: relationship of OIDC, ADFS, IDAnywhere; Okta and Keycloak profiles; internal token flow; detailed sequence diagrams; runnable Spring demo.',
};

export default function IdAnywhereDemoPage(){
  const files=listIdAnywhereDemoFiles();
  const tree=buildIdAnywhereDemoTree(files);
  const defaultPath=files.find((f)=>f.path.includes('application-okta.yml'))?.path
    ?? files.find((f)=>f.path==='docs/CONCEPTS.md')?.path
    ?? files.find((f)=>f.path==='README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Spring Security · OIDC SSO
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          IDAnywhere / ADFS / OIDC SSO
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          How OIDC SSO works internally, how IDAnywhere relates to ADFS, and how the <strong>same Spring app</strong> can
          use Okta or Keycloak by swapping <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-900">issuer-uri</code>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="#relationship" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            OIDC ↔ ADFS ↔ IDAnywhere →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#ways" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Implementation ways →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#internal" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Internal sequence →
          </a>
          <span className="text-slate-300">·</span>
          <a href="#okta-keycloak" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Okta / Keycloak →
          </a>
          <span className="text-slate-300">·</span>
          <Link href="/spring-security" className="font-semibold text-slate-700 hover:underline dark:text-blue-400">
            Spring Security hub →
          </Link>
        </div>
      </header>

      {/* Relationship */}
      <section id="relationship" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Relationship: OIDC · ADFS · IDAnywhere
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          These are <strong>not</strong> three competing login systems. They sit on different layers.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">What it is</th>
                <th className="px-4 py-3 font-semibold">Your app talks to it how?</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">OAuth 2.0</td>
                <td className="px-4 py-3">Authorization framework (tokens, scopes, grants)</td>
                <td className="px-4 py-3">Gets <code>access_token</code> for APIs</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">OIDC</td>
                <td className="px-4 py-3">Identity layer <em>on top of</em> OAuth 2.0 (<code>openid</code>, <code>id_token</code>, discovery)</td>
                <td className="px-4 py-3">Standard protocol Spring Security speaks</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">AD (Active Directory)</td>
                <td className="px-4 py-3">Corporate user / group directory</td>
                <td className="px-4 py-3">Usually <strong>not</strong> directly — via federation</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">ADFS</td>
                <td className="px-4 py-3">Microsoft federation server (can speak SAML <em>and</em> OIDC)</td>
                <td className="px-4 py-3">Issues tokens / federates login</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">IDAnywhere</td>
                <td className="px-4 py-3">Enterprise SSO <strong>gateway</strong> in front of ADFS (branding, routing, discovery)</td>
                <td className="px-4 py-3">Your <code>issuer-uri</code> points here</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">Okta / Keycloak</td>
                <td className="px-4 py-3">Other IdP products that also speak OIDC</td>
                <td className="px-4 py-3">Same Spring code — different issuer</td>
              </tr>
            </tbody>
          </table>
        </div>
        <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vibhu-tech-blog/images/spring-security/oidc-idanywhere-adfs-relationship.svg"
            alt="OIDC vs OAuth2 vs ADFS vs IDAnywhere vs Okta vs Keycloak relationship diagram"
            className="h-auto w-full"
          />
        </figure>
        <blockquote className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <strong>One sentence:</strong> OIDC is the protocol. ADFS is a Microsoft IdP that can speak OIDC.
          IDAnywhere is the corporate front door to ADFS. Okta and Keycloak are other IdPs — your Spring app only changes <code>issuer-uri</code>.
        </blockquote>
      </section>

      {/* Ways */}
      <section id="ways" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Ways to implement OIDC SSO
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Approach</th>
                <th className="px-4 py-3 font-semibold">When to use</th>
                <th className="px-4 py-3 font-semibold">Spring piece</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">1. Authorization Code (confidential web app)</td>
                <td className="px-4 py-3">Server-rendered / BFF holds client secret — <strong>this demo</strong></td>
                <td className="px-4 py-3"><code>oauth2Login</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">2. Authorization Code + PKCE (public / SPA)</td>
                <td className="px-4 py-3">SPA without secret — prefer BFF that still uses code flow</td>
                <td className="px-4 py-3">SPA SDK or BFF <code>oauth2Login</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">3. BFF pattern</td>
                <td className="px-4 py-3">SPA + cookie session to BFF; BFF talks OIDC to IdP</td>
                <td className="px-4 py-3">Gateway / Spring BFF</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">4. JWT resource server only</td>
                <td className="px-4 py-3">APIs that trust Bearer tokens from any OIDC IdP</td>
                <td className="px-4 py-3"><code>oauth2ResourceServer().jwt()</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3 font-semibold">5. SAML (legacy)</td>
                <td className="px-4 py-3">Older enterprise apps — ADFS classic</td>
                <td className="px-4 py-3">Spring SAML — not this lab</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Avoid ROPC (password grant) for browser SSO. Prefer Authorization Code so passwords stay on the IdP.
        </p>
      </section>

      {/* Okta Keycloak */}
      <section id="okta-keycloak" className="mt-10 max-w-5xl scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Can we use Okta or Keycloak? Yes.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Same <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">web-app</code> +{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">resource-api</code> code.
          Activate a Spring profile and set env vars.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Local stand-in</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Default — <code>idp-standin :9080</code></p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`# no profile
mvn -pl idp-standin,web-app,resource-api spring-boot:run`}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Okta</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Files: <code>application-okta.yml</code></p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`export OKTA_ISSUER_URI=https://dev-xxx.okta.com/oauth2/default
export OKTA_CLIENT_ID=...
export OKTA_CLIENT_SECRET=...
# web-app + resource-api
--spring.profiles.active=okta`}</pre>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Keycloak</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Files: <code>application-keycloak.yml</code></p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`export KEYCLOAK_ISSUER_URI=http://localhost:8080/realms/payments
export KEYCLOAK_CLIENT_ID=payments-web
export KEYCLOAK_CLIENT_SECRET=...
--spring.profiles.active=keycloak`}</pre>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">Redirect URI to register at every IdP</p>
          <p className="mt-1"><code>http://localhost:8088/login/oauth2/code/idanywhere</code></p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Registration id stays <code>idanywhere</code> across profiles — only <code>issuer-uri</code> and client secrets change.
            Corporate IDAnywhere: <code>--spring.profiles.active=idanywhere</code>.
          </p>
        </div>
      </section>

      {/* Internal how */}
      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          How it works internally (short)
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <li>User hits a protected page → Spring redirects to IdP <code>/authorize</code>.</li>
          <li>IdP authenticates (password/MFA/SSO) — your app never sees the password.</li>
          <li>IdP redirects back with an <strong>authorization code</strong>.</li>
          <li>Spring exchanges code at <code>/token</code> → gets <code>id_token</code> + <code>access_token</code>.</li>
          <li>Spring validates <code>id_token</code> (issuer, audience, nonce, signature via JWKS) and creates a session.</li>
          <li>API calls use <code>Authorization: Bearer &lt;access_token&gt;</code>; resource server validates JWT and maps groups → roles.</li>
        </ol>
      </section>

      {/* Stack table */}
      <section className="mt-10 max-w-5xl">
        <h2 className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Demo modules
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Port</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>idp-standin</code></td>
                <td className="px-4 py-3">9080</td>
                <td className="px-4 py-3">Local OIDC IdP (stand-in for IDAnywhere)</td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>web-app</code></td>
                <td className="px-4 py-3">8088</td>
                <td className="px-4 py-3">OIDC client — <code>oauth2Login</code></td>
              </tr>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3"><code>resource-api</code></td>
                <td className="px-4 py-3">8089</td>
                <td className="px-4 py-3">JWT resource server + group→role map</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{`cd idanywhere-oidc-demo
mvn test
mvn -pl idp-standin spring-boot:run
mvn -pl resource-api spring-boot:run
mvn -pl web-app spring-boot:run
# Open http://127.0.0.1:8088 — alice / admin , password password`}</pre>
      </section>

      <IdAnywhereSequenceDiagrams />

      <div id="source" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
          Source explorer
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Look at <code>application-okta.yml</code>, <code>application-keycloak.yml</code>, <code>application-idanywhere.yml</code>
          — same SecurityConfig, different issuers.
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
              routeBase="/idanywhere-demo"
              ariaLabel="IDAnywhere OIDC demo source tree"
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
