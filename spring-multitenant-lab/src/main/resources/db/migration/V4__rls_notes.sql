-- Enable when running against real PostgreSQL (profile infra + multitenant.rls.enabled=true).
-- Application sets: SELECT set_config('app.current_tenant', '<uuid>', true);

-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY orders_tenant_isolation ON orders
--   USING (tenant_id::text = current_setting('app.current_tenant', true));
-- ALTER TABLE orders FORCE ROW LEVEL SECURITY;

SELECT 1;
