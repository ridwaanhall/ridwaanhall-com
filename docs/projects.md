# Projects App

The `apps/projects` app provides a paginated project showcase with search, featured project sorting, individual detail pages, and multi-image support.

## File Structure

```
apps/projects/
├── views.py               # Projects list and detail views
├── urls.py                # URL routing
├── models.py              # (empty - no models)
├── admin.py               # (empty)
├── data/
│   ├── projects_index.py  # Dynamic project file loader
│   └── projects/
│       ├── project-1.py   # Individual project
│       ├── project-2.py
│       └── ...
├── types/
│   ├── project.py         # Feature, ProjectData
│   └── __init__.py
├── templatetags/
│   └── project_tags.py    # Multi-image template filters/tags
└── templates/projects/
    ├── projects.html          # Projects listing page
    ├── projects_detail.html   # Individual project page
    └── partials/
        └── project_image_gallery.html  # Image gallery inclusion tag
```

## Views (`views.py`)

### `ProjectsView`

**URL**: `/projects/`

Extends `PaginatedView` (6 items per page). Displays all projects with:

- **Search**: Filters by title, headline, description, category, or tags via `?q=` query parameter
- **Sorting**: Featured projects appear first (sorted by `featured_priority` ascending: 1, 2, 3...), then non-featured projects sorted by `created_at` descending

### `ProjectsDetailView`

**URL**: `/projects/<slug:title>/`

Extends `DetailView`. Looks up a single project by its slugified title.

## Template Tags (`templatetags/project_tags.py`)

### Filters

| Filter | Usage | Description |
|--------|-------|-------------|
| `get_project_image` | `{{ project\|get_project_image:"screenshot.webp" }}` | Get a specific image by name, or the first image if none specified |
| `get_project_image_name` | `{{ project\|get_project_image_name:0 }}` | Get the image filename at a given index |
| `project_image_count` | `{{ project\|project_image_count }}` | Number of images in the project |
| `has_multiple_images` | `{% if project\|has_multiple_images %}` | Check if the project has more than one image |

### Inclusion Tag

```django
{% project_image_gallery project "gallery-class" %}
```

Renders `projects/partials/project_image_gallery.html` with all project images.

## How Project Data Works

Projects have no database models. Each project is an individual Python file in `apps/projects/data/projects/` (e.g., `project-1.py`). The file exports a `project_data` dict:

```python
project_data = {
    'id': 1,
    'title': 'My Project',
    'headline': 'A short tagline',
    'description': 'Full description...',
    'category': 'Web Development',
    'tags': ['django', 'python', 'tailwind'],
    'tech_stack': [
        {'name': 'Django', 'icon_svg': '<svg>...</svg>'},
    ],
    'is_featured': True,
    'featured_priority': 1,
    'github_url': 'https://github.com/...',
    'live_url': 'https://...',
    'images': {
        'cover.webp': 'https://example.com/images/cover.webp',
        'detail.webp': 'https://example.com/images/detail.webp',
    },
    'created_at': datetime(2025, 3, 1, tzinfo=...),
    'updated_at': datetime(2025, 3, 15, tzinfo=...),
}
```

The `ProjectsDataIndex` loader dynamically imports all `project-*.py` files and extracts `image_url`, `img_name`, `image_list`, `image_names`, and `image_count` for backward compatibility.

OOP types for project data are defined in `apps/projects/types/`:

```python
from apps.projects.types import ProjectData, Feature
```

See [Data App](data.md) for details on the Individual File System.

## URL Configuration

```
/projects/                → ProjectsView (listing with pagination and search)
/projects/<slug:title>/   → ProjectsDetailView (single project)
```

## Adding a New Project

1. Create a new file: `apps/projects/data/projects/project-<id>.py`
2. Export a `project_data` dict following the structure above
3. The project will appear automatically — no migrations or database changes needed
4. Set `is_featured: True` and `featured_priority: <number>` to feature it at the top
