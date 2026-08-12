CREATE TABLE customers (
    id              UUID PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email_encrypted VARCHAR(512) NOT NULL,
    ssn_encrypted   VARCHAR(512) NOT NULL,
    pan_last4       VARCHAR(4) NOT NULL,
    created_at      TIMESTAMP NOT NULL
);
