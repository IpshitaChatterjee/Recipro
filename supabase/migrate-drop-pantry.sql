-- One-time migration for a project set up before the Pantry tab was removed.
-- Optional: the app no longer reads or writes this table, so it's just dead
-- weight — but nothing breaks if you leave it. Run this once, whenever
-- convenient, to actually delete it and its data.
drop table if exists pantry_items;
