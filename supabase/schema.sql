-- ============================================================
-- Preply Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_premium boolean not null default false,
  stripe_customer_id text unique,
  macro_goals jsonb default '{"calories":2000,"protein":150,"carbs":200,"fat":65}'::jsonb,
  dietary_restrictions text[] default '{}',
  created_at timestamptz not null default now()
);

-- Recipes
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  default_servings numeric not null default 1,
  image_url text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ingredients (per recipe)
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  amount_per_serving numeric not null,
  unit text not null,
  calories_per_unit numeric not null default 0,
  protein_per_unit numeric not null default 0,
  carbs_per_unit numeric not null default 0,
  fat_per_unit numeric not null default 0,
  fiber_per_unit numeric default 0,
  sodium_per_unit numeric default 0,
  created_at timestamptz not null default now()
);

-- Meal Plan Entries
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  servings numeric not null default 1,
  created_at timestamptz not null default now()
);

-- Grocery List Items
create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  amount numeric not null,
  unit text not null,
  checked boolean not null default false,
  source_recipe text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.grocery_items enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Recipes
create policy "recipes_select" on public.recipes for select using (auth.uid() = user_id);
create policy "recipes_insert" on public.recipes for insert with check (auth.uid() = user_id);
create policy "recipes_update" on public.recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete" on public.recipes for delete using (auth.uid() = user_id);

-- Ingredients
create policy "ingredients_select" on public.ingredients for select
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy "ingredients_insert" on public.ingredients for insert
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy "ingredients_update" on public.ingredients for update
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy "ingredients_delete" on public.ingredients for delete
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- Meal plans
create policy "meal_plans_select" on public.meal_plans for select using (auth.uid() = user_id);
create policy "meal_plans_insert" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "meal_plans_update" on public.meal_plans for update using (auth.uid() = user_id);
create policy "meal_plans_delete" on public.meal_plans for delete using (auth.uid() = user_id);

-- Grocery items
create policy "grocery_select" on public.grocery_items for select using (auth.uid() = user_id);
create policy "grocery_insert" on public.grocery_items for insert with check (auth.uid() = user_id);
create policy "grocery_update" on public.grocery_items for update using (auth.uid() = user_id);
create policy "grocery_delete" on public.grocery_items for delete using (auth.uid() = user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on recipes
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.update_updated_at();
