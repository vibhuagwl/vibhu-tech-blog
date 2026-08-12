CREATE TABLE roles (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(64) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    enabled    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id),
    role_id BIGINT NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);
