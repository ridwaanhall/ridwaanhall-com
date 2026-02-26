# Data App

The `apps/data` app implements the **Individual File System (IFS)** — a file-based content management approach where each piece of content (blog post, project, about info, etc.) is stored as a standalone Python file instead of in a database.

Data files and OOP type definitions are co-located with their respective apps. The `apps/data` app provides the service layer (`DataService`, `AboutManager`, `ContentManager`) that orchestrates data access across all apps.

## File Structure

```
apps/data/
├── data_service.py        # Centralized data access layer
├── content_manager.py     # Blog and project data manager
├── about_manager.py       # About-related data manager
└── apps.py                # AppConfig

apps/about/
├── data/
│   ├── about_data.py      # Personal info, bio, social media, skills
│   ├── experiences_data.py
│   ├── education_data.py
│   ├── certifications_data.py
│   ├── awards_data.py
│   ├── applications_data.py
│   └── skills_data.py
└── types/
    ├── personal.py        # CV, PersonalInfo, Bio, AboutLocation, SocialMedia, DonateLink, AboutDataModel
    ├── experience.py      # IssuedDate, PeriodDate, Period, Experience
    ├── education.py       # EducationDate, EducationLocation, Education
    ├── certification.py   # Certification
    ├── award.py           # Award
    ├── skill.py           # Skill
    ├── application.py     # JourneyStep, Application
    └── __init__.py        # Re-exports all types

apps/blog/
├── data/
│   ├── blog_index.py      # Dynamic blog file loader
│   └── blog/
│       ├── blog-1.py      # Individual blog post
│       ├── blog-2.py
│       └── ...
└── types/
    ├── blog.py            # BlogContentItem, BlogData
    └── __init__.py

apps/projects/
├── data/
│   ├── projects_index.py  # Dynamic project file loader
│   └── projects/
│       ├── project-1.py   # Individual project
│       ├── project-2.py
│       └── ...
└── types/
    ├── project.py         # Feature, ProjectData
    └── __init__.py

apps/openhire/
├── data/
│   ├── open.py            # Open-to-work data
│   └── hiring.py          # Hiring data
└── types/
    ├── open_to_work.py    # PortfolioHighlight, OpenToWorkModel
    ├── hiring.py          # Position, Requirements, ContactInfo, HiringModel
    └── __init__.py

apps/core/
├── data/
│   └── privacy_policy_data.py  # Privacy policy content
└── types/
    ├── privacy.py              # PrivacyPolicyModel
    └── __init__.py
```

## Why Individual Files?

- **No database migrations** for content changes — just edit a Python file
- **Git-friendly** — each content piece has its own commit history
- **Easy deployment** — content ships with the code, no data import/export needed
- **Type-safe** — OOP dataclasses with `to_dict()` methods and IDE autocompletion
- **Co-located** — each app owns its own data and types, keeping things modular
- **Dynamic loading** — files are discovered and imported at runtime using `importlib`

## OOP Type Classes

Each type module uses `@dataclass(frozen=True)` with an added `to_dict()` method for clean serialization:

```python
from dataclasses import dataclass, asdict
from typing import Any

@dataclass(frozen=True)
class Skill:
    name: str
    description: str
    icon_svg: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
```

Import types directly from the app's `types` package:

```python
from apps.about.types import Skill, Experience, Education
from apps.blog.types import BlogData
from apps.projects.types import ProjectData, Feature
from apps.openhire.types import OpenToWorkModel, HiringModel
from apps.core.types import PrivacyPolicyModel
```

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

### `BlogDataIndex` (`apps/blog/data/blog_index.py`)

- Scans `apps/blog/data/blog/` for files matching `blog-*.py`
- Imports each file using `importlib.util` and reads the `blog_data` dict
- Adds backward-compatible fields from the `images` dict: `image_url`, `img_name`, `image_list`, `image_names`, `image_count`

### `ProjectsDataIndex` (`apps/projects/data/projects_index.py`)

- Scans `apps/projects/data/projects/` for files matching `project-*.py`
- Same dynamic import approach as `BlogDataIndex`
- Also normalizes the `tech_stack` field format

## Adding Content

### New Blog Post

Create `apps/blog/data/blog/blog-<id>.py`:

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

Create `apps/projects/data/projects/project-<id>.py`:

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

Edit files directly in `apps/about/data/`. The structure varies per file:

- `about_data.py` exports `AboutData.get_about_data()` returning a nested dict
- `experiences_data.py` exports `ExperiencesData.experiences` as a list of dicts
- Other files follow similar patterns with a class containing a class-level list or method

## Privacy Policy

The privacy policy is defined as a `PrivacyPolicyModel` dataclass in `apps/core/data/privacy_policy_data.py`, then exposed as a plain dict via `asdict()` for template rendering. Sections include data collected, usage, third-party services, data protection, user rights, guestbook limitations, email communications, cookies, and legal basis.
