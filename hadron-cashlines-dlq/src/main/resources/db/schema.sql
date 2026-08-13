-- Production PostgreSQL schema for Hadron CashLines DLQ.
-- Lab default uses H2 with Hibernate ddl-auto=update; this file is the contract.

CREATE TABLE IF NOT EXISTS cash_lines (
    cashline_id          VARCHAR(64) PRIMARY KEY,
    participant_id       VARCHAR(64) NOT NULL,
    account_id           VARCHAR(64) NOT NULL,
    currency             CHAR(3) NOT NULL,
    amount               NUMERIC(18, 4) NOT NULL,
    status               VARCHAR(32) NOT NULL,
    last_event_id        VARCHAR(128),
    last_sequence        INTEGER NOT NULL DEFAULT 0,
    version              INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashline_state (
    cashline_id                VARCHAR(64) PRIMARY KEY,
    last_processed_sequence    INTEGER NOT NULL DEFAULT 0,
    status                     VARCHAR(32) NOT NULL,
    blocked_reason             VARCHAR(64),
    version                    INTEGER NOT NULL DEFAULT 0,
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processed_events (
    event_id       VARCHAR(128) PRIMARY KEY,
    cashline_id    VARCHAR(64) NOT NULL,
    event_type     VARCHAR(64) NOT NULL,
    sequence_number INTEGER NOT NULL,
    processed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    status         VARCHAR(32) NOT NULL,
    version        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_processed_cashline ON processed_events (cashline_id);

CREATE TABLE IF NOT EXISTS waiting_events (
    id               BIGSERIAL PRIMARY KEY,
    event_id         VARCHAR(128) NOT NULL UNIQUE,
    cashline_id      VARCHAR(64) NOT NULL,
    sequence_number  INTEGER NOT NULL,
    event_type       VARCHAR(64) NOT NULL,
    payload          TEXT NOT NULL,
    expected_sequence INTEGER NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_waiting_cashline_seq ON waiting_events (cashline_id, sequence_number);

CREATE TABLE IF NOT EXISTS dead_letter_messages (
    id                 BIGSERIAL PRIMARY KEY,
    message_id         VARCHAR(128) NOT NULL,
    event_id           VARCHAR(128) NOT NULL,
    cashline_id        VARCHAR(64) NOT NULL,
    event_type         VARCHAR(64),
    topic              VARCHAR(128) NOT NULL,
    partition_no       INTEGER NOT NULL,
    offset_no          BIGINT NOT NULL,
    message_key        VARCHAR(128),
    payload            TEXT NOT NULL,
    headers            TEXT,
    exception_type     VARCHAR(256) NOT NULL,
    exception_message  VARCHAR(2000),
    failure_reason     VARCHAR(64) NOT NULL,
    retry_count        INTEGER NOT NULL DEFAULT 0,
    status             VARCHAR(32) NOT NULL,
    first_failed_at    TIMESTAMPTZ NOT NULL,
    last_failed_at     TIMESTAMPTZ NOT NULL,
    resolved_at        TIMESTAMPTZ,
    replayed_at        TIMESTAMPTZ,
    replay_count       INTEGER NOT NULL DEFAULT 0,
    replay_actor       VARCHAR(128),
    correlation_id     VARCHAR(128),
    version            INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_dlq_event UNIQUE (event_id),
    CONSTRAINT uk_dlq_tpo UNIQUE (topic, partition_no, offset_no)
);

-- Operator lookups by CashLine during an incident.
CREATE INDEX IF NOT EXISTS idx_dlq_cashline ON dead_letter_messages (cashline_id);
-- Dedup / replay safety if event_id unique is not enough for a given source.
CREATE INDEX IF NOT EXISTS idx_dlq_message_id ON dead_letter_messages (message_id);
-- Queue dashboards: FAILED / READY_FOR_REPLAY / REPLAYING.
CREATE INDEX IF NOT EXISTS idx_dlq_status ON dead_letter_messages (status);
-- Retention / cleanup jobs.
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON dead_letter_messages (created_at);
-- Kafka coordinate lookup after rebalance / offset questions.
CREATE INDEX IF NOT EXISTS idx_dlq_tpo_lookup ON dead_letter_messages (topic, partition_no, offset_no);

CREATE TABLE IF NOT EXISTS neptune_cash_lines (
    id            BIGSERIAL PRIMARY KEY,
    cashline_id   VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64) NOT NULL,
    account_id    VARCHAR(64) NOT NULL,
    currency      CHAR(3) NOT NULL,
    amount        NUMERIC(18, 4) NOT NULL,
    event_type    VARCHAR(64) NOT NULL,
    sequence_number INTEGER NOT NULL,
    version       INTEGER NOT NULL DEFAULT 1,
    deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_neptune_cursor ON neptune_cash_lines (updated_at, id);

CREATE TABLE IF NOT EXISTS poller_cursor (
    id              VARCHAR(64) PRIMARY KEY,
    last_updated_at TIMESTAMPTZ NOT NULL,
    last_id         BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor       VARCHAR(128) NOT NULL,
    action      VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id   VARCHAR(128) NOT NULL,
    detail      VARCHAR(1000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
