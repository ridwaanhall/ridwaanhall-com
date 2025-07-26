"""
Project #5: BMKG Weather Pro
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BMKG Weather Pro
project_data = {
    "id": 5,
    "title": """BMKG Weather Pro""",
    "headline": """Your VIP pass to Indonesia’s weather scene, powered by Flask and BMKG.""",
    "description": ['This Flask project hooks you up with detailed weather forecasts from BMKG’s database.', 'Filter by region, parameter, or time range to get exactly what you need.', 'From Aceh to Papua, it’s your one-stop shop for reliable weather intel.'],
    "images": {
        "bmkg_weather_forecast_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_forecast_api.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Nationwide Reach', 'description': 'Covers weather data for every corner of Indonesia.'}, {'title': 'Flexi-Filters', 'description': 'Mix and match area, parameter, and time for custom results.'}, {'title': 'Flask Flow', 'description': 'Smooth routing and fast data handling with Flask.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Weather, Forecast, Flask",
    "tags": [
        "BMKG",
        "Weather Forecast",
        "Flask",
        "Python",
        "Indonesia",
        "Data Filtering",
        "Weather Data",
        "Forecast",
        "API"
    ],
    "priority": 1,
    "slug": ""
}
