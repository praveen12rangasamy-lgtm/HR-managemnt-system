-- VyaraHR Database Schema

-- 1. Profiles (for both Admins and Employees)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  employee_id text unique,
  role text check (role in ('admin', 'employee')),
  department text,
  designation text,
  avatar_url text,
  org_name text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Attendance
create table attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  status text check (status in ('present', 'absent', 'on-leave', 'half-day')),
  entry_type text check (entry_type in ('biometric', 'manual')) default 'biometric',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 3. Leave Requests
create table leave_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null, -- e.g., 'Sick Leave', 'Casual Leave'
  start_date date not null,
  end_date date not null,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  checked_by uuid references auth.users, -- The admin who approved/rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;

-- 5. Trigger for New User Profile Creation
-- This function will run whenever a new user is created in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name, org_name, expires_at)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'employee'), 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'org_name',
    (new.raw_user_meta_data->>'expires_at')::timestamp with time zone
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Existing Policies
-- Profiles: Users can view their own profile; Admins can view all.
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Attendance: Users can view/create their own; Admins can view all.
create policy "Users can view own attendance." on attendance for select using (auth.uid() = user_id);
create policy "Admins can view all attendance." on attendance for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can insert own attendance." on attendance for insert with check (auth.uid() = user_id);
create policy "Users can update own attendance." on attendance for update using (auth.uid() = user_id);

-- Leave Requests: Employees can insert and view their own; Admins view all.
create policy "Users can insert own leave requests." on leave_requests for insert with check (auth.uid() = user_id);
create policy "Users can view own leave requests." on leave_requests for select using (auth.uid() = user_id);
create policy "Admins can view all leave requests." on leave_requests for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update leave requests." on leave_requests for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
