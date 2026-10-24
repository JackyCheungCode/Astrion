-- Astrion CRM core schema: multi-tenant foundation and core sales domains.
-- This migration defines schema only; deploy to a reviewed Supabase project before use.
begin;

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  default_currency char(3) not null default 'EUR',
  locale text not null default 'en',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'sales_rep' check (role in ('owner','admin','sales_manager','sales_rep','marketing','service_agent','analyst','read_only')),
  team_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id,user_id)
);
create index if not exists organization_memberships_user_idx on public.organization_memberships(user_id, organization_id) where is_active;

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.organization_memberships m where m.organization_id=target_org and m.user_id=auth.uid() and m.is_active); $$;

create or replace function public.has_org_role(target_org uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.organization_memberships m where m.organization_id=target_org and m.user_id=auth.uid() and m.is_active and m.role = any(allowed_roles)); $$;

create table if not exists public.crm_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_number text not null,
  account_name text not null,
  account_type text not null default 'prospect' check (account_type in ('prospect','customer','partner','competitor','supplier')),
  parent_account_id uuid references public.crm_accounts(id) on delete set null,
  industry text,
  website text,
  phone text,
  email text,
  tax_id text,
  registration_number text,
  annual_revenue numeric(18,2),
  employee_count integer check (employee_count is null or employee_count >= 0),
  currency char(3) not null default 'EUR',
  country_code char(2),
  region text,
  city text,
  postal_code text,
  address_line1 text,
  address_line2 text,
  customer_tier text,
  lifecycle_stage text not null default 'target',
  owner_id uuid references auth.users(id) on delete set null,
  source text,
  external_ids jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','inactive','pending_review','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, account_number)
);
create index if not exists crm_accounts_org_name_idx on public.crm_accounts(organization_id, lower(account_name));
create index if not exists crm_accounts_org_owner_idx on public.crm_accounts(organization_id, owner_id);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_number text not null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  first_name text,
  last_name text not null,
  full_name text generated always as (trim(coalesce(first_name || ' ', '') || last_name)) stored,
  job_title text,
  department text,
  email text,
  phone text,
  mobile_phone text,
  preferred_language text,
  country_code char(2),
  linkedin_url text,
  decision_role text,
  is_primary boolean not null default false,
  consent_status text not null default 'unknown' check (consent_status in ('unknown','granted','withdrawn','not_required')),
  owner_id uuid references auth.users(id) on delete set null,
  source text,
  external_ids jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','inactive','unverified','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, contact_number)
);
create index if not exists crm_contacts_org_account_idx on public.crm_contacts(organization_id, account_id);
create index if not exists crm_contacts_org_email_idx on public.crm_contacts(organization_id, lower(email)) where email is not null;

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_number text not null,
  first_name text,
  last_name text,
  company_name text not null,
  job_title text,
  email text,
  phone text,
  website text,
  industry text,
  country_code char(2),
  city text,
  source text not null default 'manual',
  source_detail text,
  campaign_id uuid,
  status text not null default 'new' check (status in ('new','open','working','nurturing','qualified','disqualified','converted')),
  rating text check (rating is null or rating in ('hot','warm','cold')),
  score numeric(5,2) check (score is null or score between 0 and 100),
  qualification_notes text,
  owner_id uuid references auth.users(id) on delete set null,
  converted_account_id uuid references public.crm_accounts(id) on delete set null,
  converted_contact_id uuid references public.crm_contacts(id) on delete set null,
  converted_opportunity_id uuid,
  converted_at timestamptz,
  research_evidence jsonb not null default '[]'::jsonb,
  external_ids jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, lead_number)
);
create index if not exists crm_leads_org_status_idx on public.crm_leads(organization_id,status,score desc);
create index if not exists crm_leads_org_email_idx on public.crm_leads(organization_id,lower(email)) where email is not null;

create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_number text not null,
  opportunity_name text not null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  primary_contact_id uuid references public.crm_contacts(id) on delete set null,
  lead_source text,
  stage text not null default 'prospecting' check (stage in ('prospecting','qualification','discovery','proposal','negotiation','closed_won','closed_lost')),
  probability numeric(5,2) not null default 10 check (probability between 0 and 100),
  amount numeric(18,2) not null default 0 check (amount >= 0),
  currency char(3) not null default 'EUR',
  expected_close_date date,
  actual_close_date date,
  loss_reason text,
  competitor text,
  forecast_category text not null default 'pipeline' check (forecast_category in ('pipeline','best_case','commit','closed','omitted')),
  owner_id uuid references auth.users(id) on delete set null,
  next_step text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, opportunity_number)
);
create index if not exists crm_opportunities_org_stage_idx on public.crm_opportunities(organization_id,stage,expected_close_date);

create table if not exists public.crm_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  product_name text not null,
  description text,
  product_family text,
  unit_of_measure text not null default 'each',
  list_price numeric(18,2) not null default 0 check (list_price >= 0),
  currency char(3) not null default 'EUR',
  is_active boolean not null default true,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,sku)
);

create table if not exists public.crm_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quote_number text not null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','in_review','approved','sent','accepted','rejected','expired','converted')),
  currency char(3) not null default 'EUR',
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  valid_until date,
  payment_terms text,
  delivery_terms text,
  owner_id uuid references auth.users(id) on delete set null,
  line_items jsonb not null default '[]'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,quote_number,version)
);

create table if not exists public.crm_sales_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_number text not null,
  quote_id uuid references public.crm_quotes(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  account_id uuid references public.crm_accounts(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending_approval','confirmed','in_fulfillment','partially_fulfilled','fulfilled','cancelled','closed')),
  order_date date not null default current_date,
  requested_delivery_date date,
  currency char(3) not null default 'EUR',
  subtotal numeric(18,2) not null default 0,
  discount_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  payment_terms text,
  shipping_address jsonb not null default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  owner_id uuid references auth.users(id) on delete set null,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,order_number)
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  activity_type text not null check (activity_type in ('call','email','meeting','task','note','system')),
  subject text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  related_account_id uuid references public.crm_accounts(id) on delete cascade,
  related_contact_id uuid references public.crm_contacts(id) on delete cascade,
  related_lead_id uuid references public.crm_leads(id) on delete cascade,
  related_opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_activities_org_due_idx on public.crm_activities(organization_id,status,due_at);

create table if not exists public.crm_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  object_name text not null,
  field_name text not null,
  label text not null,
  data_type text not null check (data_type in ('text','long_text','number','currency','date','datetime','boolean','select','multi_select','user','relation','formula','auto_number','email','phone','url','percent','json')),
  is_required boolean not null default false,
  is_unique boolean not null default false,
  is_searchable boolean not null default true,
  is_system boolean not null default false,
  is_active boolean not null default true,
  default_value jsonb,
  options jsonb not null default '[]'::jsonb,
  validation_rules jsonb not null default '{}'::jsonb,
  visibility_rules jsonb not null default '{}'::jsonb,
  display_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,object_name,field_name)
);

create table if not exists public.crm_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_name text not null,
  entity_id uuid,
  action text not null check (action in ('insert','update','delete','convert','approve','export','login','permission_change')),
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);
create index if not exists crm_audit_log_org_time_idx on public.crm_audit_log(organization_id,created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path=public
as $$ begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['organizations','crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_products','crm_quotes','crm_sales_orders','crm_activities','crm_field_definitions'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
create policy "members can read their organizations" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "members can read organization memberships" on public.organization_memberships for select to authenticated using (public.is_org_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array['crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_products','crm_quotes','crm_sales_orders','crm_activities','crm_field_definitions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_org_member(organization_id))',t||'_read_member',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_org_role(organization_id, array[''owner'',''admin'',''sales_manager'',''sales_rep'',''marketing'',''service_agent'']))',t||'_insert_member',t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_org_role(organization_id, array[''owner'',''admin'',''sales_manager'',''sales_rep'',''marketing'',''service_agent''])) with check (public.has_org_role(organization_id, array[''owner'',''admin'',''sales_manager'',''sales_rep'',''marketing'',''service_agent'']))',t||'_update_member',t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_org_role(organization_id, array[''owner'',''admin'']))',t||'_delete_admin',t);
  end loop;
end $;

-- Audit entries are append-only: members may read and authorized members may insert.
alter table public.crm_audit_log enable row level security;
create policy crm_audit_log_read_member on public.crm_audit_log
  for select to authenticated using (public.is_org_member(organization_id));
create policy crm_audit_log_insert_member on public.crm_audit_log
  for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','sales_manager','sales_rep','marketing','service_agent']));

-- Custom schema metadata is managed by workspace administrators/managers.
drop policy if exists crm_field_definitions_insert_member on public.crm_field_definitions;
drop policy if exists crm_field_definitions_update_member on public.crm_field_definitions;
drop policy if exists crm_field_definitions_delete_admin on public.crm_field_definitions;
create policy crm_field_definitions_insert_admin on public.crm_field_definitions
  for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','sales_manager']));
create policy crm_field_definitions_update_admin on public.crm_field_definitions
  for update to authenticated using (public.has_org_role(organization_id, array['owner','admin','sales_manager']))
  with check (public.has_org_role(organization_id, array['owner','admin','sales_manager']));
create policy crm_field_definitions_delete_admin on public.crm_field_definitions
  for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin']));

-- Membership/organization provisioning is intentionally server-controlled.
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
revoke all on function public.has_org_role(uuid,text[]) from public;
grant execute on function public.has_org_role(uuid,text[]) to authenticated;

commit;
