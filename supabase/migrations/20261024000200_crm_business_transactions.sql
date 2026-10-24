-- Atomic CRM business transactions: lead conversion and accepted-quote order creation.
begin;

alter table public.crm_leads
  add constraint crm_leads_converted_opportunity_fk
  foreign key (converted_opportunity_id) references public.crm_opportunities(id) on delete set null;

alter table public.crm_quotes
  add column if not exists converted_order_id uuid;

alter table public.crm_quotes
  add constraint crm_quotes_converted_order_fk
  foreign key (converted_order_id) references public.crm_sales_orders(id) on delete set null;

create or replace function public.convert_lead_to_account(
  p_lead_id uuid,
  p_account_number text,
  p_contact_number text,
  p_create_opportunity boolean default false,
  p_opportunity_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.crm_leads%rowtype;
  v_account_id uuid;
  v_contact_id uuid;
  v_opportunity_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if coalesce(trim(p_account_number),'') = '' or coalesce(trim(p_contact_number),'') = '' then
    raise exception 'Account and contact numbers are required' using errcode = '22023';
  end if;

  select * into v_lead
  from public.crm_leads
  where id = p_lead_id
  for update;

  if not found then raise exception 'Lead not found' using errcode = 'P0002'; end if;
  if not public.has_org_role(v_lead.organization_id, array['owner','admin','sales_manager','sales_rep']) then
    raise exception 'Insufficient permission to convert this lead' using errcode = '42501';
  end if;
  if v_lead.status = 'converted' then
    raise exception 'Lead has already been converted' using errcode = '23505';
  end if;
  if v_lead.status = 'disqualified' then
    raise exception 'Disqualified leads cannot be converted' using errcode = '22023';
  end if;
  if p_create_opportunity and coalesce(trim(p_opportunity_number),'') = '' then
    raise exception 'Opportunity number is required when creating an opportunity' using errcode = '22023';
  end if;

  insert into public.crm_accounts (
    organization_id, account_number, account_name, industry, website, country_code, city,
    owner_id, source, lifecycle_stage, created_by
  ) values (
    v_lead.organization_id, trim(p_account_number), v_lead.company_name, v_lead.industry,
    v_lead.website, v_lead.country_code, v_lead.city,
    coalesce(v_lead.owner_id,v_actor), v_lead.source, 'customer', v_actor
  ) returning id into v_account_id;

  insert into public.crm_contacts (
    organization_id, contact_number, account_id, first_name, last_name, job_title,
    email, phone, country_code, owner_id, source, created_by
  ) values (
    v_lead.organization_id, trim(p_contact_number), v_account_id, v_lead.first_name,
    coalesce(nullif(trim(v_lead.last_name),''), nullif(trim(v_lead.company_name),''), 'Primary Contact'),
    v_lead.job_title, v_lead.email, v_lead.phone, v_lead.country_code,
    coalesce(v_lead.owner_id,v_actor), v_lead.source, v_actor
  ) returning id into v_contact_id;

  if p_create_opportunity then
    insert into public.crm_opportunities (
      organization_id, opportunity_number, opportunity_name, account_id,
      primary_contact_id, lead_source, stage, probability, amount, owner_id, created_by
    ) values (
      v_lead.organization_id, trim(p_opportunity_number), v_lead.company_name || ' - New opportunity',
      v_account_id, v_contact_id, v_lead.source, 'prospecting', 10, 0,
      coalesce(v_lead.owner_id,v_actor), v_actor
    ) returning id into v_opportunity_id;
  end if;

  update public.crm_leads
  set status='converted', converted_account_id=v_account_id, converted_contact_id=v_contact_id,
      converted_opportunity_id=v_opportunity_id, converted_at=now(), updated_at=now()
  where id=v_lead.id;

  insert into public.crm_audit_log(organization_id,actor_id,entity_name,entity_id,action,after_data)
  values (v_lead.organization_id,v_actor,'crm_leads',v_lead.id,'convert',
    jsonb_build_object('account_id',v_account_id,'contact_id',v_contact_id,'opportunity_id',v_opportunity_id));

  return jsonb_build_object('lead_id',v_lead.id,'account_id',v_account_id,'contact_id',v_contact_id,'opportunity_id',v_opportunity_id);
end;
$$;

create or replace function public.convert_accepted_quote_to_order(
  p_quote_id uuid,
  p_order_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote public.crm_quotes%rowtype;
  v_order_id uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if coalesce(trim(p_order_number),'') = '' then raise exception 'Order number is required' using errcode = '22023'; end if;

  select * into v_quote
  from public.crm_quotes
  where id = p_quote_id
  for update;

  if not found then raise exception 'Quote not found' using errcode = 'P0002'; end if;
  if not public.has_org_role(v_quote.organization_id, array['owner','admin','sales_manager','sales_rep']) then
    raise exception 'Insufficient permission to convert this quote' using errcode = '42501';
  end if;
  if v_quote.converted_order_id is not null then
    return jsonb_build_object('quote_id',v_quote.id,'order_id',v_quote.converted_order_id,'already_converted',true);
  end if;
  if v_quote.status <> 'accepted' then
    raise exception 'Only accepted quotes can be converted to orders' using errcode = '22023';
  end if;
  if v_quote.valid_until is not null and v_quote.valid_until < current_date then
    raise exception 'Expired quotes cannot be converted to orders' using errcode = '22023';
  end if;

  insert into public.crm_sales_orders (
    organization_id, order_number, quote_id, opportunity_id, account_id,
    status, order_date, currency, subtotal, discount_amount, tax_amount,
    total_amount, payment_terms, line_items, owner_id, created_by
  ) values (
    v_quote.organization_id, trim(p_order_number), v_quote.id, v_quote.opportunity_id, v_quote.account_id,
    'confirmed', current_date, v_quote.currency, v_quote.subtotal, v_quote.discount_amount,
    v_quote.tax_amount, v_quote.total_amount, v_quote.payment_terms, v_quote.line_items,
    coalesce(v_quote.owner_id,v_actor), v_actor
  ) returning id into v_order_id;

  update public.crm_quotes
  set status='converted', converted_order_id=v_order_id, updated_at=now()
  where id=v_quote.id;

  insert into public.crm_audit_log(organization_id,actor_id,entity_name,entity_id,action,after_data)
  values (v_quote.organization_id,v_actor,'crm_quotes',v_quote.id,'convert',
    jsonb_build_object('order_id',v_order_id,'order_number',trim(p_order_number)));

  return jsonb_build_object('quote_id',v_quote.id,'order_id',v_order_id,'already_converted',false);
end;
$$;

revoke all on function public.convert_lead_to_account(uuid,text,text,boolean,text) from public;
grant execute on function public.convert_lead_to_account(uuid,text,text,boolean,text) to authenticated;
revoke all on function public.convert_accepted_quote_to_order(uuid,text) from public;
grant execute on function public.convert_accepted_quote_to_order(uuid,text) to authenticated;

commit;
