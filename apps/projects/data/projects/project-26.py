"""
Project #26: Khodam Color Finder
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=26,
    title='Khodam Color Finder',
    headline='Unleash your inner Khodam vibe with this Django-powered online checker.',
    description=['This slick platform lets you discover your Khodam color in a snap, no hassle.', 'Built with Django, it’s open to all for three months starting June 25, 2024.', 'Brings a modern, fun twist to mystical exploration with a smooth user experience.'],
    features=[
        Feature(title='Instant Khodam Check', description='Find your Khodam color with zero fuss.'),
        Feature(title='Open to All', description='Publicly accessible during its live run.'),
        Feature(title='Django Swagger', description='Rock-solid backend for seamless performance.'),
    ],
    images={
        "khodam_form.webp": f"{settings.PROJECT_BASE_IMG_URL}/khodam_form.webp",
        "khodam_result.webp": f"{settings.PROJECT_BASE_IMG_URL}/khodam_result.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
    ],
    github_url='https://github.com/ridwaanhall/website-cek-khodam',
    demo_url='',
    category='Web App, Entertainment, Personality, Django',
    tags=['Khodam', 'Color Finder', 'Django', 'Python', 'Personality Test', 'Entertainment', 'Online Checker', 'Mystical'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-06-25T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-06-25T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
