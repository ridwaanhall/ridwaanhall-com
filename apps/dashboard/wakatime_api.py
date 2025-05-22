from typing import Optional, Dict
import requests
import logging
from datetime import datetime
from django.utils import timezone

logger = logging.getLogger(__name__)

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
