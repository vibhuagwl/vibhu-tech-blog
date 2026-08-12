# CSRF interview talk track

## What CSRF is

Cross-Site Request Forgery: attacker site tricks the victim's browser into sending a state-changing request to your origin **while the session cookie is auto-attached**.

## Defense

Spring Security issues a secret CSRF token bound to the session (or cookie). Mutating requests must present that token. Attackers on another origin cannot read it (same-origin policy).

## Modes in this demo

| Mode | Path | Token delivery |
|---|---|---|
| Session (default) | `/transfer` | Hidden `_csrf` form field |
| Cookie (SPA) | `/spa/**` | `XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header |
| Disabled | typical JWT API | No browser session cookie → CSRF N/A |

## Do not say

- “Always disable CSRF in Spring Boot 3”
- “HTTPS alone stops CSRF”
- “CORS replaces CSRF”
