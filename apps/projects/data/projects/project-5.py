"""
Project #5: BMKG Weather Pro
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=5,
    title='BMKG Weather Pro',
    headline='Access Indonesia’s weather forecasts with a Flask-powered API hub.',
    description=['This Flask project connects directly to BMKG’s database to deliver detailed weather forecasts.', 'Filter results by region, parameter, or time range for precise, tailored insights.', 'From Aceh to Papua, it provides a reliable, developer-friendly gateway to nationwide weather data.'],
    features=[
        Feature(title='Nationwide Coverage', description='Delivers weather data for every region across Indonesia.'),
        Feature(title='Custom Filters', description='Mix and match area, parameter, and time range for targeted results.'),
        Feature(title='Flask-Powered Performance', description='Smooth routing and efficient data handling with Flask.'),
    ],
    images={
        "bmkg_weather_forecast_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/bmkg_weather_forecast_api.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
    ],
    github_url='',
    demo_url='',
    category='Web App, Weather, Forecast, Flask',
    tags=['BMKG', 'Weather Forecast', 'Flask', 'Python', 'Indonesia', 'Data Filtering', 'Weather Data', 'Forecast', 'API'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
