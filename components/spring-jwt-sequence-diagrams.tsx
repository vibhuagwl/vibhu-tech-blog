'use client';

import Mermaid from '@/components/mermaid';

const REGISTER = `sequenceDiagram
    autonumber
    participant C as Client
    participant A as AuthController
    participant S as AuthService
    participant PE as PasswordEncoder
    participant R as UserRepository
    participant DB as Database

    C->>A: POST /api/auth/register
    A->>S: register request
    S->>R: existsByEmailIgnoreCase
    R->>DB: SELECT users
    DB-->>R: empty
    S->>PE: encode password
    PE-->>S: BCrypt hash
    S->>R: save user plus ROLE_USER
    R->>DB: INSERT users and user_roles
    S-->>A: UserResponse no password
    A-->>C: 201 Created`;

const LOGIN = `sequenceDiagram
    autonumber
    participant C as Client
    participant A as AuthController
    participant S as AuthService
    participant AM as AuthenticationManager
    participant UDS as UserDetailsService
    participant PE as PasswordEncoder
    participant DB as Database
    participant JWT as JwtService
    participant RT as RefreshTokenService

    C->>A: POST /api/auth/login
    A->>S: login email plus password
    S->>S: LoginAttemptService not locked
    S->>AM: authenticate
    AM->>UDS: loadUserByUsername email
    UDS->>DB: SELECT user and roles
    AM->>PE: matches raw vs BCrypt hash
    PE-->>AM: OK
    AM-->>S: CustomUserDetails
    S->>JWT: generateAccessToken HS256
    JWT-->>S: access JWT 15m
    S->>RT: issue opaque refresh
    RT->>DB: INSERT refresh_tokens SHA-256
    S-->>A: accessToken refreshToken expiresIn 900
    A-->>C: 200 JSON`;

const AUTHENTICATED = `sequenceDiagram
    autonumber
    participant C as Client
    participant Chain as SecurityFilterChain
    participant F as JwtAuthenticationFilter
    participant JWT as JwtService
    participant UDS as UserDetailsService
    participant CTX as SecurityContext
    participant UC as UserController

    C->>Chain: GET /api/users/me Authorization Bearer
    Chain->>F: OncePerRequestFilter
    F->>JWT: validate signature exp iss aud sub
    JWT-->>F: subject plus jti
    F->>F: AccessTokenDenylist check jti
    F->>UDS: loadUserByUsername
    UDS-->>F: UserDetails authorities
    F->>CTX: UsernamePasswordAuthenticationToken
    Chain->>UC: authenticated
    UC->>UC: PreAuthorize hasAnyRole USER ADMIN
    UC-->>C: 200 UserResponse`;

const REFRESH = `sequenceDiagram
    autonumber
    participant C as Client
    participant A as AuthController
    participant RT as RefreshTokenService
    participant DB as Database
    participant JWT as JwtService

    C->>A: POST /api/auth/refresh
    A->>RT: rotate raw token
    RT->>DB: SELECT by SHA-256 hash
    alt revoked reused
        RT->>DB: revoke entire family
        RT-->>C: 401 reuse detected
    else valid
        RT->>DB: revoke old insert new same family
        RT->>JWT: new access JWT
        A-->>C: 200 new access plus refresh
    end`;

const LOGOUT = `sequenceDiagram
    autonumber
    participant C as Client
    participant A as AuthController
    participant S as AuthService
    participant RT as RefreshTokenService
    participant DL as AccessTokenDenylist
    participant DB as Database

    C->>A: POST /api/auth/logout Bearer plus refresh body
    A->>S: logout
    S->>RT: revoke refresh hash
    RT->>DB: SET revoked_at
    S->>DL: deny access jti until exp
    Note over C,DL: Stateless access JWT is dead only via denylist or expiry
    A-->>C: 204 No Content`;

const STACK = `flowchart TD
  C[Client] -->|POST /api/auth/login| AC[AuthController]
  AC --> AS[AuthService]
  AS --> AM[AuthenticationManager]
  AM --> UDS[UserDetailsService]
  UDS --> DB[(users roles refresh_tokens)]
  AS --> JWT[JwtService HS256]
  AS --> RT[RefreshTokenService]
  C -->|Authorization Bearer| F[JwtAuthenticationFilter]
  F --> JWT
  F --> CTX[SecurityContext]
  CTX --> API["/api/users/me and /api/admin/users"]`;

const diagrams = [
  {
    id: 'jwt-stack',
    title: 'Architecture',
    blurb: 'This app is the IdP. Login issues tokens. Later calls send Bearer access JWTs. Refresh tokens live hashed in the database.',
    chart: STACK,
  },
  {
    id: 'jwt-register',
    title: 'Registration',
    blurb: 'Validate → unique email → BCrypt → ROLE_USER. Password hash never appears in the JSON.',
    chart: REGISTER,
  },
  {
    id: 'jwt-login',
    title: 'Login',
    blurb: 'AuthenticationManager compares the password. JwtService signs a 15-minute access JWT. RefreshTokenService stores only SHA-256 of an opaque token.',
    chart: LOGIN,
  },
  {
    id: 'jwt-request',
    title: 'Authenticated request',
    blurb: 'Filter validates JWT, rejects denylisted jti, reloads UserDetails so a disabled account is rejected even if the JWT is still unexpired.',
    chart: AUTHENTICATED,
  },
  {
    id: 'jwt-refresh',
    title: 'Refresh rotation + reuse detection',
    blurb: 'Each refresh revokes the old row and issues a new token in the same family. Presenting a revoked token revokes the whole family.',
    chart: REFRESH,
  },
  {
    id: 'jwt-logout',
    title: 'Logout',
    blurb: 'Refresh row is revoked. Access jti is denylisted until exp. Deleting the client copy alone does not kill a still-valid access JWT.',
    chart: LOGOUT,
  },
] as const;

export default function SpringJwtSequenceDiagrams() {
  return (
    <section className="mt-10 max-w-5xl" aria-labelledby="jwt-flows-heading">
      <h2 id="jwt-flows-heading" className="text-2xl font-bold tracking-[-.02em] text-slate-900 dark:text-white">
        Sequence diagrams
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Flows match the Java in <code>spring-jwt-auth-demo/</code> — not OAuth2 / OIDC.
      </p>
      <div className="mt-6 space-y-10">
        {diagrams.map((d) => (
          <article key={d.id} id={d.id} className="scroll-mt-24">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d.blurb}</p>
            <Mermaid chart={d.chart} />
          </article>
        ))}
      </div>
    </section>
  );
}
