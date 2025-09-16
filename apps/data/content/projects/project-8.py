"""
Project #8: BMKG Quake Watcher API (Unofficial)
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: BMKG Quake Watcher API (Unofficial)
project_data = {
    # Identity
    "id": 8,
    "title": "BMKG Quake Watcher API (Unofficial)",
    "headline": "Real-time quake & tsunami data API with multi-format support, built on Flask.",

    # Core Content
    "description": [
        "Serve seismic insights instantly — delivers earthquake and tsunami data straight from BMKG in JSON, XML, and GeoJSON.",
        "Multi-format flexibility — whether you’re building dashboards, research tools, or mobile apps, the API adapts to your needs.",
        "Beyond the basics — includes quake magnitude, location, PGA Max, MMI, and tsunami alerts for comprehensive monitoring.",
        "Developer-friendly — lightweight Flask build with clean endpoints for quick integration into any project."
    ],
    "features": [
        {
            "title": "Flexible Data Formats",
            "description": "Access quake and tsunami info in JSON, XML, or GeoJSON for easy integration."
        },
        {
            "title": "Live Alerts",
            "description": "Stay updated with real-time seismic and tsunami warnings from BMKG."
        },
        {
            "title": "Comprehensive Insights",
            "description": "Includes magnitude, location, PGA Max, MMI, and more for deeper analysis."
        }
    ],
    "images": {
        "bmkg_quake_tracker_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_quake_tracker_api.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"]
    ],
    "github_url": "",
    "demo_url": "https://earthquake-bmkg-api.ridwaanhall.repl.co",

    # Classification
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

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
