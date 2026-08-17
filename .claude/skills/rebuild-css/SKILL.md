---
name: rebuild-css
description: Rebuild the compiled Tailwind CSS output, automatically renaming it to a fresh random filename for cache busting, and verify the hardcoded output filename stays in sync across the build command and templates. Use after editing static/css/input.css or after changing Tailwind config.
---

This repo does not auto-hash its compiled CSS filename. The output path is a hand-picked string (currently `staticfiles/css/global-ewllzlra.css`) that is hardcoded in three places, which must always agree:

1. The Tailwind CLI `-o` flag (the build command below)
2. `templates/base_seo.html` — `{% static 'css/<filename>' %}`
3. `templates/error.html` — `{% static 'css/<filename>' %}`

Every rebuild picks a **new random filename** — this is deliberate, not optional. Because there's no content hash, reusing the old filename after a CSS change risks stale cached CSS being served under the same URL; a fresh random name forces browsers/CDNs to fetch the new content. Never rebuild in place onto the existing filename.

## Steps

1. Find the current filename by checking the `{% static %}` reference in `templates/base_seo.html` (call it `<old_filename>`).
2. Generate a new random 8-character lowercase-letter slug and build the new filename `global-<slug>.css` (matching the existing naming style, e.g. `global-bijbtigg.css` → `global-rqfrjorp.css`). Generate it, don't hand-pick it, e.g.:

   ```
   uv run python -c "import random,string;print('global-'+''.join(random.choices(string.ascii_lowercase,k=8))+'.css')"
   ```

   Re-roll if it happens to collide with `<old_filename>` or with any file already under `staticfiles/css/`.
3. Run the build with the new filename:

   ```
   npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/<new_filename> --minify
   ```

   (Add `--watch` instead of running once if the user wants live rebuilding during dev — in that case skip the rename dance and rebuild onto the existing filename until the watch session ends, then do a final random-rename pass.)
4. Update the `{% static %}` reference in both `templates/base_seo.html` and `templates/error.html` from `<old_filename>` to `<new_filename>`.
5. Delete the old file under `staticfiles/css/` so it doesn't linger.
6. Confirm all three references (`-o` path used, `base_seo.html`, `error.html`) now point at the same new filename, and that exactly one `global-*.css` file remains under `staticfiles/css/`, before considering the task done — a mismatch silently breaks styling in production since WhiteNoise will serve whatever templates ask for, even if it's stale or missing.
