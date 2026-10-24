-- Sales execution, service, marketing, and automation records.
begin;

create table if not exists public.crm_products (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 product_code text not null, name text not null, description text,
 product_type text not null default 'service' check (product_type in ('product','service','subscription','bundle')),
 family text, unit_of_measure text not null default 'unit',
 base_price numeric(20,4) not null default 0 check (base_price >= 0),
 currency char(3) not null default 'EUR', tax_code text,
 is_active boolean not null default true,
 attributes jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,product_code)
);
create table if not exists public.crm_quotes (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 quote_number text not null, account_id uuid, opportunity_id uuid,
 status text not null default 'draft' check (status in ('draft','in_review','approved','sent','accepted','rejected','expired','cancelled')),
 version integer not null default 1 check (version > 0),
 currency char(3) not null default 'EUR',
 subtotal numeric(20,2) not null default 0, discount_amount numeric(20,2) not null default 0,
 tax_amount numeric(20,2) not null default 0, total_amount numeric(20,2) not null default 0,
 valid_until date, payment_terms text, delivery_terms text, notes text,
 owner_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,quote_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,opportunity_id) references public.crm_opportunities(workspace_id,id)
);
create table if not exists public.crm_quote_lines (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 quote_id uuid not null, product_id uuid,
 line_number integer not null check (line_number > 0),
 description text not null, quantity numeric(20,4) not null default 1 check (quantity > 0),
 unit_price numeric(20,4) not null default 0 check (unit_price >= 0),
 discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
 tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
 net_amount numeric(20,2) not null default 0, tax_amount numeric(20,2) not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,quote_id,line_number),
 foreign key(workspace_id,quote_id) references public.crm_quotes(workspace_id,id) on delete cascade,
 foreign key(workspace_id,product_id) references public.crm_products(workspace_id,id)
);
create table if not exists public.crm_sales_orders (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 order_number text not null, account_id uuid, quote_id uuid,
 status text not null default 'draft' check (status in ('draft','pending_approval','confirmed','in_fulfillment','partially_shipped','shipped','completed','cancelled','returned')),
 order_date date not null default current_date, requested_delivery_date date,
 currency char(3) not null default 'EUR',
 subtotal numeric(20,2) not null default 0, discount_amount numeric(20,2) not null default 0,
 tax_amount numeric(20,2) not null default 0, total_amount numeric(20,2) not null default 0,
 payment_terms text, shipping_terms text, billing_address jsonb not null default '{}'::jsonb,
 shipping_address jsonb not null default '{}'::jsonb,
 owner_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,order_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,quote_id) references public.crm_quotes(workspace_id,id)
);
create table if not exists public.crm_order_lines (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 order_id uuid not null, product_id uuid,
 line_number integer not null check (line_number > 0),
 description text not null, quantity_ordered numeric(20,4) not null default 1 check (quantity_ordered > 0),
 quantity_fulfilled numeric(20,4) not null default 0 check (quantity_fulfilled >= 0 and quantity_fulfilled <= quantity_ordered),
 unit_price numeric(20,4) not null default 0 check (unit_price >= 0),
 discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
 tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
 net_amount numeric(20,2) not null default 0, tax_amount numeric(20,2) not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,order_id,line_number),
 foreign key(workspace_id,order_id) references public.crm_sales_orders(workspace_id,id) on delete cascade,
 foreign key(workspace_id,product_id) references public.crm_products(workspace_id,id)
);
create table if not exists public.crm_service_cases (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 case_number text not null, subject text not null, description text,
 account_id uuid, contact_id uuid,
 status text not null default 'new' check (status in ('new','open','pending_customer','pending_internal','resolved','closed','cancelled')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 origin text not null default 'web', category text, subcategory text,
 sla_due_at timestamptz, first_response_at timestamptz, resolved_at timestamptz,
 resolution text, owner_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,case_number),
 foreign key(workspace_id,account_id) references public.crm_accounts(workspace_id,id),
 foreign key(workspace_id,contact_id) references public.crm_contacts(workspace_id,id)
);
create table if not exists public.crm_campaigns (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 campaign_code text not null, name text not null, campaign_type text not null default 'digital',
 status text not null default 'planned' check (status in ('planned','active','paused','completed','cancelled')),
 channel text, start_date date, end_date date, budget numeric(20,2) not null default 0 check (budget >= 0),
 currency char(3) not null default 'EUR', target_audience jsonb not null default '{}'::jsonb,
 owner_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,campaign_code)
);
create table if not exists public.crm_campaign_members (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 campaign_id uuid not null, lead_id uuid, contact_id uuid,
 status text not null default 'targeted' check (status in ('targeted','sent','responded','engaged','converted','unsubscribed','bounced')),
 responded_at timestamptz, conversion_value numeric(20,2),
 created_at timestamptz not null default now(),
 unique(workspace_id,id),
 check (num_nonnulls(lead_id,contact_id)=1),
 foreign key(workspace_id,campaign_id) references public.crm_campaigns(workspace_id,id) on delete cascade,
 foreign key(workspace_id,lead_id) references public.crm_leads(workspace_id,id),
 foreign key(workspace_id,contact_id) references public.crm_contacts(workspace_id,id)
);
create table if not exists public.automation_workflows (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 workflow_key text not null, name text not null, description text,
 trigger_config jsonb not null default '{}'::jsonb,
 steps jsonb not null default '[]'::jsonb,
 status text not null default 'draft' check (status in ('draft','active','paused','archived')),
 version integer not null default 1 check (version > 0),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,id), unique(workspace_id,workflow_key)
);
create table if not exists public.automation_runs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 workflow_id uuid not null, status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','needs_review')),
 trigger_payload jsonb not null default '{}'::jsonb,
 result_payload jsonb not null default '{}'::jsonb,
 error_message text, attempt_count integer not null default 0 check (attempt_count >= 0),
 started_at timestamptz, finished_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,workflow_id) references public.automation_workflows(workspace_id,id) on delete cascade
);
create table if not exists public.crm_notifications (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 recipient_user_id uuid not null references auth.users(id) on delete cascade,
 notification_type text not null, title text not null, body text,
 entity_type text, entity_id uuid, read_at timestamptz,
 created_at timestamptz not null default now()
);

create index if not exists idx_products_active on public.crm_products(workspace_id,name) where is_active;
create index if not exists idx_quotes_status on public.crm_quotes(workspace_id,status,valid_until);
create index if not exists idx_orders_status_date on public.crm_sales_orders(workspace_id,status,order_date desc);
create index if not exists idx_cases_queue on public.crm_service_cases(workspace_id,status,priority,created_at);
create index if not exists idx_campaign_status on public.crm_campaigns(workspace_id,status,start_date);
create index if not exists idx_workflow_runs_status on public.automation_runs(workspace_id,status,created_at desc);
create index if not exists idx_notifications_inbox on public.crm_notifications(workspace_id,recipient_user_id,created_at desc) where read_at is null;

alter table public.crm_products enable row level security;
alter table public.crm_quotes enable row level security;
alter table public.crm_quote_lines enable row level security;
alter table public.crm_sales_orders enable row level security;
alter table public.crm_order_lines enable row level security;
alter table public.crm_service_cases enable row level security;
alter table public.crm_campaigns enable row level security;
alter table public.crm_campaign_members enable row level security;
alter table public.automation_workflows enable row level security;
alter table public.automation_runs enable row level security;
alter table public.crm_notifications enable row level security;

do $$
declare t text;
begin
 foreach t in array array['crm_products','crm_quotes','crm_quote_lines','crm_sales_orders','crm_order_lines','crm_service_cases','crm_campaigns','crm_campaign_members','automation_workflows','automation_runs']
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

drop policy if exists notification_recipient_select on public.crm_notifications;
create policy notification_recipient_select on public.crm_notifications for select to authenticated
using (private.is_workspace_member(workspace_id) and recipient_user_id = (select auth.uid()));
drop policy if exists notification_recipient_update on public.crm_notifications;
create policy notification_recipient_update on public.crm_notifications for update to authenticated
using (private.is_workspace_member(workspace_id) and recipient_user_id = (select auth.uid()))
with check (private.is_workspace_member(workspace_id) and recipient_user_id = (select auth.uid()));

commit;
