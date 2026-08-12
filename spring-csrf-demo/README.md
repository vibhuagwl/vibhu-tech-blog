# Spring Security CSRF Protection Demo

Runnable lab for the Spring Security hub: session CSRF, Cookie CSRF for SPA paths, and when to disable CSRF.

## Run

```bash
cd spring-csrf-demo
mvn test
mvn spring-boot:run
```

Open http://localhost:8090 — login `alice` / `password`.

## What to try

1. Submit **Transfer** (includes `_csrf`) → success
2. Click **Forge transfer without CSRF** → HTTP 403
3. Inspect the hidden field / `XSRF-TOKEN` cookie under `/spa/**`

## Interview punchline

> CSRF matters when the browser automatically attaches credentials (session cookie). Stateless JWT Bearer APIs usually disable CSRF; cookie-session browser apps must keep it on.
