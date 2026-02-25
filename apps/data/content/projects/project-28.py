"""
Project #28: Follow Dragon SpaceX Tracker
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=28,
    title='Follow Dragon SpaceX Tracker',
    headline='Chase SpaceX Dragon missions live with Django-powered API swagger.',
    description=['This Django project hooks into external APIs to serve real-time SpaceX Dragon data, rendered in slick HTML templates.', 'The `dragon_public` view grabs JSON data with custom headers, delivering responsive, dynamic visuals.', 'Extra views handle redirects and data rendering for a seamless user experience.'],
    features=[
        Feature(title='Live API Connect', description='Pulls JSON data with custom headers for real-time mission tracking.'),
        Feature(title='Sleek Template Vibes', description='Responsive designs make data pop dynamically.'),
        Feature(title='Django Dynamism', description='Robust and scalable thanks to Django’s framework.'),
    ],
    images={
        "follow_dragon_spacex_dark.webp": f"{settings.PROJECT_BASE_IMG_URL}/follow_dragon_spacex_dark.webp",
        "follow_dragon_spacex_satelite.webp": f"{settings.PROJECT_BASE_IMG_URL}/follow_dragon_spacex_satelite.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
    ],
    github_url='https://github.com/ridwaanhall/follow-dragon-spacex',
    demo_url='https://follow-dragon.ridwaanhall.com/',
    category='API, Space, Real-time Data, Django',
    tags=['SpaceX', 'Dragon', 'API', 'Django', 'Python', 'Real-time Data', 'External API', 'Mission Tracking', 'HTML Templates'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
