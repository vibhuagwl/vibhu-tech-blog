CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    total_amount DECIMAL(19, 4) NOT NULL,
    status VARCHAR(32) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    correlation_id VARCHAR(64),
    payment_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    inventory_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(19, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
    id VARCHAR(64) PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inbox (
    message_id VARCHAR(256) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status, created_at);
