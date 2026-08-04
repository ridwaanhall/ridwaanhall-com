---
name: rebuild-css
description: Rebuild the compiled Tailwind CSS output and verify the hardcoded output filename stays in sync across the build command and templates. Use after editing static/css/input.css, after changing Tailwind config, or whenever the compiled CSS filename needs to change (cache busting).
---

This repo does not auto-hash its compiled CSS filename. The output path is a hand-picked string (currently `staticfiles/css/global-wvbpenzt.css`) that is hardcoded in three places, which must always agree:

1. The Tailwind CLI `-o` flag (the build command below)
2. `templates/base_seo.html` — `{% static 'css/<filename>' %}`
3. `templates/error.html` — `{% static 'css/<filename>' %}`

## Steps

1. Find the current filename by checking the `{% static %}` reference in `templates/base_seo.html`.
2. Run the build:

   ```
   npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/<filename> --minify
   ```

   (Add `--watch` instead of running once if the user wants live rebuilding during dev.)

3. If the filename is changing (e.g. for cache busting after a CSS change):
   - Update the `-o` path used above.
   - Update the `{% static %}` reference in both `templates/base_seo.html` and `templates/error.html`.
   - Delete the old file under `staticfiles/css/` so it doesn't linger.
4. Confirm all three references now point at the same filename before considering the task done — a mismatch silently breaks styling in production since WhiteNoise will serve whatever templates ask for, even if it's stale or missing.
