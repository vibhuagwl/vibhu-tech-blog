CREATE TABLE users (
    id           VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(128) NOT NULL,
    email        VARCHAR(256) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
