"""
Project #31: NGL Link Spam
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=31,
    title='NGL Link Spam',
    headline='Python script to fire off NGL messages, no login required.',
    description=['This Python tool lets you send custom or random messages to NGL without needing an account.', 'Flexes web requests and API skills, automating what’s usually a manual grind.', 'Keeps it cool with built-in rate limits to dodge spamming headaches.'],
    features=[
        Feature(title='Custom Messages', description='Drop your own texts with zero hassle.'),
        Feature(title='Random Texts', description='Generate quirky messages for kicks.'),
        Feature(title='No Login', description='Jump straight to messaging, no sign-up needed.'),
    ],
    images={
        "ngl_link_spamming.webp": f"{settings.PROJECT_BASE_IMG_URL}/ngl_link_spamming.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
    ],
    github_url='https://github.com/ridwaanhall/ngl-link-spamming',
    demo_url='',
    category='Automation, Messaging, Social Media, Python Script',
    tags=['NGL', 'Messaging', 'Automation', 'Python', 'API', 'Web Requests', 'Rate Limiting', 'Social Media'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
