-- Create safety_alerts and emergency_contacts tables if missing
create table if not exists public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  severity text,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  affected_area integer,
  created_at timestamptz default now()
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_safety_alerts_active_created_at on public.safety_alerts(is_active, created_at desc);
create index if not exists idx_emergency_contacts_user on public.emergency_contacts(user_id);

-- RLS
alter table public.safety_alerts enable row level security;
alter table public.emergency_contacts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'safety_alerts' and policyname = 'safety_alerts_read'
  ) then
    create policy "safety_alerts_read" on public.safety_alerts for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'emergency_contacts' and policyname = 'emergency_contacts_owner_read'
  ) then
    create policy "emergency_contacts_owner_read" on public.emergency_contacts for select using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'emergency_contacts' and policyname = 'emergency_contacts_owner_write'
  ) then
    create policy "emergency_contacts_owner_write" on public.emergency_contacts for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'emergency_contacts' and policyname = 'emergency_contacts_owner_update'
  ) then
    create policy "emergency_contacts_owner_update" on public.emergency_contacts for update using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'emergency_contacts' and policyname = 'emergency_contacts_owner_delete'
  ) then
    create policy "emergency_contacts_owner_delete" on public.emergency_contacts for delete using (auth.uid() = user_id);
  end if;
end $$;

