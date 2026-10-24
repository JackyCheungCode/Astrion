-- Run with Supabase CLI: supabase test db
begin;
select plan(24);

select has_table('public','workspaces');
select has_table('public','workspace_memberships');
select has_table('public','crm_accounts');
select has_table('public','crm_contacts');
select has_table('public','crm_leads');
select has_table('public','crm_opportunities');
select has_table('public','crm_activities');
select has_table('public','crm_custom_field_definitions');
select has_table('public','crm_custom_field_values');
select has_table('public','audit_events');
select has_table('public','crm_products');
select has_table('public','crm_quotes');
select has_table('public','crm_quote_lines');
select has_table('public','crm_sales_orders');
select has_table('public','crm_order_lines');
select has_table('public','crm_service_cases');
select has_table('public','crm_campaigns');
select has_table('public','crm_campaign_members');
select has_table('public','automation_workflows');
select has_table('public','automation_runs');
select has_table('public','crm_notifications');

select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname='crm_accounts'),
  'CRM accounts enforce row-level security'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname='crm_leads'),
  'CRM leads enforce row-level security'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname='crm_sales_orders'),
  'Sales orders enforce row-level security'
);

select * from finish();
rollback;
