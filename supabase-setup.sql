-- Fitness Tracker — Supabase schema setup
-- Run this entire block in the Supabase SQL Editor

create table if not exists steps_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  data jsonb not null default '{"steps":0,"activities":[]}',
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

create table if not exists sleep_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  data jsonb not null default '{"bedtime":"","waketime":"","quality":0}',
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

create table if not exists food_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  data jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

create table if not exists water_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  data jsonb not null default '{"glasses":0}',
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

create table if not exists weight_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, date)
);

create table if not exists user_settings (
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb,
  primary key (user_id, key)
);

-- Enable Row Level Security (users only see their own data)
alter table steps_log enable row level security;
alter table sleep_log enable row level security;
alter table food_log enable row level security;
alter table water_log enable row level security;
alter table weight_log enable row level security;
alter table user_settings enable row level security;

-- Policies
create policy "own_steps"    on steps_log    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_sleep"    on sleep_log    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_food"     on food_log     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_water"    on water_log    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_weight"   on weight_log   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_settings" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
