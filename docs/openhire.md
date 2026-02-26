# OpenHire App

The `apps/openhire` app displays "Open to Work" and "Hiring" status information when enabled in the about data.

## File Structure

```
apps/openhire/
├── views.py       # OpenHireView
├── urls.py        # URL routing
├── models.py      # (empty - no models)
├── admin.py       # (empty)
├── data/
│   ├── open.py    # Open-to-work data (OpenToWorkData)
│   └── hiring.py  # Hiring data (HiringData)
├── types/
│   ├── open_to_work.py  # PortfolioHighlight, OpenToWorkModel
│   ├── hiring.py        # Position, Requirements, ContactInfo, HiringModel
│   └── __init__.py
└── templates/openhire/
    └── openhire.html  # OpenHire display template
```

## View (`views.py`)

### `OpenHireView`

**URL**: `/openhire/`

Fetches `about` data from `DataService` and conditionally loads hiring-related data:

| Condition | Data Loaded | Context Variable |
|-----------|------------|-----------------|
| `about.is_open_to_work == True` | `DataService.get_open_to_work_data()` | `open_to_work_data` |
| `about.is_hiring == True` | `DataService.get_hiring_data()` | `hiring_data` |

If neither flag is set, the page renders without hiring/open-to-work data.

Uses `OpenHireSEOMixin` for automatic SEO metadata.

## OOP Types (`apps/openhire/types/`)

```python
from apps.openhire.types import OpenToWorkModel, HiringModel, Position
```

## Data Source

The data comes from individual Python files in `apps/openhire/data/`:

- `apps/openhire/data/open.py` — `OpenToWorkData.get_open_to_work_data()` returns position preferences, availability, and other open-to-work details
- `apps/openhire/data/hiring.py` — `HiringData.get_hiring_data()` returns open positions and hiring requirements

The `is_open_to_work` and `is_hiring` flags are set in `apps/about/data/about_data.py`.

## URL Configuration

```
/openhire/ → OpenHireView
```
