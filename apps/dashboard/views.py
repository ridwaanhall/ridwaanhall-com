import json
import requests
from decouple import config
from django.views.generic import TemplateView
from apps.data.about_data import AboutData
from datetime import datetime, timedelta

def fetch_github_activity():
    username = "ridwaanhall"
    access_token = config("ACCESS_TOKEN")
    api_url = "https://api.github.com/graphql"

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
    """ % username

    headers = {
        "Authorization": "Bearer %s" % access_token,
        "Content-Type": "application/json",
    }
    data = json.dumps({"query": query})

    response = requests.post(api_url, headers=headers, data=data)
    if response.status_code == 200:
        return response.json()
    else:
        return None

def calculate_github_stats(contribution_weeks, total_contributions):
    """Calculate GitHub contribution statistics."""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get first day of current week (Sunday)
    day_of_week = today.weekday()
    # Convert from Monday-based (0-6) to Sunday-based (0-6) week
    first_day_of_current_week = today - timedelta(days=(day_of_week + 1) % 7)
    
    # Initialize statistics
    this_week_contributions = 0
    best_day_count = 0
    total_days_with_contributions = 0
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Collect all days
    all_days = []
    for week in contribution_weeks:
        for day in week['contributionDays']:
            date = datetime.fromisoformat(day['date'])
            count = day['contributionCount']
            
            all_days.append({'date': date, 'count': count})
            
            # Calculate best day
            if count > best_day_count:
                best_day_count = count
            
            # Calculate this week's contributions
            if first_day_of_current_week <= date <= today:
                this_week_contributions += count
            
            # Count days with contributions for average calculation
            if count > 0:
                total_days_with_contributions += 1
    
    # Sort days chronologically
    all_days.sort(key=lambda x: x['date'])
    
    # Calculate streaks
    for day_data in all_days:
        if day_data['count'] > 0:
            temp_streak += 1
            
            # Update current streak if the date is today or yesterday
            day_diff = (today - day_data['date']).days
            if day_diff <= 1:
                current_streak = temp_streak
        else:
            # Update longest streak
            if temp_streak > longest_streak:
                longest_streak = temp_streak
            temp_streak = 0
    
    # Check if the final streak is the longest
    if temp_streak > longest_streak:
        longest_streak = temp_streak
    
    # If current streak was broken (no contributions today or yesterday), reset to 0
    if all_days:
        last_day = all_days[-1]
        days_since_last_contribution = (today - last_day['date']).days
        if days_since_last_contribution > 1 or last_day['count'] == 0:
            current_streak = 0
    
    # Calculate average (contributions per day)
    total_days = len(all_days)
    average_contributions = round(total_contributions / total_days, 1) if total_days > 0 else 0
    
    return {
        'this_week': this_week_contributions,
        'best_day': best_day_count,
        'average': f"{average_contributions}",
        'longest_streak': longest_streak,
        'current_streak': current_streak
    }

class DashboardView(TemplateView):
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        about = AboutData.get_about_data()
        context['about'] = about[0]
        
        # Add GitHub activity data to context
        github_activity = fetch_github_activity()
        context['github_activity'] = github_activity
        
        # Calculate statistics if GitHub data is available
        if github_activity:
            calendar_data = github_activity['data']['user']['contributionsCollection']['contributionCalendar']
            contribution_weeks = calendar_data['weeks']
            total_contributions = calendar_data['totalContributions']
            
            # Calculate statistics
            stats = calculate_github_stats(contribution_weeks, total_contributions)
            
            # Add statistics to context
            context['total_contributions'] = total_contributions
            context['this_week'] = stats['this_week']
            context['best_day'] = stats['best_day']
            context['average'] = f"{stats['average']} / day"
            context['longest_streak'] = stats['longest_streak']
            context['current_streak'] = stats['current_streak']
            context['last_update_time'] = datetime.now().strftime('%B %d, %Y %I:%M %p')
        
        return context