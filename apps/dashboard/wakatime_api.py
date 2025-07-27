"""
WakaTime API client for fetching coding activity data.
Separated from views for better organization and reusability.
"""

import logging
import requests
import pytz
from datetime import datetime, timedelta
from typing import Dict, Optional
from django.utils import timezone

logger = logging.getLogger(__name__)


class WakatimeClient:
    """Client for interacting with WakaTime API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://wakatime.com/api/v1"
        self.timeout = 10

    def get_activity_data(self) -> Optional[Dict]:
        """Fetch WakaTime activity data for the last 7 days (including weekends) and all time."""
        try:
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            today = timezone.now().astimezone(jakarta_tz).date()
            start = today - timedelta(days=6)  # 7 days including today
            end = today

            last_7_days_url = (
                f"{self.base_url}/users/current/summaries"
                f"?start={start}&end={end}&cache=true&paywalled=true&api_key={self.api_key}"
            )
            all_time_url = f"{self.base_url}/users/current/all_time_since_today?api_key={self.api_key}"

            last_7_days = requests.get(last_7_days_url, timeout=self.timeout)
            all_time_response = requests.get(all_time_url, timeout=self.timeout)

            last_7_days.raise_for_status()
            all_time_response.raise_for_status()

            return {
                'last_7_days': last_7_days.json(),
                'all_time': all_time_response.json()
            }
        except requests.RequestException as e:
            logger.error(f"WakaTime API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in WakaTime API: {e}")
            return None


class WakatimeStatsCalculator:
    """Calculator for processing WakaTime API data into statistics."""
    
    @staticmethod
    def _convert_to_gmt7(iso_string: str) -> datetime:
        """Convert ISO string to GMT+7 timezone."""
        try:
            utc_dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
            utc_dt = utc_dt.replace(tzinfo=pytz.UTC)
            gmt7 = pytz.timezone('Asia/Jakarta')  # GMT+7
            return utc_dt.astimezone(gmt7)
        except Exception as e:
            logger.error(f"Error converting timezone: {e}")
            return timezone.now()
    
    @staticmethod
    def _format_time(seconds: float) -> str:
        """Format seconds into hours and minutes."""
        try:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            return f"{hours} hrs {minutes} mins"
        except (TypeError, ValueError):
            return "0 hrs 0 mins"
    
    @staticmethod
    def calculate_stats(data: Dict) -> Optional[Dict]:
        """Calculate comprehensive WakaTime statistics."""
        if not data or 'last_7_days' not in data or 'all_time' not in data:
            return None
        
        try:
            last_7_days = data['last_7_days']
            all_time = data['all_time']['data']
            
            # Calculate time differences
            # modified_at = WakatimeStatsCalculator._convert_to_gmt7(last_7_days['modified_at'])
            # now_gmt7 = timezone.now().astimezone(pytz.timezone('Asia/Jakarta'))
            # time_diff = now_gmt7 - modified_at
            # hours_ago = max(0, int(time_diff.total_seconds() / 3600))
            
            # Get daily average seconds from last 7 days
            daily_avg_seconds = 0
            if isinstance(last_7_days.get('daily_average'), dict):
                daily_avg_seconds = last_7_days['daily_average'].get('seconds_including_other_language', 0)
            else:
                daily_avg_seconds = last_7_days.get('daily_average', 0)

            # Get total coding time from last 7 days
            this_week_coding_seconds = 0
            if isinstance(last_7_days.get('cumulative_total'), dict):
                this_week_coding_seconds = last_7_days['cumulative_total'].get('seconds', 0)
            else:
                this_week_coding_seconds = last_7_days.get('cumulative_total', 0)
                
            # get most active day
            most_active_day_seconds = 0
            

            # Process top languages
            # top_languages = []
            # for lang in last_7_days.get('languages', [])[:3]:
            #     top_languages.append({
            #         'name': lang.get('name', 'Unknown'),
            #         'percent': lang.get('percent', 0),
            #         'time': lang.get('text', '0 mins')
            #     })
            
            # # Sum all categories as "Coding"
            # total_seconds = 0
            # total_percent = 0
            # for category in last_7_days.get('categories', []):
            #     total_seconds += category.get('total_seconds', 0)
            #     total_percent += category.get('percent', 0)
            # top_category = [{
            #     'name': 'Coding',
            #     'percent': total_percent,
            #     'time': WakatimeStatsCalculator._format_time(total_seconds)
            # }]
            
            # # Process top operating systems
            # top_os = []
            # for os in last_7_days.get('operating_systems', [])[:2]:
            #     top_os.append({
            #         'name': os.get('name', 'Unknown'),
            #         'percent': os.get('percent', 0),
            #         'time': os.get('text', '0 mins')
            #     })
            
            return {
                # 'created_at': WakatimeStatsCalculator._convert_to_gmt7(
                #     last_7_days.get('created_at', '')
                # ).strftime('%B %d, %Y'),
                # 'updated_at': WakatimeStatsCalculator._convert_to_gmt7(
                #     last_7_days.get('modified_at', '')
                # ).strftime('%B %d, %Y'),
                'start_date': WakatimeStatsCalculator._convert_to_gmt7(
                    last_7_days.get('start', '')
                ).strftime('%B %d, %Y'),
                'end_date': WakatimeStatsCalculator._convert_to_gmt7(
                    last_7_days.get('end', '')
                ).strftime('%B %d, %Y'),
                'daily_average': WakatimeStatsCalculator._format_time(
                    last_7_days.get('daily_average', 0)
                ),
                'daily_average': WakatimeStatsCalculator._format_time(
                    daily_avg_seconds
                ),
                'this_week_coding': WakatimeStatsCalculator._format_time(
                    this_week_coding_seconds
                ),
            }
        
        except Exception as e:
            logger.error(f"Error calculating WakaTime stats: {e}")
            return None
