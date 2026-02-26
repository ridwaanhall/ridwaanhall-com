"""
Project #12: College Data Playground
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=12,
    title='College Data Playground',
    headline='Explore Indonesian college stats with a slick Flask-powered hub.',
    description=['This Flask site is your one-stop shop for college data—students, lecturers, programs, and more.', 'Comes with a dope dashboard for stats, a search tool, and detailed pages for everything.', 'Built to make digging through academic data fun, fast, and easy.'],
    features=[
        Feature(title='Stats Dashboard', description='Visualize student, lecturer, and program counts like a pro.'),
        Feature(title='Search Superstar', description='Find students, lecturers, colleges, or programs in a flash.'),
        Feature(title='Deep Dives', description='Explore detailed data on students, lecturers, and more.'),
    ],
    images={
        "college_data_hub.webp": f"{settings.PROJECT_BASE_IMG_URL}/college_data_hub.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["bootstrap"],
    ],
    github_url='',
    demo_url='https://replit.com/@ridwaanhall/web-college',
    category='Web App, Education, Data Visualization',
    tags=['College Data', 'Dashboard', 'Flask', 'Bootstrap', 'Education', 'Indonesia', 'Data Visualization', 'Academic Data', 'Search Tool'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
