CREATE TABLE IF NOT EXISTS stock (
    sku VARCHAR(64) PRIMARY KEY,
    available INT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL
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

CREATE INDEX IF NOT EXISTS idx_inventory_outbox_status ON outbox(status, created_at);
