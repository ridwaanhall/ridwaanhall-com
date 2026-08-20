# /static/ is load-bearing — do not move or rename this directory

`about_skill.icon_svg` stores **absolute URLs** for all 78 skill icons, in the
form `https://ridwaanhall.com/static/svg/icon/<name>.svg`. Those values live in
the database, not in any file, so nothing in this codebase references them and
no build step, type check or lint can notice if the path stops resolving.

They were served by Django's `staticfiles/svg/`. Next serves the same paths from
here. If this directory moves, every skill icon on the homepage marquee, the
about page and every project card silently 404s.

(In local development these URLs still point at the live site, because they are
absolute. That is the stored data's shape, not a bug in the port.)

Verified complete: a scan of every JSONB content column, plus `icon_svg`, found
`/static/svg/icon/` to be the only `/static/` path referenced from the database.
