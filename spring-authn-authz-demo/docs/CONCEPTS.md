# Concepts — Authn vs Authz (no OAuth)

## Authentication
Proving identity. In this demo:
- **web-portal**: username/password form → `UsernamePasswordAuthenticationFilter` → `DaoAuthenticationProvider` → `DbUserDetailsService` → BCrypt check → `SecurityContext` in HTTP session.
- **api-service**: `Authorization: Basic ...` → `BasicAuthenticationFilter` → same provider stack → no session.

## Authorization
Deciding whether the authenticated principal may perform an action:
1. **URL / filter chain** — `authorizeHttpRequests` (`hasRole`, `authenticated`, `permitAll`)
2. **Method security** — `@PreAuthorize("hasRole('ADMIN')")` on services/controllers
3. **Role hierarchy** — `ROLE_ADMIN > ROLE_USER`

## What the “Authorization Server” is in OAuth (and why it is absent here)
In OAuth, a dedicated AS issues tokens for *other* apps. Here each Spring Boot app **is** the security boundary: it authenticates the user and authorizes requests locally. No token exchange protocol.

## Filter order (simplified)
```
SecurityFilterChain
  → ... ExceptionTranslationFilter
  → UsernamePasswordAuthenticationFilter  (portal)  OR  BasicAuthenticationFilter (api)
  → AuthorizationFilter   (URL rules)
  → Controller
       → @PreAuthorize (method rules)
```
