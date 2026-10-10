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
