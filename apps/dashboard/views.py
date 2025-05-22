import logging
from typing import Dict, Optional, Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.views.generic import TemplateView

from apps.data.about_data import AboutData

from apps.dashboard.github_api import GitHubClient, GitHubStatsCalculator
from apps.dashboard.wakatime_api import WakatimeClient, WakatimeStatsCalculator

logger = logging.getLogger(__name__)

# Constants
CACHE_TIMEOUT = 10800  # 3 hours

class DashboardView(TemplateView):
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        
        # Get basic information
        about = AboutData.get_about_data()
        context['about'] = about[0]
        
        # Set SEO data
        context['seo'] = self._get_seo_data(about[0])
        
        # Get GitHub stats
        github_data = self._get_github_data()
        if github_data:
            context.update(github_data)
        
        # Get Wakatime stats
        wakatime_stats = self._get_wakatime_data()
        if wakatime_stats:
            context['wakatime_stats'] = wakatime_stats
        
        return context
    
    def _get_seo_data(self, about_data: Dict) -> Dict:
        """Generate SEO metadata."""
        return {
            'title': f"{about_data['name']}'s Dev Hub - My Coding Life",
            'description': f"Check out what {about_data['name']}'s been coding lately—GitHub commits, stats, and all the nerdy details!",
            'keywords': f"{about_data['name']}, coding, github, dev stats, programming, productivity",
            'og_image': about_data.get('image_url', ''),
            'og_type': 'website',
            'twitter_card': 'summary_large_image',
        }
    
    def _get_github_data(self) -> Optional[Dict]:
        """Get GitHub statistics data with caching."""
        cache_key = 'github_activity_data'
        github_data = cache.get(cache_key)
        
        if not github_data:
            github_client = GitHubClient(
                username=AboutData.get_about_data()[0]['username'],
                access_token=settings.ACCESS_TOKEN
            )
            github_activity = github_client.get_contribution_data()
            
            if github_activity:
                calendar_data = github_activity['data']['user']['contributionsCollection']['contributionCalendar']
                contribution_weeks = calendar_data['weeks']
                total_contributions = calendar_data['totalContributions']
                
                github_stats = GitHubStatsCalculator.calculate_stats(contribution_weeks, total_contributions)
                
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
        
        return github_data
    
    def _get_wakatime_data(self) -> Optional[Dict]:
        """Get Wakatime statistics data with caching."""
        cache_key = 'wakatime_activity_data'
        wakatime_stats = cache.get(cache_key)
        
        if not wakatime_stats:
            wakatime_client = WakatimeClient(api_key=settings.WAKATIME_API_KEY)
            wakatime_activity = wakatime_client.get_activity_data()
            
            if wakatime_activity:
                wakatime_stats = WakatimeStatsCalculator.calculate_stats(wakatime_activity)
                cache.set(cache_key, wakatime_stats, CACHE_TIMEOUT)
        
        return wakatime_stats