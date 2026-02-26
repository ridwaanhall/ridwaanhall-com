"""
Project #8: BMKG Quake Watcher API (Unofficial)
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=8,
    title='BMKG Quake Watcher API (Unofficial)',
    headline='Real-time quake & tsunami data API with multi-format support, built on Flask.',
    description=['Serve seismic insights instantly — delivers earthquake and tsunami data straight from BMKG in JSON, XML, and GeoJSON.', 'Multi-format flexibility — whether you’re building dashboards, research tools, or mobile apps, the API adapts to your needs.', 'Beyond the basics — includes quake magnitude, location, PGA Max, MMI, and tsunami alerts for comprehensive monitoring.', 'Developer-friendly — lightweight Flask build with clean endpoints for quick integration into any project.'],
    features=[
        Feature(title='Flexible Data Formats', description='Access quake and tsunami info in JSON, XML, or GeoJSON for easy integration.'),
        Feature(title='Live Alerts', description='Stay updated with real-time seismic and tsunami warnings from BMKG.'),
        Feature(title='Comprehensive Insights', description='Includes magnitude, location, PGA Max, MMI, and more for deeper analysis.'),
    ],
    images={
        "bmkg_quake_tracker_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_quake_tracker_api.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
    ],
    github_url='',
    demo_url='https://earthquake-bmkg-api.ridwaanhall.repl.co',
    category='API, Disaster Monitoring, Earthquake, Flask',
    tags=['BMKG', 'Earthquake', 'Tsunami', 'API', 'Flask', 'Real-time Data', 'Indonesia', 'GeoJSON', 'XML', 'JSON'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
