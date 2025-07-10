"""
Dashboard views for displaying GitHub and WakaTime activity statistics.
Provides developer activity insights with caching for performance.
"""

import logging
from typing import Dict, Optional, Any
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from apps.core.base_views import BaseView
from apps.seo.mixins import DashboardSEOMixin
from apps.dashboard.github_api import GitHubClient, GitHubStatsCalculator
from apps.dashboard.wakatime_api import WakatimeClient, WakatimeStatsCalculator

logger = logging.getLogger(__name__)

# Cache timeout: 3 hours
CACHE_TIMEOUT = 10800


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
        github_data = self._get_github_data()
        if github_data:
            context.update(github_data)
        else:
            context['github_activity'] = None
            context['github_last_update'] = None
        
        # Get WakaTime statistics
        wakatime_stats = self._get_wakatime_data()
        if wakatime_stats:
            context['wakatime_stats'] = wakatime_stats
        else:
            context['wakatime_stats'] = None
        
        # Add SEO data from mixin
        mixin_context = super(DashboardView, self).get_context_data(**context)
        context.update(mixin_context)
        
        return context

    def _get_github_data(self) -> Optional[Dict]:
        """Get GitHub statistics with caching."""
        cache_key = 'github_activity_data'
        github_data = cache.get(cache_key)
        
        if not github_data:
            try:
                about_data = self.get_about_data()
                github_client = GitHubClient(
                    username=about_data['username'],
                    access_token=settings.ACCESS_TOKEN
                )
                github_activity = github_client.get_contribution_data()
                
                if github_activity and 'data' in github_activity:
                    user_data = github_activity['data']['user']
                    calendar_data = user_data['contributionsCollection']['contributionCalendar']
                    contribution_weeks = calendar_data['weeks']
                    total_contributions = calendar_data['totalContributions']
                    
                    github_stats = GitHubStatsCalculator.calculate_stats(
                        contribution_weeks, total_contributions
                    )
                    
                    github_data = {
                        'github_activity': github_activity,
                        'total_contributions': total_contributions,
                        'this_week': github_stats['this_week'],
                        'best_day': github_stats['best_day'],
                        'average': f"{github_stats['average']}",
                        'longest_streak': github_stats['longest_streak'],
                        'current_streak': github_stats['current_streak'],
                        'github_last_update': timezone.now().strftime('%B %d, %Y %I:%M %p')
                    }
                    
                    cache.set(cache_key, github_data, CACHE_TIMEOUT)
                else:
                    logger.error("GitHub activity data is missing or malformed.")
                    github_data = None
            except Exception as e:
                logger.error(f"Error fetching GitHub data: {e}")
                github_data = None
        
        return github_data
    
    def _get_wakatime_data(self) -> Optional[Dict]:
        """Get WakaTime statistics with caching."""
        cache_key = 'wakatime_activity_data'
        wakatime_stats = cache.get(cache_key)
        
        if not wakatime_stats:
            try:
                wakatime_client = WakatimeClient(api_key=settings.WAKATIME_API_KEY)
                wakatime_activity = wakatime_client.get_activity_data()
                
                if wakatime_activity:
                    wakatime_stats = WakatimeStatsCalculator.calculate_stats(wakatime_activity)
                    if wakatime_stats:
                        cache.set(cache_key, wakatime_stats, CACHE_TIMEOUT)
                    else:
                        logger.error("WakaTime statistics calculation failed.")
                else:
                    logger.error("WakaTime activity data is missing or malformed.")
                    wakatime_stats = None
            except Exception as e:
                logger.error(f"Error fetching WakaTime data: {e}")
                wakatime_stats = None
        else:
            logger.info("Using cached WakaTime statistics.")
        
        return wakatime_stats