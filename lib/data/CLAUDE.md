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

## Patch notes are written by the release workflow

Every push to main runs `.github/workflows/release.yml`, with nobody doing
anything. It sends **every commit since the newest `v*` tag** (not only the
push's) to `POST /api/patch-notes`, so nothing falls between releases;
`lib/patch-notes/commits.ts` (pure, tested) files each commit by its type and
picks the version: a breaking change is a major, a `feat` a minor, anything
else a patch. The workflow then tags `v<version>` and publishes the GitHub
Release with the Markdown the endpoint returns. Before that it tags any release
the site holds that GitHub lacks, so a run that died half way, or a note added
in the admin with a commit sha, is published by the next one. Edit a release's
wording, summary or visibility in the admin (**Site > Patch notes**).

- **Everything before 4.0.0 is `lib/patch-notes/history.json`**: 0.1.0 (the
  Django scaffold) to 3.0.0 (the Next.js rebuild), written by hand from the git
  history. One release per month of the Django era, which was mostly pushed
  straight to main; majors at its turning points: 1.0.0 the first deploy, 2.0.0
  the move into Supabase, 2.2.1 the last Django code, 3.0.0 Next.js. Each
  names the last commit of its window, and its lines are highlights tied to
  real commits (`history.test.ts` holds the shape). The workflow sends it to
  `PUT /api/patch-notes` on every run; the site **only adds** versions it
  lacks, so an admin edit is never undone, and the backfill then tags them
  with `--latest=false` so an old release never takes "Latest".
- **The first run makes 4.0.0.** With no release on the site, the range is
  everything since `v3.0.0`: the redesign and whatever followed it.
- **`Release-Title:` and `Release-Summary:` lines in a commit message name the
  release** it lands in, the newest winning. Without one, the title is the
  most important line.
- **The workflow never calls `ridwaanhall.com`.** That domain is behind
  Cloudflare, which answers GitHub's runners with a bot challenge (403) no
  script passes; the old cron workflow failed that way on every run. It calls
  the production deployment's Vercel address with a Protection Bypass for
  Automation secret (`VERCEL_AUTOMATION_BYPASS_SECRET`, a repository secret)
  in the `x-vercel-protection-bypass` header.
- **The endpoint takes `PATCH_NOTES_TOKEN`**, set on Vercel and as a repository
  secret. It writes text onto a public page, so unlike the cron route it
  replaced in spirit, it is not open. Unset, it refuses everything.
- **It is idempotent on the pushed sha.** A re-run workflow gets the release it
  already made, never a second version. Concurrent pushes queue on an advisory
  lock (`8_471_003`), so two cannot both claim the same number.
- **A hidden release keeps its number.** The next version is read from every
  row, published or not.
- **`[skip release]` in a commit message leaves it out**, and a push of
  nothing but skipped commits and merges records nothing.
- The repository is public, so the workflow costs no Actions minutes.

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
