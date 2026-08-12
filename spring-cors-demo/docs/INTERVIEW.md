# CORS interview talk track

## What CORS is

Cross-Origin Resource Sharing: the browser blocks JS on origin A from reading responses from origin B unless B opts in via CORS headers.

## End-to-end flow

1. Page on `http://localhost:5500` calls `http://localhost:8091/api/...`
2. Browser sends `Origin: http://localhost:5500`
3. For "non-simple" requests (JSON POST, custom headers, credentials) → **preflight OPTIONS**
4. Server responds with `Access-Control-Allow-Origin` (exact match) + methods/headers
5. Browser allows JS to read the real response — or blocks it

## Spring wiring

```java
http.cors(Customizer.withDefaults());
// + CorsConfigurationSource bean with allowlist
```

## Do not say

- "Server always runs the handler for evil origins" — Spring Security may reject with 403 Invalid CORS request before the controller
- "CORS replaces authentication"
- "CORS replaces CSRF"
- "Allow-Origin: * with credentials"