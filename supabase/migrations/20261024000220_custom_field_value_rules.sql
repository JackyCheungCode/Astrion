-- Enforce custom-field metadata rules on persisted values.
begin;

create or replace function public.enforce_custom_field_value_rules()
returns trigger language plpgsql security definer
set search_path = public, private, auth
as $$
declare
  v_field public.crm_custom_field_definitions%rowtype;
  v_scalar text;
  v_numeric numeric;
begin
  if tg_op='DELETE' then
    select * into v_field
    from public.crm_custom_field_definitions
    where id=old.field_definition_id and workspace_id=old.workspace_id;
    if found and v_field.is_readonly then raise exception 'This custom field is read-only' using errcode='42501'; end if;
    if found and v_field.is_required then raise exception 'Required custom field "%" cannot be removed',v_field.label using errcode='23502'; end if;
    return old;
  end if;

  select * into v_field
  from public.crm_custom_field_definitions
  where id=new.field_definition_id and workspace_id=new.workspace_id and is_active=true;
  if not found then raise exception 'Custom field definition is not active in this workspace' using errcode='23503'; end if;

  if tg_op='UPDATE' and v_field.is_readonly and new.value is distinct from old.value then
    raise exception 'This custom field is read-only' using errcode='42501';
  end if;

  if (new.value is null or new.value='null'::jsonb) and v_field.default_value is not null then
    new.value := v_field.default_value;
  end if;

  if v_field.is_required and (new.value is null or new.value='null'::jsonb or new.value='""'::jsonb) then
    raise exception 'Custom field "%" is required',v_field.label using errcode='23502';
  end if;

  if v_field.is_unique and new.value is not null and new.value<>'null'::jsonb then
    perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text||':'||new.field_definition_id::text||':'||new.value::text,0));
    if exists (
      select 1 from public.crm_custom_field_values existing
      where existing.workspace_id=new.workspace_id
        and existing.field_definition_id=new.field_definition_id
        and existing.value=new.value
        and existing.record_id<>new.record_id
    ) then
      raise exception 'Custom field "%" must be unique',v_field.label using errcode='23505';
    end if;
  end if;

  if v_field.field_type in ('number','decimal','currency') and new.value is not null and new.value<>'null'::jsonb then
    begin
      v_numeric := (new.value #>> '{}')::numeric;
    exception when others then
      raise exception 'Custom field "%" must contain a number',v_field.label using errcode='22023';
    end;
    if v_field.validation_rules ? 'min' and v_numeric < (v_field.validation_rules->>'min')::numeric then
      raise exception 'Custom field "%" is below its minimum',v_field.label using errcode='23514';
    end if;
    if v_field.validation_rules ? 'max' and v_numeric > (v_field.validation_rules->>'max')::numeric then
      raise exception 'Custom field "%" exceeds its maximum',v_field.label using errcode='23514';
    end if;
  end if;

  if v_field.field_type in ('text','long_text','email','phone','url') and new.value is not null and new.value<>'null'::jsonb then
    v_scalar := new.value #>> '{}';
    if v_field.validation_rules ? 'max_length' and length(v_scalar) > (v_field.validation_rules->>'max_length')::integer then
      raise exception 'Custom field "%" exceeds maximum length',v_field.label using errcode='23514';
    end if;
    if v_field.validation_rules ? 'pattern' and v_scalar !~ (v_field.validation_rules->>'pattern') then
      raise exception 'Custom field "%" does not match its required pattern',v_field.label using errcode='23514';
    end if;
  end if;

  if v_field.field_type='single_select' and jsonb_typeof(v_field.options)='array' and jsonb_array_length(v_field.options)>0 and new.value is not null and new.value<>'null'::jsonb then
    v_scalar := new.value #>> '{}';
    if not exists(select 1 from jsonb_array_elements_text(v_field.options) as opts(option_value) where opts.option_value=v_scalar) then
      raise exception 'Custom field "%" has an unsupported option',v_field.label using errcode='23514';
    end if;
  end if;

  if v_field.field_type='multi_select' and jsonb_typeof(v_field.options)='array' and jsonb_array_length(v_field.options)>0 and new.value is not null and new.value<>'null'::jsonb then
    if jsonb_typeof(new.value)<>'array' then raise exception 'Custom field "%" must contain an array of options',v_field.label using errcode='22023'; end if;
    for v_scalar in select jsonb_array_elements_text(new.value) loop
      if not exists(select 1 from jsonb_array_elements_text(v_field.options) as opts(option_value) where opts.option_value=v_scalar) then
        raise exception 'Custom field "%" has an unsupported option',v_field.label using errcode='23514';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists crm_custom_field_values_rules_guard on public.crm_custom_field_values;
create trigger crm_custom_field_values_rules_guard
before insert or update or delete on public.crm_custom_field_values
for each row execute function public.enforce_custom_field_value_rules();

drop trigger if exists crm_custom_field_values_audit_event on public.crm_custom_field_values;
create trigger crm_custom_field_values_audit_event
after insert or update or delete on public.crm_custom_field_values
for each row execute function public.capture_audit_event();

revoke all on function public.enforce_custom_field_value_rules() from public;

commit;
