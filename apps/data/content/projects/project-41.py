"""
Project #41: MLBB API Stats Hub
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB API Stats Hub
project_data = {
    "id": 41,
    "title": """MLBB API Stats Hub""",
    "headline": """REST API and website loaded with Mobile Legends game data.""",
    "description": ['A must-have for Mobile Legends fans, this REST API and website dish out hero stats, rankings, and game insights.', 'The API offers clean endpoints for heroes, skills, and meta trends, ideal for devs crafting game tools. Docs are super easy to follow.', 'The site breaks down complex data for casual players, dropping tips on hero matchups, builds, and counters based on the latest meta.'],
    "image_url": "https://ridwaanhall.com/static/img/project/mobile_legends_bang_bang_api_and_website.webp",
    "img_name": "mobile_legends_bang_bang_api_and_website.webp",
    "is_featured": True,
    "features": [{'title': 'Game API', 'description': 'GET endpoints for hero stats and rankings.'}, {'title': 'Dev Docs', 'description': 'Next.js-powered guide for easy API use.'}, {'title': 'Player Hub', 'description': 'Simple site for browsing game insights.'}],
    "tech_stack": [
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["rest_api"],
        SkillsData.tech_stack["nextjs"],
        SkillsData.tech_stack["shadcn_ui"],
        SkillsData.tech_stack["vercel"]
    ],
    "github_url": "https://github.com/ridwaanhall/api-mobilelegends",
    "demo_url": "https://mlbb-stats.ridwaanhall.com/",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-20T14:24:22+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "",
    "tags": [],
    "priority": 1,
    "slug": ""
}
