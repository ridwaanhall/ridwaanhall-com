"""
Project #1: MLBB Username Finder
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=1,
    title='MLBB Username Finder',
    headline='Retrieve Mobile Legends usernames instantly with a lightweight Python API tool.',
    description=['This Python-based utility fetches Mobile Legends usernames quickly and reliably.', 'Simply provide a user ID and zone ID, and the API returns the corresponding player username.', 'Lightweight, fast, and designed as a handy tool for MLBB fans and developers alike.'],
    features=[
        Feature(title='Instant Lookups', description='Fetch usernames in seconds using just a user ID and zone ID.'),
        Feature(title='Python Efficiency', description='Built with Python for speed, simplicity, and smooth performance.'),
        Feature(title='API Integration', description='Leverages API calls to ensure accurate and reliable username retrieval.'),
    ],
    images={
        "mlbb_username_checker.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_username_checker.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
    ],
    github_url='',
    demo_url='',
    category='API, Gaming, Utility',
    tags=['API', 'Mobile Legends', 'MLBB', 'Username Finder', 'Python', 'Game Utility', 'User Lookup', 'Gaming Tool'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
