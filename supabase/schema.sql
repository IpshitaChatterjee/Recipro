-- Recipro schema.
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).

create table if not exists recipes (
  id             text primary key,
  name           text not null,
  cook_time_min  integer not null default 0,
  servings       integer not null default 1,
  tags           text[] not null default '{}',
  -- {name, qty}[] and {text, nightBefore}[] respectively — see lib/types.ts.
  ingredients    jsonb not null default '[]',
  prep_steps     jsonb not null default '[]',
  instructions   text not null default '',
  updated_at     timestamptz not null default now()
);

create table if not exists mealplans (
  -- The Monday of the week, e.g. "2026-09-07".
  week_id    text primary key,
  -- Record<Day, {recipeId, prepDone: boolean[]} | null> — see lib/types.ts.
  days       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every write, so "last changed" is always available
-- without every call site having to set it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_set_updated_at
  before update on recipes
  for each row execute function set_updated_at();

create trigger mealplans_set_updated_at
  before update on mealplans
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Recipro has no login — it's a single household's planner, and the browser
-- talks to Supabase directly with the public anon key. RLS is enabled (never
-- leave tables open by relying on "no one will guess the URL"), but since
-- there's no authenticated user to scope rows to, the policies below grant
-- the anon role full access to these tables and nothing else in the
-- database. Anyone with the project URL and anon key can read and write this
-- data — that's an acceptable tradeoff for a personal app, but if you add
-- multiple households later, replace these with per-user policies keyed on
-- auth.uid() (see Supabase's RLS guide) before that ships.
-- ---------------------------------------------------------------------------

alter table recipes enable row level security;
alter table mealplans enable row level security;

create policy recipes_anon_all on recipes
  for all to anon using (true) with check (true);

create policy mealplans_anon_all on mealplans
  for all to anon using (true) with check (true);

-- Realtime: let clients subscribe to changes so multiple tabs/devices stay in sync.
alter publication supabase_realtime add table recipes;
alter publication supabase_realtime add table mealplans;
