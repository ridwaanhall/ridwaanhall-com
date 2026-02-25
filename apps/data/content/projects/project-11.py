"""
Project #11: Tsunami & Quake Dashboard
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=11,
    title='Tsunami & Quake Dashboard',
    headline='Track Indonesia’s quakes and tsunami alerts with real-time flair.',
    description=['This Flask frontend serves up earthquake and tsunami data straight from BMKG, no filter.', 'With Chart.js visuals, Leaflet maps, OpenStreetMap, and Google Maps, it’s a seismic data party.', 'Rocking Bootstrap and OverlayScrollbars for a clean, responsive vibe.'],
    features=[
        Feature(title='Live Quake Data', description='Get historical and real-time earthquake info from BMKG.'),
        Feature(title='Tsunami Heads-Up', description='Stay alert with live tsunami warnings across Indonesia.'),
        Feature(title='Visual Feast', description='Interactive maps, shakemaps, and charts for epic insights.'),
    ],
    images={
        "inatews_dashboard_page.webp": f"{settings.PROJECT_BASE_IMG_URL}/inatews_dashboard_page.webp",
        "inatews_maps_page.webp": f"{settings.PROJECT_BASE_IMG_URL}/inatews_maps_page.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["bootstrap"],
        SkillsData.tech_stack["leaflet"],
        SkillsData.tech_stack["chartjs"],
        SkillsData.tech_stack["datatables"],
        SkillsData.tech_stack["google_maps"],
        SkillsData.tech_stack["openstreetmap"],
    ],
    github_url='https://github.com/ridwaanhall/web-earthquake-bmkg',
    demo_url='',
    category='Dashboard, Data Visualization, Disaster Monitoring',
    tags=['Dashboard', 'Earthquake', 'Tsunami', 'BMKG', 'Indonesia', 'Flask', 'Chart.js', 'Leaflet', 'OpenStreetMap', 'Google Maps', 'Bootstrap', 'Data Visualization', 'Disaster Monitoring'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
