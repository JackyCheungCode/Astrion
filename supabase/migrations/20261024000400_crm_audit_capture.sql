-- Append-only audit capture for CRM records and restricted audit visibility.
begin;

drop policy if exists crm_audit_log_read_member on public.crm_audit_log;
create policy crm_audit_log_read_admin on public.crm_audit_log
  for select to authenticated using (
    public.has_org_role(organization_id, array['owner','admin','sales_manager','analyst'])
  );

create or replace function public.capture_crm_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_entity uuid;
  v_before jsonb;
  v_after jsonb;
  v_action text;
begin
  if tg_op = 'DELETE' then
    v_org := old.organization_id;
    v_entity := old.id;
    v_before := to_jsonb(old);
    v_after := null;
    v_action := 'delete';
  elsif tg_op = 'UPDATE' then
    v_org := new.organization_id;
    v_entity := new.id;
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    v_action := 'update';
  else
    v_org := new.organization_id;
    v_entity := new.id;
    v_before := null;
    v_after := to_jsonb(new);
    v_action := 'insert';
  end if;

  insert into public.crm_audit_log(organization_id,actor_id,entity_name,entity_id,action,before_data,after_data)
  values(v_org,auth.uid(),tg_table_name,v_entity,v_action,v_before,v_after);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_products',
    'crm_quotes','crm_sales_orders','crm_activities','crm_field_definitions'
  ] loop
    execute format('drop trigger if exists %I_audit_event on public.%I',t,t);
    execute format('create trigger %I_audit_event after insert or update or delete on public.%I for each row execute function public.capture_crm_audit_event()',t,t);
  end loop;
end $$;

revoke all on function public.capture_crm_audit_event() from public;

commit;
