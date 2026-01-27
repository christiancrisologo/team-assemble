-- Enable Row Level Security (RLS) is good practice, but for simplicity we will start open (or you can apply policies later).
-- For this "Local-First to Cloud" transition, we assume a single tenant or public access for the MVP.
-- If you need multi-tenancy later, we would add `user_id` to these tables.

-- 1. Members Table
create table lrn_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  avatar_url text, -- Optional custom avatar
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Roles Table
create table lrn_roles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text default 'bg-blue-500', -- Tailwind class
  icon text default 'Shield', -- Lucide icon name
  created_at timestamptz default now()
);

-- 3. Sprints Table
create table lrn_sprints (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text check (status in ('planning', 'active', 'completed')),
  assignments jsonb default '{}'::jsonb, -- Map of RoleID -> MemberID
  created_at timestamptz default now()
);

-- Enable RLS (Optional, but recommended to prevent accidental wipes if exposed)
alter table lrn_members enable row level security;
alter table lrn_roles enable row level security;
alter table lrn_sprints enable row level security;

-- Create Policies (Public Access for MVP)
create policy "Public Select Members" on lrn_members for select using (true);
create policy "Public Insert Members" on lrn_members for insert with check (true);
create policy "Public Update Members" on lrn_members for update using (true);
create policy "Public Delete Members" on lrn_members for delete using (true);

create policy "Public Select Roles" on lrn_roles for select using (true);
create policy "Public Insert Roles" on lrn_roles for insert with check (true);
create policy "Public Update Roles" on lrn_roles for update using (true);
create policy "Public Delete Roles" on lrn_roles for delete using (true);

create policy "Public Select Sprints" on lrn_sprints for select using (true);
create policy "Public Insert Sprints" on lrn_sprints for insert with check (true);
create policy "Public Update Sprints" on lrn_sprints for update using (true);
create policy "Public Delete Sprints" on lrn_sprints for delete using (true);
