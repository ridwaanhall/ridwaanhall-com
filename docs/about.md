# About App

The `apps/about` app displays personal information including work experience, education, certifications, awards, and applications.

## File Structure

```
apps/about/
├── views.py       # AboutView
├── urls.py        # URL routing
├── models.py      # (empty - no models)
├── admin.py       # (empty)
├── data/
│   ├── about_data.py          # Personal info, bio, location, social media, skills
│   ├── experiences_data.py    # Work experience entries
│   ├── education_data.py      # Education records
│   ├── certifications_data.py # Certifications list
│   ├── awards_data.py         # Awards list
│   ├── applications_data.py   # Application journey entries with timestamps
│   └── skills_data.py         # Skills with SVG icons
├── types/
│   ├── personal.py            # CV, PersonalInfo, Bio, AboutLocation, SocialMedia, DonateLink, AboutDataModel
│   ├── experience.py          # IssuedDate, PeriodDate, Period, Experience
│   ├── education.py           # EducationDate, EducationLocation, Education
│   ├── certification.py       # Certification
│   ├── award.py               # Award
│   ├── skill.py               # Skill
│   ├── application.py         # JourneyStep, Application
│   └── __init__.py            # Re-exports all types
└── templates/about/
    └── about.html             # About page template
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

All data is loaded from individual Python files in `apps/about/data/` (see [Data App](data.md)).

Uses `AboutSEOMixin` for automatic SEO metadata generation.

## OOP Types (`apps/about/types/`)

Type classes are organized by domain into individual modules and use `@dataclass(frozen=True)` with `to_dict()` methods:

```python
from apps.about.types import Skill, Experience, Education, Certification, Award, Application
```

## URL Configuration

```
/about/ → AboutView
```

## Data Source

The about app owns its data files in `apps/about/data/`:

- `apps/about/data/about_data.py` — personal info, bio, location, social media, skills
- `apps/about/data/experiences_data.py` — work experience entries
- `apps/about/data/education_data.py` — education records
- `apps/about/data/certifications_data.py` — certifications list
- `apps/about/data/awards_data.py` — awards list
- `apps/about/data/applications_data.py` — application journey entries with timestamps
- `apps/about/data/skills_data.py` — skills with SVG icons
