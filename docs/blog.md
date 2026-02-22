# Blog App

The `apps/blog` app provides a paginated blog listing with search functionality, featured posts, individual blog detail pages, and multi-image support via custom template tags.

## File Structure

```
apps/blog/
├── views.py               # Blog list and detail views
├── urls.py                # URL routing
├── models.py              # (empty - no models)
├── admin.py               # (empty)
├── templatetags/
│   └── blog_tags.py       # Multi-image template filters/tags
└── templates/blog/
    ├── blog.html          # Blog listing page
    ├── blog_detail.html   # Individual blog post page
    └── partials/
        └── image_gallery.html  # Image gallery inclusion tag
```

## Views (`views.py`)

### `BlogView`

**URL**: `/blog/`

Extends `PaginatedView` (6 items per page). Displays all blog posts with:

- **Search**: Filters by title, description, author, or tags via `?q=` query parameter
- **Featured posts**: `featured_blogs` are passed separately for highlighted display
- **Sorting**: Posts sorted by `created_at` descending (newest first)

### `BlogDetailView`

**URL**: `/blog/<slug:title>/`

Extends `DetailView`. Looks up a single blog post by its slugified title. Passes the full blog data dict as `blog` in context.

## Template Tags (`templatetags/blog_tags.py`)

### Filters

| Filter | Usage | Description |
|--------|-------|-------------|
| `get_blog_image` | `{{ blog\|get_blog_image:"thumbnail.webp" }}` | Get a specific image by name, or the first image if no name given |
| `get_blog_image_name` | `{{ blog\|get_blog_image_name:0 }}` | Get the image filename at a given index |
| `blog_image_count` | `{{ blog\|blog_image_count }}` | Number of images in the blog post |
| `has_multiple_images` | `{% if blog\|has_multiple_images %}` | Check if the post has more than one image |

### Inclusion Tag

```django
{% blog_image_gallery blog "gallery-class" %}
```

Renders `blog/partials/image_gallery.html` with all blog images.

## How Blog Data Works

Blog posts have no database models. Each post is an individual Python file in `apps/data/content/blog/` (e.g., `blog-1.py`). The file exports a `blog_data` dict with fields like:

```python
blog_data = {
    'id': 1,
    'title': 'My Blog Post',
    'description': 'Short description',
    'content': 'Full HTML content...',
    'author': 'Ridwan Halim',
    'tags': ['python', 'django'],
    'is_featured': True,
    'images': {
        'cover.webp': 'https://example.com/images/cover.webp',
        'diagram.webp': 'https://example.com/images/diagram.webp',
    },
    'created_at': datetime(2025, 1, 15, tzinfo=...),
    'updated_at': datetime(2025, 1, 20, tzinfo=...),
}
```

The `BlogDataIndex` loader dynamically imports all `blog-*.py` files at runtime, extracting `image_url`, `img_name`, `image_list`, `image_names`, and `image_count` from the `images` dict for backward compatibility.

See [Data App](data.md) for details on the Individual File System.

## URL Configuration

```
/blog/                → BlogView (listing with pagination and search)
/blog/<slug:title>/   → BlogDetailView (single post)
```

## Adding a New Blog Post

1. Create a new file: `apps/data/content/blog/blog-<id>.py`
2. Export a `blog_data` dict following the structure above
3. The post will appear automatically — no migrations or database changes needed
