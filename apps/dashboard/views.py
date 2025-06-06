import logging
from datetime import datetime
import requests
from typing import Dict, Optional, Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.views.generic import TemplateView

from apps.data.about_data import AboutData

from apps.dashboard.github_api import GitHubClient, GitHubStatsCalculator

logger = logging.getLogger(__name__)

# Constants
CACHE_TIMEOUT = 10800  # 3 hours

class WakatimeClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def get_activity_data(self) -> Optional[Dict]:
        """Fetch Wakatime activity data."""
        try:
            last_7_days_api = f"https://wakatime.com/api/v1/users/current/stats/last_7_days?api_key={self.api_key}"
            all_time_api = f"https://wakatime.com/api/v1/users/current/all_time_since_today?api_key={self.api_key}"
            
            last_7_days_response = requests.get(last_7_days_api, timeout=10)
            all_time_response = requests.get(all_time_api, timeout=10)
            
            last_7_days_response.raise_for_status()
            all_time_response.raise_for_status()
            
            return {
                'last_7_days': last_7_days_response.json(),
                'all_time': all_time_response.json()
            }
        except requests.RequestException as e:
            logger.error(f"Wakatime API error: {e}")
            return None

class WakatimeStatsCalculator:
    @staticmethod
    def calculate_stats(data: Dict) -> Optional[Dict]:
        """Calculate Wakatime statistics."""
        if not data:
            return None
        
        last_7_days = data['last_7_days']['data']
        all_time = data['all_time']['data']
        
        end_date = datetime.fromisoformat(last_7_days['end'].replace('Z', '+00:00'))
        now = timezone.now()
        time_diff = now - end_date
        hours_ago = int(time_diff.total_seconds() / 3600)
        
        # Get top 3 languages
        top_languages = []
        for i, lang in enumerate(last_7_days['languages'][:3]):
            top_languages.append({
            'name': lang['name'],
            'percentage': lang['percent'],
            'time': lang['text']
            })
        
        return {
            'start_date': datetime.fromisoformat(last_7_days['start'].replace('Z', '+00:00')).strftime('%B %d, %Y'),
            'end_date': end_date.strftime('%B %d, %Y'),
            'daily_average': WakatimeStatsCalculator._format_time(last_7_days['daily_average_including_other_language']),
            'this_week_coding': WakatimeStatsCalculator._format_time(last_7_days['total_seconds_including_other_language']),
            'best_day_date': datetime.fromisoformat(last_7_days['best_day']['date']).strftime('%B %d, %Y'),
            'best_day_coding': last_7_days['best_day']['text'],
            'top_language': last_7_days['languages'][0]['name'],
            'top_language_percentage': last_7_days['languages'][0]['percent'],
            'top_3_languages': top_languages,
            'all_time_coding': all_time['text'],
            'all_time_start': datetime.fromisoformat(all_time['range']['start'].replace('Z', '+00:00')).strftime('%B %d, %Y'),
            'all_time_end': datetime.fromisoformat(all_time['range']['end'].replace('Z', '+00:00')).strftime('%B %d, %Y'),
            'last_update_time': f"{hours_ago} hours ago"
        }
    
    @staticmethod
    def _format_time(seconds: float) -> str:
        """Format seconds into hours and minutes."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        return f"{hours} hrs {minutes} mins"

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