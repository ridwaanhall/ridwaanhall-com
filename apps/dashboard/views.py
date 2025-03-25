import json
import requests
from decouple import config
from django.views.generic import TemplateView
from apps.data.about_data import AboutData

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

class DashboardView(TemplateView):
    template_name = 'dashboard/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        about = AboutData.get_about_data()
        context['about'] = about[0]
        
        # Add GitHub activity data to context
        github_activity = fetch_github_activity()
        context['github_activity'] = github_activity
        
        return context