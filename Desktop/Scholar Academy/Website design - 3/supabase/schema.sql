-- ============================================================
-- SCHOLAR ACADEMY — database schema for Supabase (Postgres)
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ---------- 1. PROFILES ----------
-- One row per auth.users row. role decides what the person can do.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'parent', 'admin')),
  full_name text not null,
  phone text,
  email text,
  area text,
  created_at timestamptz not null default now()
);

-- ---------- 2. PLANS ----------
-- Admin-editable subscription plans that a teacher chooses at signup.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  commission_percent numeric not null default 0,
  billing_cycle text not null default 'one_time' check (billing_cycle in ('one_time', 'monthly', 'yearly')),
  description text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 3. TEACHER PROFILES ----------
create table if not exists public.teacher_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  subjects text[] not null default '{}',
  classes text not null default '',
  boards text not null default '',
  experience_years int not null default 0,
  bio text,
  photo_url text,
  plan_id uuid references public.plans(id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_review', 'active', 'rejected')),
  admin_note text,
  updated_at timestamptz not null default now()
);

-- ---------- 4. PAYMENTS (manual UPI verification) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id),
  amount numeric not null,
  utr_reference text not null unique,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- ---------- 5. TUITION REQUESTS (from parents) ----------
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.teacher_profiles(id),
  student_class text not null,
  subjects text not null,
  area text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------- 6. PAYMENT SETTINGS (single row: your UPI details) ----------
create table if not exists public.payment_settings (
  id int primary key default 1,
  upi_id text not null default 'yourupi@bank',
  upi_name text not null default 'Scholar Academy',
  qr_url text,
  constraint single_row check (id = 1)
);
insert into public.payment_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- Helper: is the current logged-in user an admin?
-- SECURITY DEFINER avoids infinite recursion inside RLS policies.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Trigger: auto-create a profiles row whenever someone signs up.
-- Reads role / full_name / phone from the signUp() metadata.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email, area)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'parent'),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    new.email,
    new.raw_user_meta_data->>'area'
  );

  if coalesce(new.raw_user_meta_data->>'role', 'parent') = 'teacher' then
    insert into public.teacher_profiles (id) values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.payments enable row level security;
alter table public.requests enable row level security;
alter table public.payment_settings enable row level security;

-- PROFILES: everyone can read (needed for public teacher directory);
-- a user may only edit their own row; admin may edit any row.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- PLANS: everyone can read active plans; only admin can write.
drop policy if exists "plans_select" on public.plans;
create policy "plans_select" on public.plans for select using (is_active = true or public.is_admin());
drop policy if exists "plans_write" on public.plans;
create policy "plans_write" on public.plans for all using (public.is_admin()) with check (public.is_admin());

-- TEACHER_PROFILES: public can read only "active" teachers (directory for parents);
-- the teacher can read/update their own row in any status; admin sees/edits everything.
drop policy if exists "teacher_profiles_select" on public.teacher_profiles;
create policy "teacher_profiles_select" on public.teacher_profiles for select
  using (status = 'active' or id = auth.uid() or public.is_admin());
drop policy if exists "teacher_profiles_update" on public.teacher_profiles;
create policy "teacher_profiles_update" on public.teacher_profiles for update
  using (id = auth.uid() or public.is_admin());
drop policy if exists "teacher_profiles_insert" on public.teacher_profiles;
create policy "teacher_profiles_insert" on public.teacher_profiles for insert
  with check (id = auth.uid() or public.is_admin());

-- PAYMENTS: a user can see/add only their own payments; admin sees/updates all.
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments for insert
  with check (user_id = auth.uid());
drop policy if exists "payments_update" on public.payments;
create policy "payments_update" on public.payments for update
  using (public.is_admin());

-- REQUESTS: parent sees/adds their own; a teacher can see requests aimed at them;
-- admin sees/updates all.
drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests for select
  using (parent_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());
drop policy if exists "requests_insert" on public.requests;
create policy "requests_insert" on public.requests for insert
  with check (parent_id = auth.uid());
drop policy if exists "requests_update" on public.requests;
create policy "requests_update" on public.requests for update
  using (parent_id = auth.uid() or public.is_admin());

-- PAYMENT_SETTINGS: everyone logged in can read (to see the UPI ID); only admin writes.
drop policy if exists "payment_settings_select" on public.payment_settings;
create policy "payment_settings_select" on public.payment_settings for select using (true);
drop policy if exists "payment_settings_write" on public.payment_settings;
create policy "payment_settings_write" on public.payment_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Seed a few starter plans (edit anytime from the Admin → Plans page)
-- ============================================================
insert into public.plans (name, price, commission_percent, billing_cycle, description, features, sort_order)
values
  ('Basic', 499, 10, 'one_time',
   'Get listed and start receiving tuition leads.',
   array['Listed in teacher directory', 'Leads shared over WhatsApp', 'Email support'], 1),
  ('Standard', 999, 15, 'monthly',
   'Priority listing with more leads every month.',
   array['Priority in search results', 'More leads per month', 'Weekly test material', 'Priority support'], 2),
  ('Premium', 1999, 20, 'monthly',
   'Maximum visibility and dedicated area matching.',
   array['Top of search results', 'Dedicated area matching', 'Marketing done for you', 'Priority support + calls'], 3)
on conflict do nothing;

-- ============================================================
-- Storage bucket for payment screenshots & teacher photos
-- (Run this part too — creates a public bucket named "uploads")
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_read" on storage.objects;
create policy "uploads_read" on storage.objects for select using (bucket_id = 'uploads');
drop policy if exists "uploads_insert" on storage.objects;
create policy "uploads_insert" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
