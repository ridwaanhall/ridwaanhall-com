# Dashboard App Documentation

## Overview

The Dashboard app provides real-time developer activity insights by integrating with GitHub and WakaTime APIs. It displays coding statistics, contribution patterns, repository activity, and development metrics with intelligent caching and rate limiting for optimal performance.

## Table of Contents

- [App Structure](#app-structure)
- [API Integrations](#api-integrations)
- [Views and Functionality](#views-and-functionality)
- [Real-time Data Fetching](#real-time-data-fetching)
- [Caching System](#caching-system)
- [Rate Limiting and Optimization](#rate-limiting-and-optimization)
- [Templates and Visualization](#templates-and-visualization)
- [Configuration](#configuration)
- [API Setup Instructions](#api-setup-instructions)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## App Structure

```txt
apps/dashboard/
├── __init__.py
├── admin.py
├── apps.py
├── models.py           # Empty - uses API data
├── views.py            # DashboardView with API integration
├── urls.py             # Dashboard URL routing
├── github_api.py       # GitHub API client and statistics
├── wakatime_api.py     # WakaTime API client and statistics
├── tests.py
├── migrations/
└── templates/
    └── dashboard/
        └── dashboard.html  # Analytics dashboard template
```

## API Integrations

### GitHub API Integration

The Dashboard integrates with GitHub's REST API to fetch:
- **Repository statistics**: Stars, forks, commits
- **Contribution activity**: Daily contributions, streaks
- **Repository details**: Languages, topics, visibility
- **User profile data**: Followers, following, public repos

### WakaTime API Integration

WakaTime integration provides coding time analytics:
- **Daily coding time**: Hours spent coding per day
- **Language statistics**: Time spent per programming language
- **Project breakdown**: Time allocation across projects
- **Coding patterns**: Activity trends and habits

## Views and Functionality

### DashboardView

The main dashboard view orchestrates data from multiple APIs:

```python
class DashboardView(DashboardSEOMixin, BaseView):
    """
    Dashboard view displaying GitHub and WakaTime statistics.
    Shows coding activity, contribution patterns, and development insights.
    """
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs) -> Dict[str, Any]:
        """Build context with GitHub and WakaTime data."""
        context = super().get_context_data(**kwargs)
        
        # Get GitHub statistics
        github_stats = self._get_github_stats()
        if github_stats:
            context.update(github_stats)
        else:
            context['github_activity'] = None
            context['github_last_update'] = None
        
        # Get WakaTime statistics
        wakatime_stats = self._get_wakatime_stats()
        if wakatime_stats:
            context['wakatime_stats'] = wakatime_stats
        else:
            context['wakatime_stats'] = None
        
        return context
```

#### GitHub Statistics Loading

```python
def _get_github_stats(self) -> Optional[Dict]:
    """Get GitHub statistics with caching."""
    cache_key = 'dashboard_github_stats'
    github_stats = cache.get(cache_key)
    
    if not github_stats:
        try:
            # Initialize GitHub clients
            github_client = GitHubClient()
            github_calculator = GitHubStatsCalculator(github_client)
            
            # Fetch and calculate statistics
            repos = github_client.get_user_repositories()
            user_info = github_client.get_user_info()
            
            github_stats = {
                'github_activity': github_calculator.calculate_activity_stats(repos),
                'github_last_update': timezone.now(),
                'user_info': user_info,
                'repositories': repos[:10],  # Top 10 repositories
            }
            
            # Cache for 3 hours
            cache.set(cache_key, github_stats, CACHE_TIMEOUT)
            logger.info("GitHub statistics cached successfully.")
            
        except Exception as e:
            logger.error(f"Error fetching GitHub statistics: {e}")
            github_stats = None
    
    return github_stats
```

#### WakaTime Statistics Loading

```python
def _get_wakatime_stats(self) -> Optional[Dict]:
    """Get WakaTime statistics with caching."""
    cache_key = 'dashboard_wakatime_stats'
    wakatime_stats = cache.get(cache_key)
    
    if not wakatime_stats:
        try:
            # Initialize WakaTime clients
            wakatime_client = WakatimeClient()
            wakatime_calculator = WakatimeStatsCalculator(wakatime_client)
            
            # Fetch statistics for last 30 days
            wakatime_stats = wakatime_calculator.get_comprehensive_stats(days=30)
            
            # Cache for 3 hours
            cache.set(cache_key, wakatime_stats, CACHE_TIMEOUT)
            logger.info("WakaTime statistics cached successfully.")
            
        except Exception as e:
            logger.error(f"Error fetching WakaTime statistics: {e}")
            wakatime_stats = None
    
    return wakatime_stats
```

## Real-time Data Fetching

### GitHub API Client

```python
# apps/dashboard/github_api.py
class GitHubClient:
    """Client for GitHub API interactions."""
    
    def __init__(self):
        self.token = settings.ACCESS_TOKEN
        self.base_url = "https://api.github.com"
        self.headers = {
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json'
        }
    
    def get_user_info(self):
        """Get authenticated user information."""
        response = requests.get(
            f"{self.base_url}/user",
            headers=self.headers,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    
    def get_user_repositories(self, sort='updated', per_page=100):
        """Get user repositories with sorting and pagination."""
        repos = []
        page = 1
        
        while len(repos) < 100:  # Limit to prevent excessive API calls
            response = requests.get(
                f"{self.base_url}/user/repos",
                headers=self.headers,
                params={
                    'sort': sort,
                    'direction': 'desc',
                    'per_page': per_page,
                    'page': page
                },
                timeout=10
            )
            response.raise_for_status()
            
            page_repos = response.json()
            if not page_repos:
                break
                
            repos.extend(page_repos)
            page += 1
            
        return repos
```

### WakaTime API Client

```python
# apps/dashboard/wakatime_api.py
class WakatimeClient:
    """Client for WakaTime API interactions."""
    
    def __init__(self):
        self.api_key = settings.WAKATIME_API_KEY
        self.base_url = "https://wakatime.com/api/v1"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}'
        }
    
    def get_stats(self, range_type='last_30_days'):
        """Get coding statistics for specified range."""
        response = requests.get(
            f"{self.base_url}/users/current/stats/{range_type}",
            headers=self.headers,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    
    def get_summaries(self, start_date, end_date):
        """Get coding summaries for date range."""
        response = requests.get(
            f"{self.base_url}/users/current/summaries",
            headers=self.headers,
            params={
                'start': start_date,
                'end': end_date
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()
```

## Caching System

### Cache Configuration

The Dashboard uses a sophisticated caching system to minimize API calls:

```python
# Cache settings
CACHE_TIMEOUT = 10800  # 3 hours

# Cache keys
GITHUB_CACHE_KEY = 'dashboard_github_stats'
WAKATIME_CACHE_KEY = 'dashboard_wakatime_stats'
```

### Cache Strategy

1. **GitHub Data**: Cached for 3 hours due to less frequent updates
2. **WakaTime Data**: Cached for 3 hours, updated with new coding activity
3. **Cache Invalidation**: Manual cache clearing available for immediate updates
4. **Error Handling**: Graceful fallback when cache or API fails

### Cache Management Commands

```python
# Clear specific caches
from django.core.cache import cache

# Clear GitHub cache
cache.delete('dashboard_github_stats')

# Clear WakaTime cache
cache.delete('dashboard_wakatime_stats')

# Clear all dashboard caches
cache.delete_many(['dashboard_github_stats', 'dashboard_wakatime_stats'])
```

## Rate Limiting and Optimization

### GitHub API Rate Limits

- **Authenticated requests**: 5,000 per hour
- **Rate limit checking**: Headers inspection for remaining requests
- **Exponential backoff**: Implemented for rate limit recovery

```python
def check_rate_limit(self, response):
    """Check GitHub API rate limit from response headers."""
    remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
    reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
    
    if remaining < 100:  # Warning threshold
        logger.warning(f"GitHub API rate limit low: {remaining} remaining")
        
    if remaining == 0:
        wait_time = reset_time - int(time.time())
        logger.error(f"GitHub API rate limit exceeded. Reset in {wait_time}s")
        raise RateLimitExceeded(f"Rate limit reset in {wait_time} seconds")
```

### WakaTime API Optimization

- **Request consolidation**: Combine multiple stats in single requests
- **Data aggregation**: Pre-process data to reduce template complexity
- **Selective fetching**: Only fetch necessary time ranges

### Performance Optimizations

1. **Concurrent API calls**: Use async/await for parallel requests
2. **Data compression**: Compress cached data to reduce memory usage
3. **Smart refresh**: Only update changed data
4. **Connection pooling**: Reuse HTTP connections for API calls

## Templates and Visualization

### Dashboard Template Structure

```html
<!-- dashboard/dashboard.html -->
{% extends 'base.html' %}

{% block content %}
<div class="dashboard-container">
    <!-- Header Section -->
    <div class="dashboard-header">
        <h1>Developer Analytics Dashboard</h1>
        <p>Real-time insights into coding activity and contributions</p>
    </div>
    
    <!-- GitHub Statistics Section -->
    {% if github_activity %}
        {% include 'dashboard/partials/github_stats.html' %}
    {% else %}
        {% include 'dashboard/partials/github_error.html' %}
    {% endif %}
    
    <!-- WakaTime Statistics Section -->
    {% if wakatime_stats %}
        {% include 'dashboard/partials/wakatime_stats.html' %}
    {% else %}
        {% include 'dashboard/partials/wakatime_error.html' %}
    {% endif %}
    
    <!-- Repository Showcase -->
    {% include 'dashboard/partials/repositories.html' %}
</div>
{% endblock %}
```

### Chart and Visualization Components

#### GitHub Activity Chart
```html
<!-- dashboard/partials/github_stats.html -->
<div class="github-stats-section">
    <h2>GitHub Activity</h2>
    
    <!-- Contribution Overview -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Repositories</h3>
            <p class="stat-number">{{ github_activity.total_repos }}</p>
        </div>
        <div class="stat-card">
            <h3>Total Stars</h3>
            <p class="stat-number">{{ github_activity.total_stars }}</p>
        </div>
        <div class="stat-card">
            <h3>Total Forks</h3>
            <p class="stat-number">{{ github_activity.total_forks }}</p>
        </div>
    </div>
    
    <!-- Language Distribution -->
    <div class="language-chart">
        <h3>Language Distribution</h3>
        <canvas id="languageChart"></canvas>
    </div>
    
    <!-- Repository Activity -->
    <div class="repository-activity">
        <h3>Recent Activity</h3>
        {% for repo in repositories %}
            <div class="repo-item">
                <h4>{{ repo.name }}</h4>
                <p>{{ repo.description }}</p>
                <div class="repo-stats">
                    <span>⭐ {{ repo.stargazers_count }}</span>
                    <span>🍴 {{ repo.forks_count }}</span>
                    <span>{{ repo.language }}</span>
                </div>
            </div>
        {% endfor %}
    </div>
</div>
```

#### WakaTime Analytics Chart
```html
<!-- dashboard/partials/wakatime_stats.html -->
<div class="wakatime-stats-section">
    <h2>Coding Time Analytics</h2>
    
    <!-- Time Overview -->
    <div class="time-overview">
        <div class="stat-card">
            <h3>Total Time (30 days)</h3>
            <p class="stat-number">{{ wakatime_stats.total_time_human }}</p>
        </div>
        <div class="stat-card">
            <h3>Daily Average</h3>
            <p class="stat-number">{{ wakatime_stats.daily_average_human }}</p>
        </div>
    </div>
    
    <!-- Language Time Distribution -->
    <div class="language-time-chart">
        <h3>Languages</h3>
        <canvas id="wakatimeLanguageChart"></canvas>
    </div>
    
    <!-- Daily Activity -->
    <div class="daily-activity">
        <h3>Daily Coding Activity</h3>
        <canvas id="dailyActivityChart"></canvas>
    </div>
</div>
```

### JavaScript for Interactive Charts

```javascript
// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GitHub language chart
    if (typeof githubLanguages !== 'undefined') {
        initializeLanguageChart('languageChart', githubLanguages);
    }
    
    // Initialize WakaTime charts
    if (typeof wakatimeData !== 'undefined') {
        initializeWakatimeCharts(wakatimeData);
    }
});

function initializeLanguageChart(canvasId, languageData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: languageData.labels,
            datasets: [{
                data: languageData.values,
                backgroundColor: languageData.colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
```

## Configuration

### Environment Variables

```env
# API Configuration
ACCESS_TOKEN="github_personal_access_token"
WAKATIME_API_KEY="wakatime_secret_api_key"

# Cache Configuration
CACHE_TIMEOUT=10800  # 3 hours in seconds
DASHBOARD_REFRESH_INTERVAL=3600  # 1 hour

# Rate Limiting
GITHUB_RATE_LIMIT_THRESHOLD=100
WAKATIME_REQUEST_DELAY=1  # seconds between requests
```

### Django Settings

```python
# Dashboard app settings
DASHBOARD_CONFIG = {
    'GITHUB_TOKEN': os.getenv('ACCESS_TOKEN'),
    'WAKATIME_API_KEY': os.getenv('WAKATIME_API_KEY'),
    'CACHE_TIMEOUT': int(os.getenv('CACHE_TIMEOUT', 10800)),
    'ENABLE_GITHUB': True,
    'ENABLE_WAKATIME': True,
    'MAX_REPOSITORIES': 100,
    'STATS_DAYS_RANGE': 30,
}

# Logging configuration for dashboard
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'dashboard_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/dashboard.log',
        },
    },
    'loggers': {
        'apps.dashboard': {
            'handlers': ['dashboard_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## API Setup Instructions

### GitHub Personal Access Token Setup

1. **Go to GitHub Settings**
   - Navigate to GitHub.com → Settings → Developer settings → Personal access tokens

2. **Generate New Token**
   - Click "Generate new token (classic)"
   - Name: "Portfolio Dashboard Token"
   - Expiration: Choose appropriate duration

3. **Select Scopes**
   ```
   ✅ repo (Full control of private repositories)
   ✅ user:read (Read user profile data)
   ✅ user:email (Access user email addresses)
   ```

4. **Add to Environment**
   ```env
   ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

### WakaTime API Key Setup

1. **Visit WakaTime Settings**
   - Go to https://wakatime.com/settings/api-key

2. **Copy Secret API Key**
   - Copy the secret API key (not the public one)

3. **Install WakaTime in Your Editor**
   - Follow WakaTime setup for your code editor
   - Ensure it's tracking your coding time

4. **Add to Environment**
   ```env
   WAKATIME_API_KEY="waka_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

### API Key Validation

```bash
# Test GitHub API connection
python manage.py shell
>>> from apps.dashboard.github_api import GitHubClient
>>> client = GitHubClient()
>>> user_info = client.get_user_info()
>>> print(user_info['login'])

# Test WakaTime API connection
>>> from apps.dashboard.wakatime_api import WakatimeClient
>>> client = WakatimeClient()
>>> stats = client.get_stats()
>>> print(stats['data']['total_seconds_including_other_language'])
```

## Performance Monitoring

### Dashboard Performance Metrics

Monitor key performance indicators:

1. **API Response Times**
   - GitHub API: < 2 seconds
   - WakaTime API: < 3 seconds

2. **Cache Hit Rates**
   - Target: > 80% cache hit rate
   - Monitor cache effectiveness

3. **Error Rates**
   - API failures: < 5%
   - Monitor rate limiting issues

### Performance Monitoring Commands

```python
# Dashboard management command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Check API health
        github_status = self.check_github_api()
        wakatime_status = self.check_wakatime_api()
        
        # Check cache performance
        cache_stats = self.get_cache_stats()
        
        # Report performance metrics
        self.stdout.write(f"GitHub API: {'✓' if github_status else '✗'}")
        self.stdout.write(f"WakaTime API: {'✓' if wakatime_status else '✗'}")
        self.stdout.write(f"Cache Hit Rate: {cache_stats['hit_rate']}%")
```

## Troubleshooting

### Common Issues

#### GitHub API Rate Limit Exceeded
**Problem**: Too many API requests, rate limit exceeded
**Solution**:
1. Increase cache timeout
2. Reduce data refresh frequency
3. Check for unnecessary API calls

```bash
# Check current rate limit status
curl -H "Authorization: token $ACCESS_TOKEN" https://api.github.com/rate_limit
```

#### WakaTime Data Not Loading
**Problem**: WakaTime statistics not displaying
**Solution**:
1. Verify API key is correct
2. Check WakaTime account has data
3. Ensure WakaTime plugin is active in editor

#### Cache Issues
**Problem**: Data not updating despite changes
**Solution**:
1. Clear specific caches
2. Restart Django server
3. Check cache backend configuration

```python
# Clear dashboard caches
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()  # Clear all caches
```

#### Template Rendering Errors
**Problem**: Dashboard page showing errors
**Solution**:
1. Check data structure in templates
2. Verify context variables exist
3. Handle None values gracefully

### Debug Commands

```bash
# Debug GitHub API integration
python manage.py shell
>>> from apps.dashboard.views import DashboardView
>>> view = DashboardView()
>>> github_stats = view._get_github_stats()
>>> print(github_stats.keys() if github_stats else "No GitHub stats")

# Debug WakaTime integration
>>> wakatime_stats = view._get_wakatime_stats()
>>> print(wakatime_stats.keys() if wakatime_stats else "No WakaTime stats")

# Check cache status
>>> from django.core.cache import cache
>>> github_cached = cache.get('dashboard_github_stats')
>>> print("GitHub data cached" if github_cached else "No GitHub cache")
```

## Best Practices

### API Usage Optimization
1. **Respect rate limits**: Implement proper rate limiting logic
2. **Use caching**: Cache API responses to minimize requests
3. **Error handling**: Gracefully handle API failures
4. **Timeout handling**: Set reasonable request timeouts

### Data Management
1. **Data validation**: Validate API response data structure
2. **Error recovery**: Provide fallback data when APIs fail
3. **Monitoring**: Monitor API health and performance
4. **Logging**: Log API interactions for debugging

### Security Considerations
1. **API key protection**: Never expose API keys in code
2. **Environment variables**: Store sensitive data in environment
3. **Access control**: Limit dashboard access if needed
4. **Rate limiting**: Implement client-side rate limiting

### Performance Optimization
1. **Selective data fetching**: Only fetch necessary data
2. **Concurrent requests**: Use async patterns for parallel API calls
3. **Data preprocessing**: Process data before caching
4. **Template optimization**: Minimize template complexity

### User Experience
1. **Loading states**: Show loading indicators during API calls
2. **Error messages**: Provide clear error messages
3. **Fallback content**: Show meaningful content when data unavailable
4. **Progressive enhancement**: Ensure basic functionality works without JavaScript

### Maintenance
1. **Regular monitoring**: Monitor API status and performance
2. **Key rotation**: Regularly rotate API keys
3. **Update dependencies**: Keep API client libraries updated
4. **Documentation**: Keep API integration documentation current

The Dashboard app provides powerful insights into development activity while maintaining excellent performance through intelligent caching and API optimization strategies.