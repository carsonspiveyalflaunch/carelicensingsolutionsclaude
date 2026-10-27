-- Public offer checks need the file names inside a complete-bundle folder (report vs checklist).
-- storage.objects SELECT is limited to authenticated owners, and preview deploys can have a
-- service-role key the API rejects. Keep the privileged read in an unexposed schema. The public
-- wrapper is security invoker and only returns basenames for an active Complete Bundle slug.
-- It does not return file bytes, signed URLs, or objects outside that folder.

create schema if not exists internal;

revoke all on schema internal from public;
grant usage on schema internal to anon, authenticated, service_role;

create or replace function internal.list_complete_bundle_file_names(p_slug text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    array_agg(btrim(split_part(o.name, '/', 2)) order by o.name),
    '{}'::text[]
  )
  from storage.objects o
  where o.bucket_id = 'bundle-files'
    and p_slug ~ '^[a-z0-9-]{3,160}$'
    and exists (
      select 1
      from public.products p
      where p.product_slug = p_slug
        and p.type = 'bundle'
        and p.is_active = true
        and p.product_label = 'Complete Bundle'
        and p.product_slug like '%complete-bundle'
    )
    and split_part(o.name, '/', 1) = p_slug
    and split_part(o.name, '/', 2) <> ''
    and split_part(o.name, '/', 3) = ''
    and split_part(o.name, '/', 2) !~ '^\.'
    and split_part(o.name, '/', 2) ~* '\.(pdf|xlsx|xls|docx|doc|csv)$';
$$;

revoke all on function internal.list_complete_bundle_file_names(text) from public;
grant execute on function internal.list_complete_bundle_file_names(text) to anon, authenticated, service_role;

create or replace function public.list_complete_bundle_file_names(p_slug text)
returns text[]
language sql
stable
security invoker
set search_path = ''
as $$
  select internal.list_complete_bundle_file_names(p_slug);
$$;

revoke all on function public.list_complete_bundle_file_names(text) from public;
grant execute on function public.list_complete_bundle_file_names(text) to anon, authenticated, service_role;
