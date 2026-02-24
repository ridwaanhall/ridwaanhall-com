"""
Project #3: Quran Explorer Web
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=3,
    title='Quran Explorer Web',
    headline='Explore Quran chapters, verses, and translations with a modern Flask-powered web app.',
    description=['This Flask-based web app enables users to explore Quran chapters, verses, and translations in a clean, modern interface.', 'Built with AdminLTE for a responsive and intuitive design, combining functionality with aesthetics.', 'Integrates trusted data sources from quranenc.com and quran.api-docs.io to ensure accuracy and reliability.'],
    features=[
        Feature(title='Comprehensive APIs', description='Access endpoints for chapters, Juz, verses, and translations.'),
        Feature(title='Multiple Scripts', description='View verses in Uthmani, Uthmani Simple, Imlaei, or Imlaei Simple formats.'),
        Feature(title='Translation Search', description='Find translations by chapter, Surah, Aya, or keyword for deeper study.'),
    ],
    images={
        "quran_website_frontend_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/quran_website_frontend_api.webp",
        "quran_website_frontend.webp": f"{settings.PROJECT_BASE_IMG_URL}/quran_website_frontend.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["adminlte"],
    ],
    github_url='',
    demo_url='',
    category='Web App, Religion, Quran, Flask',
    tags=['Quran', 'Web App', 'Flask', 'AdminLTE', 'API Integration', 'Translation', 'Islamic', 'Data Visualization', 'Religious Study'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-07-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-07-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
