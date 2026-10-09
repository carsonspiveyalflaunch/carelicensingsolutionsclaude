-- Security fix: customers must not be able to change their own privileges.
--
-- The "Users can update own profile" policy lets a signed-in user update any
-- column of their own profiles row, including is_admin and is_active. This
-- trigger rejects changes to those two columns unless the change comes from
-- the server (service role) or from the database owner (SQL editor).
--
-- Run once in the Supabase SQL editor. Safe to re-run.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if new.is_admin is distinct from old.is_admin
       or new.is_active is distinct from old.is_active then
      raise exception 'Not allowed to change profile privileges';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- New rows created by a signed-in user can never start as admin.
create or replace function public.protect_profile_privileges_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.is_admin := false;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_insert on public.profiles;
create trigger protect_profile_privileges_insert
  before insert on public.profiles
  for each row execute function public.protect_profile_privileges_insert();

-- The old policy exposed every admin's profile row to everyone
-- (it tested the row's is_admin, not the caller's). Users can still read
-- their own row through "Users can view own profile"; the admin panel reads
-- profiles through the server, which now checks the caller is an admin.
drop policy if exists "Admins can view all profiles" on public.profiles;
