-- Tenant isolation and append-only audit access for the initial CRM schema.
begin;

create schema if not exists private;

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.crm_accounts enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_opportunities enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_custom_field_definitions enable row level security;
alter table public.crm_custom_field_values enable row level security;
alter table public.audit_events enable row level security;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (
   select 1 from public.workspace_memberships m
   where m.workspace_id = target_workspace_id
     and m.user_id = (select auth.uid()) and m.is_active = true
 );
$$;
create or replace function private.has_workspace_role(target_workspace_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (
   select 1 from public.workspace_memberships m
   where m.workspace_id = target_workspace_id
     and m.user_id = (select auth.uid()) and m.is_active = true
     and m.role_key = any(allowed_roles)
 );
$$;
revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_role(uuid,text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid,text[]) to authenticated;

drop policy if exists workspace_member_select on public.workspaces;
create policy workspace_member_select on public.workspaces for select to authenticated
using (private.is_workspace_member(id));
drop policy if exists workspace_admin_update on public.workspaces;
create policy workspace_admin_update on public.workspaces for update to authenticated
using (private.has_workspace_role(id,array['owner','admin']))
with check (private.has_workspace_role(id,array['owner','admin']));

drop policy if exists membership_self_or_admin_select on public.workspace_memberships;
create policy membership_self_or_admin_select on public.workspace_memberships for select to authenticated
using (user_id = (select auth.uid()) or private.has_workspace_role(workspace_id,array['owner','admin']));
drop policy if exists membership_admin_insert on public.workspace_memberships;
create policy membership_admin_insert on public.workspace_memberships for insert to authenticated
with check (private.has_workspace_role(workspace_id,array['owner','admin']));
drop policy if exists membership_admin_update on public.workspace_memberships;
create policy membership_admin_update on public.workspace_memberships for update to authenticated
using (private.has_workspace_role(workspace_id,array['owner','admin']))
with check (private.has_workspace_role(workspace_id,array['owner','admin']));
drop policy if exists membership_admin_delete on public.workspace_memberships;
create policy membership_admin_delete on public.workspace_memberships for delete to authenticated
using (private.has_workspace_role(workspace_id,array['owner','admin']));

do $$
declare t text;
begin
 foreach t in array array['crm_accounts','crm_contacts','crm_leads','crm_opportunities','crm_activities','crm_custom_field_definitions','crm_custom_field_values']
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

drop policy if exists audit_member_select on public.audit_events;
create policy audit_member_select on public.audit_events for select to authenticated
using (private.is_workspace_member(workspace_id));
drop policy if exists audit_member_insert on public.audit_events;
create policy audit_member_insert on public.audit_events for insert to authenticated
with check (private.is_workspace_member(workspace_id) and actor_user_id = (select auth.uid()));
revoke update, delete on public.audit_events from authenticated;

commit;
