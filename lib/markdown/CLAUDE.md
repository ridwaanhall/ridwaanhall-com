# Markdown twins

Guidance for working in `lib/markdown/`. The root `CLAUDE.md` covers everything that applies everywhere.

## Every page has a Markdown twin

A page's address plus `.md` (the home page is `/index.md`), or the page asked
for with `Accept: text/markdown`, returns the same content as Markdown.
`/llms.txt` lists every twin in the llmstxt.org shape and `/llms-full.txt` joins
them. `proxy.ts` rewrites both ways of asking to `/md/<path>`, whose one handler
(`app/md/[[...path]]/route.ts`) renders them from `lib/markdown/pages.ts`.

- **A twin is drawn from the same cached read as its page,** so it cannot say
  what the page does not, and a draft has none for the same reason it has no
  page: `getBlogs` and `getProjects` are the only two places that ask.
- **What is left out is left out on purpose.** The guestbook's messages were
  written for the page, not for a dataset, so its twin counts them. The
  dashboard's figures are live and a copy in a cached file is wrong by the time
  it is read, so its twin names the sources.
- **The headers matter.** A twin is `noindex` with a canonical `Link` to its
  page, and everything varies on `Accept`, or a CDN serves the first format it
  cached to everybody. Each page's head names its twin through
  `alternates.types`.
- **`lib/markdown/html.ts` converts only what the sanitiser allows,** and
  strips the rest. It is pure and tested offline.
- **The CV has a twin too, at `/cv.md`,** though its page for people is the PDF
  (`Twin.page`). `lib/cv/load.ts` is the one cached read behind both formats and
  `lib/cv/markdown.ts` turns it into text, so the two cannot disagree. The CV
  viewer offers "View as Markdown" beside "Open the PDF".
- `lib/site/twins.ts` is the one answer to "does this path have a twin", read
  by the footer, the palette, the proxy and the metadata. `check-markdown.mjs`
  walks the sitemap and holds all of it.
