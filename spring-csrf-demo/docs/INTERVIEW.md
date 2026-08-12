# CSRF interview talk track

## Live example (memorize the URLs)

| Role | URL |
|---|---|
| Bank (victim logged in) | `https://bank.example.com` |
| Attacker page | `https://evil-gifts.example/win-prize.html` |
| Local demo | `http://localhost:8090/transfer` |

1. Victim logs into bank → `JSESSIONID` cookie set  
2. Victim opens evil page → hidden form POSTs to `/transfer`  
3. Browser auto-attaches bank cookie  
4. **With CSRF ON → HTTP 403** `Invalid CSRF token found for .../transfer`  
5. Transfer does **not** execute  

## Fix

```java
http.csrf(Customizer.withDefaults());
```

```html
<input type="hidden" name="_csrf" value="..."/>
```

Evil site cannot read the token (same-origin policy).

## Do not say

- “Always disable CSRF in Spring Boot 3”
- “HTTPS alone stops CSRF”
- “CORS replaces CSRF”
