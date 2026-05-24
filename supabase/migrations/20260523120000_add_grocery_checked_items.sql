-- ============================================================
-- Migration: add grocery_checked_items
-- Tracks per-ingredient checked state for the week-based grocery checklist.
-- State is scoped to (user, week_start, meal_plan, ingredient) so it naturally
-- resets each week without any cleanup job.
-- ============================================================

create table if not exists public.grocery_checked_items (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  week_start       date        not null,
  meal_plan_id     uuid        not null references public.meal_plans(id) on delete cascade,
  ingredient_name  text        not null,
  checked          boolean     not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id, week_start, meal_plan_id, ingredient_name)
);

alter table public.grocery_checked_items enable row level security;

drop policy if exists "grocery_checked_items_rls" on public.grocery_checked_items;
create policy "grocery_checked_items_rls"
  on public.grocery_checked_items
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
