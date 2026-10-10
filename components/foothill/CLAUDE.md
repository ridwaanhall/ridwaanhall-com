# The public site

Guidance for working in `components/foothill/` and the public pages' design. The root `CLAUDE.md` covers everything that applies everywhere.

## The public site is black, white and the greys between

A design built from the data alone, in eight greys. Colour belongs to the work
itself -- screenshots, covers, organisation logos and skill icons keep their
own -- and the interface never adds any. Dark is the default theme, on true
black; light is one click away and remembered. The home page opens on type
alone: the name, the role, two actions and four facts. The portrait is small,
above the About heading.

- **Eight greys paint everything, and none of them is an accent.**
  `--fh-bg`, `surface`, `raise`, `line`, `line-2`, `mute`, `ink-2` and `ink`
  live in `styles/site.css` with their jobs written beside them, redefined
  under `[data-theme="dark"]`. `--fh-paper` and the other names the admin's
  palette and Tailwind's `bg-paper` were built on are aliases of them, which is
  how the admin follows the site. Never a `dark:` variant, never a zinc class on
  a public page. Every rule below the tokens is anchored to `.fh-site`, so none
  reaches the admin; `--fh-print` is the portrait's plate, light in both themes.
- **The sheet is unlayered, so a class here beats any utility.** The public
  pages are written in the class vocabulary of `styles/site.css` (`.btn`, `.tag`,
  `.pcard`, `.panel`, `.sec`, `.wrap`) rather than in utilities; a utility on the
  same element and property loses. Add rules at the end, under `.fh-site`.
- **Status is a shape, never a colour.** `PHASE` in `components/foothill/ui.tsx`
  maps a status *slug* to a tag: filled for done, outlined for in progress,
  dashed for planned or waiting, struck for stopped. The label is editorial and
  only ever rendered. Charts tell series apart by fill pattern (`.f1` to `.f6`),
  checked in greys alone.
- **Three faces, one job each**, from `app/fonts.ts`: Funnel Display for
  headings, Geist for everything read, Geist Mono for figures, dates and code.
  The scale is `.t1`, `.t2`, `.t3`, `.lead` and `.meta` in `site.css`. Geist is
  Tailwind's `font-sans`, so the admin inherits it.
- **A single-tone icon is inverted on the theme it would vanish on,** and every
  other icon is shown in its own colours. Which is `media_asset.tone` (`dark` or
  `light`), measured from the icon's pixels by `scripts/measure-icon-tones.mjs`
  -- guessing from the file's colour values misses half of them. **Run it with
  `--apply` after uploading a skill's icon in the admin;** a new icon starts
  unmeasured and a black one is invisible on the dark theme until it is.
- **A project's first image is its live address.** `scripts/capture-project-previews.mjs`
  photographs each `demo_url` (dry run by default; look at the files before
  `--apply`) and files the capture first in the gallery. A `demo_url` that stops
  answering should be cleared rather than left to show a dead link.
- **No picture is a drawing, and it is drawn everywhere a picture would be.**
  `NoImage` (`components/foothill/noimg.tsx`) sketches the kind of work in the
  page's greys -- a web page, a terminal, a chart, a network, a flow, a board, an
  article -- over a dotted ground, chosen by the category *slug*
  (`lib/site/noimg.ts`, pure and tested) and varied by a seed taken from the
  title, so two web projects are not one tile repeated. It fills a card through
  `Thumb`, and it fills each `.mini` thumbnail (home's "Currently building", the
  Work list, the skill drawer): a `.mini` that wrote `{image && <SiteImage/>}`
  was an empty box. The title is hidden by a container query under 200px and in
  every `.mini`, which always sits beside its own title. Its classes are `ni-`
  prefixed for the collision reason in the root `CLAUDE.md` (a class that is also a
  Tailwind utility). **A new place that shows a project's
  picture renders `NoImage` when there is none.**
- **A gallery's strip is six columns whatever the count.** It was as many columns
  as images up to six, so a project with two screenshots drew thumbnails half the
  page wide beside another's sixth. `.gal-strip` in `site.css` owns the count.
- **A band sized by the viewport crops its content differently at every width.**
  The footer's word is fitted to the page's width by `GiantWord`, and the band
  holding it takes its height from the same measurement; a CSS height from `vw`
  cropped the word to a different slice at each resolution, and a scrub that
  never completed left it half hidden. `ScrollTrigger.refresh()` follows every fit.
- **No kicker labels, no em dashes in copy.** A section says what it is in its
  own title (`Heading`, its count set small beside it), and copy uses a comma or
  a full stop.
- **Every glyph is an SVG from `components/foothill/icons.tsx`,** each carrying
  the icon for what it does. An arrow only where a link leaves the site. Icons
  never grow, turn or move on hover; they take the ink colour with their label.
- **Two motion libraries, divided by what they do.** Framer Motion owns what
  responds to a press or a state: the sliding pills (`layoutId`), disclosures,
  dialogs, the palette, toasts, the CV and Markdown viewers, the drawer. GSAP
  owns what follows the scroll or splits text: `PageMotion` (once per page,
  running `data-fh-split`, `-chars`, `-enter`, `-blur` and section titles),
  `Reveal`, `Animate` for charts (`data-fh-bar`, `-col`, `-draw`, `-sweep`,
  `-fade`), `CountUp`, `TiltedRow`, and the skills marquee. `MotionConfig
  reducedMotion="user"` in the shell and `MOTION_OK` in GSAP gate both.
- **Never animate server-painted markup into a `<Suspense>` boundary.** A
  page-wide script runs before that boundary hydrates, and styling markup React
  has not claimed is a hydration mismatch. Anything that streams carries
  `data-fh-scope`, which `PageMotion` skips, and brings its own motion;
  `AnimatePresence` over server-painted content takes `initial={false}`.
  `useMountedByHydration` decides whether an entrance may play, and
  `data-fh-hold` hides an element until GSAP or a fallback reveals it. **Never
  hold a control** -- `check-breakpoints.mjs` counts it as missing.
- **An entrance waits on an IntersectionObserver, never a ScrollTrigger.**
  `onSeen` in `motion.tsx` is the one trigger every reveal uses: a ScrollTrigger
  works out its start against the scroll offset of the moment it is created, and
  on a client navigation that is still the previous page's. ScrollTrigger stays
  for what scrubs.
- **A constant exported from a `"use client"` module is not that constant.**
  `DEFAULT_FILTERS.sort` read from a server page was `undefined`, and the first
  filter change wrote `?sort=undefined`; `CV_FILE` is the same trap. Shared
  constants live in plain modules (`lib/site/work-filters.ts`, `lib/site/cv.ts`,
  `lib/site/twins.ts`).
- **A render function, not a component, inside a component.** A component
  declared in a render is a new type each time, so an open reply box loses its
  focus on every keystroke. The guestbook and the contact form use functions.
- **A filtered list is a URL.** Work and Writing write their filters to the
  address with `history.replaceState` (back still means the page before), the
  server reads them on arrival, and `serverMatches` is its answer for `?q=`,
  which searches each body as well as the fields the client holds.
- **Filters live behind a button.** `FilterBar` (`components/foothill/filter-bar.tsx`)
  is one line -- search, **Filters** with a count of what is applied, sort and
  view -- with every group that narrows the list (`FilterGroup`) in a panel that
  opens below it, and what is applied drawn outside the panel as removable chips
  with Clear all. Five rows of chips sat between Work's heading and its first
  project, 610px of them on a phone. The panel starts closed on the server and
  the client alike: opening itself for a filter in the address would paint
  differently from the page the server sent. A new filtered list is a
  `FilterBar` and its skeleton is `FilterBarSkeleton`, not a row of chips. The
  heights of its controls are the next entry's.
- **Controls come in two heights, and a button is the Filters button's.**
  `.btn`, the Filters button, the search field and a segmented control are 34px
  with 13px type; `.btn.sm` and a chip are 28px with 12.5px. Under a coarse
  pointer they are 40px and 32px with the invisible `::after` keeping the 44px
  tap, so a button never has to be big to be reachable. The sign-in buttons
  (`.btn.wide`) were 48px beside a 34px search; a skeleton that stands in for a
  button draws the same 34px, or the page jumps when it lands.
- **A page's frame is `MAIN` and `WRAP`** from `components/foothill/layout.ts`,
  and its skeleton uses `PageSkeleton` and the blocks in
  `components/foothill/skeleton.tsx` -- which is what `check-skeleton-shape.mjs`
  measures. A page drops the footer's invitation band with `data-quiet` on
  `<main>` where it is already the way to get in touch (Contact, Sign in, the
  error pages).
- **The overlays all lock the page the same way.** `useLockedPage`
  (`lib/motion/use-locked-page.ts`) counts holders and puts `locked` on
  `<html>`; the scrollbar keeps its gutter, so opening one never shifts the
  layout sideways.

## How pictures are resized is a setting

`site_setting` is one row (a unique index on a constant refuses a second) with
`image_service` -- `none`, `next` or `wsrv` -- and `image_quality`. The default
row is what the site did before the setting existed: Next's optimizer at 80.
Next's optimizer spends the host's image-transformation quota, which is the
reason the choice exists; `wsrv` sends each width to wsrv.nl instead, which
fetches the original from storage and answers with a resized WebP, and `none`
serves the stored file as it is.

- **`SiteImage` is the only way the public site renders a picture.**
  `components/foothill/site-image.tsx` wraps `next/image` and reads the choice
  from `ImageServiceProvider`, mounted once in `SiteShell` from the layout's
  cached read (`getImageSettings`, tagged `settings`). A component that imports
  `next/image` itself bypasses the setting and nothing else will say so. The
  admin's own previews are plain `img` for a different reason, in
  `image-field.tsx`.
- **A path on this site has nothing for wsrv to fetch.** `wsrvUrl` returns
  `null` for anything that is not an absolute http(s) address and the loader
  falls back to the source as it is. Every uploaded picture is an absolute
  storage address, so this only matters for a local path.
- **Next 16 serves only the qualities it is told about.** `images.qualities`
  in `next.config.ts` and `NEXT_QUALITIES` in `lib/site/image-service.ts` are
  the same list, because the config cannot import the module; the setting is
  snapped to the nearest before it is passed.
- **`img-src` names wsrv.nl** in the report-only policy. Promote the policy
  with it still there or wsrv pictures are blocked.
- **The screen is in its own `Site` group and the editor preset leaves that
  group out**, so changing what the site costs is the owner's unless somebody
  is granted it on the Access screen. `scripts/check-image-service.mjs` saves
  each choice through the real form and reads what a signed-out reader gets.
