-- Replace member-only write checks with role-aware write permissions.
-- Read policies remain workspace-member scoped; readonly/analyst roles cannot mutate CRM data.
begin;

do $$
declare r record;
begin
  for r in
    select * from (values
      ('crm_accounts', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_contacts', ARRAY['owner','admin','sales_manager','sales_rep','service_agent']::text[]),
      ('crm_leads', ARRAY['owner','admin','sales_manager','sales_rep','marketing']::text[]),
      ('crm_opportunities', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_activities', ARRAY['owner','admin','sales_manager','sales_rep','marketing','service_agent']::text[]),
      ('crm_custom_field_values', ARRAY['owner','admin','sales_manager','sales_rep','marketing','service_agent']::text[]),
      ('crm_products', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_quotes', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_quote_lines', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_sales_orders', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_order_lines', ARRAY['owner','admin','sales_manager','sales_rep']::text[]),
      ('crm_service_cases', ARRAY['owner','admin','sales_manager','service_agent']::text[]),
      ('crm_campaigns', ARRAY['owner','admin','sales_manager','marketing']::text[]),
      ('crm_campaign_members', ARRAY['owner','admin','sales_manager','marketing']::text[]),
      ('automation_workflows', ARRAY['owner','admin','sales_manager','marketing']::text[]),
      ('automation_runs', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_notifications', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_shipments', ARRAY['owner','admin','sales_manager','sales_rep','service_agent']::text[]),
      ('crm_shipment_lines', ARRAY['owner','admin','sales_manager','sales_rep','service_agent']::text[]),
      ('crm_contracts', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_invoices', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_payments', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_service_work_orders', ARRAY['owner','admin','sales_manager','service_agent']::text[]),
      ('crm_sla_policies', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_approval_requests', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_import_jobs', ARRAY['owner','admin','sales_manager','marketing']::text[]),
      ('crm_duplicate_rules', ARRAY['owner','admin','sales_manager']::text[]),
      ('crm_duplicate_reviews', ARRAY['owner','admin','sales_manager','sales_rep','marketing']::text[]),
      ('integration_connections', ARRAY['owner','admin']::text[]),
      ('integration_sync_runs', ARRAY['owner','admin','sales_manager']::text[])
    ) as policy_map(table_name,write_roles)
  loop
    execute format('drop policy if exists %I on public.%I',r.table_name,r.table_name||'_member_insert');
    execute format('drop policy if exists %I on public.%I',r.table_name,r.table_name||'_member_update');
    execute format('drop policy if exists %I on public.%I',r.table_name,r.table_name||'_member_delete');

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.has_workspace_role(workspace_id,%L::text[]))',
      r.table_name||'_role_insert',r.table_name,r.write_roles::text
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_workspace_role(workspace_id,%L::text[])) with check (private.has_workspace_role(workspace_id,%L::text[]))',
      r.table_name||'_role_update',r.table_name,r.write_roles::text,r.write_roles::text
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.has_workspace_role(workspace_id,array[''owner'',''admin'',''sales_manager'']))',
      r.table_name||'_role_delete',r.table_name
    );
  end loop;
end $$;

commit;
