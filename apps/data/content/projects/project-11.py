"""
Project #11: Tsunami & Quake Dashboard
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Tsunami & Quake Dashboard
project_data = {
    "id": 11,
    "title": """Tsunami & Quake Dashboard""",
    "headline": """Track Indonesia’s quakes and tsunami alerts with real-time flair.""",
    "description": ['This Flask frontend serves up earthquake and tsunami data straight from BMKG, no filter.', 'With Chart.js visuals, Leaflet maps, OpenStreetMap, and Google Maps, it’s a seismic data party.', 'Rocking Bootstrap and OverlayScrollbars for a clean, responsive vibe.'],
    "images": {
        "inatews_dashboard.webp": f"{settings.PROJECT_BASE_IMG_URL}/inatews_dashboard.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Live Quake Data', 'description': 'Get historical and real-time earthquake info from BMKG.'}, {'title': 'Tsunami Heads-Up', 'description': 'Stay alert with live tsunami warnings across Indonesia.'}, {'title': 'Visual Feast', 'description': 'Interactive maps, shakemaps, and charts for epic insights.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["bootstrap"],
        SkillsData.tech_stack["leaflet"],
        SkillsData.tech_stack["chartjs"],
        SkillsData.tech_stack["datatables"],
        SkillsData.tech_stack["google_maps"],
        SkillsData.tech_stack["openstreetmap"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Dashboard, Data Visualization, Disaster Monitoring",
    "tags": [
        "Dashboard",
        "Earthquake",
        "Tsunami",
        "BMKG",
        "Indonesia",
        "Flask",
        "Chart.js",
        "Leaflet",
        "OpenStreetMap",
        "Google Maps",
        "Bootstrap",
        "Data Visualization",
        "Disaster Monitoring"
    ],
    "priority": 1,
    "slug": ""
}
