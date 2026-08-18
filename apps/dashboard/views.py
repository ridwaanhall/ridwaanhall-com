"""
Dashboard views for displaying GitHub and WakaTime activity statistics.
Provides developer activity insights with caching for performance.
"""

import logging
import time
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

# Ceiling on the time this page may spend on external APIs in one request.
#
# The individual clients each carry a 10s timeout, but they run in sequence and
# WakaTime makes two calls of its own, so a cold cache with both services
# struggling adds up to 30s of waiting -- past the serverless function limit,
# which the visitor sees as a gateway timeout rather than as the page they
# asked for. A per-call timeout says nothing about total time once there is
# more than one call.
#
# Overrunning it hides a panel, which is the degradation this view already
# implements for an API that errors or returns nothing.
EXTERNAL_API_BUDGET = 20


class DashboardView(DashboardSEOMixin, BaseView):
    """
    Dashboard view displaying GitHub and WakaTime statistics.
    Shows coding activity, contribution patterns, and development insights.
    """
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        """Build context with GitHub and WakaTime data."""
        context = super().get_context_data(**kwargs)
        self._api_deadline = time.monotonic() + EXTERNAL_API_BUDGET

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

        # A cache hit costs nothing, so the budget is only consulted on the
        # path that actually reaches the network.
        if time.monotonic() >= getattr(self, "_api_deadline", float("inf")):
            logger.warning(
                "Skipping %s fetch: the %ss external-API budget for this request is "
                "already spent, so the panel is hidden rather than risking a "
                "gateway timeout.",
                label,
                EXTERNAL_API_BUDGET,
            )
            return None

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