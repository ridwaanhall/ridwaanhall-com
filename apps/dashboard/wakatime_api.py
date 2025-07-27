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
            if hours > 0 and minutes == 0:
                return f"{hours} hrs"
            elif hours > 0:
                return f"{hours} hrs {minutes} mins"
            elif minutes > 0:
                return f"{minutes} mins"
            else:
                return "0 mins"
        except (TypeError, ValueError):
            return "0 mins"
    
    @staticmethod
    def calculate_stats(data: Dict) -> Optional[Dict]:
        """Calculate comprehensive WakaTime statistics."""
        if not data or 'last_7_days' not in data or 'all_time' not in data:
            return None
        
        try:
            last_7_days = data['last_7_days']
            all_time = data['all_time']['data']
            
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
            if isinstance(last_7_days.get('data'), list) and last_7_days['data']:
                most_active_day_seconds = max(
                    (day.get('grand_total', {}).get('total_seconds', 0) for day in last_7_days['data']),
                    default=0
                )
            else:
                most_active_day_seconds = 0
                
            # Get the date of the most active day
            most_active_day_date = None
            if isinstance(last_7_days.get('data'), list) and last_7_days['data']:
                # Find the day with the most seconds
                most_active_day = max(
                    last_7_days['data'],
                    key=lambda day: day.get('grand_total', {}).get('total_seconds', 0),
                    default={}
                )
                # Get the date from the 'range' field if available, else fallback to 'date'
                date_str = most_active_day.get('range', {}).get('date') or most_active_day.get('date', '')
                if date_str:
                    most_active_day_date = WakatimeStatsCalculator._convert_to_gmt7(date_str).strftime('%B %d, %Y')
            else:
                most_active_day_date = WakatimeStatsCalculator._convert_to_gmt7(
                    last_7_days.get('start', '')
                ).strftime('%B %d, %Y')
                
            # get today's coding time
            today_coding_seconds = 0
            if isinstance(last_7_days.get('data'), list) and last_7_days['data']:
                jakarta_tz = pytz.timezone('Asia/Jakarta')
                today_jakarta = timezone.now().astimezone(jakarta_tz).strftime('%Y-%m-%d')
                
                today_coding_seconds = next(
                    (
                        day.get('grand_total', {}).get('total_seconds', 0)
                        for day in last_7_days['data']
                        if day.get('range', {}).get('date') == today_jakarta
                    ),
                    0
                )
                
            else:
                # This fallback logic is fine and handles an alternative data structure
                today_coding_seconds = last_7_days.get('today', {}).get('grand_total', {}).get('total_seconds', 0)
                
            # get languages used
            language_total = {}
            if isinstance(last_7_days.get('languages', []), list):
                for day_data in last_7_days['data']:
                    if 'languages' in day_data and isinstance(day_data['languages'], list):
                        for lang in day_data['languages']:
                            lang_name = lang.get('name', 'Unknown')
                            lang_seconds = lang.get('total_seconds', 0)
                            if lang_name in language_total:
                                language_total[lang_name] += lang_seconds
                            else:
                                language_total[lang_name] = lang_seconds

            grand_total_seconds = sum(language_total.values())
            
            languages_with_percentage = []
            for name, seconds in language_total.items():
                percent = (seconds / grand_total_seconds * 100) if grand_total_seconds > 0 else 0
                
                languages_with_percentage.append({
                    'name': name,
                    'seconds': seconds,
                    'time': WakatimeStatsCalculator._format_time(seconds),
                    'percent': percent
                })
                
            # Get the top 3 languages based on total_seconds
            top_3_languages = sorted(
                languages_with_percentage,
                key=lambda item: item['seconds'],
                reverse=True
            )[:3]
            
            return {
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
                'best_day_coding': WakatimeStatsCalculator._format_time(
                    most_active_day_seconds
                ),
                'best_day_date': most_active_day_date or 'N/A',
                'today_coding': WakatimeStatsCalculator._format_time(
                    today_coding_seconds
                ),
                'all_time_start': WakatimeStatsCalculator._convert_to_gmt7(
                    all_time.get('range', {}).get('start', '')
                ).strftime('%B %d, %Y'),
                'all_time_coding': all_time.get('text', '0 mins'),
                'top_3_languages': top_3_languages
            }
        
        except Exception as e:
            logger.error(f"Error calculating WakaTime stats: {e}")
            return None
