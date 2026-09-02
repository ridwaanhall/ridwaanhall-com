-- A superuser is always staff.
--
-- Throwaway. The change lives in `0000_init.sql`; this is only how it reaches a
-- database that already exists. Delete it in the same commit -- a delta that
-- stays becomes a rung, and `check-fresh-start.mjs` fails on one.
--
--   node scripts/apply-migration.mjs drizzle/<this file>
--   node scripts/apply-migration.mjs drizzle/<this file> --apply
--
-- Creates no table, so the RLS loop is not needed here.

-- First, because ADD CONSTRAINT validates the rows that are already there.
-- Nothing should match: the state has never been reachable from the admin.
update "app"."account"
   set "is_staff" = true
 where "is_superuser" and not "is_staff";--> statement-breakpoint

alter table "app"."account"
  add constraint "account_superuser_is_staff"
  check (not "is_superuser" or "is_staff");
