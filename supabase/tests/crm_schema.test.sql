-- Run with Supabase CLI: supabase test db
begin;
select plan(52);

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

select has_table('public','crm_shipments');
select has_table('public','crm_shipment_lines');
select has_table('public','crm_contracts');
select has_table('public','crm_invoices');
select has_table('public','crm_payments');
select has_table('public','crm_service_work_orders');
select has_table('public','crm_sla_policies');
select has_table('public','crm_approval_requests');
select has_table('public','crm_import_jobs');
select has_table('public','crm_duplicate_rules');
select has_table('public','crm_duplicate_reviews');
select has_table('public','integration_connections');
select has_table('public','integration_sync_runs');

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


select has_table('public','crm_number_counters');
select has_column('public','crm_quotes','converted_order_id');
select has_function('public','next_crm_number',ARRAY['uuid','text']);
select has_function('public','convert_lead_to_account',ARRAY['uuid','text','text','boolean','text']);
select has_function('public','convert_accepted_quote_to_order',ARRAY['uuid','text']);
select has_trigger('public','crm_accounts','crm_accounts_audit_event');
select has_trigger('public','crm_quotes','crm_quotes_audit_event');
select has_policy('public','crm_custom_field_definitions','crm_custom_field_definitions_admin_insert');
select has_policy('public','audit_events','audit_admin_select');


select has_trigger('public','crm_leads','crm_leads_workspace_link_guard');
select has_trigger('public','crm_custom_field_values','crm_custom_field_values_scope_guard');
select has_policy('public','crm_accounts','crm_accounts_role_insert');
select has_policy('public','crm_accounts','crm_accounts_role_update');
select has_policy('public','crm_custom_field_definitions','crm_custom_field_definitions_admin_update');
select has_policy('public','crm_number_counters','crm_number_counters_member_select');

select * from finish();
rollback;
