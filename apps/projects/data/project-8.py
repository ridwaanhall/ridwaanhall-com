"""
Project #8: BMKG Quake Watcher API (Unofficial)
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BMKG Quake Watcher API (Unofficial)
project_data = {
    "id": 8,
    "title": """BMKG Quake Watcher API (Unofficial)""",
    "headline": """Stay in the loop with real-time earthquake and tsunami updates via Flask.""",
    "description": ['This Flask-based API dishes out earthquake data in XML, JSON, and GeoJSON formats, no cap.', 'Covers quakes over 5 magnitude, recent tremors, tsunami alerts, and seismic news.', 'A must-have for researchers, devs, or anyone vibing with quake info.'],
    "images": {
        "bmkg_quake_tracker_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_quake_tracker_api.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Flexi-Format Data', 'description': 'Grab quake info in XML, JSON, or GeoJSON—your pick.'}, {'title': 'Live Alerts', 'description': 'Stay woke with real-time tsunami and seismic updates.'}, {'title': 'Data Deep Dive', 'description': 'Get magnitude, location, PGA Max, MMI, and more.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "https://earthquake-bmkg-api.ridwaanhall.repl.co",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Disaster Monitoring, Earthquake, Flask",
    "tags": [
        "BMKG",
        "Earthquake",
        "Tsunami",
        "API",
        "Flask",
        "Real-time Data",
        "Indonesia",
        "GeoJSON",
        "XML",
        "JSON"
    ],
    "priority": 1,
    "slug": ""
}
