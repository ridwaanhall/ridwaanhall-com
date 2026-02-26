# SEO App

The `apps/seo` app handles search engine optimization across the entire site — meta tags, Open Graph, Twitter Cards, JSON-LD schemas, sitemaps, and robots.txt.

## File Structure

```
apps/seo/
├── mixins.py          # SEO view mixins (used by all other apps)
├── manager.py         # Central SEO manager
├── data.py            # Raw SEO data definitions
├── schema.py          # JSON-LD schema generator
├── config.py          # SEO configuration constants
├── sitemaps.py        # Django sitemap classes
├── updated_at_data.py # Last-modified timestamp tracker
├── views.py           # robots.txt view
└── urls.py            # Sitemap and robots.txt URLs
```

## How It Works

Every page view in the project uses an SEO mixin that automatically generates meta tags, Open Graph data, Twitter Cards, and JSON-LD structured data. The flow:

1. A view inherits from an SEO mixin (e.g., `HomepageSEOMixin`, `BlogDetailSEOMixin`)
2. The mixin's `get_context_data()` creates an `SEOManager` instance with `about` data
3. `SEOManager` generates page-specific SEO data + JSON-LD schemas
4. The `seo` dict is added to template context and rendered in `base_seo.html`

## Mixins (`mixins.py`)

The base `SEOMixin` class provides `get_seo_data()` which dispatches to the appropriate `SEOManager` method based on `seo_type`. It also injects `seo` and `about` data into the template context.

Available page-specific mixins:

| Mixin | `seo_type` | Used By |
|-------|-----------|---------|
| `HomepageSEOMixin` | `homepage` | `HomeView` |
| `AboutSEOMixin` | `about` | `AboutView` |
| `ContactSEOMixin` | `contact` | `ContactView` |
| `DashboardSEOMixin` | `dashboard` | `DashboardView` |
| `BlogListSEOMixin` | `blog_list` | `BlogView` |
| `BlogDetailSEOMixin` | `blog_detail` | `BlogDetailView` |
| `ProjectsListSEOMixin` | `projects_list` | `ProjectsView` |
| `ProjectDetailSEOMixin` | `project_detail` | `ProjectsDetailView` |
| `GuestbookSEOMixin` | `guestbook` | `GuestbookView` |
| `PrivacyPolicySEOMixin` | `privacy_policy` | `PrivacyPolicyView` |
| `OpenHireSEOMixin` | `openhire` | `OpenHireView` |

## Manager (`manager.py`)

### `SEOManager`

Central class initialized with `about_data`. Each method returns a dict with `title`, `description`, `keywords`, `og_image`, `og_type`, `twitter_card`, `canonical_url`, and `schemas`.

Key methods:

- `get_homepage_seo()` — Website + Person schemas
- `get_blog_list_seo(blogs, page)` — Blog + CollectionPage schemas, page title for pagination
- `get_blog_detail_seo(blog_data)` — BlogPosting schema
- `get_projects_list_seo(projects, page)` — CollectionPage schema
- `get_project_detail_seo(project_data)` — SoftwareSourceCode schema
- `get_about_seo()` — ProfilePage schema
- `get_contact_seo()` — ContactPage schema
- `get_guestbook_seo()` — Breadcrumb schema
- `get_privacy_policy_seo()` — PrivacyPolicy schema
- `get_openhire_seo()` — Breadcrumb schema

### `get_meta_tags(seo_data, request)`

Generates the final meta tag dict used in templates, including `og_*`, `twitter_*`, `canonical_url`, `author`, `published_date`, `modified_date`, and `schemas`.

## Sitemaps (`sitemaps.py`)

Three sitemap classes registered in `urls.py`:

### `StaticPagesSitemap`

Covers all static pages (home, dashboard, about, contact, privacy, guestbook) and generates paginated entries for blog and project listing pages. Uses `UpdatedAtData` for `lastmod` values. Guestbook `lastmod` comes from the latest `ChatMessage` timestamp.

### `BlogSitemap`

One entry per blog post. Featured blogs get priority `0.9`, others `0.7`. URLs use slugified titles.

### `ProjectSitemap`

One entry per project. Featured projects get priority `0.9`, others `0.7`. URLs use slugified titles.

## Updated At Tracker (`updated_at_data.py`)

### `UpdatedAtData`

Scans content files and database records to determine the last modification time for each page:

- **Blog/Projects**: Reads `updated_at` from individual content Python files in `apps/blog/data/blog/` and `apps/projects/data/projects/`
- **About**: Checks file modification time of `apps/about/data/about_data.py`
- **Guestbook**: Latest `ChatMessage` timestamp
- **Dashboard**: Always current time (dynamic data)
- **Home**: Most recent of blog, project, or about update

## Views (`views.py`)

### `robots_txt`

**URL**: `/robots.txt`

Generates a `robots.txt` file with sitemap references. Cached for 24 hours.

## URL Configuration

```
/robots.txt           → robots_txt
/sitemap.xml          → Combined sitemap index
/sitemap-static.xml   → StaticPagesSitemap
/sitemap-blog.xml     → BlogSitemap
/sitemap-projects.xml → ProjectSitemap
```
