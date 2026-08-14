-- Shared schema multi-tenancy with tenant_id on every owned table.
-- Production Postgres also enables RLS (see V3). H2 skips RLS.

CREATE TABLE tenants (
    id              UUID PRIMARY KEY,
    slug            VARCHAR(64) NOT NULL UNIQUE,
    name            VARCHAR(128) NOT NULL,
    plan            VARCHAR(32) NOT NULL,
    status          VARCHAR(32) NOT NULL,
    database_strategy VARCHAR(32) NOT NULL,
    database_name   VARCHAR(128),
    schema_name     VARCHAR(128),
    region          VARCHAR(32) NOT NULL DEFAULT 'us-east-1',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE tenant_configuration (
    tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    timezone        VARCHAR(64) NOT NULL DEFAULT 'UTC',
    locale          VARCHAR(16) NOT NULL DEFAULT 'en-US',
    feature_flags   VARCHAR(2000) NOT NULL DEFAULT '{}',
    payment_provider VARCHAR(64) NOT NULL DEFAULT 'stripe-lab',
    max_users       INTEGER NOT NULL DEFAULT 100,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 1000,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    email           VARCHAR(256) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    password_hash   VARCHAR(256) NOT NULL,
    roles           VARCHAR(256) NOT NULL,
    status          VARCHAR(32) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_users_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE customers (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(256) NOT NULL,
    email           VARCHAR(256),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);

CREATE TABLE products (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    sku             VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    price           NUMERIC(19,2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_products_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_products_tenant ON products(tenant_id);

CREATE TABLE orders (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    customer_id     UUID NOT NULL,
    amount          NUMERIC(19,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    status          VARCHAR(50) NOT NULL,
    created_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at);

CREATE TABLE payments (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    order_id        UUID NOT NULL,
    amount          NUMERIC(19,2) NOT NULL,
    status          VARCHAR(50) NOT NULL,
    provider_ref    VARCHAR(128),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_tenant_order ON payments(tenant_id, order_id);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    actor_user_id   UUID,
    action          VARCHAR(64) NOT NULL,
    entity_type     VARCHAR(64) NOT NULL,
    entity_id       VARCHAR(128) NOT NULL,
    detail          VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);

CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    event_id        VARCHAR(128) NOT NULL UNIQUE,
    event_type      VARCHAR(64) NOT NULL,
    aggregate_id    VARCHAR(128) NOT NULL,
    payload         CLOB NOT NULL,
    status          VARCHAR(32) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at    TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_outbox_status ON outbox_events(status, created_at);
CREATE INDEX idx_outbox_tenant ON outbox_events(tenant_id);

CREATE TABLE dead_letter_events (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    event_id        VARCHAR(128) NOT NULL,
    topic           VARCHAR(128) NOT NULL,
    partition_no    INTEGER,
    offset_no       BIGINT,
    payload         CLOB NOT NULL,
    error_message   VARCHAR(2000),
    retry_count     INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(32) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_dlq_tenant ON dead_letter_events(tenant_id);
