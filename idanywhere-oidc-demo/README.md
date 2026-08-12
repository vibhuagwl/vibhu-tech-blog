# IDAnywhere / ADFS / OIDC Demo

Runnable Spring Boot lab that shows **how production apps authenticate via IDAnywhere (OIDC on ADFS)** and authorize APIs from AD group claims.

You cannot hit corporate IDAnywhere from this public repo, so the lab ships a **local IdP stand-in** that speaks the same OAuth2/OIDC endpoints and emits ADFS-style claims (`upn`, `groups`, `aud`). Swap `issuer-uri` to real IDAnywhere for production.

## Architecture

```text
Browser → web-app :8088  (OIDC client / oauth2Login)
              │ Authorization Code + openid
              ▼
     idp-standin :9080   ←—— stand-in for IDAnywhere/ADFS
       /oauth2/authorize /oauth2/token /oauth2/jwks
       /.well-known/openid-configuration
              │ access_token JWT (aud=api://payments-api, groups=…)
              ▼
     resource-api :8089  (JWT resource server)
       groups → ROLE_USER / ROLE_ADMIN → @PreAuthorize
```

| Module | Port | Role |
|---|---|---|
| `idp-standin` | 9080 | Local OIDC AS mimicking IDAnywhere |
| `web-app` | 8088 | Confidential OIDC client |
| `resource-api` | 8089 | Validates JWT + maps AD groups |

## Quick start

```bash
cd idanywhere-oidc-demo
mvn clean test
mvn -pl idp-standin spring-boot:run     # :9080
mvn -pl resource-api spring-boot:run    # :8089
mvn -pl web-app spring-boot:run         # :8088
```

Open http://127.0.0.1:8088 → **Login via IDAnywhere** → users `alice` / `admin`, password `password`.

### Client credentials (service)

```bash
curl -s -u payments-svc:payments-svc-secret \
  -X POST http://localhost:9080/oauth2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&scope=api://payments-api/.default'
```

## Pointing at real IDAnywhere

1. Register the app in IDAnywhere/ADFS (client id, secret, redirect URIs, API audience).
2. Export secrets (never commit):

```bash
export IDA_CLIENT_ID=...
export IDA_CLIENT_SECRET=...
export IDA_ISSUER_URI=https://<idanywhere-host>/adfs   # use your real issuer
export IDA_API_AUDIENCE=api://payments-api
```

3. Run with the production profile:

```bash
mvn -pl web-app spring-boot:run -Dspring-boot.run.profiles=idanywhere
mvn -pl resource-api spring-boot:run -Dspring-boot.run.profiles=idanywhere
# Do NOT run idp-standin against real IDAnywhere
```

See `web-app/src/main/resources/application-idanywhere.yml`.

## Authn vs Authz

| Step | Who |
|---|---|
| Corporate login / MFA / SSO | IDAnywhere + ADFS |
| Issue ID + access tokens (OAuth + OIDC) | IDAnywhere |
| Validate JWT signature / iss / aud / exp | `resource-api` |
| Map `groups` → roles; `@PreAuthorize` | `resource-api` |

## Compare with other labs

| Lab | Identity |
|---|---|
| `spring-authn-authz-demo` | Local form / Basic — **no OAuth** |
| `oauth-jwt-demo` | Local Spring Authorization Server |
| **`idanywhere-oidc-demo`** | IDAnywhere/ADFS-shaped OIDC (stand-in + prod profile) |

## Docs

- [docs/CONCEPTS.md](docs/CONCEPTS.md)
- [docs/FLOWS.md](docs/FLOWS.md)
- [docs/PRODUCTION.md](docs/PRODUCTION.md)
- [docs/INTERVIEW.md](docs/INTERVIEW.md)
- [scripts/curl-examples.sh](scripts/curl-examples.sh)
