-- The original policy used an unqualified `name`, which resolved to products.name inside the
-- subquery, so no buyer could ever read their bundle files. Qualify it with the storage object.
drop policy if exists "Owners can read their product files" on storage.objects;
create policy "Owners can read their product files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bundle-files'
    and exists (
      select 1
      from public.user_products up
      join public.products p on p.id = up.product_id
      where up.user_id = auth.uid()
        and up.is_active = true
        and (up.expires_at is null or up.expires_at > now())
        and p.product_slug = (storage.foldername(storage.objects.name))[1]
    )
  );
