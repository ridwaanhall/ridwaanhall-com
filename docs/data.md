# Data App

The `apps/data` app implements the **Individual File System (IFS)** — a file-based content management approach where each piece of content (blog post, project, about info, etc.) is stored as a standalone Python file instead of in a database.

## File Structure

```
apps/data/
├── data_service.py        # Centralized data access layer
├── content_manager.py     # Blog and project data manager
├── about_manager.py       # About-related data manager
├── apps.py                # AppConfig
├── content/
│   ├── blog_index.py      # Dynamic blog file loader
│   ├── projects_index.py  # Dynamic project file loader
│   ├── blog/
│   │   ├── blog-1.py      # Individual blog post
│   │   ├── blog-2.py
│   │   └── ...
│   └── projects/
│       ├── project-1.py   # Individual project
│       ├── project-2.py
│       └── ...
├── about/
│   ├── about_data.py      # Personal info, bio, social media, skills
│   ├── experiences_data.py
│   ├── education_data.py
│   ├── certifications_data.py
│   ├── awards_data.py
│   ├── applications_data.py
│   └── skills_data.py
├── openhire/
│   ├── open.py            # Open-to-work data
│   └── hiring.py          # Hiring data
└── privacy/
    ├── privacy_policy_data.py  # Privacy policy content
    └── types.py                # Dataclass types
```

## Why Individual Files?

- **No database migrations** for content changes — just edit a Python file
- **Git-friendly** — each content piece has its own commit history
- **Easy deployment** — content ships with the code, no data import/export needed
- **Type-safe** — Python dicts with IDE autocompletion
- **Dynamic loading** — files are discovered and imported at runtime using `importlib`

## DataService (`data_service.py`)

The top-level access layer used by all views. Wraps `ContentManager` and `AboutManager` with error handling and logging.

| Method | Returns | Description |
|--------|---------|-------------|
| `get_about_data()` | `dict` or `None` | Personal info (flattened) |
| `get_blogs(sort_by_id, featured_only)` | `list[dict]` | Blog posts, optionally filtered/sorted |
| `get_projects(sort_by_featured)` | `list[dict]` | Projects with featured-first sorting |
| `get_experiences(current_only)` | `list[dict]` | Work experiences |
| `get_education(last_only)` | `list[dict]` | Education records |
| `get_certifications()` | `list[dict]` | Certifications |
| `get_skills()` | `list[dict]` | Skills (only those with valid `icon_svg`) |
| `get_awards(sort_by_id)` | `list[dict]` | Awards |
| `get_applications()` | `list[dict]` | Applications with journey timestamps |
| `get_privacy_policy()` | `dict` | Privacy policy data |
| `get_open_to_work_data()` | `dict` or `None` | Open to work details |
| `get_hiring_data()` | `dict` or `None` | Hiring details |

## ContentManager (`content_manager.py`)

Manages blog and project content. Delegates loading to `BlogDataIndex` and `ProjectsDataIndex`.

Additional query methods:

- `get_blog_by_id(id)` / `get_project_by_id(id)` — lookup by ID
- `get_featured_blogs(limit)` / `get_featured_projects(limit)` — featured content
- `get_recent_blogs(limit)` / `get_recent_projects(limit)` — latest content
- `get_data_source_info()` — metadata about loaded content files

## AboutManager (`about_manager.py`)

Manages about-related data files. Handles:

- **About data flattening**: The `about_data.py` file uses nested structure (`personal`, `bio`, `location`, etc.) which gets flattened to root level for backward compatibility
- **Applications sorting**: Sorts by the latest journey timestamp (most recent first), with individual journey steps sorted chronologically
- **Skills filtering**: Only returns skills that have a valid `icon_svg` field

## Dynamic File Loaders

### `BlogDataIndex` (`content/blog_index.py`)

- Scans `apps/data/content/blog/` for files matching `blog-*.py`
- Imports each file using `importlib.util` and reads the `blog_data` dict
- Adds backward-compatible fields from the `images` dict: `image_url`, `img_name`, `image_list`, `image_names`, `image_count`

### `ProjectsDataIndex` (`content/projects_index.py`)

- Scans `apps/data/content/projects/` for files matching `project-*.py`
- Same dynamic import approach as `BlogDataIndex`
- Also normalizes the `tech_stack` field format

## Adding Content

### New Blog Post

Create `apps/data/content/blog/blog-<id>.py`:

```python
from datetime import datetime, timezone

blog_data = {
    'id': 10,
    'title': 'My New Post',
    'description': 'A short summary.',
    'content': '<p>Full HTML content here.</p>',
    'author': 'Ridwan Halim',
    'tags': ['python', 'tutorial'],
    'is_featured': False,
    'images': {
        'cover.webp': 'https://your-domain.com/static/img/blog/cover.webp',
    },
    'created_at': datetime(2025, 6, 1, tzinfo=timezone.utc),
    'updated_at': datetime(2025, 6, 1, tzinfo=timezone.utc),
}
```

### New Project

Create `apps/data/content/projects/project-<id>.py`:

```python
from datetime import datetime, timezone

project_data = {
    'id': 5,
    'title': 'My Project',
    'headline': 'Short tagline',
    'description': 'Full description.',
    'category': 'Web',
    'tags': ['django'],
    'tech_stack': [{'name': 'Django', 'icon_svg': '<svg>...</svg>'}],
    'is_featured': True,
    'featured_priority': 1,
    'github_url': 'https://github.com/...',
    'images': {
        'screenshot.webp': 'https://your-domain.com/static/img/project/screenshot.webp',
    },
    'created_at': datetime(2025, 3, 1, tzinfo=timezone.utc),
    'updated_at': datetime(2025, 3, 1, tzinfo=timezone.utc),
}
```

### About Data

Edit files directly in `apps/data/about/`. The structure varies per file:

- `about_data.py` exports `AboutData.get_about_data()` returning a nested dict
- `experiences_data.py` exports `ExperiencesData.experiences` as a list of dicts
- Other files follow similar patterns with a class containing a class-level list or method

## Privacy Policy

The privacy policy is defined as a `PrivacyPolicyModel` dataclass in `apps/data/privacy/privacy_policy_data.py`, then exposed as a plain dict via `asdict()` for template rendering. Sections include data collected, usage, third-party services, data protection, user rights, guestbook limitations, email communications, cookies, and legal basis.
