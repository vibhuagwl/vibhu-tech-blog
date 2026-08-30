# Okta setup — two authorization servers

Kafka is **not** an HTTP resource server. Okta still issues both JWTs. Use **two custom authorization servers** so `aud`
cannot be reused across planes.

| Authorization server | Audience      | Who gets a token                                       | Token URL           |
|----------------------|---------------|--------------------------------------------------------|---------------------|
| `payment-api`        | `payment-api` | Caller → `POST /api/payments`                          | `{issuer}/v1/token` |
| `kafka`              | `kafka`       | `payment-producer`, `payment-consumer`, `kafka-broker` | `{issuer}/v1/token` |

Okta org authorization server (`https://{domain}/oauth2/v1/token`) has a single audience (`api://default`). Do not use
it for this lab.

## 1. Applications (API Services)

Admin → **Applications** → **Create App Integration** → **API Services** (client credentials). Create four:

| App name           | Assign to AS | Scopes                          |
|--------------------|--------------|---------------------------------|
| `payment-api`      | payment-api  | `payment:write`, `payment:read` |
| `payment-producer` | kafka        | `kafka`                         |
| `payment-consumer` | kafka        | `kafka`                         |
| `kafka-broker`     | kafka        | `kafka`                         |

Copy each **Client ID** (`0oa…`) and **Client secret** into `.env`.

## 2. Authorization servers

Admin → **Security** → **API** → **Authorization Servers** → **Add Authorization Server**.

### payment-api

- **Audience:** `payment-api` (exact string the Spring `JwtDecoder` checks)
- **Issuer:** `https://{yourOktaDomain}/oauth2/{asId}` — this is `OAUTH_ISSUER_URI`
- **Scopes:** `payment:write`, `payment:read` (default metadata is fine)
- **Access policy:** allow the `payment-api` app, grant type **Client Credentials**, scopes above
- **Claims:** none required for HTTP (Spring reads `scp` or `scope`)

### kafka

- **Audience:** `kafka`
- **Issuer:** `https://{yourOktaDomain}/oauth2/{asId}` — this is `KAFKA_OAUTH_ISSUER_URI`
- **Scopes:** `kafka`
- **Access policy:** allow `payment-producer`, `payment-consumer`, `kafka-broker`
- **Claims (required for readable ACLs):** add an **Access token** claim

| Field                 | Value        |
|-----------------------|--------------|
| Name                  | `azp`        |
| Include in token type | Access Token |
| Value type            | Expression   |
| Value                 | see below    |
| Include in            | Any scope    |

Expression (replace the `0oa…` ids with yours):

```text
app.clientId == "0oaProducerId" ? "payment-producer" : (app.clientId == "0oaConsumerId" ? "payment-consumer" : (app.clientId == "0oaBrokerId" ? "kafka-broker" : app.clientId))
```

Broker config is `sasl.oauthbearer.sub.claim.name=azp` so ACLs stay `User:payment-producer`.

If you skip this claim, set `OAUTH_PRINCIPAL_CLAIM=cid` and change ACL principals to the raw `0oa…` client ids. Okta’s
native app id is `cid`, not Keycloak’s `azp`.

## 3. Endpoints to put in `.env`

```text
# payment-api AS
OAUTH_ISSUER_URI=https://dev-xxxxx.okta.com/oauth2/ausXXXX
OAUTH_TOKEN_ENDPOINT=https://dev-xxxxx.okta.com/oauth2/ausXXXX/v1/token
OAUTH_API_AUDIENCE=payment-api

# kafka AS
KAFKA_OAUTH_ISSUER_URI=https://dev-xxxxx.okta.com/oauth2/ausYYYY
KAFKA_OAUTH_TOKEN_ENDPOINT=https://dev-xxxxx.okta.com/oauth2/ausYYYY/v1/token
KAFKA_OAUTH_JWKS_ENDPOINT=https://dev-xxxxx.okta.com/oauth2/ausYYYY/v1/keys
```

Discovery (public):

```text
GET {issuer}/.well-known/oauth-authorization-server
GET {issuer}/v1/keys
```

`iss` on the JWT must match the issuer **exactly** (no trailing slash).

## 4. Smoke-test a token

```bash
set -a && source .env && set +a
./scripts/get-token.sh
# decode payload: should show aud=payment-api and scp/scope containing payment:write
```

Kafka token (producer):

```bash
curl -sS -u "${KAFKA_PRODUCER_CLIENT_ID}:${KAFKA_PRODUCER_CLIENT_SECRET}" \
  -d grant_type=client_credentials -d scope=kafka \
  "${KAFKA_OAUTH_TOKEN_ENDPOINT}"
# payload: aud=kafka, azp=payment-producer (or cid=0oa… if you skipped the claim)
```

The payment-api token must **not** validate on the Kafka broker (`expected.audience=kafka`). That is the point.

## 5. Network

The Kafka container calls Okta over HTTPS for JWKS and (for the broker’s own login) the token endpoint. The JVM default
trust store already trusts public CAs. No Keycloak container.
