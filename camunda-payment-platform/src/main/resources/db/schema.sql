CREATE TABLE IF NOT EXISTS payment (
    payment_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    process_instance_key VARCHAR(64),
    fraud_detected BOOLEAN DEFAULT FALSE,
    bank_reference VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_customer ON payment (customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment (status);
