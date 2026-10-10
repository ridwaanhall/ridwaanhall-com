# The public read paths

Guidance for working in `lib/data/`. The root `CLAUDE.md` covers everything that applies everywhere.

## A draft is a row, and only one column decides

`blog_post.is_published` and `project.is_published` are the whole of what the
public site looks at. `getBlogs` and `getProjects` in `lib/data/content.ts` are
the only two places that ask, and everything a reader can reach resolves
through them -- the listings, the detail pages, `generateStaticParams`, the
sitemap, the JSON API and search -- so a draft is absent from all of them
without any of them knowing the column exists.

Both default to **off**, so a create through the admin is a draft. Before this
existed, every save was a publish; there was no draft state anywhere except
`legal_document.is_published`.

**`published_at` is *when*, not *whether*.** That distinction is the reason for
the column rather than a nicety: the read path had no `where` at all and merely
ordered by `published_at DESC`, so setting it forward did not hide a post -- it
sorted the unfinished draft **above everything finished** and prerendered it
into the sitemap. The one control that read like "publish later" was the one
that made the post most prominent.

**The schedule cannot be `published_at <= now()` in the read path.** That is a
cached function with a lifetime of days, so a clock comparison inside it is
evaluated once when the entry is filled and frozen with it: a post scheduled
for tomorrow would stay hidden for days after its moment. The flag moves
instead, and `app/api/cron/publish` moves it.

**The schedule is a GitHub workflow rather than a Vercel cron**, and that is a
plan limit rather than a preference. `vercel.json` carried a `crons` entry for
about an hour: Hobby allows a cron job to run **once a day**, and a schedule it
will not accept **fails the deployment** rather than the job -- so the site does
not ship at all until the entry is removed, and the failure names a pricing page
rather than a build error. A daily run would have been accepted and is not worth
having, since a post due at nine could appear any time in the next twenty-four
hours. `.github/workflows/publish.yml` calls the same endpoint every fifteen
minutes; moving back is deleting that file and restoring the key, on a plan that
allows it.

That endpoint **takes no credentials**, on purpose. It publishes exactly the
posts whose `published_at` has passed -- the set the next scheduled run
publishes anyway -- so a stranger calling it can bring a post forward by one
interval at most and can never reach one dated in the future. A secret guarded
nothing waiting would not, and cost a value set and matched in two places. The
consequence worth knowing: **unpublishing a post dated in the past does not keep
it down**; the next run puts it back. Move the date forward instead.

**Only posts can be scheduled.** `project` carries the same flag but no column
saying when it should go live, and that is the honest shape -- a project goes
public when there is something to link to, which is not a date known in advance.

**`updateTag` is refused in a route handler.** It is Server Actions only; the
API reference says so outright and the error names the restriction. So the job
uses `revalidateTag(TAGS.blog, "max")`, which marks the tag stale rather than
expiring it -- the post appears on the request after the first rather than on
the first. Seconds, against a schedule measured in days. It is called **only
when a row actually moved**: marking the tag every run would discard the blog
payload hourly, which is the opposite of what `cacheLife("days")` is for.

There is **no preview of a draft yet**. Seeing one rendered means publishing it,
looking, and unpublishing -- the article page is one file of inline JSX rather
than a component something else could render, and `draftMode()` is not the way
round it: reading it in `/blog/[slug]` makes that route dynamic for every
reader, not only for staff.

## Other things worth knowing here

- **The command palette reaches the content, and the listing search reads the
  body.** Two halves of one gap. The palette indexed pages, socials and CV
  links -- everything the site has except the two things it is made of -- so a
  reader who remembered a post's title could not get to it from there. Its rows
  now come from `/api/search` on the first open rather than in every page's
  payload, which is eighty-odd titles that most readers never ask for. A row is
  an `li` with a click handler, not an anchor, because this palette navigates
  through the router: a check looking for `a[href^="/blog/"]` finds nothing, and
  a `:below(heading)` selector counts the next section's rows too, so
  `check-ui-state.mjs` asks for the section heading and the row count instead.
  Separately, `searchBlogs` matched the title, summary, byline and tags but not
  the body -- the blog was the one content type written at length whose text
  could not be found -- while `searchProjects` had always searched its
  description. Both strip to plain text first, or `href` and `span` become
  search terms.
