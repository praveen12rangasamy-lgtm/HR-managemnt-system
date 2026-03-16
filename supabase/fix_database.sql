-- VyaraHR Database Migration & Fix Script
-- Run this in your Supabase SQL Editor if you see errors

-- 1. Ensure the email column exists in profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE profiles ADD COLUMN email text UNIQUE;
    END IF;
END $$;

-- 2. Ensure the handle_new_user function is correct and has access to email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'employee', new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 3. Re-create the trigger (drops if exists to avoid duplication errors)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Update your specific account to be Admin (only if the user already exists)
-- If the trigger worked, the profile will already be there.
-- If you created the user BEFORE running the trigger, you may need to insert it manually.
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'praveen12rangasamy@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
