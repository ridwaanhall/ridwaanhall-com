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
                else:
                    best_day_count = best_day_count
                
                if count > 0:
                    total_days_with_contributions += 1
                else:
                    total_days_with_contributions = total_days_with_contributions
        
        # Calculate this week's contributions if current week was found
        if current_week:
            for day in current_week['contributionDays']:
                this_week_contributions += day['contributionCount']
        else:
            this_week_contributions = 0

        all_days.sort(key=lambda x: x['date'])
        
        # Calculate streaks
        current_streak, longest_streak, current_streak_start, current_streak_end = GitHubStatsCalculator._calculate_streaks(all_days, today)
        
        total_days = len(all_days)
        average_contributions = round(total_contributions / total_days, 1) if total_days > 0 else 0
        return {
            'this_week': this_week_contributions,
            'best_day': best_day_count,
            'average': f"{average_contributions}",
            'longest_streak': longest_streak,
            'current_streak': current_streak,
            'current_streak_start': current_streak_start,
            'current_streak_end': current_streak_end
        }
    
    @staticmethod
    def _calculate_streaks(all_days: List[Dict], today: datetime) -> tuple:
        """Helper method to calculate contribution streaks. Returns (current_streak, longest_streak, current_streak_start, current_streak_end)."""
        if not all_days:
            return 0, 0, None, None
        
        # Calculate longest streak by iterating through all days
        temp_streak = 0
        longest_streak = 0
        
        for day_data in all_days:
            if day_data['count'] > 0:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0
        
        # Calculate current streak by going backwards from the most recent day with data
        current_streak = 0
        current_streak_start = None
        current_streak_end = None
        
        # Sort days in reverse order (most recent first)
        reversed_days = sorted(all_days, key=lambda x: x['date'], reverse=True)
        
        if not reversed_days:
            return current_streak, longest_streak, current_streak_start, current_streak_end
        
        # Find the current streak by going backwards from the most recent day
        streak_days = []
        
        # Start from the most recent day and count backwards
        for i, day_data in enumerate(reversed_days):
            if day_data['count'] > 0:
                current_streak += 1
                streak_days.append(day_data)
            else:
                # If we hit a day with 0 contributions, check if it's the first day
                # If it's the first day (most recent), streak is 0
                # If it's not the first day, we've found the end of the streak
                break
        
        # If we have a current streak, determine start and end dates
        if current_streak > 0 and streak_days:
            # streak_days is in reverse order (newest first), so:
            current_streak_end = streak_days[0]['date']  # Most recent date
            current_streak_start = streak_days[-1]['date']  # Oldest date in streak
        
        return current_streak, longest_streak, current_streak_start, current_streak_end

    @staticmethod
    def process_github_data(github_activity: Dict) -> Optional[Dict]:
        """Process GitHub activity data and return formatted statistics ready for template use."""
        if not github_activity or 'data' not in github_activity:
            logger.error("GitHub activity data is missing or malformed.")
            return None
        
        try:
            user_data = github_activity['data']['user']
            calendar_data = user_data['contributionsCollection']['contributionCalendar']
            contribution_weeks = calendar_data['weeks']
            total_contributions = calendar_data['totalContributions']
            
            # Calculate statistics
            github_stats = GitHubStatsCalculator.calculate_stats(
                contribution_weeks, total_contributions
            )
            
            # Format streak dates for display
            current_streak_start_formatted = None
            current_streak_end_formatted = None
            
            if github_stats['current_streak_start'] and github_stats['current_streak_end']:
                current_streak_start_formatted = github_stats['current_streak_start'].strftime('%b %d, %Y')
                current_streak_end_formatted = github_stats['current_streak_end'].strftime('%b %d, %Y')
            
            # Return fully processed data ready for template
            return {
                'github_activity': github_activity,
                'total_contributions': total_contributions,
                'this_week': github_stats['this_week'],
                'best_day': github_stats['best_day'],
                'average': f"{github_stats['average']}",
                'longest_streak': github_stats['longest_streak'],
                'current_streak': github_stats['current_streak'],
                'current_streak_start': current_streak_start_formatted,
                'current_streak_end': current_streak_end_formatted,
                'github_last_update': timezone.now().strftime('%B %d, %Y %I:%M %p')
            }
            
        except Exception as e:
            logger.error(f"Error processing GitHub data: {e}", exc_info=True)
            return None
