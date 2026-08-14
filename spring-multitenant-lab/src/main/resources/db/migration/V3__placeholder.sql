-- PostgreSQL Row-Level Security (skipped on H2 via flyway placeholders / conditional).
-- This script is PostgreSQL-only. For H2 lab profile we use V3__rls_postgres.sql only when dialect is postgres.
-- Flyway will run this; on H2 MODE=PostgreSQL some RLS DDL fails — we put RLS in a separate profile migration.
SELECT 1;
