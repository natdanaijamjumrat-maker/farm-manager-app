-- Farm Manager: proposed Supabase (PostgreSQL) schema.
-- Mirrors src/types.ts. Not used by the prototype yet.
-- Run in the Supabase SQL editor when you are ready to move from prototype to real data.

create extension if not exists "pgcrypto";

create table farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null default auth.uid(),
  name text not null,
  location text,
  area_sqm numeric,
  owner text,
  notes text,
  created_at timestamptz default now()
);

create table greenhouses (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms on delete cascade not null,
  name text not null,
  type text check (type in ('greenhouse','vertical','nethouse')) not null,
  area_sqm numeric,
  notes text
);

create table growing_systems (
  id uuid primary key default gen_random_uuid(),
  greenhouse_id uuid references greenhouses on delete cascade not null,
  name text not null,
  type text check (type in ('NFT','DFT','Tower','DutchBucket','Ebb')) not null,
  capacity int not null,
  tank_liters numeric,
  notes text
);

create table crops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null default auth.uid(),
  name_th text not null,
  name_en text not null,
  variety text,
  category text check (category in ('lettuce','herb','leafy','fruit')) not null,
  days_to_transplant int not null,
  days_to_harvest int not null,
  ph_min numeric(3,1), ph_max numeric(3,1),
  ec_min numeric(3,1), ec_max numeric(3,1),
  temp_min numeric, temp_max numeric,
  expected_yield_g numeric,
  notes text
);

create table planting_batches (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  crop_id uuid references crops not null,
  system_id uuid references growing_systems not null,
  seed_count int not null check (seed_count > 0),
  sow_date date not null,
  transplant_date date,
  expected_harvest_date date not null,
  status text check (status in ('seedling','growing','ready','harvested')) not null default 'seedling',
  notes text
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references planting_batches on delete cascade not null,
  date date not null,
  ph numeric(3,1),
  ec numeric(4,2),
  temperature numeric(4,1),
  humidity numeric(4,1),
  alive_count int,
  activities text[] default '{}',
  notes text,
  unique (batch_id, date)
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references planting_batches on delete cascade not null,
  date date not null,
  caption text,
  storage_path text -- Supabase Storage bucket "photos"
);

create table harvests (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references planting_batches not null,
  date date not null,
  plant_count int not null,
  total_weight_kg numeric(8,2) not null,
  waste_weight_kg numeric(8,2) not null default 0,
  grade text check (grade in ('A','B','C')) not null,
  notes text
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms on delete cascade,
  name text not null,
  category text check (category in ('seed','nutrient','media','packaging','equipment')) not null,
  quantity numeric not null default 0,
  unit text not null,
  min_level numeric default 0,
  notes text
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms on delete cascade,
  date date not null,
  type text check (type in ('cost','revenue')) not null,
  category text not null,
  amount numeric(12,2) not null,
  batch_id uuid references planting_batches,
  note text
);

create table nutrient_recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crop_id uuid references crops,
  a_ml_per_l numeric(5,2) not null,
  b_ml_per_l numeric(5,2) not null,
  target_ec numeric(3,1),
  target_ph numeric(3,1),
  notes text
);

-- Next steps: enable Row Level Security on every table and add policies
-- so each user only sees rows that belong to their farms.
