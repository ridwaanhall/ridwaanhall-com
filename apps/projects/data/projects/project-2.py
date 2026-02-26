"""
Project #2: TikTok Profile Digger
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=2,
    title='TikTok Profile Digger',
    headline='Extract TikTok profile data with Python and BeautifulSoup.',
    description=['This Python project scrapes TikTok profiles to extract structured data for analysis.', 'Uses BeautifulSoup to parse HTML and capture key details such as username, bio, followers, following, and likes.', 'Designed for developers, researchers, or analysts who need quick access to TikTok profile insights.'],
    features=[
        Feature(title='Profile Data Extraction', description='Collects username, bio, followers, following, and likes in one request.'),
        Feature(title='BeautifulSoup Parsing', description='Leverages BeautifulSoup to efficiently parse TikTok’s HTML structure.'),
        Feature(title='Research-Ready', description='Ideal for social media analysis, trend research, or data-driven insights.'),
    ],
    images={
        "tiktok_data_extractor.webp": f"{settings.PROJECT_BASE_IMG_URL}/tiktok_data_extractor.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["beautifulsoup"],
    ],
    github_url='',
    demo_url='',
    category='Web Scraping, Social Media, Data Extraction',
    tags=['TikTok', 'Web Scraping', 'BeautifulSoup', 'Python', 'Profile Data', 'Followers', 'Bio Extraction', 'Social Media', 'Data Mining'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-04-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-04-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
