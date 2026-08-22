-- Display order, for the two tables that were relying on their primary key
-- for it, and for the skill categories whose order was a list in TypeScript.
--
-- A serial key carries insertion order as a side effect, and three read paths
-- were spending it: education listed `order by id asc`, skills `order by id
-- asc`, and both meant "the sequence somebody entered them in". A uuid sorts by
-- its bytes, which is to say not at all -- so the order has to become a column
-- that says what it is.
--
-- Awards and certifications needed nothing. They ordered by `id desc`, and on
-- this data that is exactly `issued desc` -- both are strictly descending by
-- date -- so they now order by the date they always meant.
--
-- `category.position` existed but held whatever order the migration inserted
-- rows in. It is set here from SKILL_CATEGORY_ORDER in lib/data/about.ts, which
-- is where the curated sequence has been living. Moving it into the database is
-- the point: it is editorial data, the admin can now reorder it, and the
-- constant goes.

-- No `begin`/`commit` here: scripts/apply-migration.mjs wraps the whole file
-- in one transaction, and a `commit` inside would end it -- which is exactly
-- how this file's first dry run committed itself.

alter table app.education add column if not exists position integer not null default 0;
alter table app.skill add column if not exists position integer not null default 0;

-- Backfilled from the rows Django built, matched on a natural key: `degree` is
-- unique across the 5 education rows and `name` across the 101 skills.
update app.education e
   set position = old.id - 1
  from public.about_education old
 where old.degree = e.degree;

update app.skill s
   set position = ranked.rank
  from (
    select name, (row_number() over (order by id)) - 1 as rank
      from public.about_skill
  ) ranked
 where ranked.name = s.name;

-- The curated category order. Anything not named keeps a position after the
-- list rather than jumping to the front, which is what the TypeScript did with
-- its "natural position at the end" fallback.
update app.category c
   set position = named.ordinality - 1
  from (
    select * from unnest(array[
      'Languages', 'Backend Frameworks', 'Frontend Frameworks', 'Styling & UI',
      'CMS & E-commerce', 'Data Visualization', 'Utilities & Auth', 'Data Apps',
      'Automation & Scraping', 'ML Frameworks', 'ML Algorithms', 'LLMs & AI Services',
      'Data Science', 'Databases & ORM', 'APIs & Services', 'Cloud & DevOps',
      'Package Management', 'PaaS', 'Serverless', 'Web Server', 'Testing',
      'Version Control', 'Editor & IDE', 'Design', 'Desktop'
    ]) with ordinality as t(label, ordinality)
  ) as named
 where c.kind = 'skill' and named.label = c.label;

-- Absolute, not `1000 + position`: this file is re-runnable and an increment
-- would push the same rows further out every time it ran.
update app.category c
   set position = 1000 + ranked.rank
  from (
    select id, (row_number() over (order by label)) - 1 as rank
      from app.category
     where kind = 'skill'
       and label not in (
         'Languages', 'Backend Frameworks', 'Frontend Frameworks', 'Styling & UI',
         'CMS & E-commerce', 'Data Visualization', 'Utilities & Auth', 'Data Apps',
         'Automation & Scraping', 'ML Frameworks', 'ML Algorithms', 'LLMs & AI Services',
         'Data Science', 'Databases & ORM', 'APIs & Services', 'Cloud & DevOps',
         'Package Management', 'PaaS', 'Serverless', 'Web Server', 'Testing',
         'Version Control', 'Editor & IDE', 'Design', 'Desktop'
       )
  ) ranked
 where ranked.id = c.id;
