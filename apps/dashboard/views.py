"""
Dashboard views for displaying GitHub and WakaTime activity statistics.
Provides developer activity insights with caching for performance.
"""

import logging
from typing import Any
from django.conf import settings
from django.core.cache import cache

from apps.core.base_views import BaseView
from apps.seo.mixins import DashboardSEOMixin
from apps.dashboard.github_api import GitHubClient, GitHubStatsCalculator
from apps.dashboard.wakatime_api import WakatimeClient, WakatimeStatsCalculator

logger = logging.getLogger(__name__)

# Cache timeout: 15 minutes
CACHE_TIMEOUT = 900 # 15 minutes in seconds


class DashboardView(DashboardSEOMixin, BaseView):
    """
    Dashboard view displaying GitHub and WakaTime statistics.
    Shows coding activity, contribution patterns, and development insights.
    """
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
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

    def _get_cached_stats(self, cache_key, fetch, process, label):
        """Fetch, process, and cache external stats, with consistent error handling."""
        stats = cache.get(cache_key)
        if stats:
            return stats

        try:
            raw_data = fetch()
            if not raw_data:
                logger.error(f"{label} activity data is missing or malformed.")
                return None

            stats = process(raw_data)
            if stats:
                cache.set(cache_key, stats, CACHE_TIMEOUT)
            else:
                logger.error(f"{label} statistics processing failed.")
            return stats
        except Exception as e:
            logger.error(f"Error fetching {label} data: {e}")
            return None

    def _get_github_stats(self) -> dict | None:
        """Get GitHub statistics with caching."""
        def fetch():
            about_data = self.get_about_data()
            github_client = GitHubClient(
                username=about_data['username'],
                access_token=settings.ACCESS_TOKEN
            )
            return github_client.get_contribution_data()

        return self._get_cached_stats(
            'github_activity_data', fetch, GitHubStatsCalculator.process_github_data, 'GitHub'
        )

    def _get_wakatime_stats(self) -> dict | None:
        """Get WakaTime statistics with caching."""
        def fetch():
            wakatime_client = WakatimeClient(api_key=settings.WAKATIME_API_KEY)
            return wakatime_client.get_activity_data()

        return self._get_cached_stats(
            'wakatime_activity_data', fetch, WakatimeStatsCalculator.calculate_stats, 'WakaTime'
        )