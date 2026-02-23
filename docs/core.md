# Core App

The `apps/core` app provides the foundational views, forms, email handling, image optimization, and utility classes used across the entire project.

## File Structure

```txt
apps/core/
├── base_views.py          # Reusable base view classes
├── views.py               # Page views (home, contact, privacy, CV, dynamic assets)
├── urls.py                # URL routing
├── forms.py               # Contact form
├── validators.py          # Cloudflare Turnstile validation
├── email_handler.py       # Email dispatch functions
├── email_templates.py     # HTML/text email template loader
├── image_utils.py         # wsrv.nl image optimization
├── models.py              # (empty - no models)
├── management/
│   └── commands/
│       └── wsrv_config.py # WSRV management command
├── templatetags/
│   └── image_filters.py   # wsrv_image template filter/tag
└── templates/core/
    └── email/             # HTML and text email templates
```

## Base Views (`base_views.py`)

Three reusable base classes that other apps inherit from.

### `BaseView`

Extends Django's `TemplateView`. Provides common context (`about` data and `seo` metadata) to all views through the SEO mixin system.

### `PaginatedView`

Extends `BaseView` with built-in pagination. Handles:

- Configurable `items_per_page` (default: 6)
- Smart page range with a sliding window (shows 5 pages around the current page)
- Invalid page fallback (defaults to page 1)

Subclasses override `get_items()` and `get_template_name()`.

### `DetailView`

Extends `BaseView` for single-item detail pages. Uses `slug_field` (default: `title`) to look up content by slug. Subclasses override `get_all_items()`.

## Views (`views.py`)

| View | URL | Description |
|------|-----|-------------|
| `HomeView` | `/` | Homepage with featured blogs, projects, recent blogs, experiences, education |
| `ContactView` | `/contact/` | Contact form with Cloudflare Turnstile CAPTCHA (GET renders form, POST validates and sends email) |
| `PrivacyPolicyView` | `/privacy-policy/` | Displays privacy policy from `DataService` |
| `CVRedirectView` | `/cv/` | Redirects to Google Docs CV |
| `CVLatestRedirectView` | `/cv-latest/` | Redirects to latest CV version |
| `CVTemplateRedirectView` | `/cv-copy/` | Redirects to CV template copy |
| `dynamic_css_view` | `/css/<name>.css` | Serves dynamic CSS files from staticfiles |
| `dynamic_webmanifest_view` | `/site.webmanifest` | Serves web app manifest with dynamic `about` data |

### Contact Form Flow

1. User submits form → Turnstile token validated via `TurnstileValidator`
2. On success → `send_contact_email()` sends an email to the site owner and an auto-reply confirmation to the user
3. Returns JSON response (`is_ajax`) or redirects

## Forms (`forms.py`)

### `ContactForm`

Fields: `name`, `email`, `message`. Uses TailwindCSS-styled widgets with placeholder text and rounded borders.

## Validators (`validators.py`)

### `TurnstileValidator`

Validates Cloudflare Turnstile tokens by POSTing to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Returns `True` if the token is valid. Controlled by the `USE_CF_TURNSTILE` setting — when disabled, always returns `True`.

## Email Handler (`email_handler.py`)

All email functions use Django's `EmailMultiAlternatives` (HTML + plain text). Templates are loaded via `EmailTemplateLoader`.

| Function | Purpose |
|----------|---------|
| `_get_owner_emails()` | Returns list of owner emails from `CONTACT_EMAIL_RECIPIENT` setting |
| `send_contact_email(name, email, message)` | Sends two emails: owner notification + auto-reply confirmation to sender |
| `send_guestbook_notification(user_name, user_email, message, reply_info)` | Notifies the site owner about a new guestbook message |
| `send_guestbook_user_confirmation(user_name, user_email, message)` | Sends confirmation to the guestbook message author |
| `send_guestbook_reply_notification(original_name, original_email, replier_name, reply_message, original_message)` | Notifies the original poster when someone replies to their message |

## Email Templates (`email_templates.py`)

### `EmailTemplateLoader`

Loads templates from `apps/core/templates/core/email/` using simple `{{ variable }}` replacement (not Django's template engine).

Provides render methods for each email type:

- `render_contact_owner_html/text` — owner notification for contact form
- `render_contact_confirmation_html/text` — auto-reply to contact form sender
- `render_guestbook_notification_html/text` — owner notification for guestbook
- `render_guestbook_confirmation_html/text` — confirmation to guestbook poster
- `render_guestbook_reply_notification_html/text` — reply notification to original poster

## Image Optimization (`image_utils.py`)

### `get_optimized_image_url(image_url, width, height, format_type)`

Proxies images through [wsrv.nl](https://wsrv.nl) for automatic optimization. Parameters:

- `width` / `height` — resize dimensions
- `format_type` — output format (e.g., `webp`)
- Adds `&output=webp` by default

Controlled by `WSRV_IMAGE_OPTIMIZATION` setting. When disabled, returns the original URL unchanged.

### `get_wsrv_status()`

Returns the current enabled/disabled state of WSRV optimization.

## Template Tags (`templatetags/image_filters.py`)

### `wsrv_image` filter

```django
{{ image_url|wsrv_image }}
{{ image_url|wsrv_image:"300x300" }}
{{ image_url|wsrv_image:"300" }}
```

### `wsrv_img` tag

```django
{% wsrv_img image_url width=300 height=300 format_type="webp" %}
```

## Management Command

### `wsrv_config`

Test and check WSRV image optimization settings.

```bash
python manage.py wsrv_config --status
python manage.py wsrv_config --test-url "https://example.com/image.jpg" --width 300
```

## URL Configuration

```
/                     → HomeView
/contact/             → ContactView
/privacy-policy/      → PrivacyPolicyView
/cv/                  → CVRedirectView
/cv-latest/           → CVLatestRedirectView
/cv-copy/             → CVTemplateRedirectView
/css/<name>.css       → dynamic_css_view
/site.webmanifest     → dynamic_webmanifest_view
```
