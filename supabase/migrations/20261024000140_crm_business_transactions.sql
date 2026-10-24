-- Atomic lead conversion and accepted-quote-to-order transactions on the canonical workspace schema.
begin;

alter table public.crm_quotes add column if not exists converted_order_id uuid;
alter table public.crm_quotes drop constraint if exists crm_quotes_status_check;
alter table public.crm_quotes add constraint crm_quotes_status_check
  check (status in ('draft','in_review','approved','sent','accepted','rejected','expired','cancelled','converted'));
alter table public.crm_quotes
  add constraint crm_quotes_converted_order_fk
  foreign key (workspace_id,converted_order_id)
  references public.crm_sales_orders(workspace_id,id);

create or replace function public.convert_lead_to_account(
  p_lead_id uuid,
  p_account_number text,
  p_contact_number text,
  p_create_opportunity boolean default false,
  p_opportunity_number text default null
)
returns jsonb language plpgsql security definer
set search_path = public, private, auth
as $$
declare
  v_lead public.crm_leads%rowtype;
  v_account_id uuid;
  v_contact_id uuid;
  v_opportunity_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if coalesce(trim(p_account_number),'')='' or coalesce(trim(p_contact_number),'')='' then
    raise exception 'Account and contact numbers are required' using errcode='22023';
  end if;
  select * into v_lead from public.crm_leads where id=p_lead_id for update;
  if not found then raise exception 'Lead not found' using errcode='P0002'; end if;
  if not private.has_workspace_role(v_lead.workspace_id,array['owner','admin','sales_manager','sales_rep']) then
    raise exception 'Insufficient permission to convert this lead' using errcode='42501';
  end if;
  if v_lead.status='converted' then raise exception 'Lead has already been converted' using errcode='23505'; end if;
  if v_lead.status='disqualified' then raise exception 'Disqualified leads cannot be converted' using errcode='22023'; end if;
  if p_create_opportunity and coalesce(trim(p_opportunity_number),'')='' then
    raise exception 'Opportunity number is required when creating an opportunity' using errcode='22023';
  end if;

  insert into public.crm_accounts(
    workspace_id,account_number,name,account_type,industry,website,country_code,region,city,
    owner_user_id,source,lifecycle_stage,created_by,updated_by
  ) values (
    v_lead.workspace_id,trim(p_account_number),v_lead.company_name,'customer',v_lead.industry,
    v_lead.website,v_lead.country_code,v_lead.region,null,
    coalesce(v_lead.owner_user_id,v_actor),v_lead.lead_source,'customer',v_actor,v_actor
  ) returning id into v_account_id;

  insert into public.crm_contacts(
    workspace_id,contact_number,account_id,first_name,last_name,job_title,email,phone,country_code,
    owner_user_id,source,created_by,updated_by
  ) values (
    v_lead.workspace_id,trim(p_contact_number),v_account_id,
    coalesce(nullif(trim(v_lead.first_name),''),'Primary'),
    coalesce(nullif(trim(v_lead.last_name),''),nullif(trim(v_lead.company_name),''),'Contact'),
    v_lead.title,v_lead.email,v_lead.phone,v_lead.country_code,
    coalesce(v_lead.owner_user_id,v_actor),v_lead.lead_source,v_actor,v_actor
  ) returning id into v_contact_id;

  if p_create_opportunity then
    insert into public.crm_opportunities(
      workspace_id,opportunity_number,name,account_id,primary_contact_id,lead_id,
      stage,status,amount,probability,owner_user_id,source,created_by,updated_by
    ) values (
      v_lead.workspace_id,trim(p_opportunity_number),v_lead.company_name||' - New opportunity',
      v_account_id,v_contact_id,v_lead.id,'prospecting','open',0,10,
      coalesce(v_lead.owner_user_id,v_actor),v_lead.lead_source,v_actor,v_actor
    ) returning id into v_opportunity_id;
  end if;

  update public.crm_leads set status='converted',converted_account_id=v_account_id,
    converted_contact_id=v_contact_id,converted_opportunity_id=v_opportunity_id,
    converted_at=now(),updated_by=v_actor,updated_at=now()
  where id=v_lead.id;

  insert into public.audit_events(workspace_id,actor_user_id,action_key,object_key,record_id,after_data,metadata)
  values(v_lead.workspace_id,v_actor,'convert','crm_leads',v_lead.id,
    jsonb_build_object('account_id',v_account_id,'contact_id',v_contact_id,'opportunity_id',v_opportunity_id),
    jsonb_build_object('source','convert_lead_to_account'));

  return jsonb_build_object('lead_id',v_lead.id,'account_id',v_account_id,'contact_id',v_contact_id,'opportunity_id',v_opportunity_id);
end;
$$;

create or replace function public.convert_accepted_quote_to_order(p_quote_id uuid,p_order_number text)
returns jsonb language plpgsql security definer
set search_path = public, private, auth
as $$
declare
  v_quote public.crm_quotes%rowtype;
  v_order_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if coalesce(trim(p_order_number),'')='' then raise exception 'Order number is required' using errcode='22023'; end if;
  select * into v_quote from public.crm_quotes where id=p_quote_id for update;
  if not found then raise exception 'Quote not found' using errcode='P0002'; end if;
  if not private.has_workspace_role(v_quote.workspace_id,array['owner','admin','sales_manager','sales_rep']) then
    raise exception 'Insufficient permission to convert this quote' using errcode='42501';
  end if;
  if v_quote.converted_order_id is not null then
    return jsonb_build_object('quote_id',v_quote.id,'order_id',v_quote.converted_order_id,'already_converted',true);
  end if;
  if v_quote.status<>'accepted' then raise exception 'Only accepted quotes can be converted to orders' using errcode='22023'; end if;
  if v_quote.valid_until is not null and v_quote.valid_until<current_date then
    raise exception 'Expired quotes cannot be converted to orders' using errcode='22023';
  end if;

  insert into public.crm_sales_orders(
    workspace_id,order_number,account_id,quote_id,status,order_date,currency,subtotal,
    discount_amount,tax_amount,total_amount,payment_terms,owner_user_id
  ) values (
    v_quote.workspace_id,trim(p_order_number),v_quote.account_id,v_quote.id,'confirmed',current_date,
    v_quote.currency,v_quote.subtotal,v_quote.discount_amount,v_quote.tax_amount,v_quote.total_amount,
    v_quote.payment_terms,coalesce(v_quote.owner_user_id,v_actor)
  ) returning id into v_order_id;

  update public.crm_quotes set status='converted',converted_order_id=v_order_id,updated_at=now()
  where id=v_quote.id;

  insert into public.audit_events(workspace_id,actor_user_id,action_key,object_key,record_id,after_data,metadata)
  values(v_quote.workspace_id,v_actor,'convert','crm_quotes',v_quote.id,
    jsonb_build_object('order_id',v_order_id,'order_number',trim(p_order_number)),
    jsonb_build_object('source','convert_accepted_quote_to_order'));

  return jsonb_build_object('quote_id',v_quote.id,'order_id',v_order_id,'already_converted',false);
end;
$$;

revoke all on function public.convert_lead_to_account(uuid,text,text,boolean,text) from public;
grant execute on function public.convert_lead_to_account(uuid,text,text,boolean,text) to authenticated;
revoke all on function public.convert_accepted_quote_to_order(uuid,text) from public;
grant execute on function public.convert_accepted_quote_to_order(uuid,text) to authenticated;

commit;
