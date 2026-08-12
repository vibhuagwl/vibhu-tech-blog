CREATE TABLE pii_access_audit (
    id                UUID PRIMARY KEY,
    occurred_at       TIMESTAMP NOT NULL,
    actor             VARCHAR(120) NOT NULL,
    source_service    VARCHAR(64) NOT NULL,
    action            VARCHAR(64) NOT NULL,
    customer_id       UUID NOT NULL,
    full_pii_granted  BOOLEAN NOT NULL,
    client_ip         VARCHAR(64) NOT NULL
);

CREATE INDEX idx_pii_audit_customer ON pii_access_audit (customer_id, occurred_at DESC);
