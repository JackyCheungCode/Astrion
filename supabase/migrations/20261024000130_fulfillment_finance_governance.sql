-- Fulfillment, billing, approvals, and integration governance extensions.
begin;

create table if not exists public.crm_shipments (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 shipment_number text not null, order_id uuid not null,
 status text not null default 'planned' check (status in ('planned','ready','in_transit','partially_delivered','delivered','exception','returned','cancelled')),
 carrier text, tracking_number text, planned_ship_date date, shipped_at timestamptz,
 estimated_delivery_at timestamptz, delivered_at timestamptz, shipping_address jsonb not null default '{}'::jsonb,
 exception_reason text, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,shipment_number),
 foreign key(workspace_id,order_id) references public.crm_sales_orders(workspace_id,id)
);
create table if not exists public.crm_shipment_lines (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 shipment_id uuid not null, order_line_id uuid not null,
 quantity_shipped numeric(20,4) not null check (quantity_shipped > 0),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,shipment_id) references public.crm_shipments(workspace_id,id) on delete cascade,
 foreign key(workspace_id,order_line_id) references public.crm_order_lines(workspace_id,id)
);
create table if not exists public.crm_contracts (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 contract_number text not null, name text not null, account_id uuid not null, opportunity_id uuid,
 status text not null default 'draft' check (status in ('draft','in_review','active','expired','terminated','renewed')),
 contract_type text not null default 'customer',
 start_date date, end_date date, renewal_date date, auto_renew boolean not null default false,
 contract_value numeric(20,2) not null default 0 check (contract_value >= 0),
 currency char(3) not null default 'EUR', terms jsonb not null default '{}'::jsonb,
 owner_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,contract_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,opportunity_id) references public.crm_opportunities(workspace_id,id)
);
create table if not exists public.crm_invoices (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 invoice_number text not null, account_id uuid not null, order_id uuid, contract_id uuid,
 status text not null default 'draft' check (status in ('draft','issued','partially_paid','paid','overdue','void','written_off')),
 invoice_date date not null default current_date, due_date date,
 currency char(3) not null default 'EUR', subtotal numeric(20,2) not null default 0,
 tax_amount numeric(20,2) not null default 0, total_amount numeric(20,2) not null default 0,
 amount_paid numeric(20,2) not null default 0 check (amount_paid >= 0),
 billing_address jsonb not null default '{}'::jsonb, external_reference text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,invoice_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,order_id) references public.crm_sales_orders(workspace_id,id),
 foreign key(workspace_id,contract_id) references public.crm_contracts(workspace_id,id)
);
create table if not exists public.crm_payments (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 payment_number text not null, account_id uuid not null, invoice_id uuid,
 status text not null default 'received' check (status in ('pending','received','allocated','partially_refunded','refunded','failed','reversed')),
 payment_method text, payment_reference text, payment_date date not null default current_date,
 amount numeric(20,2) not null check (amount > 0), currency char(3) not null default 'EUR',
 allocated_amount numeric(20,2) not null default 0 check (allocated_amount >= 0 and allocated_amount <= amount),
 received_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,payment_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,invoice_id) references public.crm_invoices(workspace_id,id)
);
create table if not exists public.crm_service_work_orders (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 work_order_number text not null, case_id uuid, account_id uuid,
 status text not null default 'open' check (status in ('open','scheduled','in_progress','blocked','completed','cancelled')),
 work_type text, scheduled_start timestamptz, scheduled_end timestamptz,
 actual_start timestamptz, actual_end timestamptz, instructions text, completion_notes text,
 assigned_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,work_order_number),
 foreign key(workspace_id,case_id) references public.crm_service_cases(workspace_id,id),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id)
);
create table if not exists public.crm_sla_policies (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 policy_key text not null, name text not null, priority text not null default 'normal',
 first_response_minutes integer not null check (first_response_minutes > 0),
 resolution_minutes integer not null check (resolution_minutes > 0),
 business_calendar jsonb not null default '{}'::jsonb,
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,policy_key)
);
create table if not exists public.crm_approval_requests (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null, record_id uuid not null, approval_type text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','changes_requested')),
 requested_by uuid references auth.users(id) on delete set null,
 assigned_to uuid references auth.users(id) on delete set null,
 decision_by uuid references auth.users(id) on delete set null,
 decision_at timestamptz, decision_comment text,
 payload_snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id)
);
create table if not exists public.crm_import_jobs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null, source_name text, status text not null default 'queued'
 check (status in ('queued','validating','ready','running','completed','failed','cancelled')),
 mapping_config jsonb not null default '{}'::jsonb, validation_summary jsonb not null default '{}'::jsonb,
 total_rows integer not null default 0 check (total_rows >= 0),
 processed_rows integer not null default 0 check (processed_rows >= 0),
 error_rows integer not null default 0 check (error_rows >= 0),
 created_by uuid references auth.users(id) on delete set null,
 started_at timestamptz, finished_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id)
);
create table if not exists public.crm_duplicate_rules (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null, rule_key text not null, name text not null,
 match_fields jsonb not null default '[]'::jsonb,
 match_mode text not null default 'any' check (match_mode in ('any','all','weighted')),
 threshold numeric(5,2) not null default 85 check (threshold between 0 and 100),
 action_on_match text not null default 'review' check (action_on_match in ('review','block','auto_merge')),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,object_key,rule_key)
);
create table if not exists public.crm_duplicate_reviews (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 object_key text not null, left_record_id uuid not null, right_record_id uuid not null,
 rule_id uuid, match_score numeric(5,2) not null check (match_score between 0 and 100),
 status text not null default 'pending' check (status in ('pending','confirmed_duplicate','not_duplicate','merged','dismissed')),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 review_notes text, created_at timestamptz not null default now(),
 unique(workspace_id,id),
 check (left_record_id <> right_record_id),
 foreign key(workspace_id,rule_id) references public.crm_duplicate_rules(workspace_id,id)
);
create table if not exists public.integration_connections (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 provider_key text not null, display_name text not null,
 status text not null default 'not_connected' check (status in ('not_connected','pending','connected','degraded','error','disabled')),
 config_public jsonb not null default '{}'::jsonb,
 secret_reference text,
 last_sync_at timestamptz, last_error text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,provider_key)
);
create table if not exists public.integration_sync_runs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 connection_id uuid not null, status text not null default 'queued'
 check (status in ('queued','running','succeeded','partial','failed','cancelled')),
 direction text not null default 'inbound' check (direction in ('inbound','outbound','bidirectional')),
 records_seen integer not null default 0, records_created integer not null default 0,
 records_updated integer not null default 0, records_failed integer not null default 0,
 started_at timestamptz, finished_at timestamptz, error_summary jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,connection_id) references public.integration_connections(workspace_id,id) on delete cascade
);

create index if not exists idx_shipments_status on public.crm_shipments(workspace_id,status,planned_ship_date);
create index if not exists idx_invoices_due on public.crm_invoices(workspace_id,status,due_date);
create index if not exists idx_payments_date on public.crm_payments(workspace_id,payment_date desc);
create index if not exists idx_approval_queue on public.crm_approval_requests(workspace_id,status,created_at);
create index if not exists idx_import_jobs_status on public.crm_import_jobs(workspace_id,status,created_at desc);
create index if not exists idx_duplicate_reviews_queue on public.crm_duplicate_reviews(workspace_id,status,match_score desc);
create index if not exists idx_sync_runs_connection on public.integration_sync_runs(workspace_id,connection_id,created_at desc);

alter table public.crm_shipments enable row level security;
alter table public.crm_shipment_lines enable row level security;
alter table public.crm_contracts enable row level security;
alter table public.crm_invoices enable row level security;
alter table public.crm_payments enable row level security;
alter table public.crm_service_work_orders enable row level security;
alter table public.crm_sla_policies enable row level security;
alter table public.crm_approval_requests enable row level security;
alter table public.crm_import_jobs enable row level security;
alter table public.crm_duplicate_rules enable row level security;
alter table public.crm_duplicate_reviews enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_sync_runs enable row level security;

do $$
declare t text;
begin
 foreach t in array array['crm_shipments','crm_shipment_lines','crm_contracts','crm_invoices','crm_payments','crm_service_work_orders','crm_sla_policies','crm_approval_requests','crm_import_jobs','crm_duplicate_rules','crm_duplicate_reviews','integration_connections','integration_sync_runs']
 loop
  execute format('drop policy if exists %I on public.%I',t||'_member_select',t);
  execute format('create policy %I on public.%I for select to authenticated using (private.is_workspace_member(workspace_id))',t||'_member_select',t);
  execute format('drop policy if exists %I on public.%I',t||'_member_insert',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.is_workspace_member(workspace_id))',t||'_member_insert',t);
  execute format('drop policy if exists %I on public.%I',t||'_member_update',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id))',t||'_member_update',t);
  execute format('drop policy if exists %I on public.%I',t||'_member_delete',t);
  execute format('create policy %I on public.%I for delete to authenticated using (private.has_workspace_role(workspace_id,array[''owner'',''admin'',''sales_manager'']))',t||'_member_delete',t);
 end loop;
end $$;

commit;
