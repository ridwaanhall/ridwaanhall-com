# About App

The `apps/about` app displays personal information including work experience, education, certifications, awards, and applications.

## File Structure

```
apps/about/
├── views.py       # AboutView
├── urls.py        # URL routing
├── models.py      # (empty - no models)
├── admin.py       # (empty)
└── templates/about/
    └── about.html # About page template
```

## View (`views.py`)

### `AboutView`

**URL**: `/about/`

Renders the about page with data fetched from `DataService`:

| Context Variable | Source | Description |
|-----------------|--------|-------------|
| `experiences` | `DataService.get_experiences()` | Work experience entries |
| `education` | `DataService.get_education()` | Education history |
| `certifications` | `DataService.get_certifications()` | Professional certifications |
| `applications` | `DataService.get_applications()` | Application journey entries (sorted by latest timestamp) |
| `awards` | `DataService.get_awards()` | Awards sorted by ID descending |

All data is loaded from individual Python files in `apps/data/about/` (see [Data App](data.md)).

Uses `AboutSEOMixin` for automatic SEO metadata generation.

## URL Configuration

```
/about/ → AboutView
```

## Data Source

The about app has no database models. All data comes from the `data` app's file-based system:

- `apps/data/about/about_data.py` — personal info, bio, location, social media, skills
- `apps/data/about/experiences_data.py` — work experience entries
- `apps/data/about/education_data.py` — education records
- `apps/data/about/certifications_data.py` — certifications list
- `apps/data/about/awards_data.py` — awards list
- `apps/data/about/applications_data.py` — application journey entries with timestamps
- `apps/data/about/skills_data.py` — skills with SVG icons
