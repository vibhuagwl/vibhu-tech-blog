# CSRF flows

## Browser form (session token)

1. GET `/transfer` → `CsrfFilter` ensures token in session
2. HTML includes `<input name="_csrf" value="...">`
3. POST `/transfer` with token → allowed
4. POST without token → 403

## SPA cookie token

1. Authenticated GET `/spa/csrf` sets `XSRF-TOKEN` cookie (`HttpOnly=false`)
2. JS reads cookie, sets `X-XSRF-TOKEN` on POST `/spa/transfer`
3. Missing header → 403
