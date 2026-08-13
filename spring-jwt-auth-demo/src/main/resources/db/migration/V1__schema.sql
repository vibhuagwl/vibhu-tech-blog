CREATE TABLE roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    CONSTRAINT uk_roles_name UNIQUE (name)
);

CREATE TABLE users (
    id                       BIGSERIAL PRIMARY KEY,
    email                    VARCHAR(255) NOT NULL,
    password_hash            VARCHAR(255) NOT NULL,
    enabled                  BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_expired      BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_locked       BOOLEAN NOT NULL DEFAULT TRUE,
    credentials_non_expired  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- Opaque refresh tokens stored as SHA-256 hex. Raw token never persisted.
CREATE TABLE refresh_tokens (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash     VARCHAR(64) NOT NULL,
    family_id      VARCHAR(36) NOT NULL,
    expires_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at     TIMESTAMP WITH TIME ZONE,
    replaced_by_id BIGINT REFERENCES refresh_tokens (id),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens (family_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

INSERT INTO roles (name) VALUES ('ROLE_USER');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');
