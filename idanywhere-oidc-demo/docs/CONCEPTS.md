# Concepts — IDAnywhere, ADFS, OIDC, Okta, Keycloak

## One-sentence map

| Term | Layer |
|---|---|
| **OAuth 2.0** | Authorization framework (access tokens) |
| **OIDC** | Identity on top of OAuth (`id_token`, discovery) |
| **AD** | User/group directory |
| **ADFS** | Microsoft federation IdP (can speak OIDC) |
| **IDAnywhere** | Corporate SSO gateway in front of ADFS |
| **Okta / Keycloak** | Other IdP products that also speak OIDC |

## Relationship

```text
Active Directory  →  ADFS  →  IDAnywhere (OIDC front door)  →  Your Spring app
                                      ↑
                         Okta / Keycloak are alternate IdPs
                         (same OIDC contract, different issuer-uri)
```

## Spring wiring (unchanged across IdPs)

1. `oauth2Login` client with `issuer-uri`
2. Resource server JWT with same issuer JWKS
3. Map IdP group/role claims → `ROLE_*`

Profiles in this repo:

| Profile | File |
|---|---|
| (default) | local `idp-standin` |
| `idanywhere` | `application-idanywhere.yml` |
| `okta` | `application-okta.yml` |
| `keycloak` | `application-keycloak.yml` |
