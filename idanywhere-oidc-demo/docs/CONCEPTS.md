# Concepts — IDAnywhere, ADFS, OIDC, Okta, Keycloak

## If you are confused

Separate three layers:

| Layer | Examples | What it is |
|---|---|---|
| **Protocol** | OAuth 2.0, OIDC, SAML | Rules machines speak |
| **Product / IdP** | IDAnywhere, Okta, Keycloak, ADFS | Login service you redirect to |
| **Directory** | Active Directory | Where users & groups are stored |

- **SSO** = user signs in once at a company login; apps trust tokens instead of collecting passwords.
- **OAuth 2.0** = authorization (can this client call that API?) → `access_token`.
- **OIDC** = identity on top of OAuth → also `id_token` + discovery. Browser SSO almost always means OIDC (`scope=openid`).

## One-sentence map

| Term | Layer |
|---|---|
| **OAuth 2.0** | Authorization framework (access tokens) |
| **OIDC** | Identity on top of OAuth (`id_token`, discovery) |
| **AD** | User/group directory |
| **ADFS** | Microsoft federation IdP (can speak OIDC and/or SAML) |
| **IDAnywhere** | Corporate SSO gateway in front of ADFS (your usual `issuer-uri`) |
| **Okta / Keycloak** | Other IdP products that also speak OIDC |

## Relationship

```text
Active Directory  →  ADFS  →  IDAnywhere (OIDC front door)  →  Your Spring app
                                      ↑
                         Okta / Keycloak are alternate IdPs
                         (same OIDC contract, different issuer-uri)
```

### Airport analogy

| Piece | Like… | Job |
|---|---|---|
| **AD** | Employee / passenger database | Stores users & groups; verifies password |
| **ADFS** | Immigration | Federates login against AD; issues assertions / tokens |
| **IDAnywhere** | Airport front desk | Branded OIDC entrance your app calls |
| **Spring app** | The gate you enter | Speaks OIDC only — never stores AD passwords |

### Who talks to whom

| Who | User types password here? | Spring calls it? |
|---|---|---|
| Spring web-app | No | — |
| IDAnywhere | Often shows branded UI | Yes — issuer, authorize, token, JWKS |
| ADFS | May authn behind IDAnywhere | Usually **no** (gateway federates) |
| Active Directory | Yes (via ADFS) | **No** LDAP from this lab |

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

## Two tokens

| Token | For | Job |
|---|---|---|
| `id_token` | Login app / session | Who logged in |
| `access_token` | Resource API | Permission to call the API |
