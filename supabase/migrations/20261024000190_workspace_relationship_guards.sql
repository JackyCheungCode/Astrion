-- Enforce same-workspace relationships where the legacy logical model uses single-column foreign keys.
begin;

create or replace function public.validate_core_workspace_links()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if tg_table_name='crm_accounts' then
    if new.parent_account_id is not null and not exists (
      select 1 from public.crm_accounts r where r.id=new.parent_account_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Parent account must belong to the same workspace' using errcode='23503'; end if;
  elsif tg_table_name='crm_contacts' then
    if new.account_id is not null and not exists (
      select 1 from public.crm_accounts r where r.id=new.account_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Contact account must belong to the same workspace' using errcode='23503'; end if;
  elsif tg_table_name='crm_leads' then
    if new.converted_account_id is not null and not exists (
      select 1 from public.crm_accounts r where r.id=new.converted_account_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Converted account must belong to the same workspace' using errcode='23503'; end if;
    if new.converted_contact_id is not null and not exists (
      select 1 from public.crm_contacts r where r.id=new.converted_contact_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Converted contact must belong to the same workspace' using errcode='23503'; end if;
    if new.converted_opportunity_id is not null and not exists (
      select 1 from public.crm_opportunities r where r.id=new.converted_opportunity_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Converted opportunity must belong to the same workspace' using errcode='23503'; end if;
  elsif tg_table_name='crm_opportunities' then
    if new.account_id is not null and not exists (
      select 1 from public.crm_accounts r where r.id=new.account_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Opportunity account must belong to the same workspace' using errcode='23503'; end if;
    if new.primary_contact_id is not null and not exists (
      select 1 from public.crm_contacts r where r.id=new.primary_contact_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Opportunity contact must belong to the same workspace' using errcode='23503'; end if;
    if new.lead_id is not null and not exists (
      select 1 from public.crm_leads r where r.id=new.lead_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Opportunity lead must belong to the same workspace' using errcode='23503'; end if;
  elsif tg_table_name='crm_activities' then
    if new.related_account_id is not null and not exists (
      select 1 from public.crm_accounts r where r.id=new.related_account_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Activity account must belong to the same workspace' using errcode='23503'; end if;
    if new.related_contact_id is not null and not exists (
      select 1 from public.crm_contacts r where r.id=new.related_contact_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Activity contact must belong to the same workspace' using errcode='23503'; end if;
    if new.related_lead_id is not null and not exists (
      select 1 from public.crm_leads r where r.id=new.related_lead_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Activity lead must belong to the same workspace' using errcode='23503'; end if;
    if new.related_opportunity_id is not null and not exists (
      select 1 from public.crm_opportunities r where r.id=new.related_opportunity_id and r.workspace_id=new.workspace_id
    ) then raise exception 'Activity opportunity must belong to the same workspace' using errcode='23503'; end if;
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
 foreach t in array array['crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_activities'] loop
  execute format('drop trigger if exists %I_workspace_link_guard on public.%I',t,t);
  execute format('create trigger %I_workspace_link_guard before insert or update on public.%I for each row execute function public.validate_core_workspace_links()',t,t);
 end loop;
end $$;

alter table public.crm_custom_field_values
  add constraint crm_custom_field_values_workspace_field_fk
  foreign key(workspace_id,field_definition_id)
  references public.crm_custom_field_definitions(workspace_id,id) on delete cascade;

create or replace function public.validate_custom_field_value_scope()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_definition_object text;
  v_record_exists boolean := false;
begin
  select object_key into v_definition_object
  from public.crm_custom_field_definitions
  where id=new.field_definition_id and workspace_id=new.workspace_id and is_active=true;
  if not found then raise exception 'Field definition must be active and belong to the same workspace' using errcode='23503'; end if;
  if v_definition_object<>new.object_key then raise exception 'Custom field object type does not match its field definition' using errcode='23514'; end if;

  case new.object_key
    when 'account' then select exists(select 1 from public.crm_accounts where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'contact' then select exists(select 1 from public.crm_contacts where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'lead' then select exists(select 1 from public.crm_leads where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'opportunity' then select exists(select 1 from public.crm_opportunities where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'activity' then select exists(select 1 from public.crm_activities where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'quote' then select exists(select 1 from public.crm_quotes where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'order' then select exists(select 1 from public.crm_sales_orders where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'case' then select exists(select 1 from public.crm_service_cases where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    when 'product' then select exists(select 1 from public.crm_products where id=new.record_id and workspace_id=new.workspace_id) into v_record_exists;
    else raise exception 'Unsupported custom field object type' using errcode='22023';
  end case;
  if not v_record_exists then raise exception 'Custom field record must belong to the same workspace' using errcode='23503'; end if;
  return new;
end;
$$;

drop trigger if exists crm_custom_field_values_scope_guard on public.crm_custom_field_values;
create trigger crm_custom_field_values_scope_guard
before insert or update on public.crm_custom_field_values
for each row execute function public.validate_custom_field_value_scope();

revoke all on function public.validate_core_workspace_links() from public;
revoke all on function public.validate_custom_field_value_scope() from public;

commit;
