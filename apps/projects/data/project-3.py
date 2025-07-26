"""
Project #3: Quran Explorer Web
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Quran Explorer Web
project_data = {
    "id": 3,
    "title": """Quran Explorer Web""",
    "headline": """Dive into the Quran with a sleek, modern twist—holy wisdom meets dope tech.""",
    "description": ['This Flask-powered site lets you explore Quran chapters, verses, and translations with style.', 'Rocking AdminLTE for a slick look and feel, it’s as functional as it is beautiful.', 'Pulls legit data from quranenc.com and quran.api-docs.io for a deep, trustworthy experience.'],
    "images": {
        "quran_website_frontend_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/quran_website_frontend_api.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Killer APIs', 'description': 'Drops endpoints for chapters, Juz, verses, and translations like a champ.'}, {'title': 'Script Swag', 'description': 'Get verses in Uthmani, Uthmani Simple, Imlaei, or Imlaei Simple—your call.'}, {'title': 'Translation Hunt', 'description': 'Zero in on translations by chapter, Surah, Aya, or keyword.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["adminlte"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-07-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Religion, Quran, Flask",
    "tags": [
        "Quran",
        "Web App",
        "Flask",
        "AdminLTE",
        "API Integration",
        "Translation",
        "Islamic",
        "Data Visualization",
        "Religious Study"
    ],
    "priority": 1,
    "slug": ""
}
