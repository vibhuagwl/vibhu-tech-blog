# Secure Kafka flows

Same IdP. Two validation planes. Spring Security never sees the SASL handshake.

## End-to-end: three questions

Do not memorize every callback class. Remember the three questions. Token A never goes to Kafka.

**Say this:** Caller gets an HTTP JWT. The API then gets a *different* JWT for Kafka. Kafka checks TLS, then the JWT,
then the ACL. Producer needs WRITE. Consumer needs READ on the topic *and* the group. Bad JWT is 401. Missing ACL is
403 — not a DLT.

```mermaid
sequenceDiagram
    autonumber
    actor You as Caller
    participant API as Payment API HTTP
    participant Prod as PaymentProducer
    participant Okta
    participant Broker as Kafka Broker
    participant Cons as PaymentConsumer

    Note over You,API: ACT 1 — Who may call the API?
    You->>Okta: token A as payment-api
    Okta-->>You: JWT aud=payment-api
    You->>API: POST /api/payments + Bearer token A
    API->>API: Spring Security checks JWT + payment:write
    Note over Prod,Broker: Producer and broker are idle in this act.

    Note over Prod,Broker: ACT 2 — Who may write the topic?
    API->>Prod: send PaymentEvent
    Prod->>Okta: token B as payment-producer
    Okta-->>Prod: JWT aud=kafka
    Prod->>Broker: TLS handshake
    Prod->>Broker: SASL OAUTHBEARER token B
    Broker->>Broker: ACL WRITE User:payment-producer
    Broker-->>Prod: offset stored
    API-->>You: 202 ACCEPTED

    Note over Broker,Cons: ACT 3 — Who may read the topic?
    Cons->>Okta: token C as payment-consumer
    Cons->>Broker: TLS + SASL OAUTHBEARER token C
    Broker->>Broker: ACL READ topic AND group
    Broker-->>Cons: PaymentEvent
```

## Producer only (TLS → token → ACL → write)

```mermaid
sequenceDiagram
    autonumber
    participant Prod as KafkaTemplate (payment-producer)
    participant IdP as Okta token + JWKS
    participant Broker as Kafka Broker
    participant ACL as StandardAuthorizer
    participant Topic as payments

    Prod->>Broker: ClientHello (SASL_SSL)
    Broker-->>Prod: ServerHello + broker cert
    Prod->>Prod: Verify cert via truststore (who I trust)
    Note over Prod,Broker: Socket is encrypted. Identity is not yet proven.

    Prod->>IdP: client_credentials (clientId=payment-producer)
    IdP-->>Prod: access_token JWT
    Prod->>Broker: SASL OAUTHBEARER token
    Broker->>IdP: JWKS
    IdP-->>Broker: keys
    Broker->>Broker: sig + iss + aud=kafka + exp
    Broker->>Broker: sub.claim.name=azp → User:payment-producer
    Broker->>ACL: Write + Describe topic payments
    alt WRITE ACL present
        ACL-->>Broker: allow
        Prod->>Topic: Produce (idempotent, acks=all)
        Topic-->>Prod: offset
    else Missing WRITE ACL
        ACL-->>Broker: deny
        Broker-->>Prod: TopicAuthorizationException
        Note over Prod: HTTP maps to 403. Not a DLT candidate.
    end
```

## Consumer only (token → topic ACL → group ACL → poll)

```mermaid
sequenceDiagram
    autonumber
    participant Cons as @KafkaListener (payment-consumer)
    participant IdP as Okta
    participant Broker as Kafka Broker
    participant ACL as StandardAuthorizer
    participant Topic as payments
    participant Group as group payment-service

    Cons->>IdP: client_credentials (payment-consumer)
    IdP-->>Cons: JWT aud=kafka azp=payment-consumer
    Cons->>Broker: TLS + SASL/OAUTHBEARER
    Broker->>Broker: Validate JWT → User:payment-consumer
    Broker->>ACL: READ + DESCRIBE payments
    ACL-->>Broker: allow
    Cons->>Group: Join / heartbeat / commit
    Broker->>ACL: READ group payment-service
    alt Group ACL present
        ACL-->>Broker: allow
        Topic-->>Cons: records
        Cons->>Cons: process PaymentEvent
    else Wrong consumer-group ACL
        ACL-->>Broker: deny
        Broker-->>Cons: GroupAuthorizationException
        Note over Cons: KAFKA_SECURITY_DENIED. Do not publish to DLT.
    end
```

## Two tokens, two audiences (do not mix)

```mermaid
sequenceDiagram
    autonumber
    participant Caller
    participant HTTP as SecurityFilterChain
    participant Kafka as Kafka client SASL
    participant ApiAs as Okta AS payment-api
    participant KafkaAs as Okta AS kafka

    Caller->>ApiAs: POST /oauth2/{apiAs}/v1/token
    ApiAs-->>Caller: JWT aud=payment-api
    Caller->>HTTP: Bearer JWT
    HTTP->>HTTP: JwtDecoder iss/aud/scp
    Note over HTTP: Spring Security Resource Server

    Kafka->>KafkaAs: POST /oauth2/{kafkaAs}/v1/token
    KafkaAs-->>Kafka: JWT aud=kafka azp=payment-producer
    Kafka->>Kafka: OAuthBearerLoginCallbackHandler
    Note over Kafka: Not a SecurityFilterChain. Different issuer.
```

## Failure: invalid or expired Kafka JWT

```mermaid
sequenceDiagram
    autonumber
    participant Prod as Producer
    participant IdP as Okta
    participant Broker as Kafka Broker

    alt Invalid client secret / unknown client
        Prod->>IdP: client_credentials
        IdP-->>Prod: 401 invalid_client
        Prod-->>Prod: SaslAuthenticationException
    else Token issued, broker rejects
        Prod->>IdP: client_credentials
        IdP-->>Prod: JWT (wrong aud or expired)
        Prod->>Broker: SASL OAUTHBEARER
        Broker->>Broker: ValidatorCallbackHandler fail
        Broker-->>Prod: SaslAuthenticationException invalid_token
    else Expired but still in cache window
        Prod->>Prod: refresh 30s before exp
        Prod->>IdP: client_credentials again
        IdP-->>Prod: new JWT
    end
```

## Failure: TLS handshake

```mermaid
sequenceDiagram
    autonumber
    participant Client as Kafka client
    participant Broker as Kafka Broker

    Client->>Broker: ClientHello
    Broker-->>Client: broker cert
    Client->>Client: PKIX path building (truststore)
    alt Untrusted CA or hostname mismatch
        Client-->>Client: SslAuthenticationException
        Note over Client: No SASL. No ACL. Socket never up.
    else Truststore has lab CA, SAN includes localhost
        Client->>Broker: Finished
        Note over Client,Broker: Proceed to SASL/OAUTHBEARER
    end
```
