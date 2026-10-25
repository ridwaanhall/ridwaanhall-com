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

**There is no scheduled publishing.** A post goes live when somebody switches
`is_published` on in the admin, and a future `published_at` does nothing on its
own. It cannot be done in the read path with `published_at <= now()`: that is a
cached function with a lifetime of days, so a clock comparison inside it is
evaluated once when the entry is filled and frozen with it, and a post dated
tomorrow would stay hidden for days after its moment. Scheduling means a job
that flips the flag. One existed -- an open `app/api/cron/publish` route that a
GitHub workflow called every fifteen minutes -- and both were removed as unused.
A Vercel cron is not the way back on Hobby: a `crons` entry that runs more than
**once a day** **fails the deployment** rather than the job, and the failure
names a pricing page rather than a build error. Note too that `updateTag` is
refused outside a Server Action, so a route handler doing that job would need
`revalidateTag(TAGS.blog, "max")`, called only when a row actually moved.

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
