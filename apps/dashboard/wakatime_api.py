"""
WakaTime API client and statistics calculator for fetching and processing coding activity data.
"""

import logging
import requests
import pytz
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from django.utils import timezone

logger = logging.getLogger(__name__)


class WakatimeClient:
    """Client for interacting with WakaTime API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://wakatime.com/api/v1"
        self.timeout = 10

    def get_activity_data(self) -> Optional[Dict]:
        """Fetch WakaTime activity data for the last 7 days and all time."""
        try:
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            today = timezone.now().astimezone(jakarta_tz).date()
            start_date = today - timedelta(days=6)  # 7 days including today

            last_7_days_url = (
                f"{self.base_url}/users/current/summaries"
                f"?start={start_date}&end={today}&api_key={self.api_key}"
            )
            all_time_url = f"{self.base_url}/users/current/all_time_since_today?api_key={self.api_key}"

            last_7_days_response = requests.get(last_7_days_url, timeout=self.timeout)
            all_time_response = requests.get(all_time_url, timeout=self.timeout)

            last_7_days_response.raise_for_status()
            all_time_response.raise_for_status()

            return {
                'last_7_days': last_7_days_response.json(),
                'all_time': all_time_response.json()
            }
        except requests.RequestException as e:
            logger.error(f"WakaTime API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in WakaTime API client: {e}", exc_info=True)
            return None


class WakatimeStatsCalculator:
    """Calculator for processing WakaTime API data into statistics."""
    
    @staticmethod
    def _convert_to_gmt7(iso_string: str) -> Optional[datetime]:
        """Convert ISO string to GMT+7 timezone."""
        if not iso_string:
            return None
        try:
            utc_dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
            gmt7 = pytz.timezone('Asia/Jakarta')
            return utc_dt.astimezone(gmt7)
        except (ValueError, TypeError) as e:
            logger.error(f"Error converting timezone for string '{iso_string}': {e}")
            return None
    
    @staticmethod
    def _format_time(seconds: float) -> str:
        """Format seconds into a human-readable string."""
        if not isinstance(seconds, (int, float)) or seconds < 0:
            return "0 mins"
        try:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)

            hour_str = ""
            minute_str = ""

            if hours > 0:
                hour_str = f"{hours} hour" if hours == 1 else f"{hours} hours"
            if minutes > 0:
                minute_str = f"{minutes} minute" if minutes == 1 else f"{minutes} minutes"

            if hours > 0 and minutes > 0:
                return f"{hour_str} {minute_str}"
            elif hours > 0:
                return hour_str
            elif minutes > 0:
                return minute_str
            elif seconds > 0:
                return f"{int(seconds)} secs"
            else:
                return "0 mins"
        except (TypeError, ValueError):
            return "0 mins"
    
    @staticmethod
    def calculate_stats(data: Dict) -> Optional[Dict]:
        """Calculate comprehensive WakaTime statistics."""
        if not data or 'last_7_days' not in data or 'all_time' not in data:
            logger.warning("WakaTime stats calculation skipped: Invalid or missing data.")
            return None
        
        try:
            last_7_days = data.get('last_7_days', {})
            all_time = data.get('all_time', {}).get('data', {})
            daily_data = last_7_days.get('data', [])

            # Aggregation Step
            grand_total_seconds_7_days = last_7_days.get('cumulative_total', {}).get('seconds', 0)
            category_total_seconds = 0.0
            os_totals = {}
            language_totals = {}

            for day in daily_data:
                # Aggregate Categories (sum all into one 'Coding' bucket)
                for category in day.get('categories', []):
                    category_total_seconds += category.get('total_seconds', 0)
                # Aggregate Operating Systems
                for os_data in day.get('operating_systems', []):
                    os_name = os_data.get('name', 'Unknown')
                    os_totals[os_name] = os_totals.get(os_name, 0) + os_data.get('total_seconds', 0)
                # Aggregate Languages
                for lang_data in day.get('languages', []):
                    lang_name = lang_data.get('name', 'Unknown')
                    language_totals[lang_name] = language_totals.get(lang_name, 0) + lang_data.get('total_seconds', 0)

            # Calculation and Formatting Step
            
            # Find the most active day (once) for efficiency
            most_active_day = max(daily_data, key=lambda d: d.get('grand_total', {}).get('total_seconds', 0), default={})
            most_active_day_seconds = most_active_day.get('grand_total', {}).get('total_seconds', 0)
            most_active_day_date_obj = WakatimeStatsCalculator._convert_to_gmt7(most_active_day.get('range', {}).get('date'))
            
            # Find today's coding time
            today_str = timezone.now().astimezone(pytz.timezone('Asia/Jakarta')).strftime('%Y-%m-%d')
            today_coding_seconds = next((d.get('grand_total', {}).get('total_seconds', 0) for d in daily_data if d.get('range', {}).get('date') == today_str), 0)

            # Calculate daily average seconds for comparison
            daily_average_seconds = last_7_days.get('daily_average', {}).get('seconds_including_other_language', 0)
            
            # Calculate today's coding change percentage vs daily average
            today_change_percent = 0
            today_change_type = "same"
            if daily_average_seconds > 0:
                change_ratio = ((today_coding_seconds - daily_average_seconds) / daily_average_seconds) * 100
                today_change_percent = abs(change_ratio)
                today_change_type = "increase" if change_ratio > 0 else "decrease" if change_ratio < 0 else "same"

            # Process stats
            def calculate_percentage(value, total):
                return (value / total) * 100 if total > 0 else 0

            top_1_category = {
                'name': 'Coding',
                'percent': round(calculate_percentage(category_total_seconds, grand_total_seconds_7_days), 2),
                'time': WakatimeStatsCalculator._format_time(category_total_seconds)
            }
                        
            top_2_os = sorted([
                {
                    'name': name,
                    'percent': round(calculate_percentage(seconds, grand_total_seconds_7_days), 2),
                    'time': WakatimeStatsCalculator._format_time(seconds)
                } for name, seconds in os_totals.items()
            ], key=lambda x: x['percent'], reverse=True)

            languages_with_percentage = [
                {
                    'name': name,
                    'percent': round(calculate_percentage(seconds, grand_total_seconds_7_days), 2),
                    'time': WakatimeStatsCalculator._format_time(seconds)
                } for name, seconds in language_totals.items()
            ]
            top_3_languages = sorted(languages_with_percentage, key=lambda x: x['percent'], reverse=True)[:3]
            
            # Construct the Final Result
            start_date_obj = WakatimeStatsCalculator._convert_to_gmt7(last_7_days.get('start'))
            end_date_obj = WakatimeStatsCalculator._convert_to_gmt7(last_7_days.get('end'))
            all_time_start_obj = WakatimeStatsCalculator._convert_to_gmt7(all_time.get('range', {}).get('start'))

            return {
                'start_date': start_date_obj.strftime('%B %d, %Y') if start_date_obj else 'N/A',
                'end_date': end_date_obj.strftime('%B %d, %Y') if end_date_obj else 'N/A',
                'all_time_start': all_time_start_obj.strftime('%B %d, %Y') if all_time_start_obj else 'N/A',
                'all_time_coding': all_time.get('text', '0 mins'),
                'daily_average': WakatimeStatsCalculator._format_time(last_7_days.get('daily_average', {}).get('seconds_including_other_language', 0)),
                'this_week_coding': WakatimeStatsCalculator._format_time(grand_total_seconds_7_days),
                'today_coding': WakatimeStatsCalculator._format_time(today_coding_seconds),
                'today_change_percent': round(today_change_percent, 1),
                'today_change_type': today_change_type,
                'best_day_coding': WakatimeStatsCalculator._format_time(most_active_day_seconds),
                'best_day_date': most_active_day_date_obj.strftime('%B %d, %Y') if most_active_day_date_obj else 'N/A',
                'top_1_category': top_1_category,
                'top_2_os': top_2_os,
                'top_3_languages': top_3_languages,
            }
        
        except Exception as e:
            logger.error(f"Error calculating WakaTime stats: {e}", exc_info=True)
            return None