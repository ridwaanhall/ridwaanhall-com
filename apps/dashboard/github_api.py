import json
import logging
from django.utils import timezone
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import requests

import logging
logger = logging.getLogger(__name__)

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
