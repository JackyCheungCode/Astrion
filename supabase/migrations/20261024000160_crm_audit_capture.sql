-- Append-only audit capture for canonical workspace-scoped CRM and operations tables.
begin;

drop policy if exists audit_member_select on public.audit_events;
create policy audit_admin_select on public.audit_events for select to authenticated
using (private.has_workspace_role(workspace_id,array['owner','admin','sales_manager','analyst']));

create or replace function public.capture_audit_event()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_workspace_id uuid;
  v_record_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_action text;
begin
  if tg_op='DELETE' then
    v_workspace_id := old.workspace_id;
    v_record_id := old.id;
    v_before := to_jsonb(old);
    v_after := null;
    v_action := 'delete';
  elsif tg_op='UPDATE' then
    v_workspace_id := new.workspace_id;
    v_record_id := new.id;
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    v_action := 'update';
  else
    v_workspace_id := new.workspace_id;
    v_record_id := new.id;
    v_before := null;
    v_after := to_jsonb(new);
    v_action := 'insert';
  end if;

  insert into public.audit_events(
    workspace_id,actor_user_id,action_key,object_key,record_id,before_data,after_data,metadata
  ) values (
    v_workspace_id,auth.uid(),v_action,tg_table_name,v_record_id,v_before,v_after,
    jsonb_build_object('source','database_trigger','operation',tg_op)
  );
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare t text;
begin
 foreach t in array array[
  'crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_activities',
  'crm_custom_field_definitions','crm_custom_field_values','crm_products','crm_quotes',
  'crm_quote_lines','crm_sales_orders','crm_order_lines','crm_service_cases',
  'crm_campaigns','crm_campaign_members','automation_workflows','automation_runs',
  'crm_notifications','crm_shipments','crm_shipment_lines','crm_contracts','crm_invoices',
  'crm_payments','crm_service_work_orders','crm_sla_policies','crm_approval_requests',
  'crm_import_jobs','crm_duplicate_rules','crm_duplicate_reviews','integration_connections',
  'integration_sync_runs'
 ] loop
  execute format('drop trigger if exists %I_audit_event on public.%I',t,t);
  execute format('create trigger %I_audit_event after insert or update or delete on public.%I for each row execute function public.capture_audit_event()',t,t);
 end loop;
end $$;

revoke all on function public.capture_audit_event() from public;

commit;
