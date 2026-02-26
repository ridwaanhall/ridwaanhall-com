"""
Project #7: Insta Media Grabber API
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=7,
    title='Insta Media Grabber API',
    headline='Fetch Instagram profile pics, stories, and posts in HD with a Flask-powered API.',
    description=['This Flask-based API enables downloading Instagram profile pictures, stories, and post media in crisp HD.', 'Integrates with save-free.com for reliable media fetching without complexity.', 'Designed for developers who need quick, seamless access to Instagram media content.'],
    features=[
        Feature(title='HD Profile Pics', description='Retrieve high-resolution profile pictures instantly.'),
        Feature(title='Story Downloader', description='Access and download Instagram stories with ease.'),
        Feature(title='Post Media Access', description='Fetch images and videos from posts in a clean, structured way.'),
    ],
    images={
        "instagram_media_downloader.webp": f"{settings.PROJECT_BASE_IMG_URL}/instagram_media_downloader.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
    ],
    github_url='',
    demo_url='https://instagram-api-v1.ridwaanhall.repl.co/',
    category='API, Social Media, Instagram, Flask',
    tags=['Instagram', 'API', 'Flask', 'Media Downloader', 'Profile Picture', 'Stories', 'Post Media', 'Python', 'HD Download'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-08-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
