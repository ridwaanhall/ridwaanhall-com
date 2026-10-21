# The generated CV

Guidance for working in `lib/cv/`. The root `CLAUDE.md` covers everything that applies everywhere.

## The CV is generated from About

`/cv.pdf` is rendered on the server with `@react-pdf/renderer` from the rows the
About page shows, cached against the tag of every table it reads, so an edit in
the admin produces a new CV on the next request. What goes on it is chosen by
rule in `lib/cv/select.ts` (pure, tested): the roles being looked for are the
headline; the summary is the open-to-work note plus the sentences that count
work; a role with no technical title is left out; certificates are the five
newest technical ones; and a word matches whole, because `git` must not match
inside "Digital". The layout is built for applicant tracking systems -- one
column, real text, no hyphenation (a parser reads "oppor" and "tunities"), no
images. The viewer is pdf.js, imported on first use with its worker served from
this origin, and the CV links in About and the palette open it.

## Two ways the CV fell behind About, and one way it drew badly

- **Every CV address is the generated one.** `/cv`, `/cv-latest` and `/cv-copy`
  redirected to hand-written documents on Google Drive (`profile_link` rows of
  kind `cv`), and About offered a "Google Docs version" beside the PDF -- so an
  updated experience showed on the page and on none of the links people had
  been sent. They all redirect to `/cv.pdf` now (`lib/api/cv-redirect.ts`); the
  stored links are left in the table and nothing reads them.
- **No CDN copy.** `/cv.pdf` and every Markdown twin were sent with an hour of
  `s-maxage` and a day of `stale-while-revalidate`. `updateTag` expires Next's
  cache and cannot reach the edge's, so the old file was served for up to a day
  after an edit. Both now say `max-age=0, must-revalidate`; the cost is one
  cache read per request, because the `"use cache"` build is what is expensive.
- **An entry heading is a row with a flexible left and a fixed right.** Title
  and organisation were one run of text in a `space-between` row with the dates,
  so a long pair -- a merged "Mentor / Cohort" title at "Coding Camp powered by
  DBS Foundation" -- was drawn under the dates and pushed them past the margin.
  The left column is `flex: 1`, the dates do not shrink, and the organisation
  has its own line. Check a layout change by rendering real rows to PNG
  (`pdftoppm`) and looking, since nothing else sees overlap.
