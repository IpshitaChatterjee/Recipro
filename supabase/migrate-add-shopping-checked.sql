-- One-time migration for a project set up before the shopping list persisted
-- checked-off items. Safe to re-run.
alter table mealplans add column if not exists shopping_checked jsonb not null default '[]';
