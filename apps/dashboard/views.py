import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.views.generic import TemplateView

from apps.data.about_data import AboutData

logger = logging.getLogger(__name__)

# Constants
CACHE_TIMEOUT = 10800  # 3 hours


class GitHubClient:
    def __init__(self, username: str, access_token: str):
        self.username = username
        self.access_token = access_token
        self.api_url = "https://api.github.com/graphql"
        
    def get_contribution_data(self) -> Optional[Dict]:
        """Fetch GitHub contribution data for the user."""
        query = """
          query {
            user(login: "%s") {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  months {
                    firstDay
                    name
                    totalWeeks
                  }
                  weeks {
                    firstDay
                    contributionDays {
                      contributionCount
                      date
                    }
                  }
                }
              }
            }
          }
        """ % self.username

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        data = json.dumps({"query": query})

        try:
            response = requests.post(self.api_url, headers=headers, data=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"GitHub API error: {e}")
            return None


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


class GitHubStatsCalculator:
    @staticmethod
    def calculate_stats(contribution_weeks: List[Dict], total_contributions: int) -> Dict:
        """Calculate GitHub contribution statistics."""
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        this_week_contributions = 0
        best_day_count = 0
        total_days_with_contributions = 0
        longest_streak = 0
        
        all_days = []
        current_week = None
        
        # Find current week and process all days
        for week in contribution_weeks:
            first_day = datetime.fromisoformat(week['firstDay'])
            first_day = timezone.make_aware(first_day) if timezone.is_naive(first_day) else first_day
            
            # Determine if this is the current week
            last_day = first_day + timedelta(days=7)
            if first_day <= today <= last_day:
                current_week = week
            
            for day in week['contributionDays']:
                date = datetime.fromisoformat(day['date'])
                date = timezone.make_aware(date) if timezone.is_naive(date) else date
                count = day['contributionCount']
                
                all_days.append({'date': date, 'count': count})
                
                if count > best_day_count:
                    best_day_count = count
                
                if count > 0:
                    total_days_with_contributions += 1
        
        # Calculate this week's contributions if current week was found
        if current_week:
            for day in current_week['contributionDays']:
                this_week_contributions += day['contributionCount']
        
        all_days.sort(key=lambda x: x['date'])
        
        # Calculate streaks
        current_streak, longest_streak = GitHubStatsCalculator._calculate_streaks(all_days, today)
        
        total_days = len(all_days)
        average_contributions = round(total_contributions / total_days, 1) if total_days > 0 else 0
        return {
            'this_week': this_week_contributions,
            'best_day': best_day_count,
            'average': f"{average_contributions}",
            'longest_streak': longest_streak,
            'current_streak': current_streak
        }
    
    @staticmethod
    def _calculate_streaks(all_days: List[Dict], today: datetime) -> tuple:
        """Helper method to calculate contribution streaks. Returns (current_streak, longest_streak)."""
        temp_streak = 0
        current_streak = 0
        longest_streak = 0
        
        for day_data in all_days:
            if day_data['count'] > 0:
                temp_streak += 1
                
                day_diff = (today - day_data['date']).days
                if day_diff <= 1:
                    current_streak = temp_streak
            else:
                if temp_streak > longest_streak:
                    longest_streak = temp_streak
                temp_streak = 0
        
        if temp_streak > longest_streak:
            longest_streak = temp_streak
        
        if all_days:
            last_day = all_days[-1]
            days_since_last_contribution = (today - last_day['date']).days
            if days_since_last_contribution > 1 or last_day['count'] == 0:
                current_streak = 0
                
        return current_streak, longest_streak

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
        
        return {
            'start_date': datetime.fromisoformat(last_7_days['start'].replace('Z', '+00:00')).strftime('%B %d, %Y'),
            'end_date': end_date.strftime('%B %d, %Y'),
            'daily_average': WakatimeStatsCalculator._format_time(last_7_days['daily_average']),
            'this_week_coding': WakatimeStatsCalculator._format_time(last_7_days['total_seconds']),
            'best_day_date': datetime.fromisoformat(last_7_days['best_day']['date']).strftime('%B %d, %Y'),
            'best_day_coding': last_7_days['best_day']['text'],
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