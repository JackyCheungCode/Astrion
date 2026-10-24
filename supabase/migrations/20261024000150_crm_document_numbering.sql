-- Concurrency-safe, workspace-scoped business document numbering.
begin;

create table if not exists public.crm_number_counters (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  prefix text not null check (prefix ~ '^[A-Z][A-Z0-9]{1,7}$'),
  next_value bigint not null default 1 check (next_value > 0),
  updated_at timestamptz not null default now(),
  primary key(workspace_id,prefix)
);
alter table public.crm_number_counters enable row level security;
create policy crm_number_counters_member_select on public.crm_number_counters
  for select to authenticated using (private.is_workspace_member(workspace_id));

create or replace function public.next_crm_number(p_workspace_id uuid,p_prefix text)
returns text language plpgsql security definer
set search_path = public, private, auth
as $$
declare
  v_number bigint;
  v_prefix text := upper(trim(p_prefix));
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not private.is_workspace_member(p_workspace_id) then raise exception 'Workspace membership required' using errcode='42501'; end if;
  if v_prefix !~ '^[A-Z][A-Z0-9]{1,7}$' then raise exception 'Invalid document prefix' using errcode='22023'; end if;
  insert into public.crm_number_counters(workspace_id,prefix,next_value)
  values(p_workspace_id,v_prefix,2)
  on conflict(workspace_id,prefix)
  do update set next_value=public.crm_number_counters.next_value+1,updated_at=now()
  returning next_value-1 into v_number;
  return v_prefix||'-'||lpad(v_number::text,greatest(6,length(v_number::text)), '0');
end;
$$;
revoke all on function public.next_crm_number(uuid,text) from public;
grant execute on function public.next_crm_number(uuid,text) to authenticated;

commit;
