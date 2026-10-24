-- Run with Supabase CLI: supabase test db
begin;
select plan(56);

select has_table('public','workspaces','workspaces table exists');
select has_table('public','workspace_memberships','workspace_memberships table exists');
select has_table('public','crm_accounts','crm_accounts table exists');
select has_table('public','crm_contacts','crm_contacts table exists');
select has_table('public','crm_leads','crm_leads table exists');
select has_table('public','crm_opportunities','crm_opportunities table exists');
select has_table('public','crm_activities','crm_activities table exists');
select has_table('public','crm_custom_field_definitions','crm_custom_field_definitions table exists');
select has_table('public','crm_custom_field_values','crm_custom_field_values table exists');
select has_table('public','audit_events','audit_events table exists');
select has_table('public','crm_products','crm_products table exists');
select has_table('public','crm_quotes','crm_quotes table exists');
select has_table('public','crm_quote_lines','crm_quote_lines table exists');
select has_table('public','crm_sales_orders','crm_sales_orders table exists');
select has_table('public','crm_order_lines','crm_order_lines table exists');
select has_table('public','crm_service_cases','crm_service_cases table exists');
select has_table('public','crm_campaigns','crm_campaigns table exists');
select has_table('public','crm_campaign_members','crm_campaign_members table exists');
select has_table('public','automation_workflows','automation_workflows table exists');
select has_table('public','automation_runs','automation_runs table exists');
select has_table('public','crm_notifications','crm_notifications table exists');

select has_table('public','crm_shipments','crm_shipments table exists');
select has_table('public','crm_shipment_lines','crm_shipment_lines table exists');
select has_table('public','crm_contracts','crm_contracts table exists');
select has_table('public','crm_invoices','crm_invoices table exists');
select has_table('public','crm_payments','crm_payments table exists');
select has_table('public','crm_service_work_orders','crm_service_work_orders table exists');
select has_table('public','crm_sla_policies','crm_sla_policies table exists');
select has_table('public','crm_approval_requests','crm_approval_requests table exists');
select has_table('public','crm_import_jobs','crm_import_jobs table exists');
select has_table('public','crm_duplicate_rules','crm_duplicate_rules table exists');
select has_table('public','crm_duplicate_reviews','crm_duplicate_reviews table exists');
select has_table('public','integration_connections','integration_connections table exists');
select has_table('public','integration_sync_runs','integration_sync_runs table exists');

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


select has_table('public','crm_number_counters','crm_number_counters table exists');
select has_column('public','crm_quotes','converted_order_id','quotes track converted orders');
select has_function('public','next_crm_number',ARRAY['uuid','text'],'workspace document numbering function exists');
select has_function('public','convert_lead_to_account',ARRAY['uuid','text','text','boolean','text'],'atomic lead conversion function exists');
select has_function('public','convert_accepted_quote_to_order',ARRAY['uuid','text'],'accepted quote conversion function exists');
select has_trigger('public','crm_accounts','crm_accounts_audit_event','accounts audit trigger exists');
select has_trigger('public','crm_quotes','crm_quotes_audit_event','quotes audit trigger exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='crm_custom_field_definitions' and policyname='crm_custom_field_definitions_admin_insert'),'custom field insert policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_events' and policyname='audit_admin_select'),'restricted audit read policy exists');


select has_trigger('public','crm_leads','crm_leads_workspace_link_guard','lead workspace relationship guard exists');
select has_trigger('public','crm_custom_field_values','crm_custom_field_values_scope_guard','custom field scope guard exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='crm_accounts' and policyname='crm_accounts_role_insert'),'account role insert policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='crm_accounts' and policyname='crm_accounts_role_update'),'account role update policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='crm_custom_field_definitions' and policyname='crm_custom_field_definitions_admin_update'),'custom field update policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='crm_number_counters' and policyname='crm_number_counters_member_select'),'number counter member policy exists');


select has_table('public','ai_acquisition_usage','AI acquisition usage table exists');
select has_function('public','reserve_acquisition_request',ARRAY['uuid','text[]','text'],'acquisition request reservation function exists');
select has_function('public','complete_acquisition_request',ARRAY['uuid','uuid','text','integer','integer'],'acquisition request completion function exists');

select has_column('public','crm_sales_orders','customer_reference','sales orders support customer reference editing');

select * from finish();
rollback;
