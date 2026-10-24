-- Server-side request metering and basic workspace/user rate limiting for AI acquisition.
begin;

create table if not exists public.ai_acquisition_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  provider_keys text[] not null check (provider_keys <@ array['serper','tavily','works']::text[]),
  query_hash text not null check (query_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'started' check (status in ('started','completed','partial','failed')),
  result_count integer not null default 0 check (result_count >= 0),
  persisted_count integer not null default 0 check (persisted_count >= 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(workspace_id,id)
);
create index if not exists ai_acquisition_usage_user_time_idx
  on public.ai_acquisition_usage(workspace_id,actor_user_id,created_at desc);
create index if not exists ai_acquisition_usage_workspace_time_idx
  on public.ai_acquisition_usage(workspace_id,created_at desc);

alter table public.ai_acquisition_usage enable row level security;
-- No direct member policies: usage is written through the SECURITY DEFINER functions below.

create or replace function public.reserve_acquisition_request(
  p_workspace_id uuid,
  p_provider_keys text[],
  p_query_hash text
)
returns uuid language plpgsql security definer
set search_path = public, private, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_user_count integer;
  v_workspace_count integer;
  v_id uuid;
begin
  if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not private.is_workspace_member(p_workspace_id) then
    raise exception 'Workspace membership required' using errcode='42501';
  end if;
  if not private.has_workspace_role(p_workspace_id,array['owner','admin','sales_manager','sales_rep','marketing']) then
    raise exception 'Role cannot run acquisition searches' using errcode='42501';
  end if;
  if coalesce(array_length(p_provider_keys,1),0)=0 or not (p_provider_keys <@ array['serper','tavily','works']::text[]) then
    raise exception 'Invalid provider selection' using errcode='22023';
  end if;
  if p_query_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid query fingerprint' using errcode='22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text,0));

  select count(*) into v_user_count
  from public.ai_acquisition_usage
  where workspace_id=p_workspace_id and actor_user_id=v_actor and created_at > now()-interval '1 hour';
  select count(*) into v_workspace_count
  from public.ai_acquisition_usage
  where workspace_id=p_workspace_id and created_at > now()-interval '1 hour';

  if v_user_count >= 20 or v_workspace_count >= 200 then
    raise exception 'Acquisition request rate limit exceeded; retry after the current one-hour window' using errcode='P0001';
  end if;

  insert into public.ai_acquisition_usage(workspace_id,actor_user_id,provider_keys,query_hash)
  values(p_workspace_id,v_actor,p_provider_keys,p_query_hash)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.complete_acquisition_request(
  p_request_id uuid,
  p_workspace_id uuid,
  p_status text,
  p_result_count integer,
  p_persisted_count integer
)
returns boolean language plpgsql security definer
set search_path = public, private, auth
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_status not in ('completed','partial','failed') then raise exception 'Invalid request status' using errcode='22023'; end if;
  if p_result_count < 0 or p_persisted_count < 0 then raise exception 'Counts cannot be negative' using errcode='22023'; end if;

  update public.ai_acquisition_usage
  set status=p_status,result_count=p_result_count,persisted_count=p_persisted_count,finished_at=now()
  where id=p_request_id and workspace_id=p_workspace_id and actor_user_id=auth.uid() and status='started';
  if not found then raise exception 'Acquisition request not found or already completed' using errcode='42501'; end if;
  return true;
end;
$$;

revoke all on function public.reserve_acquisition_request(uuid,text[],text) from public;
grant execute on function public.reserve_acquisition_request(uuid,text[],text) to authenticated;
revoke all on function public.complete_acquisition_request(uuid,uuid,text,integer,integer) from public;
grant execute on function public.complete_acquisition_request(uuid,uuid,text,integer,integer) to authenticated;

commit;
