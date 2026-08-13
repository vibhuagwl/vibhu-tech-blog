-- Seed demo tenants: Walmart, Amazon, JP Morgan, ABC Retail
-- Fixed UUIDs for deterministic lab / tests.

INSERT INTO tenants (id, slug, name, plan, status, database_strategy, database_name, schema_name, region, created_at, updated_at)
VALUES
 ('11111111-1111-1111-1111-111111111111', 'walmart', 'Walmart', 'ENTERPRISE', 'ACTIVE', 'SHARED_SCHEMA', NULL, 'public', 'us-east-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('22222222-2222-2222-2222-222222222222', 'amazon', 'Amazon', 'ENTERPRISE', 'ACTIVE', 'SHARED_SCHEMA', NULL, 'public', 'us-east-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('33333333-3333-3333-3333-333333333333', 'jpmorgan', 'JP Morgan', 'ENTERPRISE', 'ACTIVE', 'DEDICATED_DATABASE', 'tenant_jpmorgan', NULL, 'us-east-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('44444444-4444-4444-4444-444444444444', 'abc-retail', 'ABC Retail', 'PREMIUM', 'ACTIVE', 'SHARED_SCHEMA', NULL, 'public', 'eu-west-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO tenant_configuration (tenant_id, currency, timezone, locale, feature_flags, payment_provider, max_users, rate_limit_per_minute, updated_at)
VALUES
 ('11111111-1111-1111-1111-111111111111', 'USD', 'America/Chicago', 'en-US', '{"reports":true}', 'stripe-lab', 5000, 5000, CURRENT_TIMESTAMP),
 ('22222222-2222-2222-2222-222222222222', 'USD', 'America/Los_Angeles', 'en-US', '{"reports":true}', 'stripe-lab', 8000, 8000, CURRENT_TIMESTAMP),
 ('33333333-3333-3333-3333-333333333333', 'USD', 'America/New_York', 'en-US', '{"reports":true,"dedicatedDb":true}', 'treasury-lab', 2000, 2000, CURRENT_TIMESTAMP),
 ('44444444-4444-4444-4444-444444444444', 'EUR', 'Europe/Berlin', 'en-GB', '{"reports":false}', 'stripe-lab', 200, 500, CURRENT_TIMESTAMP);

-- password for all demo users: password (BCrypt)
INSERT INTO users (id, tenant_id, email, display_name, password_hash, roles, status, created_at)
VALUES
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin@walmart.lab', 'Walmart Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsF.1Y0qH9mF9zqK0.', 'ADMIN,USER', 'ACTIVE', CURRENT_TIMESTAMP),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin@amazon.lab', 'Amazon Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsF.1Y0qH9mF9zqK0.', 'ADMIN,USER', 'ACTIVE', CURRENT_TIMESTAMP),
 ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'admin@jpmorgan.lab', 'JP Morgan Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsF.1Y0qH9mF9zqK0.', 'ADMIN,USER', 'ACTIVE', CURRENT_TIMESTAMP),
 ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'admin@abc.lab', 'ABC Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsF.1Y0qH9mF9zqK0.', 'ADMIN,USER', 'ACTIVE', CURRENT_TIMESTAMP);
