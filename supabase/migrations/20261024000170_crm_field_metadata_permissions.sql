-- Restrict custom-field schema mutations to workspace administrators and sales managers.
begin;

drop policy if exists crm_custom_field_definitions_member_insert on public.crm_custom_field_definitions;
drop policy if exists crm_custom_field_definitions_member_update on public.crm_custom_field_definitions;
drop policy if exists crm_custom_field_definitions_member_delete on public.crm_custom_field_definitions;

create policy crm_custom_field_definitions_admin_insert on public.crm_custom_field_definitions
  for insert to authenticated
  with check (private.has_workspace_role(workspace_id,array['owner','admin','sales_manager']));
create policy crm_custom_field_definitions_admin_update on public.crm_custom_field_definitions
  for update to authenticated
  using (private.has_workspace_role(workspace_id,array['owner','admin','sales_manager']))
  with check (private.has_workspace_role(workspace_id,array['owner','admin','sales_manager']));
create policy crm_custom_field_definitions_admin_delete on public.crm_custom_field_definitions
  for delete to authenticated
  using (private.has_workspace_role(workspace_id,array['owner','admin']));

commit;
