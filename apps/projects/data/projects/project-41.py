"""
Project #41: MLBB API Stats Hub
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=41,
    title='MLBB API Stats Hub',
    headline='REST API and website loaded with Mobile Legends game data.',
    description=['A must-have for Mobile Legends fans, this REST API and website dish out hero stats, rankings, and game insights.', 'The API offers clean endpoints for heroes, skills, and meta trends, ideal for devs crafting game tools. Docs are super easy to follow.', 'The site breaks down complex data for casual players, dropping tips on hero matchups, builds, and counters based on the latest meta.'],
    features=[
        Feature(title='Game API', description='GET endpoints for hero stats and rankings.'),
        Feature(title='Dev Docs', description='Next.js-powered guide for easy API use.'),
        Feature(title='Player Hub', description='Simple site for browsing game insights.'),
    ],
    images={
        "mobile_legends_bang_bang_api_and_website.webp": f"{settings.PROJECT_BASE_IMG_URL}/mobile_legends_bang_bang_api_and_website.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["rest_api"],
        SkillsData.tech_stack["nextjs"],
        SkillsData.tech_stack["shadcn_ui"],
        SkillsData.tech_stack["vercel"],
    ],
    github_url='https://github.com/ridwaanhall/api-mobilelegends',
    demo_url='https://mlbb-stats.ridwaanhall.com/',
    category='API, Gaming, MLBB, Web App, Data Visualization',
    tags=['MLBB', 'Mobile Legends', 'API', 'REST API', 'Django', 'Next.js', 'Game Stats', 'Hero Data', 'Meta Analysis', 'Shadcn UI', 'Vercel', 'Python', 'Gaming', 'Data Visualization'],
    is_featured=True,
    featured_priority=2,
    status='completed',
    created_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-07-06T16:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
