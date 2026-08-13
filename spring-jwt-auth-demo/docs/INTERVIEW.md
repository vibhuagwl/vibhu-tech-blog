# Interview — JWT auth (keep short)

**Why JWT?** APIs that must authenticate without sticky server sessions. The token is self-contained (claims + signature).

**JWT vs session:** Session stores state server-side (easy logout, extra hop). JWT is stateless until you add a denylist/refresh store.

**Access vs refresh:** Access is short (minutes) and sent on every call. Refresh is long-lived, stored hashed, rotated, used only at `/api/auth/refresh`.

**Where SecurityContext is set:** `JwtAuthenticationFilter` after signature/exp/iss/aud checks.

**Roles → authorities:** JWT `roles` claim is not used as the source of truth here — the filter reloads `UserDetails` so disabled accounts are rejected immediately. Authorities come from `ROLE_*` in the DB.

**Expired access token:** 401. Client uses refresh. Expired refresh: login again.

**Logout:** Revoke refresh (+ optional jti denylist). Deleting the client copy does **not** kill an already-issued access JWT.

**Rotation / replay:** Presenting a revoked refresh token revokes the whole family.

**HS256 vs RS256:** One secret vs private-sign / public-verify. Rotate HS256 with `JWT_PREVIOUS_SECRET` during overlap.

**Risks:** secret in git, `alg=none`, long-lived access tokens, JWT in localStorage + XSS, putting PII/passwords in claims, logging Authorization headers.
