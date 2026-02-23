"""
Project #4: BMKG Weather & Quake Tracker
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=4,
    title='BMKG Weather & Quake Tracker',
    headline='Monitor Indonesia’s weather and earthquake updates in real-time with Flask and AdminLTE.',
    description=['This Flask and AdminLTE-powered web app delivers live weather forecasts and earthquake alerts directly from BMKG.', 'Provides 3-day forecasts with wind speed, direction, and other key parameters for accurate planning.', 'Combines seismic alerts with weather insights, offering a unified dashboard for disaster awareness across Indonesia.'],
    features=[
        Feature(title='Live Weather Forecasts', description='Access 3-day forecasts including wind speed, direction, and conditions.'),
        Feature(title='Earthquake Alerts', description='Stay updated with the latest seismic activity reported by BMKG.'),
        Feature(title='Indonesia-Centric', description='Tailored for local data, ensuring relevance and reliability for Indonesian users.'),
    ],
    images={
        "bmkg_weather_quake_hub.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_quake_hub.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["adminlte"],
    ],
    github_url='https://github.com/ridwaanhall/WEB-FOR-BMKG',
    demo_url='',
    category='Web App, Weather, Disaster Monitoring, Flask',
    tags=['BMKG', 'Weather', 'Earthquake', 'Flask', 'AdminLTE', 'Indonesia', 'Real-time Data', 'Disaster Monitoring', 'Forecast'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-07-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-07-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
