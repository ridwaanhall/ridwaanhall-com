# Dashboard App

The `apps/dashboard` app displays real-time coding statistics from GitHub and WakaTime APIs with a 15-minute cache.

## File Structure

```
apps/dashboard/
├── views.py           # DashboardView with cached API calls
├── urls.py            # URL routing
├── github_api.py      # GitHub GraphQL API client and stats calculator
├── wakatime_api.py    # WakaTime REST API client and stats calculator
├── models.py          # (empty - no models)
└── templates/dashboard/
    └── dashboard.html # Dashboard display template
```

## View (`views.py`)

### `DashboardView`

**URL**: `/dashboard/`

Fetches and combines GitHub contribution data and WakaTime coding statistics. Both API calls are cached for 15 minutes (`CACHE_TIMEOUT = 900` seconds) using Django's cache framework.

Context variables:

| Variable | Description |
|----------|-------------|
| `github_stats` | GitHub contribution statistics (or `None` on error) |
| `wakatime_stats` | WakaTime coding statistics (or `None` on error) |

## GitHub API (`github_api.py`)

### `GitHubClient`

Makes GraphQL queries to the GitHub API using the `ACCESS_TOKEN` environment variable.

- Fetches the `contributionCalendar` for a given username (default: `ridwaanhall`)
- Returns weekly contribution data with dates and contribution counts

### `GitHubStatsCalculator`

Processes raw contribution calendar data into display-ready statistics:

| Metric | Description |
|--------|-------------|
| `this_week` | Total contributions in the current week |
| `best_day` | Highest single-day contribution count and date |
| `average` | Average daily contributions |
| `longest_streak` | Longest consecutive streak of contribution days (with start/end dates) |
| `current_streak` | Current ongoing streak (with start date) |
| `total_contributions` | Sum of all contributions in the calendar |
| `contributions` | Full list of daily contribution data for chart rendering |

## WakaTime API (`wakatime_api.py`)

### `WakatimeClient`

Makes REST API calls to the WakaTime API using the `WAKATIME_API_KEY` environment variable (Base64-encoded as HTTP Basic auth).

Two endpoints:

- `/api/v1/users/current/summaries` — last 7 days of coding activity
- `/api/v1/users/current/all_time_since_today` — cumulative all-time stats

### `WakatimeStatsCalculator`

Processes raw WakaTime data into:

| Metric | Description |
|--------|-------------|
| `daily_average` | Average coding time per day over the last 7 days |
| `today` | Today's total coding time |
| `today_change_percent` | Percentage change from yesterday |
| `best_day` | Highest coding day in the period |
| `languages` | Top programming languages with hours and percentages |
| `operating_systems` | OS distribution |
| `categories` | Activity categories (coding, debugging, etc.) |
| `all_time_total` | Cumulative coding time since WakaTime was installed |

## Caching

Both `_get_github_stats()` and `_get_wakatime_stats()` use Django's `cache.get()`/`cache.set()` with a 15-minute TTL. Cache keys:

- `github_stats` — GitHub contribution data
- `wakatime_stats` — WakaTime coding data

This prevents excessive API calls while keeping data reasonably fresh.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ACCESS_TOKEN` | Yes | GitHub Personal Access Token (needs `read:user` scope) |
| `WAKATIME_API_KEY` | Yes | WakaTime secret API key |

## URL Configuration

```
/dashboard/ → DashboardView
```
