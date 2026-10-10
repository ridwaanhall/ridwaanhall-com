# The admin's components

Guidance for working in `components/admin/`. The root `CLAUDE.md` covers everything that applies everywhere.

@../../lib/admin/CLAUDE.md

## The admin draws its own form controls, and the CSS is class-scoped

A `<select>`'s closed box was always themeable; the list that drops out of it
never was, and neither was a checkbox's tick, a number field's spinners, or the
calendar behind `<input type="date">`. Those are operating-system chrome.
`color-scheme` renders them in *a* dark, but it is the browser's, not this
site's.

So `styles/admin-controls.css` draws them, and `components/admin/controls/`
replaces the two that need a panel. **Every selector in that stylesheet is
anchored to a class** — `.admin-check`, `.admin-select`, `.admin-popover` —
because the file is imported from `app/globals.css` and is therefore global: a
rule written as `input[type="checkbox"] { … }` restyles the contact form, the
comment box and the guestbook composer, silently. The two admin sheets beside
it already work that way. `scripts/check-admin-controls.mjs` parses the
selectors and fails on a bare element name.

## Other things worth knowing here

- **No shadows, and the admin wears the site's palette.** The admin is
  written in stock Tailwind colour classes with no `dark:` variants -- zinc for
  surfaces, lines and text, indigo for focus and accent -- and
  `styles/theme-light.css` defines zinc, black, white and indigo *from the
  site's tokens*, which already change with the theme. So both themes, and
  the shared toast, dialog and tooltip, are the site's paper, ink and line
  from one table; only the status hues (green, red, amber and the
  rest) keep a light table of their own. Two consequences worth knowing:
  `white` is ink, so it is dark in light mode -- a surface that must stay
  light in both themes is `fh-print`, never `bg-white` -- and `indigo` is
  ink, since the site has no accent colour. Stay inside that vocabulary or a
  colour silently misses a theme.
  The admin is laid out as the public pages are, without cards: every screen
  opens with `ScreenHead` (`components/admin/screen-head.tsx`, the admin's
  `PageHead`), and an area, a fieldset or an inline is a display-face title
  over hairline-ruled rows rather than a bordered box. A box is kept only
  where it frames something that scrolls or floats -- the rich-text editor, a
  scrolling checkbox list, a popover, the dialog. The repeated class strings
  (the title, the section title, the input, the primary, quiet, pill and
  row-icon buttons, the save bar) live in `components/admin/control-classes.ts`;
  a new screen uses them rather than writing its own, and its skeleton opens
  with `ScreenHeadSkeleton`.
- **A label activates its control from anywhere inside its box, and a grid item
  is stretched to its cell.** The admin's field rows put the label in one column
  and the control in the next, so every label's box was as wide as the column
  and as tall as whatever stood beside it, with the word itself in a corner.
  Beside "Photo" that was 102x138 around 39x18 of text: 95% of a cell that
  looked like margin, wired to a file input, so clicking the blank space opened
  the operating system's file picker. Beside a rich-text field it was 230x1257.
  The checkbox labels had the same shape sideways — "Featured" ran 477px around
  83px of word, and a click well clear of it flipped a published flag. The fix
  is `w-fit`/`justify-self-start` and `self-start` on the label, which changes
  nothing visible: a label has no background, so only its hit area moves.
  `scripts/check-admin-labels.mjs` measures every label on every form screen
  against its own content, and clicks beside one for real. It measures sideways
  overhang only on labels that fit on one line — wrapped text ends its last line
  short and no CSS width means "the longest line", so that tail is not a fault.
