# /static/ is load-bearing — do not move or rename this directory

`about_skill.icon_svg` stores **absolute URLs** for all 78 skill icons, in the
form `https://ridwaanhall.com/static/svg/icon/<name>.svg`. Those values live in
the database, not in any file, so nothing in this codebase references them and
no build step, type check or lint can notice if the path stops resolving.

If this directory moves, every skill icon on the homepage marquee, the about
page and every project card silently 404s.

(Some stored URLs are absolute, so in local development they still resolve
against the live site rather than against localhost. That is the shape of the
data, not a bug.)

Verified complete: a scan of every JSONB content column, plus `icon_svg`, found
`/static/svg/icon/` to be the only `/static/` path referenced from the database.
