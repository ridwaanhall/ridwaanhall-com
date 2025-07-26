"""
Project #4: BMKG Weather & Quake Tracker
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BMKG Weather & Quake Tracker
project_data = {
    "id": 4,
    "title": """BMKG Weather & Quake Tracker""",
    "headline": """Stay woke with real-time weather and quake updates, served fresh by Flask.""",
    "description": ['This Flask and AdminLTE combo dishes out live weather forecasts and earthquake alerts.', 'Data comes straight from BMKG, so you know it’s legit and on point.', 'From Yogyakarta’s skies to the latest tremors, this tool’s got you covered.'],
    "images": {
        "bmkg_weather_quake_hub.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_quake_hub.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Live Weather Vibes', 'description': 'Check 3-day forecasts with wind speed, direction, and more.'}, {'title': 'Quake Watch', 'description': 'Stay in the loop with the latest earthquake updates from BMKG.'}, {'title': 'Indonesia Focus', 'description': 'Tailored for local data, keeping it real and relevant.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["adminlte"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-07-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Weather, Disaster Monitoring, Flask",
    "tags": [
        "BMKG",
        "Weather",
        "Earthquake",
        "Flask",
        "AdminLTE",
        "Indonesia",
        "Real-time Data",
        "Disaster Monitoring",
        "Forecast"
    ],
    "priority": 1,
    "slug": ""
}
