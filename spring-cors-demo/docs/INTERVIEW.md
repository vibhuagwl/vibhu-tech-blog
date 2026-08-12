# CORS interview talk track

## Live example (memorize the URLs)

| Piece | URL |
|---|---|
| Frontend | `http://localhost:5500` |
| API | `http://localhost:8091` |
| Allowlist | `http://localhost:5500` |
| Evil (blocked) | `http://evil.example` |

1. Page on :5500 calls API on :8091 → browser sends `Origin`  
2. Allowed → `200` + `Access-Control-Allow-Origin: http://localhost:5500`  
3. Evil origin → **HTTP 403** `Invalid CORS request`  
4. JSON + Auth → **OPTIONS preflight** first  

## Fix

```java
http.cors(Customizer.withDefaults());
// CorsConfigurationSource with exact allowed origins
// Never Allow-Origin: * with Allow-Credentials: true
```

## Do not say

- "CORS replaces authentication"
- "CORS replaces CSRF"
- "Allow-Origin: * with credentials"
