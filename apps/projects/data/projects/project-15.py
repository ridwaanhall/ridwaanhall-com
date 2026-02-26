"""
Project #15: Planetary API | Cosmic Data Hub
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=15,
    title='Planetary API | Cosmic Data Hub',
    headline='Explore the solar system with Flask and SQLAlchemy—space data, unlocked.',
    description=['This RESTful Planetary API dishes out juicy details on planets in our solar system.', 'Get names, types, home stars, masses, radii, and Earth distances with ease.', 'Rocking JWT for secure access, CRUD ops, and Flask-Mail for email notifications.'],
    features=[
        Feature(title='Planet Data Galore', description='Scoop up details on planets, types, and distances.'),
        Feature(title='Locked & Loaded', description='JWT secures user access, registration, and recovery.'),
        Feature(title='Dev-Friendly', description='CRUD ops keep data management clean and tight.'),
    ],
    images={
        "planetary_api_explore_universe.webp": f"{settings.PROJECT_BASE_IMG_URL}/planetary_api_explore_universe.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["sqlalchemy"],
        SkillsData.tech_stack["jwt"],
        SkillsData.tech_stack["flask_mail"],
    ],
    github_url='',
    demo_url='',
    category='API, Space, Data, Education',
    tags=['API', 'Space', 'Planets', 'Solar System', 'Flask', 'SQLAlchemy', 'JWT', 'Flask-Mail', 'Python', 'Education', 'CRUD'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
