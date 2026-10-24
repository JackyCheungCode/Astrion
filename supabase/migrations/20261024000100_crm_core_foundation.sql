-- Astrion CRM core schema foundation. Tenant-scoped records require workspace membership.
begin;
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text not null unique,
 default_locale text not null default 'zh-CN',
 default_timezone text not null default 'UTC',
 default_currency char(3) not null default 'EUR',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.workspace_memberships (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role_key text not null default 'sales_rep' check (role_key in ('owner','admin','sales_manager','sales_rep','marketing','service_agent','analyst','readonly')),
 team_key text,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(workspace_id,user_id)
);
create table if not exists public.crm_accounts (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 account_number text not null,
 name text not null,
 legal_name text,
 account_type text not null default 'prospect' check (account_type in ('prospect','customer','partner','supplier','competitor','inactive')),
 parent_account_id uuid references public.crm_accounts(id) on delete set null,
 industry text, website text, main_phone text, billing_email text,
 country_code char(2), region text, city text, postal_code text,
 address_line_1 text, address_line_2 text, tax_id text, registration_number text,
 annual_revenue numeric(20,2) check (annual_revenue is null or annual_revenue >= 0),
 employee_count integer check (employee_count is null or employee_count >= 0),
 currency char(3) not null default 'EUR',
 rating text check (rating is null or rating in ('cold','warm','hot','strategic')),
 lifecycle_stage text not null default 'new',
 owner_user_id uuid references auth.users(id) on delete set null,
 source text, external_ids jsonb not null default '{}'::jsonb, attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null,
 updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(workspace_id,id),
 unique(workspace_id,account_number)
);
create table if not exists public.crm_contacts (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 contact_number text not null,
 account_id uuid references public.crm_accounts(id) on delete set null,
 first_name text not null, last_name text not null,
 job_title text, department text, email text, phone text, mobile_phone text,
 preferred_language text, country_code char(2), decision_role text,
 buying_influence text check (buying_influence is null or buying_influence in ('unknown','user','influencer','evaluator','buyer','decision_maker','blocker')),
 consent_status text not null default 'unknown' check (consent_status in ('unknown','granted','withdrawn','not_required')),
 consent_updated_at timestamptz, linkedin_url text,
 owner_user_id uuid references auth.users(id) on delete set null,
 source text, external_ids jsonb not null default '{}'::jsonb, attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(workspace_id,id),
 unique(workspace_id,contact_number)
);
create table if not exists public.crm_leads (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 lead_number text not null, first_name text, last_name text, company_name text not null,
 title text, email text, phone text, website text, country_code char(2), region text, industry text,
 lead_source text not null default 'manual', source_detail text,
 status text not null default 'new' check (status in ('new','open','working','qualified','nurturing','converted','disqualified','recycled')),
 rating text check (rating is null or rating in ('cold','warm','hot')),
 score numeric(6,2) check (score is null or score between 0 and 100),
 qualification_notes text, disqualification_reason text,
 converted_account_id uuid references public.crm_accounts(id) on delete set null,
 converted_contact_id uuid references public.crm_contacts(id) on delete set null,
 converted_opportunity_id uuid, converted_at timestamptz,
 owner_user_id uuid references auth.users(id) on delete set null,
 campaign_key text, consent_status text not null default 'unknown' check (consent_status in ('unknown','granted','withdrawn','not_required')),
 enrichment_status text not null default 'not_started' check (enrichment_status in ('not_started','queued','running','complete','partial','failed','needs_review')),
 enrichment_evidence jsonb not null default '[]'::jsonb, external_ids jsonb not null default '{}'::jsonb, attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(workspace_id,id),
 unique(workspace_id,lead_number)
);
create table if not exists public.crm_opportunities (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 opportunity_number text not null, name text not null,
 account_id uuid references public.crm_accounts(id) on delete set null,
 primary_contact_id uuid references public.crm_contacts(id) on delete set null,
 lead_id uuid references public.crm_leads(id) on delete set null,
 stage text not null default 'prospecting' check (stage in ('prospecting','qualification','needs_analysis','value_proposition','proposal','negotiation','closed_won','closed_lost')),
 status text not null default 'open' check (status in ('open','won','lost','cancelled')),
 amount numeric(20,2) not null default 0 check (amount >= 0), currency char(3) not null default 'EUR',
 probability numeric(5,2) not null default 0 check (probability between 0 and 100),
 expected_close_date date, actual_close_date date, loss_reason text, next_step text,
 competitor_names text[] not null default '{}',
 owner_user_id uuid references auth.users(id) on delete set null, source text,
 external_ids jsonb not null default '{}'::jsonb, attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(workspace_id,id),
 unique(workspace_id,opportunity_number)
);
create table if not exists public.crm_activities (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 activity_type text not null check (activity_type in ('task','call','meeting','email','note','event')),
 subject text not null, description text,
 status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 due_at timestamptz, started_at timestamptz, completed_at timestamptz,
 owner_user_id uuid references auth.users(id) on delete set null,
 related_account_id uuid references public.crm_accounts(id) on delete cascade,
 related_contact_id uuid references public.crm_contacts(id) on delete cascade,
 related_lead_id uuid references public.crm_leads(id) on delete cascade,
 related_opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
 outcome text, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id),
 check (num_nonnulls(related_account_id,related_contact_id,related_lead_id,related_opportunity_id) >= 1)
);
create table if not exists public.crm_custom_field_definitions (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null check (object_key in ('account','contact','lead','opportunity','activity','quote','order','case','product')),
 field_key text not null, label text not null,
 field_type text not null check (field_type in ('text','long_text','number','decimal','currency','date','datetime','boolean','single_select','multi_select','email','phone','url','user_reference','record_reference','formula','auto_number','json')),
 is_required boolean not null default false, is_unique boolean not null default false,
 is_searchable boolean not null default true, is_filterable boolean not null default true,
 is_readonly boolean not null default false, default_value jsonb,
 options jsonb not null default '[]'::jsonb, validation_rules jsonb not null default '{}'::jsonb,
 visibility_rules jsonb not null default '{}'::jsonb, display_order integer not null default 0,
 is_active boolean not null default true, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id),
 unique(workspace_id,object_key,field_key)
);
create table if not exists public.crm_custom_field_values (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null, record_id uuid not null,
 field_definition_id uuid not null references public.crm_custom_field_definitions(id) on delete cascade,
 value jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,record_id,field_definition_id)
);
create table if not exists public.audit_events (
 id bigint generated always as identity primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_user_id uuid references auth.users(id) on delete set null,
 action_key text not null, object_key text not null, record_id uuid,
 occurred_at timestamptz not null default now(), request_id text,
 before_data jsonb, after_data jsonb, metadata jsonb not null default '{}'::jsonb
);

-- Composite foreign keys prevent records from linking across workspace boundaries.
alter table public.crm_accounts drop constraint if exists crm_accounts_parent_same_workspace;
alter table public.crm_accounts add constraint crm_accounts_parent_same_workspace
 foreign key (workspace_id,parent_account_id) references public.crm_accounts(workspace_id,id) on delete no action;
alter table public.crm_contacts drop constraint if exists crm_contacts_account_same_workspace;
alter table public.crm_contacts add constraint crm_contacts_account_same_workspace
 foreign key (workspace_id,account_id) references public.crm_accounts(workspace_id,id) on delete no action;
alter table public.crm_leads drop constraint if exists crm_leads_converted_account_same_workspace;
alter table public.crm_leads add constraint crm_leads_converted_account_same_workspace
 foreign key (workspace_id,converted_account_id) references public.crm_accounts(workspace_id,id) on delete no action;
alter table public.crm_leads drop constraint if exists crm_leads_converted_contact_same_workspace;
alter table public.crm_leads add constraint crm_leads_converted_contact_same_workspace
 foreign key (workspace_id,converted_contact_id) references public.crm_contacts(workspace_id,id) on delete no action;
alter table public.crm_opportunities drop constraint if exists crm_opportunities_account_same_workspace;
alter table public.crm_opportunities add constraint crm_opportunities_account_same_workspace
 foreign key (workspace_id,account_id) references public.crm_accounts(workspace_id,id) on delete no action;
alter table public.crm_opportunities drop constraint if exists crm_opportunities_contact_same_workspace;
alter table public.crm_opportunities add constraint crm_opportunities_contact_same_workspace
 foreign key (workspace_id,primary_contact_id) references public.crm_contacts(workspace_id,id) on delete no action;
alter table public.crm_opportunities drop constraint if exists crm_opportunities_lead_same_workspace;
alter table public.crm_opportunities add constraint crm_opportunities_lead_same_workspace
 foreign key (workspace_id,lead_id) references public.crm_leads(workspace_id,id) on delete no action;
alter table public.crm_activities drop constraint if exists crm_activities_account_same_workspace;
alter table public.crm_activities add constraint crm_activities_account_same_workspace
 foreign key (workspace_id,related_account_id) references public.crm_accounts(workspace_id,id) on delete no action;
alter table public.crm_activities drop constraint if exists crm_activities_contact_same_workspace;
alter table public.crm_activities add constraint crm_activities_contact_same_workspace
 foreign key (workspace_id,related_contact_id) references public.crm_contacts(workspace_id,id) on delete no action;
alter table public.crm_activities drop constraint if exists crm_activities_lead_same_workspace;
alter table public.crm_activities add constraint crm_activities_lead_same_workspace
 foreign key (workspace_id,related_lead_id) references public.crm_leads(workspace_id,id) on delete no action;
alter table public.crm_activities drop constraint if exists crm_activities_opportunity_same_workspace;
alter table public.crm_activities add constraint crm_activities_opportunity_same_workspace
 foreign key (workspace_id,related_opportunity_id) references public.crm_opportunities(workspace_id,id) on delete no action;
alter table public.crm_custom_field_values drop constraint if exists crm_custom_values_field_same_workspace;
alter table public.crm_custom_field_values add constraint crm_custom_values_field_same_workspace
 foreign key (workspace_id,field_definition_id) references public.crm_custom_field_definitions(workspace_id,id) on delete no action;

create index if not exists idx_memberships_user_workspace on public.workspace_memberships(user_id,workspace_id) where is_active;
create index if not exists idx_accounts_workspace_name on public.crm_accounts(workspace_id,name) where archived_at is null;
create index if not exists idx_contacts_workspace_account on public.crm_contacts(workspace_id,account_id) where archived_at is null;
create index if not exists idx_contacts_workspace_email on public.crm_contacts(workspace_id,lower(email)) where email is not null and archived_at is null;
create index if not exists idx_leads_workspace_status_score on public.crm_leads(workspace_id,status,score desc) where archived_at is null;
create index if not exists idx_opportunities_workspace_stage_close on public.crm_opportunities(workspace_id,stage,expected_close_date) where archived_at is null;
create index if not exists idx_activities_workspace_owner_due on public.crm_activities(workspace_id,owner_user_id,due_at) where status <> 'completed';
create index if not exists idx_custom_fields_object on public.crm_custom_field_definitions(workspace_id,object_key,display_order) where is_active;
create index if not exists idx_custom_values_record on public.crm_custom_field_values(workspace_id,object_key,record_id);
create index if not exists idx_audit_workspace_time on public.audit_events(workspace_id,occurred_at desc);
commit;
